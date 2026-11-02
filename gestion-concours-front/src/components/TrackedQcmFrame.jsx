import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { recordStudentMistake, resolveStudentMistakes } from '../studentProgress';

const API_BASE = '';

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
  const saveRequestTimerRef = useRef(null);
  const trackedSrc = useMemo(() => getTrackedQcmUrl(src), [src]);
  const [verifiedTrackedSrc, setVerifiedTrackedSrc] = useState('');
  const [htmlDocument, setHtmlDocument] = useState(null);
  const [htmlFrameHeight, setHtmlFrameHeight] = useState(800);
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

  const activeSrc = trackedSrc !== src && verifiedTrackedSrc === trackedSrc ? trackedSrc : src;

  useEffect(() => {
    let cancelled = false;
    setHtmlDocument(null);
    setHtmlFrameHeight(800);
    if (!/\.html?(?:$|[?#])/i.test(activeSrc || '')) return () => { cancelled = true; };

    axios.get(activeSrc, { responseType: 'text' }).then(({ data }) => {
      if (cancelled) return;
      const baseUrl = new URL(activeSrc, window.location.origin).href;
      const base = `<base href="${baseUrl}"><style>html,body{height:auto!important;min-height:0!important;overflow:visible!important}</style>`;
      const resizeScript = `<script>(function(){var send=function(){var d=document.documentElement,b=document.body;parent.postMessage({type:'tracked-html-height',height:Math.max(d?d.scrollHeight:0,b?b.scrollHeight:0,d?d.offsetHeight:0,b?b.offsetHeight:0)},'*')};window.addEventListener('load',send);window.addEventListener('resize',send);new ResizeObserver(send).observe(document.documentElement);if(document.body)new ResizeObserver(send).observe(document.body);setInterval(send,700);send()})()</script>`;
      let html = String(data || '');
      const isQuestionPaletteQcm = /id=["']pal["']/.test(html) && /class=["'][^"']*\bwrap\b/.test(html);
      const integratedQcmStyle = isQuestionPaletteQcm
        ? '<style>html,body{width:100%!important;min-width:0!important}body{background:#f1f5f9!important}.wrap{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}</style>'
        : '';
      if (/<head[^>]*>/i.test(html)) html = html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
      else html = `${base}${html}`;
      if (integratedQcmStyle) {
        const headClose = html.toLowerCase().lastIndexOf('</head>');
        if (headClose >= 0) html = `${html.slice(0, headClose)}${integratedQcmStyle}${html.slice(headClose)}`;
        else html = `${integratedQcmStyle}${html}`;
      }
      const bodyClose = html.toLowerCase().lastIndexOf('</body>');
      if (bodyClose >= 0) html = `${html.slice(0, bodyClose)}${resizeScript}${html.slice(bodyClose)}`;
      else html += resizeScript;
      setHtmlDocument(html);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [activeSrc]);

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
      choicesText: m.choicesText || '',
      selectedChoiceLabel: m.selectedChoiceLabel,
      selectedChoiceText: m.selectedChoiceText,
      correctChoiceLabel: m.correctChoiceLabel,
      correctChoiceText: m.correctChoiceText,
      explanation: m.explanation,
      attemptId: m.attemptId || actionAttemptId
    }));

    const incompleteCount = formattedList.filter((item) =>
      !String(item.questionText || '').trim()
      || !String(item.selectedChoiceLabel || '').trim()
      || !String(item.correctChoiceLabel || '').trim()
    ).length;
    if (incompleteCount > 0) {
      setSaveStatus('error');
      setSaveMessage(`${incompleteCount} question(s) n'ont pas pu être enregistrée(s) : détails de correction introuvables.`);
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
      return;
    }

    // Toujours enregistrer en local
    formattedList.forEach((item) => recordStudentMistake({ ...item, savedForReview: true }));

    let savedOnServer = !studentId;
    if (studentId) {
      try {
        const response = await axios.post(`${API_BASE}/api/student-mistakes/batch`, {
          studentId,
          studentName: user.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : (user.nom || 'Étudiant'),
          studentEmail: user.email || '',
          mistakes: formattedList
        });
        savedOnServer = response.status >= 200 && response.status < 300;
      } catch (err) {
        console.warn('Erreur lors de la sauvegarde sur le serveur (sauvegardé en local):', err);
      }
    }

    // Informer l'iframe que la sauvegarde est confirmée
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'econcourse-mistakes-saved-ack' }, '*');
    } catch {}

    setSaveStatus(savedOnServer ? 'saved' : 'error');
    setSaveMessage(savedOnServer
      ? `✓ ${formattedList.length} question(s) ajoutée(s) à « Erreurs sauvegardées »${studentId ? ' !' : ' sur cet appareil.'}`
      : 'Question(s) gardée(s) sur cet appareil, mais la synchronisation serveur a échoué.');
    setTimeout(() => {
      setSaveStatus('idle');
      setSaveMessage('');
    }, 4500);
  }, [chapter, resourceId, resourceTitle, school, year, sessionMistakes, sourceType, src, subject, title]);

  const requestSaveMistakes = useCallback(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) {
      handleSaveMistakes();
      return;
    }

    if (saveRequestTimerRef.current) clearTimeout(saveRequestTimerRef.current);
    saveRequestTimerRef.current = setTimeout(() => {
      saveRequestTimerRef.current = null;
      handleSaveMistakes();
    }, 1200);

    try {
      frame.postMessage({ type: 'econcourse-request-save-mistakes' }, '*');
    } catch {
      clearTimeout(saveRequestTimerRef.current);
      saveRequestTimerRef.current = null;
      handleSaveMistakes();
    }
  }, [handleSaveMistakes]);

  useEffect(() => {
    const handleQcmMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      if (event.data?.type === 'tracked-html-height') {
        const height = Number(event.data.height);
        if (Number.isFinite(height) && height > 0) setHtmlFrameHeight(Math.min(Math.max(height, 320), 100000));
        return;
      }

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

        const historySessionToken = localStorage.getItem('authToken');
        if (historySessionToken
          && /^\d+$/.test(String(studentMistake.resourceId || ''))
          && studentMistake.attemptId
          && studentMistake.questionText
          && studentMistake.selectedChoiceLabel
          && studentMistake.correctChoiceLabel) {
          axios.post(`${API_BASE}/api/qcm/attempt-answer`, {
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
            choicesText: mistake.choicesText || '',
            selectedChoiceLabel: mistake.selectedChoiceLabel,
            selectedChoiceText: mistake.selectedChoiceText,
            correctChoiceLabel: mistake.correctChoiceLabel,
            correctChoiceText: mistake.correctChoiceText,
            explanation: mistake.explanation
          }, { headers: { Authorization: `Bearer ${historySessionToken}` } }).then(() => window.dispatchEvent(new CustomEvent('student-qcm-history-updated')))
            .catch((error) => console.warn('Impossible d’enregistrer cette réponse dans l’historique du QCM:', error));
        }

        if (isWrong) {
          recordStudentMistake(studentMistake);
          setSessionMistakes((prev) => {
            const key = String(mistake.questionId ?? mistake.questionNumber ?? mistake.questionText);
            const exists = prev.some((item) => String(item.questionId ?? item.questionNumber ?? item.questionText) === key);
            return exists ? prev : [...prev, studentMistake];
          });
        } else {
          let studentId = null;
          try { studentId = JSON.parse(localStorage.getItem('user') || '{}')?.id ?? null; } catch {}
          const resolvedQuestionId = String(mistake.questionId ?? mistake.questionNumber ?? mistake.questionText ?? '');
          setSessionMistakes((prev) => prev.filter((item) =>
            String(item.questionId ?? item.questionNumber ?? item.questionText ?? '') !== resolvedQuestionId
          ));
          resolveStudentMistakes(studentMistake.resourceId, resolvedQuestionId);
          if (studentId) {
            axios.post(`${API_BASE}/api/student-mistakes/resolve`, {
              studentId,
              resourceId: studentMistake.resourceId,
              questionId: resolvedQuestionId
            }).then(() => window.dispatchEvent(new CustomEvent('student-mistakes-updated')))
              .catch((error) => console.warn('Impossible d’actualiser la liste de révision:', error));
          }
        }

      }

      // 2. Clic sur « Sauvegarder mes erreurs » depuis l'iframe du QCM
      if (event.data?.type === 'econcourse-save-mistakes-action') {
        if (saveRequestTimerRef.current) {
          clearTimeout(saveRequestTimerRef.current);
          saveRequestTimerRef.current = null;
        }
        const mistakesFromIframe = Array.isArray(event.data?.mistakes) ? event.data.mistakes : null;
        handleSaveMistakes(mistakesFromIframe, event.data.attemptId);
      }
    };

    window.addEventListener('message', handleQcmMessage);
    return () => {
      window.removeEventListener('message', handleQcmMessage);
      if (saveRequestTimerRef.current) clearTimeout(saveRequestTimerRef.current);
    };
  }, [chapter, handleSaveMistakes, resourceId, resourceTitle, school, sourceType, src, subject, title, year]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: 'auto' }}>
      <div style={{
        padding: '0 0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '10px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'transparent'
      }}>
        {saveMessage && (
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            color: saveStatus === 'saved' ? '#059669' : saveStatus === 'none' ? '#d97706' : saveStatus === 'error' ? '#dc2626' : '#2563eb'
          }}>
            {saveMessage}
          </span>
        )}
        <button
          type="button"
          onClick={requestSaveMistakes}
          disabled={saveStatus === 'saving'}
          title="Enregistrer toutes les questions ratées pour les réviser plus tard dans votre espace"
          style={{
            padding: '7px 14px',
            backgroundColor: saveStatus === 'saved' ? '#059669' : '#0B3675',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9px',
            fontWeight: 750,
            fontSize: '12px',
            cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(11,54,117,0.2)',
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
        src={htmlDocument === null ? activeSrc : undefined}
        srcDoc={htmlDocument === null ? undefined : htmlDocument}
        title={title || 'QCM interactif'}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        scrolling={htmlDocument === null ? undefined : 'no'}
        style={htmlDocument === null ? style : { ...style, height: `${htmlFrameHeight}px`, overflow: 'hidden' }}
      />
    </div>
  );
}
