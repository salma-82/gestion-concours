const CATEGORY_BY_TYPE = {
  CONCOURS: 'Concours',
  concours_blanc: 'Concours blanc',
  COURS: 'Cours',
  examen: 'Examen national',
  RESUME: 'Résumé',
  concours: 'Concours',
  'concours blanc': 'Concours blanc',
  cours: 'Cours',
  'examen national': 'Examen national',
  résumé: 'Résumé',
  resume: 'Résumé'
};

const categoryForMode = {
  contests: 'Concours',
  'mock-exams': 'Concours blanc',
  courses: 'Cours',
  exams: 'Examen national',
  summaries: 'Résumé'
};

export const normalizeActivityCategory = (type) => CATEGORY_BY_TYPE[String(type || '').trim().toLocaleLowerCase('fr-FR')] || '';

export const isNationalExamActivityEvent = (event) =>
  normalizeActivityCategory(event?.type) === 'Examen national';

export const isNationalExamCorrectionEvent = (event) => {
  if (!isNationalExamActivityEvent(event) || !['VIEW', 'COMPLETE'].includes(String(event?.eventType || '').toUpperCase())) return false;
  const resourceSuffix = String(event?.resourceId || '').split(':').slice(1).join(':');
  const document = [event?.resourceVariant, event?.documentType, resourceSuffix, event?.title]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR');
  return document.includes('correction') || document.includes('corrige');
};

export const aggregateStudentActivityEvents = (events = []) => {
  const groups = new Map();
  const validEvents = (Array.isArray(events) ? events : []).filter((event) => normalizeActivityCategory(event.type))
    .sort((a, b) => new Date(a.occurredAt || 0) - new Date(b.occurredAt || 0));
  validEvents.forEach((event) => {
    const type = normalizeActivityCategory(event.type);
    const resourceId = String(event.resourceId || '');
    const variant = String(event.resourceVariant || '');
    const id = `${type}:${resourceId}${variant ? `:${variant}` : ''}`;
    const group = groups.get(id) || {
      id, type, title: event.title || '', subject: event.subject || '', chapter: event.chapter || '',
      resourceVariant: variant,
      visits: 0, completed: false, completedAt: null, durationSeconds: 0, durationByDay: {},
      firstViewedAt: null, lastViewedAt: null
    };
    const occurredAt = event.occurredAt || null;
    if (event.eventType === 'VIEW') {
      group.visits += 1;
      if (occurredAt && (!group.firstViewedAt || new Date(occurredAt) < new Date(group.firstViewedAt))) group.firstViewedAt = occurredAt;
      if (occurredAt && (!group.lastViewedAt || new Date(occurredAt) > new Date(group.lastViewedAt))) group.lastViewedAt = occurredAt;
    }
    if (event.eventType === 'COMPLETE') {
      group.completed = true;
      group.completedAt = occurredAt;
    } else if (event.eventType === 'UNCOMPLETE') {
      group.completed = false;
      group.completedAt = null;
    }
    const seconds = Math.max(0, Number(event.durationSeconds) || 0);
    if (event.eventType === 'DURATION' && seconds) {
      group.durationSeconds += seconds;
      const date = new Date(occurredAt);
      if (!Number.isNaN(date.getTime())) {
        const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        group.durationByDay[day] = (group.durationByDay[day] || 0) + seconds;
      }
    }
    groups.set(id, group);
  });
  return [...groups.values()].sort((a, b) => new Date(b.lastViewedAt || 0) - new Date(a.lastViewedAt || 0));
};

export const filterDashboardActivities = (activities = [], { mode = 'overview', subject = '', period = 'all', now = Date.now() } = {}) => {
  const category = categoryForMode[mode];
  const cutoff = period === 'all' ? null : now - Number(period) * 86400000;
  return (Array.isArray(activities) ? activities : []).filter((activity) => {
    if (category && normalizeActivityCategory(activity.type) !== category) return false;
    if (subject && activity.subject !== subject) return false;
    if (cutoff !== null && (!activity.lastViewedAt || new Date(activity.lastViewedAt).getTime() < cutoff)) return false;
    return true;
  });
};

export const summarizeDashboardActivities = (activities = []) => {
  const safe = Array.isArray(activities) ? activities : [];
  const completed = safe.filter((activity) => activity.completed).length;
  const visits = safe.reduce((sum, activity) => sum + (Number(activity.visits) || 0), 0);
  const seconds = safe.reduce((sum, activity) => sum + (Number(activity.durationSeconds) || 0), 0);
  const bySubject = new Map();
  safe.forEach((activity) => {
    const subject = String(activity.subject || 'Matière non renseignée');
    const group = bySubject.get(subject) || { name: subject, resources: 0, completed: 0, visits: 0 };
    group.resources += 1;
    if (activity.completed) group.completed += 1;
    group.visits += Number(activity.visits) || 0;
    bySubject.set(subject, group);
  });
  const subjects = [...bySubject.values()].map((group) => ({ ...group, completionRate: group.resources ? Math.round(group.completed * 100 / group.resources) : null }))
    .sort((a, b) => b.completionRate - a.completionRate || b.visits - a.visits);
  return {
    resources: safe.length,
    completed,
    completionRate: safe.length ? Math.round(completed * 100 / safe.length) : null,
    visits,
    durationSeconds: seconds,
    subjects,
    strength: subjects.find((group) => group.completed > 0 && group.completionRate > 0) || null,
    difficulty: [...subjects].reverse().find((group) => group.resources > group.completed) || null
  };
};

export const buildActivityTrend = (events = [], { weeks = 8, now = Date.now(), mode = 'overview' } = {}) => {
  const category = categoryForMode[mode];
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day - (weeks - 1) * 7);
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index * 7);
    return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, label: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date), views: 0, completions: 0 };
  });
  (Array.isArray(events) ? events : []).forEach((event) => {
    if (category && normalizeActivityCategory(event.type) !== category) return;
    const date = new Date(event.occurredAt);
    if (Number.isNaN(date.getTime())) return;
    const weekStart = new Date(date);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);
    const bucket = buckets.find((item) => item.key === `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`);
    if (!bucket) return;
    if (event.eventType === 'VIEW') bucket.views += 1;
    if (event.eventType === 'COMPLETE') bucket.completions += 1;
  });
  return buckets;
};
