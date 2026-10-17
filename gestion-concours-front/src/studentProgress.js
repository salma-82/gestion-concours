const readJson = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
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
    firstViewedAt: existing?.firstViewedAt || now,
    lastViewedAt: now
  };

  return saveProgress([updated, ...items.filter((item) => item.id !== id)].slice(0, 100));
};

export const setStudentActivityCompleted = (id, completed) => {
  const now = new Date().toISOString();
  const items = readStudentProgress().map((item) => item.id === id
    ? { ...item, completed, completedAt: completed ? now : null }
    : item
  );
  return saveProgress(items);
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
    questionText: String(mistake.questionText).slice(0, 4000),
    selectedChoiceText: String(mistake.selectedChoiceText || '').slice(0, 1200),
    correctChoiceText: String(mistake.correctChoiceText || '').slice(0, 1200),
    explanation: String(mistake.explanation || '').slice(0, 2500),
    occurredAt,
    reviewed: false
  };
  const updated = [saved, ...items.filter((item) => item.id !== id)].slice(0, 300);
  localStorage.setItem(getStudentMistakesKey(), JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
  return updated;
};

export const markStudentMistakeReviewed = (id, reviewed = true) => {
  const items = readStudentMistakes().map((item) => item.id === id ? { ...item, reviewed } : item);
  localStorage.setItem(getStudentMistakesKey(), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('student-mistakes-updated'));
  return items;
};
