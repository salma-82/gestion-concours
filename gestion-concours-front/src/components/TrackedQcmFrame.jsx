import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { recordStudentMistake, resolveStudentMistakes } from '../studentProgress';

const API_BASE = 'http://localhost:8081';

export const getTrackedQcmUrl = (sourceUrl) => {
  if (!sourceUrl) return '';
  try {
    const parsedUrl = new URL(sourceUrl, window.location.origin);
    const fileName = decodeURIComponent(parsedUrl.pathname.split('/').filter(Boolean).pop() || '');
    if (!/\.html?$/i.test(fileName)) return sourceUrl;
    return `${API_BASE}/api/qcm/tracked-html/${encodeURIComponent(fileName)}`;
  } catch {
    return sourceUrl;
  }
};

export default function TrackedQcmFrame({
  src,
  title,
  sourceType,
  resourceId,
  resourceTitle,
  subject = '',
  chapter = '',
  school = '',
  year = '',
  style
}) {
  const iframeRef = useRef(null);
  const trackedSrc = useMemo(() => getTrackedQcmUrl(src), [src]);
  const [verifiedTrackedSrc, setVerifiedTrackedSrc] = useState('');
  const [sessionMistakes, setSessionMistakes] = useState([]);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'none'
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!trackedSrc || trackedSrc === src) return () => { active = false; };

    // Avoid a visible broken iframe when the backend instance has not loaded
    // the tracked QCM routes yet. The original uploaded HTML remains usable.
    fetch(trackedSrc)
      .then(async (response) => {
        if (response.ok) {
          await response.body?.cancel();
          if (active) setVerifiedTrackedSrc(trackedSrc);
        }
      }).catch(() => {});

    return () => { active = false; };
  }, [src, trackedSrc]);

  // Sauvegarde des erreurs sur le backend (base de données) et en local
  const handleSaveMistakes = useCallback(async (mistakesToSave = null, actionAttemptId = null) => {
    let user = {};
    try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch {}
    const studentId = user?.id;

    const list = Array.isArray(mistakesToSave) && mistakesToSave.length > 0
      ? mistakesToSave
      : sessionMistakes;

    if (list.length === 0) {
      setSaveStatus('none');
      setSaveMessage('Aucune question incorrecte à sauvegarder pour le moment.');
      setTimeout(() => setSaveStatus('idle'), 3500);
      return;
    }

    setSaveStatus('saving');

    const formattedList = list.map((m) => ({
      sourceType: m.sourceType || sourceType || 'QCM',
      resourceId: String(resourceId || src),
      resourceTitle: resourceTitle || title || 'QCM',
      subject: m.subject || subject || '',
      chapter: m.chapter || chapter || '',
      school: m.school || school || '',
      year: m.year || year || null,
      savedForReview: true,
      questionId: String(m.questionId ?? m.questionNumber ?? m.questionText ?? '').slice(0, 100),
      questionNumber: m.questionNumber,
      questionText: m.questionText,
      selectedChoiceLabel: m.selectedChoiceLabel,
      selectedChoiceText: m.selectedChoiceText,
      correctChoiceLabel: m.correctChoiceLabel,
      correctChoiceText: m.correctChoiceText,
      explanation: m.explanation,
      attemptId: m.attemptId || actionAttemptId
    }));

    // Toujours enregistrer en local
    formattedList.forEach((item) => recordStudentMistake({ ...item, savedForReview: true }));

    if (studentId) {
      try {
        await axios.post(`${API_BASE}/api/student-mistakes/batch`, {
          studentId,
          studentName: user.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : (user.nom || 'Étudiant'),
          studentEmail: user.email || '',
          mistakes: formattedList
        });
      } catch (err) {
        console.warn('Erreur lors de la sauvegarde sur le serveur (sauvegardé en local):', err);
      }
    }

    // Informer l'iframe que la sauvegarde est confirmée
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'econcourse-mistakes-saved-ack' }, '*');
    } catch {}

    setSaveStatus('saved');
    setSaveMessage(`✓ ${formattedList.length} question(s) ajoutée(s) à « Erreurs sauvegardées » !`);
    setTimeout(() => {
      setSaveStatus('idle');
      setSaveMessage('');
    }, 4500);
  }, [chapter, resourceId, resourceTitle, school, year, sessionMistakes, sourceType, src, subject, title]);

  useEffect(() => {
    const handleQcmMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      // 1. Détection d'une réponse incorrecte
      if (event.data?.type === 'econcourse-qcm-mistake' && event.data?.mistake) {
        const mistake = event.data.mistake;
        const isWrong = mistake.selectedChoiceLabel !== mistake.correctChoiceLabel;

        const studentMistake = {
          ...mistake,
          sourceType,
          resourceId: String(resourceId || src),
          resourceTitle: resourceTitle || title || 'QCM',
          subject: subject || '',
          chapter: mistake.chapter || chapter || '',
          school: school || '',
          year: year || null,
          attemptId: event.data.attemptId
        };

        let historyStudentId = null;
        try { historyStudentId = JSON.parse(localStorage.getItem('user') || '{}')?.id ?? null; } catch {}
        if (historyStudentId) {
          axios.post(`${API_BASE}/api/qcm/attempt-answer`, {
            studentId: historyStudentId,
            sourceType: studentMistake.sourceType,
            resourceId: studentMistake.resourceId,
            resourceTitle: studentMistake.resourceTitle,
            school: studentMistake.school,
            subject: studentMistake.subject,
            chapter: studentMistake.chapter,
            year: studentMistake.year,
            totalQuestions: event.data.totalQuestions,
            attemptId: studentMistake.attemptId,
            questionId: String(mistake.questionId ?? mistake.questionNumber ?? mistake.questionText ?? ''),
            questionNumber: mistake.questionNumber,
            questionText: mistake.questionText,
            selectedChoiceLabel: mistake.selectedChoiceLabel,
            selectedChoiceText: mistake.selectedChoiceText,
            correctChoiceLabel: mistake.correctChoiceLabel,
            correctChoiceText: mistake.correctChoiceText,
            explanation: mistake.explanation
          }).then(() => window.dispatchEvent(new CustomEvent('student-qcm-history-updated')))
            .catch((error) => console.warn('Impossible d’enregistrer cette réponse dans l’historique du QCM:', error));
        }

        if (isWrong) {
          recordStudentMistake(studentMistake);
          let student = {};
          try { student = JSON.parse(localStorage.getItem('user') || '{}'); } catch {}
          if (student.id) {
            const autoSaved = {
              studentId: student.id,
              studentName: `${student.prenom || ''} ${student.nom || ''}`.trim() || 'Étudiant',
              studentEmail: student.email || '',
              mistakes: [{
                sourceType: studentMistake.sourceType,
                resourceId: studentMistake.resourceId,
                resourceTitle: studentMistake.resourceTitle,
                subject: studentMistake.subject,
                chapter: studentMistake.chapter,
                school: studentMistake.school,
                questionId: String(studentMistake.questionId ?? studentMistake.questionNumber ?? studentMistake.questionText ?? '').slice(0, 100),
                questionNumber: studentMistake.questionNumber,
                questionText: studentMistake.questionText,
                selectedChoiceLabel: studentMistake.selectedChoiceLabel,
                selectedChoiceText: studentMistake.selectedChoiceText,
                correctChoiceLabel: studentMistake.correctChoiceLabel,
                correctChoiceText: studentMistake.correctChoiceText,
                explanation: studentMistake.explanation,
                attemptId: studentMistake.attemptId
              }]
            };
            autoSaved.mistakes[0].year = studentMistake.year;
            autoSaved.saveForReview = false;
            axios.post(`${API_BASE}/api/student-mistakes/auto`, autoSaved)
              .then(() => window.dispatchEvent(new CustomEvent('student-mistakes-updated')))
              .catch((error) => console.warn('Erreur QCM conservée localement, synchronisation serveur impossible:', error));
          }
          setSessionMistakes((prev) => {
            const key = String(mistake.questionId ?? mistake.questionNumber ?? mistake.questionText);
            const exists = prev.some((item) => String(item.questionId ?? item.questionNumber ?? item.questionText) === key);
            return exists ? prev : [...prev, studentMistake];
          });
        } else {
          let studentId = null;
          try { studentId = JSON.parse(localStorage.getItem('user') || '{}')?.id ?? null; } catch {}
          resolveStudentMistakes(studentMistake.resourceId, String(mistake.questionId ?? mistake.questionNumber ?? mistake.questionText ?? ''));
          if (studentId) {
            axios.post(`${API_BASE}/api/student-mistakes/resolve`, {
              studentId,
              resourceId: studentMistake.resourceId,
              questionId: String(mistake.questionId ?? mistake.questionNumber ?? mistake.questionText ?? '')
            }).then(() => window.dispatchEvent(new CustomEvent('student-mistakes-updated')))
              .catch((error) => console.warn('Impossible d’actualiser la liste de révision:', error));
          }
        }

        if (String(sourceType).toLowerCase().includes('concours blanc') && /^\d+$/.test(String(resourceId))) {
          let studentId = null;
          try { studentId = JSON.parse(localStorage.getItem('user') || '{}')?.id ?? null; } catch {}
          axios.post(`${API_BASE}/api/qcm/concours-blanc/${resourceId}/responses`, {
            studentId,
            attemptId: event.data.attemptId,
            questionId: mistake.questionId ?? mistake.questionNumber ?? mistake.questionText,
            questionNumber: mistake.questionNumber,
            questionText: mistake.questionText,
            selectedChoiceLabel: mistake.selectedChoiceLabel,
            selectedChoiceText: mistake.selectedChoiceText,
            correctChoiceLabel: mistake.correctChoiceLabel,
            correctChoiceText: mistake.correctChoiceText,
            explanation: mistake.explanation
          }).catch((error) => console.error('Impossible d’enregistrer la réponse QCM.', error));
        }
      }

      // 2. Clic sur « Sauvegarder mes erreurs » depuis l'iframe du QCM
      if (event.data?.type === 'econcourse-save-mistakes-action') {
        const mistakesFromIframe = Array.isArray(event.data?.mistakes) ? event.data.mistakes : null;
        handleSaveMistakes(mistakesFromIframe, event.data.attemptId);
      }
    };

    window.addEventListener('message', handleQcmMessage);
    return () => window.removeEventListener('message', handleQcmMessage);
  }, [chapter, handleSaveMistakes, resourceId, resourceTitle, school, sourceType, src, subject, title, year]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '10px'
      }}>
        {saveMessage && (
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            color: saveStatus === 'saved' ? '#059669' : saveStatus === 'none' ? '#d97706' : '#2563eb'
          }}>
            {saveMessage}
          </span>
        )}
        <button
          type="button"
          onClick={() => handleSaveMistakes()}
          disabled={saveStatus === 'saving'}
          title="Enregistrer toutes les questions ratées pour les réviser plus tard dans votre espace"
          style={{
            padding: '7px 14px',
            backgroundColor: saveStatus === 'saved' ? '#059669' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9px',
            fontWeight: 750,
            fontSize: '12px',
            cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
            transition: 'all 0.15s ease'
          }}
        >
          <span>{saveStatus === 'saved' ? '✓' : '💾'}</span>
          <span>
            {saveStatus === 'saving'
              ? 'Sauvegarde...'
              : saveStatus === 'saved'
              ? 'Erreurs sauvegardées'
              : 'Sauvegarder mes erreurs'}
          </span>
          {sessionMistakes.length > 0 && saveStatus !== 'saved' && (
            <span style={{
              background: 'rgba(255,255,255,0.25)',
              padding: '1px 6px',
              borderRadius: '999px',
              fontSize: '10.5px'
            }}>
              {sessionMistakes.length}
            </span>
          )}
        </button>
      </div>

      <iframe
        ref={iframeRef}
        src={trackedSrc === src || verifiedTrackedSrc !== trackedSrc ? src : trackedSrc}
        title={title || 'QCM interactif'}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        style={style}
      />
    </div>
  );
}
