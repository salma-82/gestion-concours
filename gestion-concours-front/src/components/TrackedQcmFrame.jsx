import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  useEffect(() => {
    const handleQcmMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type !== 'econcourse-qcm-mistake' || !event.data?.mistake) return;

      const mistake = event.data.mistake;
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
      const isWrong = mistake.selectedChoiceLabel !== mistake.correctChoiceLabel;
      if (isWrong) recordStudentMistake(studentMistake);

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
    };

    window.addEventListener('message', handleQcmMessage);
    return () => window.removeEventListener('message', handleQcmMessage);
  }, [chapter, resourceId, resourceTitle, school, sourceType, src, subject, title]);

  return (
    <iframe
      ref={iframeRef}
      src={trackedSrc === src || verifiedTrackedSrc !== trackedSrc ? src : trackedSrc}
      title={title || 'QCM interactif'}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      style={style}
    />
  );
}
