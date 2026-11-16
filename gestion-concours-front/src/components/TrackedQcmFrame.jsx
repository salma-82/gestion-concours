import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { recordStudentMistake, resolveStudentMistakes } from '../studentProgress';

const API_BASE = '';

const newClientAttemptKey = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    return (char === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
  });
};

const concoursBlancIntegratedQcmStyle = `<style>
  html, body { width: 100% !important; min-width: 0 !important; }
  body { background: transparent !important; }
  .wrap { display: grid !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; grid-template-columns: 5cm minmax(0, 1fr) !important; gap: 12px !important; align-items: start !important; }
  .layout { grid-template-columns: 5cm minmax(0, 1fr) !important; gap: 12px !important; align-items: start !important; }
  .wrap > .side { grid-column: 1 !important; width: 5cm !important; max-width: 5cm !important; position: static !important; top: auto !important; max-height: none !important; overflow: visible !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; }
  .wrap > .content { grid-column: 2 !important; width: 100% !important; max-width: none !important; min-width: 0 !important; }
  .wrap > .side h1, .wrap > .side h2, .wrap > .side h3, .wrap > .side h4, .wrap > .side h5, .wrap > .side h6 { display: none !important; }
  .wrap > .side .top, .wrap > .side .bar { display: none !important; }
  .wrap .pal { display: flex !important; flex-direction: column !important; gap: 8px !important; }
  .wrap .pal button { box-sizing: border-box !important; width: 5cm !important; max-width: 5cm !important; height: auto !important; min-height: 44px !important; border-radius: 12px !important; }
  .layout > .side {
    display: block !important; grid-column: 1 !important; width: 5cm !important; max-width: 5cm !important;
    position: static !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important;
    box-shadow: none !important; background: transparent !important;
  }
  .layout > .side h1, .layout > .side h2, .layout > .side h3, .layout > .side h4, .layout > .side h5, .layout > .side h6 { display: none !important; }
  .layout > .side > p, .legend { display: none !important; }
  .grid { display: flex !important; flex-direction: column !important; gap: 8px !important; }
  .gb {
    box-sizing: border-box !important; width: 5cm !important; max-width: 5cm !important; height: auto !important;
    min-height: 44px !important; padding: 10px !important; border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important; background: #fff !important; color: #0f2a6b !important;
    font: 800 14px system-ui, sans-serif !important; cursor: pointer !important;
  }
  .gb:hover { border-color: #93c5fd !important; background: #f8fbff !important; }
  .gb.cur {
    outline: none !important; border: 1.5px solid #3b82f6 !important; background: #eff6ff !important;
    color: #1d4ed8 !important; box-shadow: 0 2px 8px rgba(37, 99, 235, .12) !important;
  }
  .gb.ans, .gb.ok { background: #16a34a !important; border-color: #16a34a !important; color: #fff !important; }
  .gb.ko { background: #fee2e2 !important; border-color: #f87171 !important; color: #b91c1c !important; }
  .layout > .card:not(.side):not(.explain-side) {
    grid-column: 2 !important; width: 100% !important; max-width: none !important; padding: 16px 20px !important; border: 0 !important;
    border-radius: 0 !important; box-shadow: none !important; background: transparent !important;
  }
  .explain-side { grid-column: 2 !important; position: static !important; }
  .layout .top, .layout .bar { display: none !important; }
  .tag { display: none !important; }
  .q { margin: 6px 0 12px !important; }
  .opt { box-sizing: border-box !important; min-height: 64px !important; padding: 8px 16px !important; margin: 6px 0 !important; border-color: #cbdaf4 !important; border-radius: 12px !important; }
  .opt:hover { border-color: #93b4f0 !important; background: #f8fbff !important; }
  .opt.sel { border-color: #3b82f6 !important; background: #eff6ff !important; }
  .opt .k { background: #e6efff !important; color: #1d4ed8 !important; }
  .opt.sel .k { background: #2563eb !important; color: #fff !important; }
  .btn-p { background: #24478d !important; }
  .btn-p:hover { background: #1e3d7c !important; }
  html[data-platform-theme="dark"] { color-scheme: dark; --bg: #0F172A; --card: #1B2940; --text: #F1F5F9; --muted: #A6B3C5; --navy: #F1F5F9; --navy2: #3B82F6; --teal: #60A5FA; --teal-d: #3B82F6; --line: #2B3B52; }
  html[data-platform-theme="dark"] body { background: #0F172A !important; color: #F1F5F9 !important; }
  html[data-platform-theme="dark"] .gb { background: #1e293b !important; border-color: #334155 !important; color: #e2e8f0 !important; }
  html[data-platform-theme="dark"] .gb.cur { background: rgba(37, 99, 235, .18) !important; border-color: #60a5fa !important; color: #93c5fd !important; }
  html[data-platform-theme="dark"] .opt { background: #1e293b !important; border-color: #334155 !important; color: #e2e8f0 !important; }
  html[data-platform-theme="dark"] .opt.sel { background: rgba(37, 99, 235, .18) !important; border-color: #60a5fa !important; }
  html[data-platform-theme="dark"] .opt .k { background: #263854 !important; color: #bfdbfe !important; }
  html[data-platform-theme="dark"] .opt.sel .k { background: #2563eb !important; color: #fff !important; }
  @media (max-width: 760px) {
    .wrap, .layout { grid-template-columns: minmax(0, 1fr) !important; gap: 12px !important; }
    .wrap > .side { grid-column: 1 !important; width: 100% !important; max-width: none !important; }
    .wrap > .content { grid-column: 1 !important; }
    .layout > .side { grid-column: 1 !important; width: 100% !important; max-width: none !important; }
    .grid { flex-direction: row !important; overflow-x: auto !important; padding-bottom: 6px !important; }
    .grid > .gb { flex: 0 0 5cm !important; }
    .wrap .pal { flex-direction: row !important; overflow-x: auto !important; padding-bottom: 6px !important; }
    .wrap .pal > button { flex: 0 0 5cm !important; }
    .layout > .card:not(.side):not(.explain-side), .explain-side { grid-column: 1 !important; width: 100% !important; }
  }
</style>`;

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
  enableTimer = true,
  style
}) {
  const iframeRef = useRef(null);
  const [timerPortalTarget, setTimerPortalTarget] = useState(null);
  const [timerSlotAttached, setTimerSlotAttached] = useState(false);
  const timerControlStateRef = useRef(null);
  const timerActionHandlerRef = useRef(null);
  const currentQuestionRef = useRef(null);
  const trackedSrc = useMemo(() => getTrackedQcmUrl(src), [src]);
  const [verifiedTrackedSrc, setVerifiedTrackedSrc] = useState('');
  const [htmlDocument, setHtmlDocument] = useState(null);
  const [htmlFrameHeight, setHtmlFrameHeight] = useState(800);
  const [sessionMistakes, setSessionMistakes] = useState([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'none'
  const [saveMessage, setSaveMessage] = useState('');
  const [timerSession, setTimerSession] = useState(null);
  const [timerLoading, setTimerLoading] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [freeTimerElapsed, setFreeTimerElapsed] = useState(0);
  const [freeTimerPaused, setFreeTimerPaused] = useState(false);
  const [timerActionLoading, setTimerActionLoading] = useState(false);
  const [timerMessage, setTimerMessage] = useState('');
  const timerSessionRef = useRef(null);
  const timerAnswersRef = useRef({});
  const timerCurrentQuestionRef = useRef(null);
  const timerTotalQuestionsRef = useRef(null);
  const timerAnchorRef = useRef({ remaining: null, at: 0 });
  const timerSnapshotWriteAtRef = useRef(0);
  const timerAutoSubmitRef = useRef(false);
  const timerRequestRef = useRef(null);
  const timerClientKeyStorageRef = useRef(null);
  const iframeLocalStorageKeyRef = useRef(null);
  const freeTimerClockRef = useRef(null);
  const pendingAnswersRef = useRef(new Set());

  useEffect(() => {
    if (String(sourceType || '').trim().toLowerCase() !== 'concours') {
      setTimerPortalTarget(null);
      return undefined;
    }
    const findQuestionTimerSlot = () => {
      const target = document.querySelector('[data-concours-question-timer-slot]');
      setTimerPortalTarget((current) => current === target ? current : target);
    };
    findQuestionTimerSlot();
    const observer = new MutationObserver(findQuestionTimerSlot);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [sourceType, resourceId]);

  const syncQcmTheme = useCallback(() => {
    const root = document.documentElement;
    const isDark = root.dataset.theme === 'dark' || root.classList.contains('dark');
    iframeRef.current?.contentWindow?.postMessage({ type: 'platform-theme', theme: isDark ? 'dark' : 'light' }, '*');
  }, []);

  const storeTimerData = useCallback((data) => {
    if (!data || typeof data !== 'object') return;
    timerSessionRef.current = data;
    setTimerSession(data);
    if (!data.supported) return;

    let localAnswers = {};
    if (data.sessionId) {
      try { localAnswers = JSON.parse(localStorage.getItem(`qcm-timer-answers:${data.sessionId}`) || '{}'); } catch {}
    }
    const mergedAnswers = { ...(data.answers || {}), ...(localAnswers || {}) };
    timerAnswersRef.current = mergedAnswers;
    const remaining = Math.max(0, Number(data.remainingSeconds) || 0);
    timerAnchorRef.current = { remaining, at: Date.now() };
    setTimerRemaining(remaining);
    let savedProgress = {};
    if (timerClientKeyStorageRef.current && data.sessionId) {
      const stateKey = timerClientKeyStorageRef.current.replace('qcm-timer-attempt:', 'qcm-timer-state:');
      try {
        const candidate = JSON.parse(localStorage.getItem(stateKey) || '{}');
        if (candidate.sessionId === data.sessionId) savedProgress = candidate;
      } catch {}
    }
    const current = Number(savedProgress.currentQuestion) || Number(data.currentQuestion) || null;
    const total = Number(savedProgress.totalQuestions) || Number(data.totalQuestions) || null;
    timerCurrentQuestionRef.current = current;
    timerTotalQuestionsRef.current = total;
    if (timerClientKeyStorageRef.current && data.sessionId) {
      const stateKey = timerClientKeyStorageRef.current.replace('qcm-timer-attempt:', 'qcm-timer-state:');
      try {
        localStorage.setItem(stateKey, JSON.stringify({
          sessionId: data.sessionId, status: data.status, remainingSeconds: remaining,
          snapshotAt: Date.now(), currentQuestion: current, totalQuestions: total,
          durationSeconds: data.durationSeconds, durationSource: data.durationSource,
          sourceUrl: data.sourceUrl, clientAttemptKey: data.clientAttemptKey,
          finishedReason: data.finishedReason
        }));
      } catch {}
    }
  }, []);

  const syncTimerAnswersToFrame = useCallback((answers = timerAnswersRef.current) => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    const send = () => {
      frame.postMessage({ type: 'timer-restore-answers', answers: answers || {} }, '*');
      if (timerCurrentQuestionRef.current) {
        frame.postMessage({ type: 'goto-question', questionNumber: timerCurrentQuestionRef.current }, '*');
      }
    };
    send();
    window.setTimeout(send, 250);
    window.setTimeout(send, 900);
  }, []);

  const timerAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const requestTimerOpen = useCallback(async (clientAttemptKey) => {
    const request = timerRequestRef.current;
    if (!request) return;
    const { data } = await axios.post(`${API_BASE}/api/qcm/timer/session/open`, {
      sourceType: request.sourceType,
      resourceId: String(request.resourceId),
      clientAttemptKey
    }, { headers: timerAuthHeaders() });
    if (data?.clientAttemptKey && timerClientKeyStorageRef.current) {
      localStorage.setItem(timerClientKeyStorageRef.current, data.clientAttemptKey);
    }
    timerAutoSubmitRef.current = false;
    storeTimerData(data);
    if (data?.supported) syncTimerAnswersToFrame();
    return data;
  }, [storeTimerData, syncTimerAnswersToFrame, timerAuthHeaders]);

  const timerIsLocked = timerSession?.supported
    && ['PAUSED', 'COMPLETED', 'EXPIRED'].includes(timerSession.status)
    || ['AUTH_REQUIRED', 'UNAVAILABLE'].includes(timerSession?.status);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'timer-set-locked', locked: Boolean(timerIsLocked) }, '*');
  }, [timerIsLocked, htmlDocument]);

  useEffect(() => {
    syncQcmTheme();
    const root = document.documentElement;
    const observer = new MutationObserver(syncQcmTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  }, [syncQcmTheme]);

  const applyTimerAction = useCallback(async (action, body = {}) => {
    const session = timerSessionRef.current;
    if (!session?.supported || !session.sessionId) return null;
    if (action === 'submit' && pendingAnswersRef.current.size) {
      await Promise.race([
        Promise.allSettled(Array.from(pendingAnswersRef.current)),
        new Promise((resolve) => window.setTimeout(resolve, body.reason === 'TIMEOUT' ? 900 : 2500))
      ]);
    }
    setTimerActionLoading(true);
    setTimerMessage('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/qcm/timer/session/${session.sessionId}/${action}`, body, {
        headers: timerAuthHeaders()
      });
      storeTimerData(data);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Le serveur n’a pas pu actualiser le chronomètre.';
      setTimerMessage(message);
      if (!error.response && session?.supported) {
        const anchor = timerAnchorRef.current;
        const remaining = session.status === 'IN_PROGRESS' && Number.isFinite(anchor.remaining)
          ? Math.max(0, anchor.remaining - Math.floor((Date.now() - anchor.at) / 1000))
          : Number(session.remainingSeconds) || 0;
        storeTimerData({ ...session, offline: true, remainingSeconds: remaining });
      }
      if (action === 'submit' && body.reason === 'TIMEOUT') {
        const expired = { ...session, status: 'EXPIRED', remainingSeconds: 0, finishedReason: 'TIMEOUT' };
        storeTimerData(expired);
      }
      return null;
    } finally {
      setTimerActionLoading(false);
    }
  }, [storeTimerData, timerAuthHeaders]);

  const restartTimerAttempt = useCallback(async () => {
    if (!timerClientKeyStorageRef.current) return;
    const newKey = newClientAttemptKey();
    localStorage.setItem(timerClientKeyStorageRef.current, newKey);
    setTimerMessage('');
    try {
      const data = await requestTimerOpen(newKey);
      if (data?.supported) {
        timerAnswersRef.current = {};
        try { localStorage.removeItem(`qcm-timer-answers:${data.sessionId}`); } catch {}
        iframeRef.current?.contentWindow?.postMessage({ type: 'timer-reset-answers' }, '*');
        window.setTimeout(() => iframeRef.current?.contentWindow?.postMessage({ type: 'timer-reset-answers' }, '*'), 250);
        syncTimerAnswersToFrame({});
      }
    } catch (error) {
      setTimerMessage(error.response?.data?.message || 'Impossible de démarrer une nouvelle tentative.');
    }
  }, [requestTimerOpen, syncTimerAnswersToFrame]);

  useEffect(() => {
    if (!enableTimer || !resourceId || !['Concours', 'Concours blanc'].includes(sourceType)) return undefined;
    let active = true;
    setTimerLoading(true);
    setTimerSession(null);
    timerSessionRef.current = null;
    timerAnswersRef.current = {};
    setTimerRemaining(null);
    setTimerMessage('');

    let user = {};
    try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch {}
    const token = localStorage.getItem('authToken');
    if (!token) {
      setTimerSession({ supported: false, status: 'AUTH_REQUIRED', message: 'Connectez-vous pour activer et sauvegarder le chronomètre.' });
      setTimerLoading(false);
      return undefined;
    }

    const storageKey = `qcm-timer-attempt:${user?.id || 'student'}:${sourceType}:${resourceId}`;
    timerClientKeyStorageRef.current = storageKey;
    timerRequestRef.current = { sourceType, resourceId };
    let clientAttemptKey = localStorage.getItem(storageKey);
    if (!clientAttemptKey) {
      clientAttemptKey = newClientAttemptKey();
      localStorage.setItem(storageKey, clientAttemptKey);
    }

    requestTimerOpen(clientAttemptKey)
      .catch((error) => {
        if (!active) return;
        const stateKey = storageKey.replace('qcm-timer-attempt:', 'qcm-timer-state:');
        try {
          const saved = JSON.parse(localStorage.getItem(stateKey) || 'null');
          if (saved?.sessionId) {
            const elapsed = saved.status === 'IN_PROGRESS' ? Math.floor((Date.now() - Number(saved.snapshotAt || Date.now())) / 1000) : 0;
            const remaining = Math.max(0, Number(saved.remainingSeconds || 0) - elapsed);
            const localSession = {
              ...saved, supported: true, offline: true, remainingSeconds: remaining,
              status: remaining === 0 && saved.status === 'IN_PROGRESS' ? 'EXPIRED' : saved.status,
              finishedReason: remaining === 0 && saved.status === 'IN_PROGRESS' ? 'TIMEOUT' : saved.finishedReason
            };
            storeTimerData(localSession);
            setTimerMessage('Mode hors ligne : le serveur rétablira le temps officiel dès la reconnexion.');
            return;
          }
        } catch {}
        setTimerSession({ supported: false, status: 'UNAVAILABLE', message: error.response?.data?.message || 'Le chronomètre serveur est indisponible. Le QCM reste bloqué jusqu’au rétablissement de la connexion.' });
      })
      .finally(() => { if (active) setTimerLoading(false); });

    return () => { active = false; };
  }, [enableTimer, resourceId, sourceType, requestTimerOpen, storeTimerData]);

  useEffect(() => {
    if (timerSession?.status !== 'UNCONFIRMED') {
      setFreeTimerElapsed(0);
      setFreeTimerPaused(false);
      freeTimerClockRef.current = null;
      return undefined;
    }
    const attemptKey = timerClientKeyStorageRef.current || `${sourceType}:${resourceId}`;
    const storageKey = `qcm-stopwatch-start:${attemptKey}`;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch {}
    if (typeof saved === 'number' && saved > 0) {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - saved) / 1000));
      saved = { elapsedSeconds, startedAt: Date.now(), paused: false };
    }
    if (!saved || typeof saved !== 'object') saved = { elapsedSeconds: 0, startedAt: Date.now(), paused: false };
    const elapsedSeconds = Math.max(0, Number(saved.elapsedSeconds) || 0);
    const paused = Boolean(saved.paused);
    const startedAt = paused ? null : Number(saved.startedAt) || Date.now();
    const clock = { storageKey, elapsedSeconds, startedAt, paused };
    freeTimerClockRef.current = clock;
    setFreeTimerElapsed(paused ? elapsedSeconds : elapsedSeconds + Math.floor((Date.now() - startedAt) / 1000));
    setFreeTimerPaused(paused);
    try { localStorage.setItem(storageKey, JSON.stringify(clock)); } catch {}
  }, [timerSession?.status, sourceType, resourceId]);

  useEffect(() => {
    if (timerSession?.status !== 'UNCONFIRMED' || freeTimerPaused) return undefined;
    const updateElapsed = () => {
      const clock = freeTimerClockRef.current;
      if (!clock || clock.paused || !clock.startedAt) return;
      setFreeTimerElapsed(clock.elapsedSeconds + Math.floor((Date.now() - clock.startedAt) / 1000));
    };
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [timerSession?.status, freeTimerPaused]);

  useEffect(() => {
    if (!timerSession?.supported || timerSession.status !== 'IN_PROGRESS') return undefined;
    const tick = () => {
      const anchor = timerAnchorRef.current;
      if (!Number.isFinite(anchor.remaining)) return;
      const remaining = Math.max(0, anchor.remaining - Math.floor((Date.now() - anchor.at) / 1000));
      setTimerRemaining(remaining);
      const session = timerSessionRef.current;
      if (session?.sessionId && timerClientKeyStorageRef.current && Date.now() - timerSnapshotWriteAtRef.current >= 1000) {
        timerSnapshotWriteAtRef.current = Date.now();
        const stateKey = timerClientKeyStorageRef.current.replace('qcm-timer-attempt:', 'qcm-timer-state:');
        try {
          const saved = JSON.parse(localStorage.getItem(stateKey) || '{}');
          localStorage.setItem(stateKey, JSON.stringify({ ...saved, sessionId: session.sessionId,
            status: session.status, remainingSeconds: remaining, snapshotAt: Date.now(),
            currentQuestion: timerCurrentQuestionRef.current, totalQuestions: timerTotalQuestionsRef.current }));
        } catch {}
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [timerSession?.supported, timerSession?.status]);

  useEffect(() => {
    if (!timerSession?.offline) return undefined;
    const reconnect = () => {
      const storageKey = timerClientKeyStorageRef.current;
      const clientKey = storageKey ? localStorage.getItem(storageKey) : null;
      if (!clientKey) return;
      requestTimerOpen(clientKey).then((data) => {
        if (data?.supported) setTimerMessage('Chronomètre et réponses resynchronisés avec le serveur.');
      }).catch(() => setTimerMessage('Resynchronisation en cours…'));
    };
    window.addEventListener('online', reconnect);
    return () => window.removeEventListener('online', reconnect);
  }, [timerSession?.offline, requestTimerOpen]);

  useEffect(() => {
    if (!timerSession?.supported || timerSession.status !== 'EXPIRED' || timerSession.finishedReason !== 'TIMEOUT') return undefined;
    const synchronizeTimeout = () => {
      if (navigator.onLine) applyTimerAction('submit', { reason: 'TIMEOUT' });
    };
    window.addEventListener('online', synchronizeTimeout);
    synchronizeTimeout();
    return () => window.removeEventListener('online', synchronizeTimeout);
  }, [timerSession?.supported, timerSession?.status, timerSession?.finishedReason, applyTimerAction]);

  useEffect(() => {
    if (!timerSession?.supported || timerSession.status !== 'IN_PROGRESS') return undefined;
    const heartbeat = async () => {
      const session = timerSessionRef.current;
      if (!session?.sessionId || !navigator.onLine) return;
      try {
        const { data } = await axios.post(`${API_BASE}/api/qcm/timer/session/${session.sessionId}/heartbeat`, {
          currentQuestion: timerCurrentQuestionRef.current,
          totalQuestions: timerTotalQuestionsRef.current
        }, { headers: timerAuthHeaders() });
        storeTimerData(data);
      } catch (error) {
        setTimerMessage(error.response?.data?.message || 'Connexion au serveur interrompue. Les réponses restent enregistrées sur cet appareil.');
        if (!error.response) {
          const session = timerSessionRef.current;
          const anchor = timerAnchorRef.current;
          const remaining = session?.status === 'IN_PROGRESS' && Number.isFinite(anchor.remaining)
            ? Math.max(0, anchor.remaining - Math.floor((Date.now() - anchor.at) / 1000))
            : Number(session?.remainingSeconds) || 0;
          if (session?.supported) storeTimerData({ ...session, offline: true, remainingSeconds: remaining });
        }
      }
    };
    const interval = window.setInterval(heartbeat, 15000);
    return () => window.clearInterval(interval);
  }, [timerSession?.supported, timerSession?.status, storeTimerData, timerAuthHeaders]);

  useEffect(() => {
    if (timerSession?.status !== 'IN_PROGRESS' || timerRemaining !== 0 || timerAutoSubmitRef.current) return;
    timerAutoSubmitRef.current = true;
    applyTimerAction('submit', { reason: 'TIMEOUT' });
  }, [timerSession?.status, timerRemaining, applyTimerAction]);

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
    setTimerSlotAttached(false);
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
      let userId = 'guest';
      try { userId = JSON.parse(localStorage.getItem('user') || '{}')?.id || 'guest'; } catch {}
      const iframeStorageKey = `qcm-frame-storage:${userId}:${sourceType}:${resourceId || activeSrc}`;
      iframeLocalStorageKeyRef.current = iframeStorageKey;
      let iframeStorage = {};
      try { iframeStorage = JSON.parse(localStorage.getItem(iframeStorageKey) || '{}') || {}; } catch {}
      const serializedIframeStorage = JSON.stringify(iframeStorage).replace(/</g, '\\u003c');
      const localStorageBridgeScript = `<script>(function(){var values=${serializedIframeStorage};function persist(operation,key,value){parent.postMessage({type:'qcm-frame-storage',operation:operation,key:key,value:value},'*')}var storage={getItem:function(key){key=String(key);return Object.prototype.hasOwnProperty.call(values,key)?values[key]:null},setItem:function(key,value){key=String(key);value=String(value);values[key]=value;persist('set',key,value)},removeItem:function(key){key=String(key);delete values[key];persist('remove',key)},clear:function(){values={};persist('clear')},key:function(index){return Object.keys(values)[Number(index)]||null}};Object.defineProperty(storage,'length',{get:function(){return Object.keys(values).length}});try{Object.defineProperty(window,'localStorage',{configurable:true,value:storage})}catch(e){try{window.localStorage=storage}catch(ignore){}}})();</script>`;
      const base = `<base href="${baseUrl}">${localStorageBridgeScript}<style>html,body{height:auto!important;min-height:0!important;overflow:visible!important}</style>`;
      const resizeScript = `<script>(function(){var send=function(){var d=document.documentElement,b=document.body;parent.postMessage({type:'tracked-html-height',height:Math.max(d?d.scrollHeight:0,b?b.scrollHeight:0,d?d.offsetHeight:0,b?b.offsetHeight:0)},'*')};window.addEventListener('load',send);window.addEventListener('resize',send);new ResizeObserver(send).observe(document.documentElement);if(document.body)new ResizeObserver(send).observe(document.body);setInterval(send,700);send()})()</script>`;
      let html = String(data || '');
      const isQuestionPaletteQcm = /id=["']pal["']/.test(html) && /class=["'][^"']*\bwrap\b/.test(html);
      const isLegacyGridQcm = /id=["']grid["']/.test(html) && /class=["'][^"']*\blayout\b/.test(html);
      const hasQuestionPaletteQcm = isQuestionPaletteQcm || isLegacyGridQcm;
      const isConcours = sourceType === 'Concours' || /concours/i.test(sourceType || '');
      const isConcoursBlanc = /concours\s*blanc/i.test(sourceType || '');
      const integratedQcmUnboxedStyle = hasQuestionPaletteQcm
        ? '<style>.wrap > .side,#main > .card{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important}.side > .top{background:transparent!important;border-radius:0!important;padding:0!important}.tag{display:none!important}</style>'
        : '';
      const explanationToggleStyle = hasQuestionPaletteQcm
        ? '<style>.qcm-explanation-toggle{box-sizing:border-box!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;max-width:100%!important;margin:0!important;padding:10px 16px!important;border:1.5px solid var(--tintbd,#c5d6f5)!important;border-radius:12px!important;background:var(--tint,#e6efff)!important;color:var(--pri,#2457c8)!important;font:700 13px system-ui,sans-serif!important;white-space:nowrap!important;cursor:pointer!important;box-shadow:none!important;transition:background .15s ease,border-color .15s ease!important}.qcm-explanation-toggle:hover{background:var(--pill,#e4edff)!important;border-color:var(--pri,#2457c8)!important}</style>'
        : '';
      const explanationNavigationStyle = hasQuestionPaletteQcm && isConcours
        ? '<style>.qcm-explanation-prev-group{align-items:stretch!important}.qcm-explanation-prev-group>button{box-sizing:border-box!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;height:52px!important;min-height:52px!important;padding-top:0!important;padding-bottom:0!important}</style>'
        : '';
      const integratedQcmStyle = hasQuestionPaletteQcm
        ? (isConcoursBlanc
            ? concoursBlancIntegratedQcmStyle
            : isConcours
            ? '<style>html,body{width:100%!important;min-width:0!important}body{background:transparent!important}.wrap{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;grid-template-columns:1fr!important}.wrap > .side, aside.side{display:none!important}#main > .card{padding:16px 20px!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important}.tag{padding:6px 14px!important;margin-bottom:10px!important}.q{margin:6px 0 12px!important}.opt{padding:9px 16px!important;margin:6px 0!important;gap:14px!important}.opt .l{width:34px!important;height:34px!important}.btns{margin-top:10px!important}.btn:disabled{opacity:.65!important}html[data-platform-theme="dark"]{color-scheme:dark;--bg:#0F172A;--card:#1B2940;--text:#F1F5F9;--muted:#A6B3C5;--pri:#60A5FA;--pri-d:#3B82F6;--bd:#2B3B52;--tint:#202F47;--tintbd:#3A4D6B;--pill:#1E3A5F;--pilltx:#BFDBFE;--ok:#34D399;--okbg:#123325;--ko:#F87171;--kobg:#3B2024;--flash:#3B321D;--flashbd:#B8892A}html[data-platform-theme="dark"] body{background:#0F172A!important;color:#F1F5F9!important}</style>'
            : '<style>html,body{width:100%!important;min-width:0!important}body{background:#f1f5f9!important}.wrap{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}</style>')
        : '';
      const integratedConcoursLayoutStyle = hasQuestionPaletteQcm && isConcours && !isConcoursBlanc
        ? '<style>.layout{grid-template-columns:minmax(0,1fr)!important;gap:0!important}.layout > .side, .layout > aside.side, aside.side{display:none!important}.wrap{display:block!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important}.wrap > .side{display:none!important}.content,#main{width:100%!important;max-width:none!important}.layout > .card:not(.side):not(.explain-side),#main > .card{width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important}.q{margin:6px 0 12px!important}.opt{box-sizing:border-box!important;min-height:64px!important;padding:8px 16px!important;margin:6px 0!important}@media(max-width:760px){.opt{min-height:60px!important;padding:8px 12px!important;margin:6px 0!important}}.qcm-explanation-toggle{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:12px 0 16px;padding:12px 16px;border:1px solid #c5d6f5;border-radius:12px;background:#e6efff;color:#1c4fd0;font:700 14px system-ui,sans-serif;cursor:pointer;transition:background .15s ease,border-color .15s ease}.qcm-explanation-toggle:hover{background:#dbe8ff;border-color:#9bbaf0}html[data-platform-theme="dark"] .qcm-explanation-toggle{background:#202F47;color:#BFDBFE;border-color:#3A4D6B}html[data-platform-theme="dark"] .qcm-explanation-toggle:hover{background:#263854;border-color:#60A5FA}</style>'
        : '';
      const concoursAnswerHeightStyle = hasQuestionPaletteQcm && isConcours && !isConcoursBlanc
        ? '<style>.opt{min-height:79px!important}@media(max-width:760px){.opt{min-height:75px!important}}</style>'
        : '';
      const navScript = `<script>(function(){
        var timerLocked=false;
        function readData(){try{return typeof QCM_DATA!=='undefined'?QCM_DATA:window.QCM_DATA}catch(e){return window.QCM_DATA}}
        function readState(){try{return typeof S!=='undefined'?S:window.S}catch(e){return window.S}}
        function readQuestions(){var data=readData();if(Array.isArray(data&&data.questions))return data.questions;try{return typeof Q!=='undefined'&&Array.isArray(Q)?Q:[]}catch(e){return []}}
        function restoreAnswers(answers){
          if(!answers||typeof answers!=='object')return;
          var data=readData(),state=readState(),questions=readQuestions();
          if(Array.isArray(data&&data.questions)&&state&&state.answers){
            Object.keys(answers).forEach(function(key){var question=data.questions.find(function(item,index){return String(item.id??item.questionNumber??index+1)===String(key)});if(question)state.answers[question.id]=answers[key]});
            if(typeof render==='function')render();else if(typeof window.render==='function')window.render();
            return;
          }
          try{var legacyAnswers=typeof ans!=='undefined'&&Array.isArray(ans)?ans:window.ans;if(Array.isArray(legacyAnswers)){Object.keys(answers).forEach(function(key){var index=questions.findIndex(function(item,qIndex){return String(item.id??item.questionNumber??qIndex+1)===String(key)});if(index<0)index=Number(key)-1;if(index>=0)legacyAnswers[index]=answers[key]});if(typeof render==='function')render();else if(typeof window.render==='function')window.render()}}catch(e){}
        }
        window.addEventListener('message',function(ev){if(!ev||!ev.data)return;if(ev.data.type==='timer-set-locked'){timerLocked=!!ev.data.locked;return}if(ev.data.type==='timer-restore-answers'){restoreAnswers(ev.data.answers);return}if(ev.data.type==='timer-reset-answers'){var data=readData(),state=readState(),questions=readQuestions();if(state&&state.answers){state.answers={};if(typeof render==='function')render();else if(typeof window.render==='function')window.render()}else{try{var legacyAnswers=typeof ans!=='undefined'&&Array.isArray(ans)?ans:window.ans;if(Array.isArray(legacyAnswers)){legacyAnswers.fill(null);if(typeof render==='function')render();else if(typeof window.render==='function')window.render()}}catch(e){}}return}if(ev.data.type==='goto-question'){var idx=typeof ev.data.index==='number'?ev.data.index:(Number(ev.data.questionNumber)-1);if(!isNaN(idx)&&idx>=0){if(typeof cur!=='undefined'&&typeof render==='function'){cur=idx;render()}else if(typeof window.cur!=='undefined'&&typeof window.render==='function'){window.cur=idx;window.render()}else{var btns=document.querySelectorAll('#pal button, .pal button');if(btns&&btns[idx]){btns[idx].click()}}}}});
        document.addEventListener('click',function(ev){if(timerLocked){ev.preventDefault();ev.stopImmediatePropagation()}},true);
        document.addEventListener('keydown',function(ev){if(timerLocked){ev.preventDefault();ev.stopImmediatePropagation()}},true);
        var lastReportedCur=-1;function readCurrentIndex(){try{if(typeof cur!=='undefined')return Number(cur)}catch(e){}return typeof window.cur!=='undefined'?Number(window.cur):null}
        setInterval(function(){var currentIndex=readCurrentIndex();if(currentIndex!==null&&Number.isFinite(currentIndex)&&currentIndex!==lastReportedCur){lastReportedCur=currentIndex;parent.postMessage({type:'econcourse-qcm-cur-changed',questionNumber:currentIndex+1},'*')}},250);
        var reportedTotal=false;setInterval(function(){var questions=readQuestions();if(!reportedTotal&&questions&&questions.length>0){reportedTotal=true;parent.postMessage({type:'econcourse-qcm-meta',totalQuestions:questions.length},'*')}},300);
      })();</script>`;
      const explanationScript = hasQuestionPaletteQcm && isConcours
        ? `<script>(function(){function setupExplanationToggle(){var explanation=document.querySelector('#exp, .exp');if(!explanation||explanation.dataset.toggleReady==='true')return;explanation.dataset.toggleReady='true';explanation.style.display='none';var button=document.createElement('button');button.type='button';button.className='qcm-explanation-toggle';button.setAttribute('aria-expanded','false');button.textContent='Afficher l’explication';button.addEventListener('click',function(){var show=explanation.style.display==='none';explanation.style.display=show?'':'none';button.setAttribute('aria-expanded',String(show));button.textContent=show?'Masquer l’explication':'Afficher l’explication';if(show)explanation.scrollIntoView({behavior:'smooth',block:'start'});});var qcmCard=document.querySelector('#main > .card');if(qcmCard)qcmCard.appendChild(button);else explanation.parentNode.insertBefore(button,explanation);}var observer=new MutationObserver(setupExplanationToggle);if(document.body){observer.observe(document.body,{childList:true,subtree:true});setupExplanationToggle();}})();</script>`
        : '';
      const explanationPlacementScript = hasQuestionPaletteQcm && isConcours
        ? `<script>(function(){function placeExplanationToggle(){var button=document.querySelector('.qcm-explanation-toggle');var card=document.querySelector('#main > .card');var nav=card&&card.querySelector('.btns,.nav');if(!button||!nav)return;var actions=nav.querySelectorAll('button:not(.qcm-explanation-toggle)');var previousButton=actions[0];if(!previousButton)return;var group=nav.querySelector('.qcm-explanation-prev-group');if(!group){group=document.createElement('div');group.className='qcm-explanation-prev-group';group.style.cssText='display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap';nav.insertBefore(group,previousButton)}if(previousButton.parentNode!==group)group.appendChild(previousButton);if(button.parentNode!==group)group.appendChild(button)}var observer=new MutationObserver(placeExplanationToggle);if(document.body){observer.observe(document.body,{childList:true,subtree:true});placeExplanationToggle();}})();</script>`
        : '';
      const themeSyncScript = hasQuestionPaletteQcm && isConcours
        ? `<script>(function(){window.addEventListener('message',function(event){if(event.source!==parent||event.data?.type!=='platform-theme')return;document.documentElement.setAttribute('data-platform-theme',event.data.theme==='dark'?'dark':'light')})})();</script>`
        : '';
      const timerSlotScript = hasQuestionPaletteQcm && isConcoursBlanc
        ? `<script>(function(){
          var timerState=null,group=null,slot=null,timerSlotReported=false;
          function reportSlot(attached){if(timerSlotReported===attached)return;timerSlotReported=attached;parent.postMessage({type:'tracked-qcm-timer-slot',attached:attached},'*')}
          function restoreQuestion(){
            if(!group||!group.parentNode){reportSlot(false);return}
            var palette=group.parentNode,question=group.querySelector('button');
            if(question)palette.insertBefore(question,group);
            group.remove();group=null;slot=null;
            reportSlot(false);
          }
          function makeSlot(){
            slot=document.createElement('div');
            slot.setAttribute('data-tracked-timer-slot','true');
            slot.style.cssText='box-sizing:border-box;display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:6px;width:100%;max-width:100%;height:44px;padding:4px 6px 4px 10px;border:1px solid #e1e9f2;border-radius:12px;background:#fff;box-shadow:0 3px 10px rgba(20,53,92,.14);font-family:system-ui,sans-serif';
            var dot=document.createElement('span');dot.setAttribute('data-timer-dot','');dot.style.cssText='width:6px;height:6px;border-radius:50%;flex:0 0 auto';
            var value=document.createElement('span');value.setAttribute('data-timer-value','');value.setAttribute('role','timer');value.setAttribute('aria-live','off');value.style.cssText='flex:1 1 auto;min-width:78px;text-align:center;color:#183b70;font-size:17px;font-weight:850;line-height:1;font-variant-numeric:tabular-nums;white-space:nowrap';
            var pause=document.createElement('button');pause.type='button';pause.setAttribute('aria-label','Mettre le chronomètre en pause');pause.title='Pause';pause.innerHTML='<svg aria-hidden="true" width="11" height="13" viewBox="0 0 12 14" fill="none"><rect x="1.5" y="1" width="3" height="12" rx="1" fill="currentColor"/><rect x="7.5" y="1" width="3" height="12" rx="1" fill="currentColor"/></svg>';pause.style.cssText='width:26px;height:26px;min-width:26px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:50%;background:#7894b3;color:#fff;cursor:pointer';pause.addEventListener('click',function(){parent.postMessage({type:'tracked-qcm-timer-action',action:'pause'},'*')});
            var resume=document.createElement('button');resume.type='button';resume.setAttribute('aria-label','Continuer le chronomètre');resume.title='Continuer';resume.innerHTML='<svg aria-hidden="true" width="11" height="13" viewBox="0 0 12 14" fill="none"><path d="M2 1.5L10.5 7L2 12.5V1.5Z" fill="currentColor"/></svg>';resume.style.cssText='width:26px;height:26px;min-width:26px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:50%;background:#153b70;color:#fff;cursor:pointer';resume.addEventListener('click',function(){parent.postMessage({type:'tracked-qcm-timer-action',action:'resume'},'*')});
            slot.append(dot,value,pause,resume);
          }
          function placeTimer(){
            if(!timerState||!timerState.visible){restoreQuestion();return}
            var palette=document.querySelector('.wrap .pal, .layout .grid');
            var question=palette&&palette.querySelector('button');
            if(!palette||!question){restoreQuestion();return}
            if(!group){group=document.createElement('div');group.setAttribute('data-tracked-question-timer-group','true');group.style.cssText='box-sizing:border-box;display:flex;flex:0 0 5cm;flex-direction:column;gap:8px;width:5cm;max-width:100%'}
            if(group.parentNode!==palette)palette.insertBefore(group,question);
            Array.prototype.forEach.call(group.querySelectorAll('button'),function(button){if(button!==question)button.remove()});
            if(question.parentNode!==group)group.insertBefore(question,group.firstChild);
            if(!slot)makeSlot();
            if(slot.parentNode!==group)group.appendChild(slot);
            var dot=slot.querySelector('[data-timer-dot]'),value=slot.querySelector('[data-timer-value]'),buttons=slot.querySelectorAll('button');
            value.textContent=timerState.value||'--:--:--';value.title=timerState.title||'Chronomètre';
            value.style.color=timerState.urgent?'#b42318':'#183b70';
            dot.style.background=timerState.urgent?'#dc4c4c':timerState.paused?'#94a3b8':'#b8c6d5';
            buttons[0].disabled=!!timerState.pauseDisabled;buttons[1].disabled=!!timerState.resumeDisabled;
            buttons[0].style.opacity=buttons[0].disabled?'.55':'1';buttons[1].style.opacity=buttons[1].disabled?'.55':'1';
            buttons[0].style.cursor=buttons[0].disabled?'default':'pointer';buttons[1].style.cursor=buttons[1].disabled?'default':'pointer';
            reportSlot(true);
          }
          window.addEventListener('message',function(event){if(event.source!==parent||event.data?.type!=='tracked-qcm-timer-render')return;timerState=event.data.state||null;placeTimer()});
          var observer=new MutationObserver(placeTimer);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
          parent.postMessage({type:'tracked-qcm-timer-ready'},'*');
        })();</script>`
        : '';
      if (/<head[^>]*>/i.test(html)) html = html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
      else html = `${base}${html}`;
      if (integratedQcmStyle || integratedConcoursLayoutStyle || integratedQcmUnboxedStyle || concoursAnswerHeightStyle) {
        const headClose = html.toLowerCase().lastIndexOf('</head>');
        const injectedStyles = `${integratedQcmStyle}${integratedConcoursLayoutStyle}${concoursAnswerHeightStyle}${integratedQcmUnboxedStyle}${explanationToggleStyle}${explanationNavigationStyle}`;
        if (headClose >= 0) html = `${html.slice(0, headClose)}${injectedStyles}${html.slice(headClose)}`;
        else html = `${injectedStyles}${html}`;
      }
      const scriptsToInject = `${resizeScript}${navScript}${explanationScript}${explanationPlacementScript}${themeSyncScript}${timerSlotScript}`;
      const bodyClose = html.toLowerCase().lastIndexOf('</body>');
      if (bodyClose >= 0) html = `${html.slice(0, bodyClose)}${scriptsToInject}${html.slice(bodyClose)}`;
      else html += scriptsToInject;
      setHtmlDocument(html);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [activeSrc, resourceId, sourceType]);

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
    if (!timerSession?.supported || !timerSession.sessionId || timerSession.status !== 'IN_PROGRESS') return undefined;
    const queueKey = `qcm-timer-answer-queue:${timerSession.sessionId}`;
    let flushing = false;
    const flushQueue = async () => {
      if (flushing || !navigator.onLine) return;
      flushing = true;
      try {
        const queued = JSON.parse(localStorage.getItem(queueKey) || '[]');
        for (const answer of queued) {
          try {
            await axios.post(`${API_BASE}/api/qcm/attempt-answer`, answer, { headers: timerAuthHeaders() });
            const current = JSON.parse(localStorage.getItem(queueKey) || '[]');
            localStorage.setItem(queueKey, JSON.stringify(current.filter((item) =>
              !(String(item.questionId) === String(answer.questionId)
                && String(item.selectedChoiceLabel) === String(answer.selectedChoiceLabel))
            )));
            window.dispatchEvent(new CustomEvent('student-qcm-history-updated'));
          } catch {
            break;
          }
        }
      } catch {} finally {
        flushing = false;
      }
    };
    window.addEventListener('online', flushQueue);
    const interval = window.setInterval(flushQueue, 12000);
    flushQueue();
    return () => {
      window.removeEventListener('online', flushQueue);
      window.clearInterval(interval);
    };
  }, [timerSession?.sessionId, timerSession?.supported, timerSession?.status, timerAuthHeaders]);

  useEffect(() => {
    const handleQcmMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      if (event.data?.type === 'tracked-qcm-timer-ready') {
        setTimerSlotAttached(false);
        iframeRef.current?.contentWindow?.postMessage({ type: 'tracked-qcm-timer-render', state: timerControlStateRef.current }, '*');
        return;
      }

      if (event.data?.type === 'tracked-qcm-timer-slot') {
        setTimerSlotAttached(Boolean(event.data.attached));
        return;
      }

      if (event.data?.type === 'tracked-qcm-timer-action') {
        timerActionHandlerRef.current?.(event.data.action);
        return;
      }

      if (event.data?.type === 'qcm-frame-storage') {
        const storageKey = iframeLocalStorageKeyRef.current;
        const itemKey = String(event.data.key || '').slice(0, 500);
        if (!storageKey) return;
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
          if (event.data.operation === 'clear') {
            localStorage.setItem(storageKey, '{}');
          } else if (itemKey && event.data.operation === 'set') {
            saved[itemKey] = String(event.data.value ?? '');
            localStorage.setItem(storageKey, JSON.stringify(saved));
          } else if (itemKey && event.data.operation === 'remove') {
            delete saved[itemKey];
            localStorage.setItem(storageKey, JSON.stringify(saved));
          }
        } catch {}
        return;
      }

      if (event.data?.type === 'tracked-html-height') {
        const height = Number(event.data.height);
        if (Number.isFinite(height) && height > 0) setHtmlFrameHeight(Math.min(Math.max(height, 320), 100000));
        return;
      }

      if (event.data?.type === 'econcourse-qcm-cur-changed') {
        updateCurrentQuestion(event.data.questionNumber);
        timerCurrentQuestionRef.current = Number(event.data.questionNumber) || null;
        const timerProgressSession = timerSessionRef.current;
        if (timerProgressSession?.sessionId && timerClientKeyStorageRef.current) {
          const stateKey = timerClientKeyStorageRef.current.replace('qcm-timer-attempt:', 'qcm-timer-state:');
          try {
            const saved = JSON.parse(localStorage.getItem(stateKey) || '{}');
            localStorage.setItem(stateKey, JSON.stringify({ ...saved, sessionId: timerProgressSession.sessionId,
              status: timerProgressSession.status, currentQuestion: timerCurrentQuestionRef.current,
              totalQuestions: timerTotalQuestionsRef.current, snapshotAt: Date.now() }));
          } catch {}
        }
        return;
      }

      if (event.data?.type === 'econcourse-qcm-meta') {
        timerTotalQuestionsRef.current = Number(event.data.totalQuestions) || null;
        return;
      }

      // 1. Détection d'une réponse incorrecte
      if (event.data?.type === 'econcourse-qcm-mistake' && event.data?.mistake) {
        const mistake = event.data.mistake;
        updateCurrentQuestion(mistake.questionNumber);
        timerCurrentQuestionRef.current = Number(mistake.questionNumber) || timerCurrentQuestionRef.current;
        if (event.data.totalQuestions) {
          timerTotalQuestionsRef.current = Number(event.data.totalQuestions) || null;
        }
        setSaveStatus('idle');
        setSaveMessage('');
        const isWrong = mistake.selectedChoiceLabel !== mistake.correctChoiceLabel;
        const timedSession = timerSessionRef.current;
        const questionKey = String(mistake.questionId ?? mistake.questionNumber ?? mistake.questionText ?? '');
        const selectedLabel = String(mistake.selectedChoiceLabel ?? '').trim();
        if (enableTimer && timedSession?.supported && timedSession.status === 'IN_PROGRESS' && questionKey && selectedLabel) {
          const nextAnswers = { ...timerAnswersRef.current, [questionKey]: selectedLabel };
          timerAnswersRef.current = nextAnswers;
          try { localStorage.setItem(`qcm-timer-answers:${timedSession.sessionId}`, JSON.stringify(nextAnswers)); } catch {}
        }

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
          const answerPayload = {
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
          };
          if (enableTimer && timedSession?.supported && timedSession.status === 'IN_PROGRESS') {
            answerPayload.timerSessionId = timedSession.sessionId;
          }
          const pendingAnswer = axios.post(`${API_BASE}/api/qcm/attempt-answer`, answerPayload, {
            headers: { Authorization: `Bearer ${historySessionToken}` }
          }).then(() => {
            if (timedSession?.supported && timedSession.sessionId) {
              const queueKey = `qcm-timer-answer-queue:${timedSession.sessionId}`;
              try {
                const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
                localStorage.setItem(queueKey, JSON.stringify(queue.filter((item) =>
                  !(String(item.questionId) === String(answerPayload.questionId)
                    && String(item.selectedChoiceLabel) === String(answerPayload.selectedChoiceLabel))
                )));
              } catch {}
            }
            window.dispatchEvent(new CustomEvent('student-qcm-history-updated'));
          }).catch((error) => {
            if (timedSession?.supported && timedSession.sessionId && answerPayload.timerSessionId) {
              const queueKey = `qcm-timer-answer-queue:${timedSession.sessionId}`;
              try {
                const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
                const withoutQuestion = queue.filter((item) => String(item.questionId) !== String(answerPayload.questionId));
                withoutQuestion.push(answerPayload);
                localStorage.setItem(queueKey, JSON.stringify(withoutQuestion.slice(-200)));
              } catch {}
            }
            if (!error.response && timedSession?.supported) {
              const anchor = timerAnchorRef.current;
              const remaining = timedSession.status === 'IN_PROGRESS' && Number.isFinite(anchor.remaining)
                ? Math.max(0, anchor.remaining - Math.floor((Date.now() - anchor.at) / 1000))
                : Number(timedSession.remainingSeconds) || 0;
              storeTimerData({ ...timedSession, offline: true, remainingSeconds: remaining });
              setTimerMessage('Connexion interrompue : vos réponses sont gardées sur cet appareil et seront resynchronisées.');
            }
            console.warn('Impossible d’enregistrer cette réponse dans l’historique du QCM:', error);
          }).finally(() => pendingAnswersRef.current.delete(pendingAnswer));
          pendingAnswersRef.current.add(pendingAnswer);
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
  }, [chapter, enableTimer, resourceId, resourceTitle, school, sourceType, src, storeTimerData, subject, title, updateCurrentQuestion, year]);

  const formattedTimer = Number.isFinite(timerRemaining)
    ? [Math.floor(timerRemaining / 3600), Math.floor((timerRemaining % 3600) / 60), timerRemaining % 60]
      .map((part) => String(part).padStart(2, '0')).join(':')
    : '--:--:--';
  const formattedFreeTimer = [Math.floor(freeTimerElapsed / 3600), Math.floor((freeTimerElapsed % 3600) / 60), freeTimerElapsed % 60]
    .map((part) => String(part).padStart(2, '0')).join(':');
  const timerStatusLabel = timerSession?.status === 'IN_PROGRESS' ? 'En cours'
    : timerSession?.status === 'PAUSED' ? 'En pause'
      : ['COMPLETED', 'EXPIRED'].includes(timerSession?.status) ? 'Terminé'
        : timerLoading ? 'Préparation du chronomètre…' : '';
  const timerUrgent = timerSession?.supported && timerSession.status === 'IN_PROGRESS' && timerRemaining !== null && timerRemaining <= 300;
  const showTimerControls = timerSession?.supported && timerSession.sessionId;
  const timerFinished = ['COMPLETED', 'EXPIRED'].includes(timerSession?.status);
  const timerControlVisible = Boolean(showTimerControls || timerSession?.status === 'UNCONFIRMED');
  const pauseFreeTimer = () => {
    const clock = freeTimerClockRef.current;
    if (!clock || clock.paused || !clock.startedAt) return;
    const elapsedSeconds = clock.elapsedSeconds + Math.floor((Date.now() - clock.startedAt) / 1000);
    const pausedClock = { ...clock, elapsedSeconds, startedAt: null, paused: true };
    freeTimerClockRef.current = pausedClock;
    try { localStorage.setItem(clock.storageKey, JSON.stringify(pausedClock)); } catch {}
    setFreeTimerElapsed(elapsedSeconds);
    setFreeTimerPaused(true);
  };
  const resumeFreeTimer = () => {
    const clock = freeTimerClockRef.current;
    if (!clock || !clock.paused) return;
    const resumedClock = { ...clock, startedAt: Date.now(), paused: false };
    freeTimerClockRef.current = resumedClock;
    try { localStorage.setItem(clock.storageKey, JSON.stringify(resumedClock)); } catch {}
    setFreeTimerPaused(false);
  };
  timerActionHandlerRef.current = (action) => {
    if (action === 'pause') return showTimerControls ? applyTimerAction('pause') : pauseFreeTimer();
    if (action === 'resume') return showTimerControls ? applyTimerAction('resume') : resumeFreeTimer();
  };
  timerControlStateRef.current = {
    visible: timerControlVisible,
    value: showTimerControls ? formattedTimer : formattedFreeTimer,
    title: timerSession?.durationSource || timerStatusLabel || 'Chronomètre libre',
    urgent: Boolean(timerUrgent),
    paused: timerSession?.status === 'PAUSED' || freeTimerPaused,
    pauseDisabled: showTimerControls
      ? timerActionLoading || timerSession.offline || !navigator.onLine || timerSession.status !== 'IN_PROGRESS'
      : freeTimerPaused,
    resumeDisabled: showTimerControls
      ? timerActionLoading || timerSession.offline || !navigator.onLine || timerSession.status !== 'PAUSED'
      : !freeTimerPaused
  };
  const syncTimerControlToFrame = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({
      type: 'tracked-qcm-timer-render',
      state: timerControlStateRef.current
    }, '*');
  }, []);
  useEffect(() => {
    syncTimerControlToFrame();
  }, [syncTimerControlToFrame, timerControlVisible, formattedTimer, formattedFreeTimer, timerUrgent,
    timerSession?.status, timerSession?.durationSource, timerSession?.offline, timerActionLoading, freeTimerPaused]);
  const timerControl = timerControlVisible ? (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: timerPortalTarget ? 'space-between' : 'flex-start', gap: 6,
      width: timerPortalTarget ? '100%' : 'auto', height: timerPortalTarget ? 44 : 36, boxSizing: 'border-box',
      padding: timerPortalTarget ? '4px 6px 4px 10px' : '3px 6px 3px 10px',
      border: '1px solid #e1e9f2', borderRadius: timerPortalTarget ? 12 : 999,
      background: '#fff', boxShadow: '0 3px 10px rgba(20, 53, 92, 0.14)', flex: '0 0 auto'
    }}>
      <span aria-hidden="true" style={{
        width: 6, height: 6, borderRadius: '50%', flex: '0 0 auto',
        background: timerUrgent ? '#dc4c4c' : (timerSession?.status === 'PAUSED' || freeTimerPaused) ? '#94a3b8' : '#b8c6d5'
      }} />
      <span role="timer" aria-live="off" title={timerSession?.durationSource || timerStatusLabel || 'Chronomètre libre'}
        style={{ color: timerUrgent ? '#b42318' : '#183b70', fontVariantNumeric: 'tabular-nums', fontSize: 17, fontWeight: 850, lineHeight: 1, whiteSpace: 'nowrap', minWidth: 78, textAlign: 'center' }}>
        {showTimerControls ? formattedTimer : formattedFreeTimer}
      </span>
      <button type="button"
        onClick={() => showTimerControls ? applyTimerAction('pause') : pauseFreeTimer()}
        disabled={showTimerControls
          ? timerActionLoading || timerSession.offline || !navigator.onLine || timerSession.status !== 'IN_PROGRESS'
          : freeTimerPaused}
        aria-label="Mettre le chronomètre en pause" title="Pause"
        style={{
          width: 26, height: 26, minWidth: 26, padding: 0, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '50%',
          background: '#7894b3', color: '#fff',
          cursor: (showTimerControls ? timerSession.status === 'IN_PROGRESS' : !freeTimerPaused) ? 'pointer' : 'default'
        }}>
        <svg aria-hidden="true" width="11" height="13" viewBox="0 0 12 14" fill="none">
          <rect x="1.5" y="1" width="3" height="12" rx="1" fill="currentColor" />
          <rect x="7.5" y="1" width="3" height="12" rx="1" fill="currentColor" />
        </svg>
      </button>
      <button type="button"
        onClick={() => showTimerControls ? applyTimerAction('resume') : resumeFreeTimer()}
        disabled={showTimerControls
          ? timerActionLoading || timerSession.offline || !navigator.onLine || timerSession.status !== 'PAUSED'
          : !freeTimerPaused}
        aria-label="Continuer le chronomètre" title="Continuer"
        style={{
          width: 26, height: 26, minWidth: 26, padding: 0, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '50%',
          background: '#153b70', color: '#fff',
          cursor: (showTimerControls ? timerSession.status === 'PAUSED' : freeTimerPaused) ? 'pointer' : 'default'
        }}>
        <svg aria-hidden="true" width="11" height="13" viewBox="0 0 12 14" fill="none">
          <path d="M2 1.5L10.5 7L2 12.5V1.5Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  ) : null;
  const timerToolbarFallback = timerControl && !timerPortalTarget && !timerSlotAttached
    ? <div style={{ marginRight: 'auto' }}>{timerControl}</div>
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: 'auto', position: 'relative' }}>
      {timerUrgent && <div role="alert" style={{ margin: '0 0 8px', padding: '9px 12px', borderRadius: 10, background: '#fff1f0', color: '#b42318', fontWeight: 800, fontSize: 13 }}>
        Temps limité : il reste cinq minutes ou moins. Le concours sera soumis automatiquement à zéro.
      </div>}
      {timerSession?.status === 'EXPIRED' && <div role="status" style={{ margin: '0 0 8px', padding: '10px 12px', borderRadius: 10, background: '#fff1f0', color: '#b42318', fontWeight: 800, fontSize: 13 }}>
        Temps écoulé : votre concours a été soumis automatiquement.
      </div>}
      {timerSession?.status === 'COMPLETED' && <div role="status" style={{ margin: '0 0 8px', padding: '10px 12px', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: 13 }}>
        Concours terminé. Vos réponses ont été sauvegardées.
      </div>}
      <div style={{
        width: '100%',
        padding: '6px 0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        flexWrap: 'wrap',
        position: 'sticky',
        top: '8px',
        zIndex: 60,
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
        {timerSession?.status !== 'UNCONFIRMED' && !showTimerControls && (timerLoading || timerSession?.message) && (
          <span style={{ marginRight: 'auto', color: '#64748b', fontSize: 12, fontWeight: 700 }}>
            {timerSession?.message || 'Préparation du chronomètre…'}
          </span>
        )}
        {timerMessage && <span role="alert" style={{ marginRight: 'auto', color: '#b42318', fontSize: 11, fontWeight: 700 }}>{timerMessage}</span>}
        {timerToolbarFallback}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
        {showTimerControls && timerFinished && (
          <button type="button" disabled={timerLoading || timerActionLoading || timerSession.offline || !navigator.onLine}
            onClick={restartTimerAttempt}
            style={{ ...timerButtonStyle('#2563eb', '#fff'), height: 40, padding: '0 13px' }}>
            Nouvelle tentative
          </button>
        )}
        <button
          type="button"
          onClick={saveCurrentQuestionMistake}
          disabled={!currentQuestionMistake || saveStatus === 'saving'}
          title="Sauvegarder uniquement la question affichée si elle est incorrecte"
          style={{
            height: 40,
            boxSizing: 'border-box',
            padding: '0 14px',
            backgroundColor: saveStatus === 'saved' ? '#059669' : '#2457c8',
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
            boxShadow: '0 2px 6px rgba(36,87,200,0.25)',
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
      </div>

      {timerPortalTarget && timerControl && createPortal(timerControl, timerPortalTarget)}

      <iframe
        ref={iframeRef}
        onLoad={() => {
          syncTimerAnswersToFrame();
          syncQcmTheme();
          syncTimerControlToFrame();
          iframeRef.current?.contentWindow?.postMessage({ type: 'timer-set-locked', locked: Boolean(timerIsLocked) }, '*');
        }}
        src={htmlDocument === null ? activeSrc : undefined}
        srcDoc={htmlDocument === null ? undefined : htmlDocument}
        title={title || 'QCM interactif'}
        sandbox="allow-scripts allow-forms allow-popups"
        scrolling={htmlDocument === null ? undefined : 'no'}
        style={htmlDocument === null ? { ...style, pointerEvents: timerIsLocked ? 'none' : 'auto' } : {
          ...style,
          width: '100%',
          maxWidth: 'none',
          height: `${htmlFrameHeight}px`,
          overflow: 'hidden',
          pointerEvents: timerIsLocked ? 'none' : 'auto',
          opacity: timerIsLocked ? 0.72 : 1
        }}
      />
    </div>
  );
}

function timerButtonStyle(background, color) {
  return {
    padding: '8px 13px', borderRadius: 10, border: '1px solid #cbd8e8', background, color,
    fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap'
  };
}
