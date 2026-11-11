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
  const currentQuestionRef = useRef(null);
  const trackedSrc = useMemo(() => getTrackedQcmUrl(src), [src]);
  const [verifiedTrackedSrc, setVerifiedTrackedSrc] = useState('');
  const [htmlDocument, setHtmlDocument] = useState(null);
  const [htmlFrameHeight, setHtmlFrameHeight] = useState(800);
  const [sessionMistakes, setSessionMistakes] = useState([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(null);
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
    setSessionMistakes([]);
    currentQuestionRef.current = null;
    setCurrentQuestionNumber(null);
    setSaveStatus('idle');
    setSaveMessage('');
    if (!/\.html?(?:$|[?#])/i.test(activeSrc || '')) return () => { cancelled = true; };

    axios.get(activeSrc, { responseType: 'text' }).then(({ data }) => {
      if (cancelled) return;
      const baseUrl = new URL(activeSrc, window.location.origin).href;
      const base = `<base href="${baseUrl}"><style>html,body{height:auto!important;min-height:0!important;overflow:visible!important}</style>`;
      const resizeScript = `<script>(function(){var send=function(){var d=document.documentElement,b=document.body;parent.postMessage({type:'tracked-html-height',height:Math.max(d?d.scrollHeight:0,b?b.scrollHeight:0,d?d.offsetHeight:0,b?b.offsetHeight:0)},'*')};window.addEventListener('load',send);window.addEventListener('resize',send);new ResizeObserver(send).observe(document.documentElement);if(document.body)new ResizeObserver(send).observe(document.body);setInterval(send,700);send()})()</script>`;
      let html = String(data || '');
      const isQuestionPaletteQcm = /id=["']pal["']/.test(html) && /class=["'][^"']*\bwrap\b/.test(html);
      const isConcours = sourceType === 'Concours' || /concours/i.test(sourceType || '');
      const integratedQcmStyle = isQuestionPaletteQcm
        ? (isConcours
            ? '<style>html,body{width:100%!important;min-width:0!important}body{background:transparent!important}.wrap{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;grid-template-columns:1fr!important}.wrap > .side, aside.side{display:none!important}#main > .card{padding:16px 20px!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important}.tag{padding:6px 14px!important;margin-bottom:10px!important}.q{margin:6px 0 12px!important}.opt{padding:9px 16px!important;margin:6px 0!important;gap:14px!important}.opt .l{width:34px!important;height:34px!important}.btns{margin-top:10px!important}.btn:disabled{opacity:.65!important}.qcm-explanation-toggle{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:12px 0 16px;padding:12px 16px;border:1px solid #c5d6f5;border-radius:12px;background:#e6efff;color:#1c4fd0;font:700 14px system-ui,sans-serif;cursor:pointer;transition:background .15s ease,border-color .15s ease}.qcm-explanation-toggle:hover{background:#dbe8ff;border-color:#9bbaf0}html[data-platform-theme="dark"]{color-scheme:dark;--bg:#0F172A;--card:#1B2940;--text:#F1F5F9;--muted:#A6B3C5;--pri:#60A5FA;--pri-d:#3B82F6;--bd:#2B3B52;--tint:#202F47;--tintbd:#3A4D6B;--pill:#1E3A5F;--pilltx:#BFDBFE;--ok:#34D399;--okbg:#123325;--ko:#F87171;--kobg:#3B2024;--flash:#3B321D;--flashbd:#B8892A}html[data-platform-theme="dark"] body{background:#0F172A!important;color:#F1F5F9!important}html[data-platform-theme="dark"] .qcm-explanation-toggle{background:#202F47;color:#BFDBFE;border-color:#3A4D6B}html[data-platform-theme="dark"] .qcm-explanation-toggle:hover{background:#263854;border-color:#60A5FA}</style>'
            : '<style>html,body{width:100%!important;min-width:0!important}body{background:#f1f5f9!important}.wrap{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}</style>')
        : '';
      const navScript = `<script>(function(){window.addEventListener('message',function(ev){if(!ev||!ev.data)return;if(ev.data.type==='goto-question'){var idx=typeof ev.data.index==='number'?ev.data.index:(Number(ev.data.questionNumber)-1);if(!isNaN(idx)&&idx>=0){if(typeof cur!=='undefined'&&typeof render==='function'){cur=idx;render()}else if(typeof window.cur!=='undefined'&&typeof window.render==='function'){window.cur=idx;window.render()}else{var btns=document.querySelectorAll('#pal button, .pal button');if(btns&&btns[idx]){btns[idx].click()}}}}});var lastReportedCur=-1;function readCurrentIndex(){try{if(typeof cur!=='undefined')return Number(cur)}catch(e){}return typeof window.cur!=='undefined'?Number(window.cur):null}setInterval(function(){var currentIndex=readCurrentIndex();if(currentIndex!==null&&Number.isFinite(currentIndex)&&currentIndex!==lastReportedCur){lastReportedCur=currentIndex;parent.postMessage({type:'econcourse-qcm-cur-changed',questionNumber:currentIndex+1},'*')}},250);var reportedTotal=false;setInterval(function(){var questions;try{if(typeof Q!=='undefined'&&Array.isArray(Q))questions=Q}catch(e){}if(!questions&&Array.isArray(window.Q))questions=window.Q;if(!reportedTotal&&questions&&questions.length>0){reportedTotal=true;parent.postMessage({type:'econcourse-qcm-meta',totalQuestions:questions.length},'*')}},300)})();</script>`;
      const explanationScript = isQuestionPaletteQcm && isConcours
        ? `<script>(function(){function setupExplanationToggle(){var explanation=document.querySelector('#exp, .exp');if(!explanation||explanation.dataset.toggleReady==='true')return;explanation.dataset.toggleReady='true';explanation.style.display='none';var button=document.createElement('button');button.type='button';button.className='qcm-explanation-toggle';button.setAttribute('aria-expanded','false');button.textContent='Afficher l’explication';button.addEventListener('click',function(){var show=explanation.style.display==='none';explanation.style.display=show?'':'none';button.setAttribute('aria-expanded',String(show));button.textContent=show?'Masquer l’explication':'Afficher l’explication';if(show)explanation.scrollIntoView({behavior:'smooth',block:'start'});});var qcmCard=document.querySelector('#main > .card');if(qcmCard)qcmCard.appendChild(button);else explanation.parentNode.insertBefore(button,explanation);}var observer=new MutationObserver(setupExplanationToggle);if(document.body){observer.observe(document.body,{childList:true,subtree:true});setupExplanationToggle();}})();</script>`
        : '';
      const themeSyncScript = isQuestionPaletteQcm && isConcours
        ? `<script>(function(){function syncTheme(){try{var root=parent.document.documentElement;var dark=root.dataset.theme==='dark'||root.classList.contains('dark');document.documentElement.setAttribute('data-platform-theme',dark?'dark':'light');}catch(e){}}syncTheme();try{new MutationObserver(syncTheme).observe(parent.document.documentElement,{attributes:true,attributeFilter:['data-theme','class']});}catch(e){}})();</script>`
        : '';
      if (/<head[^>]*>/i.test(html)) html = html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
      else html = `${base}${html}`;
      if (integratedQcmStyle) {
        const headClose = html.toLowerCase().lastIndexOf('</head>');
        if (headClose >= 0) html = `${html.slice(0, headClose)}${integratedQcmStyle}${html.slice(headClose)}`;
        else html = `${integratedQcmStyle}${html}`;
      }
      const scriptsToInject = `${resizeScript}${navScript}${explanationScript}${themeSyncScript}`;
      const bodyClose = html.toLowerCase().lastIndexOf('</body>');
      if (bodyClose >= 0) html = `${html.slice(0, bodyClose)}${scriptsToInject}${html.slice(bodyClose)}`;
      else html += scriptsToInject;
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
    if (savedOnServer) {
      const savedQuestionKeys = new Set(formattedList.map((item) =>
        String(item.questionId ?? item.questionNumber ?? item.questionText ?? '')
      ));
      setSessionMistakes((previous) => previous.filter((mistake) =>
        !savedQuestionKeys.has(String(mistake.questionId ?? mistake.questionNumber ?? mistake.questionText ?? ''))
      ));
    }

    setSaveStatus(savedOnServer ? 'saved' : 'error');
    setSaveMessage(savedOnServer
      ? `✓ ${formattedList.length} question(s) ajoutée(s) à « Erreurs sauvegardées »${studentId ? ' !' : ' sur cet appareil.'}`
      : 'Question(s) gardée(s) sur cet appareil, mais la synchronisation serveur a échoué.');
    setTimeout(() => {
      setSaveStatus('idle');
      setSaveMessage('');
    }, 4500);
  }, [chapter, resourceId, resourceTitle, school, year, sessionMistakes, sourceType, src, subject, title]);

  const currentQuestionMistake = sessionMistakes.find((mistake) =>
    Number(mistake.questionNumber) === Number(currentQuestionNumber)
  );
  const updateCurrentQuestion = useCallback((value) => {
    const questionNumber = Number(value);
    if (!Number.isInteger(questionNumber) || questionNumber < 1) return;
    if (currentQuestionRef.current !== questionNumber) {
      currentQuestionRef.current = questionNumber;
      setSaveStatus('idle');
      setSaveMessage('');
    }
    setCurrentQuestionNumber(questionNumber);
  }, []);
  const saveCurrentQuestionMistake = useCallback(() => {
    if (!currentQuestionMistake) return;
    handleSaveMistakes([currentQuestionMistake], currentQuestionMistake.attemptId);
  }, [currentQuestionMistake, handleSaveMistakes]);

  useEffect(() => {
    const handleQcmMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      if (event.data?.type === 'tracked-html-height') {
        const height = Number(event.data.height);
        if (Number.isFinite(height) && height > 0) setHtmlFrameHeight(Math.min(Math.max(height, 320), 100000));
        return;
      }

      if (event.data?.type === 'econcourse-qcm-cur-changed') {
        updateCurrentQuestion(event.data.questionNumber);
        return;
      }

      // 1. Détection d'une réponse incorrecte
      if (event.data?.type === 'econcourse-qcm-mistake' && event.data?.mistake) {
        const mistake = event.data.mistake;
        updateCurrentQuestion(mistake.questionNumber);
        setSaveStatus('idle');
        setSaveMessage('');
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
            return exists
              ? prev.map((item) => String(item.questionId ?? item.questionNumber ?? item.questionText) === key ? studentMistake : item)
              : [...prev, studentMistake];
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

    };

    window.addEventListener('message', handleQcmMessage);
    return () => window.removeEventListener('message', handleQcmMessage);
  }, [chapter, resourceId, resourceTitle, school, sourceType, src, subject, title, updateCurrentQuestion, year]);

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
          onClick={saveCurrentQuestionMistake}
          disabled={!currentQuestionMistake || saveStatus === 'saving'}
          title="Sauvegarder uniquement la question affichée si elle est incorrecte"
          style={{
            padding: '7px 14px',
            backgroundColor: saveStatus === 'saved' ? '#059669' : '#0B3675',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9px',
            fontWeight: 750,
            fontSize: '12px',
            cursor: saveStatus === 'saving' ? 'wait' : currentQuestionMistake ? 'pointer' : 'not-allowed',
            opacity: currentQuestionMistake || saveStatus === 'saved' ? 1 : 0.55,
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
              ? 'Question sauvegardée'
              : `Sauvegarder Q${currentQuestionNumber || '?'}`}
          </span>
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
