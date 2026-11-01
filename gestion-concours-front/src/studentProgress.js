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
  return fetch('http://localhost:8081/api/student-activities', {
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
  const response = await fetch('http://localhost:8081/api/student-activities', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Chargement des activités impossible (${response.status}).`);
  const data = await response.json();
  return Array.isArray(data?.events) ? data.events : [];
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
  return serverUpdate.then(() => items);
};

export const recordStudentMistake = (mistake) => {
  if (!mistake?.resourceId || !mistake?.questionText || !mistake?.selectedChoiceLabel || !mistake?.correctChoiceLabel) {
    return readStudentMistakes();
  }

  const occurredAt = mistake.occurredAt || new Date().toISOString();
  const attemptId = mistake.attemptId || occurredAt;
  const id = `${mistake.sourceType || 'qcm'}:${mistake.resourceId}:${attemptId}:${mistake.questionId ?? 'question'}`;
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
  localStorage.setItem(getStudentMistakesKey(), JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
  return updated;
};

export const markStudentMistakeReviewed = (id, reviewed = true) => {
  const items = readStudentMistakes().map((item) => (item.id === id || item.databaseId === id) ? { ...item, reviewed } : item);
  localStorage.setItem(getStudentMistakesKey(), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
  return items;
};

export const resolveStudentMistakes = (resourceId, questionId) => {
  const items = readStudentMistakes().map((item) =>
    String(item.resourceId) === String(resourceId) && String(item.questionId) === String(questionId)
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

export const deleteStudentMistake = async (id, studentId) => {
  deleteStudentMistakeLocally(id);
  const cleanId = String(id).replace(/^db-/, '');
  if (/^\d+$/.test(cleanId)) {
    try {
      await fetch(`http://localhost:8081/api/student-mistakes/${cleanId}${studentId ? `?studentId=${studentId}` : ''}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('Erreur lors de la suppression de l\'erreur sur le serveur:', e);
    }
  }
};

