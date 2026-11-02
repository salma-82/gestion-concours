const readJson = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const localDateKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getStudentScope = () => {
  const user = readJson('user', {});
  const identity = user?.id ?? user?.email ?? 'guest';
  return encodeURIComponent(String(identity).trim().toLowerCase());
};

export const getStudentProgressKey = () => `student-progress:${getStudentScope()}`;
export const getStudentPlanningKey = () => `student-planning:${getStudentScope()}`;
export const getStudentMistakesKey = () => `student-qcm-mistakes:${getStudentScope()}`;

export const readStudentProgress = () => {
  const items = readJson(getStudentProgressKey(), []);
  return Array.isArray(items) ? items : [];
};

export const readStudentPlanning = () => {
  const key = getStudentPlanningKey();
  const saved = localStorage.getItem(key);
  if (saved !== null) {
    const items = readJson(key, []);
    return Array.isArray(items) ? items : [];
  }

  // Keep the planning saved by older versions and scope it to the signed-in client.
  const legacyItems = readJson('userPlanning', []);
  const items = Array.isArray(legacyItems) ? legacyItems : [];
  if (items.length) localStorage.setItem(key, JSON.stringify(items));
  return items;
};

export const readStudentMistakes = () => {
  const items = readJson(getStudentMistakesKey(), []);
  return Array.isArray(items) ? items : [];
};

const saveProgress = (items) => {
  localStorage.setItem(getStudentProgressKey(), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('student-progress-updated'));
  return items;
};

const sendStudentActivityEvent = (payload) => {
  const token = localStorage.getItem('authToken');
  if (!token) return Promise.resolve(false);
  return fetch('/api/student-activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }).then((response) => {
    if (response.ok) window.dispatchEvent(new CustomEvent('student-server-activity-updated'));
    return response.ok;
  }).catch((error) => console.warn('Impossible d’enregistrer cette activité sur le serveur.', error));
};

export const fetchStudentActivityEvents = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Session étudiant manquante.');
  const response = await fetch('/api/student-activities', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Chargement des activités impossible (${response.status}).`);
  const data = await response.json();
  return Array.isArray(data?.events) ? data.events : [];
};

const normalizeStudentActivityType = (type) => String(type || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

export const getStudentActivityStatusKey = (type, resourceId) =>
  `${normalizeStudentActivityType(type)}:${String(resourceId ?? '')}`;

export const fetchStudentActivityCompletionMap = async () => {
  const events = await fetchStudentActivityEvents();
  const statuses = {};
  [...events]
    .sort((left, right) => {
      const timeDifference = new Date(left.occurredAt || 0) - new Date(right.occurredAt || 0);
      return timeDifference || (Number(left.id) || 0) - (Number(right.id) || 0);
    })
    .forEach((event) => {
      if (event.eventType !== 'COMPLETE' && event.eventType !== 'UNCOMPLETE') return;
      const key = getStudentActivityStatusKey(event.type, event.resourceId);
      statuses[key] = event.eventType === 'COMPLETE';
    });
  return statuses;
};

export const recordStudentActivity = ({ type, resourceId, title, subject = '', chapter = '' }) => {
  if (!title) return readStudentProgress();

  const stableResourceId = resourceId ?? title;
  const id = `${type}:${stableResourceId}`;
  const items = readStudentProgress();
  const now = new Date().toISOString();
  const existing = items.find((item) => item.id === id);
  const updated = {
    id,
    type,
    title,
    subject: subject || existing?.subject || '',
    chapter: chapter || existing?.chapter || '',
    visits: (existing?.visits || 0) + 1,
    completed: existing?.completed || false,
    completedAt: existing?.completedAt || null,
    durationSeconds: existing?.durationSeconds || 0,
    durationByDay: existing?.durationByDay || {},
    firstViewedAt: existing?.firstViewedAt || now,
    lastViewedAt: now
  };

  sendStudentActivityEvent({ type, resourceId: stableResourceId, eventType: 'VIEW' });

  return saveProgress([updated, ...items.filter((item) => item.id !== id)].slice(0, 100));
};

export const recordStudentActivityDuration = (id, durationSeconds, date = new Date()) => {
  const seconds = Math.max(0, Math.floor(Number(durationSeconds) || 0));
  if (!id || !seconds) return readStudentProgress();
  const day = localDateKey(date);
  const items = readStudentProgress().map((item) => item.id === id ? {
    ...item,
    durationSeconds: (Number(item.durationSeconds) || 0) + seconds,
    durationByDay: {
      ...(item.durationByDay || {}),
      [day]: (Number(item.durationByDay?.[day]) || 0) + seconds
    }
  } : item);
  const activity = readStudentProgress().find((item) => item.id === id);
  if (activity) sendStudentActivityEvent({ type: activity.type, resourceId: String(activity.id).slice(String(activity.type).length + 1), eventType: 'DURATION', durationSeconds: seconds });
  return saveProgress(items);
};

export const setStudentActivityCompleted = (id, completed) => {
  const now = new Date().toISOString();
  const currentItems = readStudentProgress();
  const activity = currentItems.find((item) => item.id === id);
  const knownTypes = ['Examen national', 'Concours blanc', 'Concours', 'Cours', 'Résumé'];
  const type = activity?.type || knownTypes.find((candidate) => String(id).startsWith(`${candidate}:`));
  const resourceId = activity
    ? String(activity.id).slice(String(activity.type).length + 1)
    : type ? String(id).slice(type.length + 1) : '';
  const serverUpdate = type && resourceId
    ? sendStudentActivityEvent({ type, resourceId, eventType: completed ? 'COMPLETE' : 'UNCOMPLETE' })
    : Promise.resolve(false);
  const items = currentItems.map((item) => item.id === id
    ? { ...item, completed, completedAt: completed ? now : null }
    : item
  );
  saveProgress(items);
  return serverUpdate.then((saved) => {
    if (!saved) saveProgress(currentItems);
    return saved;
  });
};

export const recordStudentMistake = (mistake) => {
  const manuallySaved = mistake?.savedManually === true;
  if (!mistake?.resourceId || !mistake?.questionText
    || (!manuallySaved && (!mistake?.selectedChoiceLabel || !mistake?.correctChoiceLabel))) {
    return readStudentMistakes();
  }

  const occurredAt = mistake.occurredAt || new Date().toISOString();
  const attemptId = mistake.attemptId || occurredAt;
  const sourceType = mistake.sourceType || 'qcm';
  const questionId = String(mistake.questionId ?? mistake.questionNumber ?? 'question');
  const id = manuallySaved
    ? `manual:${sourceType}:${mistake.resourceId}:${questionId}`
    : `${sourceType}:${mistake.resourceId}:${attemptId}:${questionId}`;
  const items = readStudentMistakes();
  const saved = {
    ...mistake,
    id,
    resourceTitle: String(mistake.resourceTitle || 'QCM').slice(0, 300),
    subject: String(mistake.subject || '').slice(0, 120),
    chapter: String(mistake.chapter || '').slice(0, 160),
    school: String(mistake.school || '').slice(0, 160),
    year: mistake.year || null,
    questionText: String(mistake.questionText).slice(0, 4000),
    selectedChoiceText: String(mistake.selectedChoiceText || '').slice(0, 1200),
    correctChoiceText: String(mistake.correctChoiceText || '').slice(0, 1200),
    explanation: String(mistake.explanation || '').slice(0, 2500),
    occurredAt,
    reviewed: false,
    savedForReview: Boolean(mistake.savedForReview)
  };
  const updated = [saved, ...items.filter((item) => item.id !== id)].slice(0, 300);
  const deduplicated = manuallySaved
    ? [saved, ...updated.slice(1).filter((item) => !(item.savedManually === true
      && String(item.sourceType || 'qcm') === String(sourceType)
      && String(item.resourceId) === String(mistake.resourceId)
      && String(item.questionId ?? item.questionNumber ?? 'question') === questionId))]
    : updated;
  localStorage.setItem(getStudentMistakesKey(), JSON.stringify(deduplicated));
  window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
  return deduplicated;
};

export const saveStudentMistakesManually = async ({
  sourceType = 'QCM',
  resourceId,
  resourceTitle = 'QCM',
  subject = '',
  chapter = '',
  school = '',
  year = null,
  attemptId = 'manual',
  mistakes = []
}) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Votre session a expiré. Reconnectez-vous pour sauvegarder cette erreur.');
  if (!resourceId || !Array.isArray(mistakes) || mistakes.length === 0) {
    throw new Error('Aucune erreur complète à sauvegarder.');
  }

  const formatted = mistakes.map((mistake) => ({
    ...mistake,
    sourceType: mistake.sourceType || sourceType,
    resourceId: String(resourceId),
    resourceTitle: String(mistake.resourceTitle || resourceTitle || 'QCM').slice(0, 300),
    subject: mistake.subject || subject,
    chapter: mistake.chapter || chapter,
    school: mistake.school || school,
    year: mistake.year || year || null,
    questionId: String(mistake.questionId ?? mistake.questionNumber ?? mistake.questionText ?? '').slice(0, 100),
    attemptId: mistake.attemptId || attemptId,
    savedForReview: true,
    savedManually: true
  }));
  const response = await fetch('/api/student-mistakes/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mistakes: formatted })
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Sauvegarde impossible (${response.status}).`);
  }
  const result = await response.json();
  const persisted = Array.isArray(result?.mistakes) ? result.mistakes : [];
  formatted.forEach((mistake, index) => recordStudentMistake({
    ...mistake,
    databaseId: persisted[index]?.id,
    savedForReview: true,
    savedManually: true
  }));
  window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
  return result;
};

export const markStudentMistakeReviewed = (id, reviewed = true) => {
  const items = readStudentMistakes().map((item) => (item.id === id || item.databaseId === id) ? { ...item, reviewed } : item);
  localStorage.setItem(getStudentMistakesKey(), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
  return items;
};

export const resolveStudentMistakes = (resourceId, questionId, sourceType = '') => {
  const items = readStudentMistakes().map((item) =>
    String(item.resourceId) === String(resourceId)
      && String(item.questionId) === String(questionId)
      && (!sourceType || String(item.sourceType || '') === String(sourceType))
      && item.savedManually === false
      ? { ...item, savedForReview: false }
      : item
  );
  localStorage.setItem(getStudentMistakesKey(), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
  return items;
};

export const deleteStudentMistakeLocally = (id) => {
  const items = readStudentMistakes().filter((item) => item.id !== id && item.databaseId !== id);
  localStorage.setItem(getStudentMistakesKey(), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
  return items;
};

export const deleteStudentMistake = async (id) => {
  const cleanId = String(id).replace(/^db-/, '');
  if (/^\d+$/.test(cleanId)) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Votre session a expiré. Reconnectez-vous pour supprimer cette erreur.');
    const response = await fetch(`/api/student-mistakes/${cleanId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Suppression impossible (${response.status}).`);
  }
  deleteStudentMistakeLocally(id);
};


export const saveStudentQuestionManually = async ({
  sourceType = 'Concours',
  resourceId,
  resourceTitle = 'QCM',
  subject = '',
  chapter = '',
  school = '',
  year = null,
  attemptId = 'manual',
  questionId,
  questionNumber,
  questionText,
  selectedChoiceLabel = '',
  selectedChoiceText = '',
  correctChoiceLabel = '',
  correctChoiceText = '',
  explanation = ''
}) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Votre session a expiré. Reconnectez-vous pour sauvegarder cette question.');
  if (!resourceId || !questionText) {
    throw new Error('Détails de la question incomplets pour la sauvegarde.');
  }

  const payload = {
    sourceType,
    resourceId: String(resourceId),
    resourceTitle: String(resourceTitle).slice(0, 300),
    subject: subject || '',
    chapter: chapter || '',
    school: school || '',
    year: year || null,
    attemptId: attemptId || 'manual',
    questionId: String(questionId ?? questionNumber ?? questionText).slice(0, 100),
    questionNumber: Number(questionNumber) || null,
    questionText: String(questionText).slice(0, 4000),
    selectedChoiceLabel: String(selectedChoiceLabel || '').slice(0, 50),
    selectedChoiceText: String(selectedChoiceText || '').slice(0, 1200),
    correctChoiceLabel: String(correctChoiceLabel || '').slice(0, 50),
    correctChoiceText: String(correctChoiceText || '').slice(0, 1200),
    explanation: String(explanation || '').slice(0, 2500)
  };

  const response = await fetch('/api/student-mistakes/manual-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Sauvegarde impossible (${response.status}).`);
  }

  const result = await response.json();
  recordStudentMistake({
    ...payload,
    id: result?.mistake?.id ? String(result.mistake.id) : undefined,
    databaseId: result?.mistake?.id,
    savedForReview: true,
    savedManually: true
  });
  window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
  return result;
};

export const syncQuizAttemptResults = async ({
  sourceType = 'Concours',
  resourceId,
  resourceTitle = 'QCM',
  subject = '',
  chapter = '',
  school = '',
  year = null,
  attemptId = '',
  resolvedQuestionIds = [],
  mistakes = []
}) => {
  const token = localStorage.getItem('authToken');
  if (!token) return { success: false, reason: 'unauthenticated' };
  if (!resourceId) return { success: false, reason: 'missing-resource' };

  try {
    const response = await fetch('/api/student-mistakes/sync-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        sourceType,
        resourceId: String(resourceId),
        resourceTitle: String(resourceTitle).slice(0, 300),
        subject: subject || '',
        chapter: chapter || '',
        school: school || '',
        year: year || null,
        attemptId: attemptId || '',
        resolvedQuestionIds: resolvedQuestionIds.map(String),
        mistakes: (mistakes || []).map((m) => ({
          questionId: String(m.questionId ?? m.questionNumber ?? m.questionText ?? '').slice(0, 100),
          questionNumber: Number(m.questionNumber) || null,
          questionText: String(m.questionText || '').slice(0, 4000),
          selectedChoiceLabel: String(m.selectedChoiceLabel || '').slice(0, 50),
          selectedChoiceText: String(m.selectedChoiceText || '').slice(0, 1200),
          correctChoiceLabel: String(m.correctChoiceLabel || '').slice(0, 50),
          correctChoiceText: String(m.correctChoiceText || '').slice(0, 1200),
          explanation: String(m.explanation || '').slice(0, 2500)
        }))
      })
    });

    if (response.ok) {
      const result = await response.json();
      const current = readStudentMistakes();
      const updated = current.filter((item) => {
        if (item.savedManually === true) return true;
        if (String(item.resourceId) === String(resourceId) && resolvedQuestionIds.map(String).includes(String(item.questionId))) {
          return false;
        }
        return true;
      });
      localStorage.setItem(getStudentMistakesKey(), JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
      window.dispatchEvent(new CustomEvent('student-server-activity-updated'));
      return result;
    }
  } catch (err) {
    console.warn('Erreur lors de la synchronisation automatique des erreurs:', err);
  }
  return { success: false };
};
