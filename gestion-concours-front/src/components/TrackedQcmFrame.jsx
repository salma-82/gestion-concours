import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { recordStudentMistake } from '../studentProgress';

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
  const handleSaveMistakes = useCallback(async (mistakesToSave = null) => {
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
      questionId: String(m.questionId ?? m.questionNumber ?? m.questionText ?? '').slice(0, 100),
      questionNumber: m.questionNumber,
      questionText: m.questionText,
      selectedChoiceLabel: m.selectedChoiceLabel,
      selectedChoiceText: m.selectedChoiceText,
      correctChoiceLabel: m.correctChoiceLabel,
      correctChoiceText: m.correctChoiceText,
      explanation: m.explanation,
      attemptId: m.attemptId
    }));

    // Toujours enregistrer en local
    formattedList.forEach((item) => recordStudentMistake(item));

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
    setSaveMessage(`✓ ${formattedList.length} question(s) enregistrée(s) dans « Mes erreurs » !`);
    setTimeout(() => {
      setSaveStatus('idle');
      setSaveMessage('');
    }, 4500);
  }, [chapter, resourceId, resourceTitle, school, sessionMistakes, sourceType, src, subject, title]);

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
          attemptId: event.data.attemptId
        };

        if (isWrong) {
          recordStudentMistake(studentMistake);
          setSessionMistakes((prev) => {
            const key = String(mistake.questionId ?? mistake.questionNumber ?? mistake.questionText);
            const exists = prev.some((item) => String(item.questionId ?? item.questionNumber ?? item.questionText) === key);
            return exists ? prev : [...prev, studentMistake];
          });
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
        handleSaveMistakes(mistakesFromIframe);
      }
    };

    window.addEventListener('message', handleQcmMessage);
    return () => window.removeEventListener('message', handleQcmMessage);
  }, [chapter, handleSaveMistakes, resourceId, resourceTitle, school, sourceType, src, subject, title]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Barre d'action supérieure pour sauvegarder les erreurs */}
      <div style={{
        padding: '9px 18px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '12.5px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
          <span style={{ fontSize: '15px' }}>🎯</span>
          <span style={{ fontWeight: 700, color: '#1e293b' }}>Entraînement QCM</span>
          {sessionMistakes.length > 0 && (
            <span style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '11px'
            }}>
              {sessionMistakes.length} erreur{sessionMistakes.length > 1 ? 's' : ''} détectée{sessionMistakes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
