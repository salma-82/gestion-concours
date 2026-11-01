import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { normalizeActivityCategory } from '../studentDashboardStats';
import { readStudentMistakes, readStudentPlanning } from '../studentProgress';
import './ClientGeneralStatsDashboard.css';

const CATEGORY = {
  mock: 'Concours blanc',
  contest: 'Concours',
  exam: 'Examen national',
  course: 'Cours',
  summary: 'Résumé'
};
const CATEGORY_PATH = {
  'Concours blanc': '/client-concours-blanc',
  Concours: '/client-concours',
  'Examen national': '/client-examens',
  Cours: '/client-cours',
  Résumé: '/client-resumes'
};
const CATEGORY_COLORS = {
  'Concours blanc': '#7357e8',
  Concours: '#2563eb',
  'Examen national': '#0ea5a4',
  Cours: '#16a477',
  Résumé: '#e69a25'
};
const PERIODS = [
  { value: '7', label: '7 jours' },
  { value: '30', label: '30 jours' },
  { value: '90', label: '3 mois' },
  { value: 'all', label: 'Toute la période' }
];
const API_BASE = 'http://localhost:8081';
const dateMs = (value) => {
  const time = new Date(value || '').getTime();
  return Number.isFinite(time) ? time : null;
};
const eventCategory = (event) => normalizeActivityCategory(event?.type);
const attemptScore = (attempt) => {
  const value = Number(attempt?.score);
  return attempt?.score !== null && attempt?.score !== undefined && attempt?.score !== ''
    && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
};
const resourceKey = (event) => `${eventCategory(event)}:${event?.resourceId ?? event?.title ?? ''}:${event?.resourceVariant ?? ''}`;
const typeMatches = (selected, actual) => selected === 'all' || selected === actual;

function Comparison({ current, previous, suffix = '' }) {
  if (previous === null || previous === undefined) return <small>Aucune période de référence</small>;
  const difference = current - previous;
  if (!difference) return <small>Stable vs période précédente</small>;
  return <small className={difference > 0 ? 'is-positive' : 'is-negative'}>
    {difference > 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(difference)}{suffix} vs période précédente
  </small>;
}

function EmptyChart({ children = 'Les données apparaîtront après vos premières activités enregistrées.' }) {
  return <div className="general-stats-empty"><span aria-hidden="true">↗</span><p>{children}</p></div>;
}

function formatDuration(seconds) {
  if (!seconds) return '0 min';
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours} h ${minutes ? `${minutes} min` : ''}`.trim() : `${totalMinutes} min`;
}

function dateLabel(value) {
  const time = dateMs(value);
  return time === null ? 'Date non disponible' : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(time);
}

export default function ClientGeneralStatsDashboard({
  events = [],
  activities = [],
  mockAttempts = [],
  concoursAttempts = [],
  activityLoading = false,
  activityError = false,
  schoolLoading = false,
  schoolError = false,
  firstName = 'Étudiant',
  onNavigate = () => {}
}) {
  const [period, setPeriod] = useState('30');
  const [type, setType] = useState('all');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('all');
  const [mistakes, setMistakes] = useState(() => readStudentMistakes());
  const [mistakeLoading, setMistakeLoading] = useState(true);
  const [planning, setPlanning] = useState(() => readStudentPlanning());

  useEffect(() => {
    let active = true;
    const refreshLocalData = async () => {
      const localMistakes = readStudentMistakes().filter((item) => item.savedForReview);
      setPlanning(readStudentPlanning());
      let studentId = null;
      try { studentId = JSON.parse(localStorage.getItem('user') || '{}')?.id ?? null; } catch {}
      if (!studentId) {
        if (active) {
          setMistakes(localMistakes);
          setMistakeLoading(false);
        }
        return;
      }
      try {
        const { data } = await axios.get(`${API_BASE}/api/student-mistakes`, { params: { studentId } });
        const serverMistakes = Array.isArray(data) ? data.map((item) => ({ ...item, savedForReview: true })) : [];
        const merged = [...serverMistakes];
        localMistakes.forEach((local) => {
          const exists = merged.some((item) => String(item.resourceId) === String(local.resourceId)
            && String(item.attemptId || '') === String(local.attemptId || '')
            && String(item.questionId || '') === String(local.questionId || ''));
          if (!exists) merged.push(local);
        });
        if (active) {
          setMistakes(merged);
          setMistakeLoading(false);
        }
      } catch {
        if (active) {
          setMistakes(localMistakes);
          setMistakeLoading(false);
        }
      }
    };
    window.addEventListener('student-mistakes-updated', refreshLocalData);
    window.addEventListener('storage', refreshLocalData);
    window.addEventListener('student-qcm-history-updated', refreshLocalData);
    refreshLocalData();
    return () => {
      active = false;
      window.removeEventListener('student-mistakes-updated', refreshLocalData);
      window.removeEventListener('storage', refreshLocalData);
      window.removeEventListener('student-qcm-history-updated', refreshLocalData);
    };
  }, []);

  const filterOptions = useMemo(() => {
    const subjects = new Set();
    const years = new Set();
    events.forEach((event) => {
      if (event.subject) subjects.add(String(event.subject).trim());
      const time = dateMs(event.occurredAt);
      if (time !== null) years.add(String(new Date(time).getFullYear()));
    });
    [...mockAttempts, ...concoursAttempts].forEach((attempt) => {
      if (attempt.subject) subjects.add(String(attempt.subject).trim());
      const time = dateMs(attempt.answeredAt);
      if (time !== null) years.add(String(new Date(time).getFullYear()));
    });
    mistakes.forEach((mistake) => {
      if (mistake.subject) subjects.add(String(mistake.subject).trim());
      const time = dateMs(mistake.createdAt || mistake.occurredAt);
      if (time !== null) years.add(String(new Date(time).getFullYear()));
    });
    return {
      subjects: [...subjects].filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr')),
      years: [...years].sort((a, b) => Number(b) - Number(a))
    };
  }, [events, mockAttempts, concoursAttempts, mistakes]);

  const now = Date.now();
  const periodDays = period === 'all' ? null : Number(period);
  const currentStart = periodDays === null ? null : now - periodDays * 86400000;
  const previousStart = periodDays === null ? null : now - periodDays * 2 * 86400000;
  const inGlobalScope = useCallback((item, timestamp, category, bounds = 'current') => {
    if (!typeMatches(type, category)) return false;
    if (subject && String(item?.subject || '') !== subject) return false;
    const time = dateMs(timestamp);
    if (year !== 'all' && (time === null || String(new Date(time).getFullYear()) !== year)) return false;
    if (periodDays === null || bounds === 'any') return true;
    if (time === null) return false;
    return bounds === 'previous'
      ? time >= previousStart && time < currentStart
      : time >= currentStart && time <= now;
  }, [type, subject, year, periodDays, currentStart, previousStart, now]);

  const scopedEvents = useMemo(() => events.filter((event) => {
    const category = eventCategory(event);
    return category && inGlobalScope(event, event.occurredAt, category);
  }), [events, inGlobalScope]);

  const scopedMockAttempts = useMemo(() => mockAttempts.filter((attempt) => inGlobalScope(attempt, attempt.answeredAt, CATEGORY.mock)), [mockAttempts, inGlobalScope]);
  const scopedConcoursAttempts = useMemo(() => concoursAttempts.filter((attempt) => inGlobalScope(attempt, attempt.answeredAt, CATEGORY.contest)), [concoursAttempts, inGlobalScope]);
  const allScopedAttempts = [...scopedMockAttempts, ...scopedConcoursAttempts];
  const scopedViews = scopedEvents.filter((event) => event.eventType === 'VIEW');
  const uniqueResourcesByType = (category) => new Set(scopedViews.filter((event) => eventCategory(event) === category).map(resourceKey)).size;
  const sessions = scopedViews.length;

  const filteredMistakes = mistakes.filter((mistake) => {
    if (!mistake.savedForReview) return false;
    const source = String(mistake.sourceType || '').toLocaleLowerCase('fr');
    const mistakeCategory = source.includes('blanc') ? CATEGORY.mock
      : source.includes('concours') ? CATEGORY.contest
        : source.includes('examen') ? CATEGORY.exam : '';
    const actualCategory = mistakeCategory || 'Questions sauvegardées';
    if (type !== 'all' && type !== actualCategory) return false;
    if (subject && String(mistake.subject || '') !== subject) return false;
    const timestamp = dateMs(mistake.createdAt || mistake.occurredAt);
    if (year !== 'all' && (timestamp === null || String(new Date(timestamp).getFullYear()) !== year)) return false;
    return periodDays === null || (timestamp !== null && timestamp >= currentStart && timestamp <= now);
  });

  const currentDurations = scopedEvents.filter((event) => event.eventType === 'DURATION')
    .reduce((sum, event) => sum + Math.max(0, Number(event.durationSeconds) || 0), 0);
  const scoreRecords = allScopedAttempts.map((attempt) => ({ attempt, score: attemptScore(attempt) })).filter(({ score }) => score !== null);
  const average = scoreRecords.length ? Math.round(scoreRecords.reduce((sum, item) => sum + item.score, 0) / scoreRecords.length) : null;
  const correctAnswers = allScopedAttempts.reduce((sum, attempt) => sum + Math.max(0, Number(attempt.correctAnswers) || 0), 0);
  const questionCount = allScopedAttempts.reduce((sum, attempt) => sum + Math.max(0, Number(attempt.totalQuestions) || 0), 0);
  const incorrectAnswers = Math.max(0, questionCount - correctAnswers);
  const successRate = questionCount ? Math.round(correctAnswers * 100 / questionCount) : null;

  const previousEvents = events.filter((event) => {
    const category = eventCategory(event);
    return category && inGlobalScope(event, event.occurredAt, category, 'previous');
  });
  const previousMockAttempts = mockAttempts.filter((attempt) => inGlobalScope(attempt, attempt.answeredAt, CATEGORY.mock, 'previous'));
  const previousConcoursAttempts = concoursAttempts.filter((attempt) => inGlobalScope(attempt, attempt.answeredAt, CATEGORY.contest, 'previous'));
  const previousMistakes = mistakes.filter((mistake) => {
    if (!mistake.savedForReview) return false;
    const source = String(mistake.sourceType || '').toLocaleLowerCase('fr');
    const category = source.includes('blanc') ? CATEGORY.mock : source.includes('concours') ? CATEGORY.contest : source.includes('examen') ? CATEGORY.exam : 'Questions sauvegardées';
    if (type !== 'all' && type !== category) return false;
    if (subject && String(mistake.subject || '') !== subject) return false;
    const timestamp = dateMs(mistake.createdAt || mistake.occurredAt);
    return periodDays !== null && timestamp !== null && timestamp >= previousStart && timestamp < currentStart
      && (year === 'all' || String(new Date(timestamp).getFullYear()) === year);
  });
  const previousDuration = previousEvents.filter((event) => event.eventType === 'DURATION')
    .reduce((sum, event) => sum + Math.max(0, Number(event.durationSeconds) || 0), 0);
  const previousResourceCount = (category) => new Set(previousEvents.filter((event) => event.eventType === 'VIEW' && eventCategory(event) === category).map(resourceKey)).size;

  const kpis = [
    { label: 'Sessions d’apprentissage', value: activityLoading ? '…' : activityError ? '—' : sessions, icon: '↗', color: '#2563eb', detail: 'Consultations enregistrées', previous: previousEvents.filter((event) => event.eventType === 'VIEW').length, unavailable: activityLoading || activityError },
    { label: 'Concours blancs réalisés', value: schoolLoading ? '…' : schoolError ? '—' : scopedMockAttempts.length, icon: '◉', color: '#7357e8', detail: 'Tentatives terminées', previous: previousMockAttempts.length, unavailable: schoolLoading || schoolError },
    { label: 'Concours des écoles réalisés', value: schoolLoading ? '…' : schoolError ? '—' : scopedConcoursAttempts.length, icon: '⚑', color: '#3478de', detail: 'Tentatives terminées', previous: previousConcoursAttempts.length, unavailable: schoolLoading || schoolError },
    { label: 'Épreuves nationales consultées', value: activityLoading ? '…' : activityError ? '—' : uniqueResourcesByType(CATEGORY.exam), icon: '▤', color: '#0e9a98', detail: 'Aucune tentative notée enregistrée', previous: previousResourceCount(CATEGORY.exam), unavailable: activityLoading || activityError },
    { label: 'Cours consultés', value: activityLoading ? '…' : activityError ? '—' : uniqueResourcesByType(CATEGORY.course), icon: '▣', color: '#15956d', detail: 'Cours distincts', previous: previousResourceCount(CATEGORY.course), unavailable: activityLoading || activityError },
    { label: 'Résumés consultés', value: activityLoading ? '…' : activityError ? '—' : uniqueResourcesByType(CATEGORY.summary), icon: '▧', color: '#d48a1d', detail: 'Fiches distinctes', previous: previousResourceCount(CATEGORY.summary), unavailable: activityLoading || activityError },
    { label: 'Questions sauvegardées', value: mistakeLoading ? '…' : filteredMistakes.length, icon: '!', color: '#e17737', detail: 'Dans vos erreurs enregistrées', previous: previousMistakes.length, unavailable: mistakeLoading },
    { label: 'Temps sur la plateforme', value: activityLoading ? '…' : activityError ? '—' : formatDuration(currentDurations), icon: '◷', color: '#5265c9', detail: 'Durées de session enregistrées', previous: formatDuration(previousDuration), duration: true, unavailable: activityLoading || activityError }
  ];

  const scoreTrend = scoreRecords.sort((a, b) => dateMs(a.attempt.answeredAt) - dateMs(b.attempt.answeredAt)).map(({ attempt, score }, index) => ({
    index: index + 1,
    date: dateLabel(attempt.answeredAt),
    shortDate: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(attempt.answeredAt)),
    score,
    kind: String(attempt.resourceType || '').toLocaleLowerCase('fr').includes('blanc') ? 'Concours blanc' : 'Concours des écoles',
    exam: attempt.resourceTitle || 'Évaluation',
    subject: attempt.subject || 'Matière non renseignée'
  }));

  const activityDistribution = [
    { name: CATEGORY.mock, value: schoolError ? 0 : scopedMockAttempts.length },
    { name: CATEGORY.contest, value: schoolError ? 0 : scopedConcoursAttempts.length },
    { name: CATEGORY.exam, value: activityError ? 0 : uniqueResourcesByType(CATEGORY.exam) },
    { name: CATEGORY.course, value: activityError ? 0 : uniqueResourcesByType(CATEGORY.course) },
    { name: CATEGORY.summary, value: activityError ? 0 : uniqueResourcesByType(CATEGORY.summary) }
  ].map((entry) => ({ ...entry, color: CATEGORY_COLORS[entry.name] }));

  const subjectPerformance = useMemo(() => {
    const groups = new Map();
    allScopedAttempts.forEach((attempt) => {
      const score = attemptScore(attempt);
      const name = String(attempt.subject || '').trim();
      if (score === null || !name) return;
      const group = groups.get(name) || { subject: name, scores: [], attempts: 0 };
      group.scores.push(score);
      group.attempts += 1;
      groups.set(name, group);
    });
    return [...groups.values()].map((group) => ({ ...group, average: Math.round(group.scores.reduce((sum, score) => sum + score, 0) / group.scores.length) }))
      .sort((a, b) => b.average - a.average);
  }, [allScopedAttempts]);
  const strongestSubject = subjectPerformance[0] || null;
  const weakestSubject = subjectPerformance.at(-1) || null;

  const filteredActivities = activities.filter((activity) => {
    const category = normalizeActivityCategory(activity.type);
    return category && typeMatches(type, category) && (!subject || activity.subject === subject)
      && (year === 'all' || String(new Date(activity.lastViewedAt || '').getFullYear()) === year)
      && (periodDays === null || (dateMs(activity.lastViewedAt) !== null && dateMs(activity.lastViewedAt) >= currentStart));
  });
  const completedResources = filteredActivities.filter((activity) => activity.completed).length;
  const completionPercent = filteredActivities.length ? Math.round(completedResources * 100 / filteredActivities.length) : null;

  const recentItems = [
    ...scopedViews.map((event) => ({
      key: `event-${event.id || `${event.type}-${event.resourceId}-${event.occurredAt}`}`,
      type: eventCategory(event),
      title: event.title || event.resourceTitle || 'Ressource consultée',
      meta: [event.subject, event.chapter].filter(Boolean).join(' · '),
      date: event.occurredAt,
      path: CATEGORY_PATH[eventCategory(event)]
    })),
    ...allScopedAttempts.map((attempt) => ({
      key: `attempt-${attempt.resourceType}-${attempt.resourceId}-${attempt.attemptId ?? attempt.answeredAt}`,
      type: String(attempt.resourceType || '').toLocaleLowerCase('fr').includes('blanc') ? CATEGORY.mock : CATEGORY.contest,
      title: attempt.resourceTitle || 'Évaluation terminée',
      meta: [attempt.school, attempt.subject, attemptScore(attempt) === null ? '' : `${Math.round(attemptScore(attempt))}%`].filter(Boolean).join(' · '),
      date: attempt.answeredAt,
      path: String(attempt.resourceType || '').toLocaleLowerCase('fr').includes('blanc') ? CATEGORY_PATH[CATEGORY.mock] : CATEGORY_PATH[CATEGORY.contest]
    })),
    ...filteredMistakes.map((mistake) => ({
      key: `mistake-${mistake.id || mistake.databaseId}`,
      type: 'Question sauvegardée',
      title: mistake.resourceTitle || 'Question incorrecte',
      meta: [mistake.subject, mistake.chapter].filter(Boolean).join(' · ') || 'À revoir',
      date: mistake.createdAt || mistake.occurredAt,
      path: '/client-erreurs?view=saved'
    }))
  ].sort((a, b) => (dateMs(b.date) ?? 0) - (dateMs(a.date) ?? 0)).slice(0, 8);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const upcomingGoals = planning.filter((goal) => goal?.title && goal?.date)
    .filter((goal) => !subject || !goal.subject || goal.subject === subject)
    .sort((a, b) => {
      const aUpcoming = String(a.date) >= todayKey;
      const bUpcoming = String(b.date) >= todayKey;
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return aUpcoming ? String(a.date).localeCompare(String(b.date)) : String(b.date).localeCompare(String(a.date));
    }).slice(0, 4);
  const totalActivity = !activityLoading && !activityError ? sessions : null;
  const recommendation = weakestSubject
    ? `Votre moyenne la plus basse est en ${weakestSubject.subject} (${weakestSubject.average}%). Une nouvelle tentative permettra de suivre son évolution.`
    : scoreRecords.length === 0
      ? 'Les recommandations par matière apparaîtront après une évaluation terminée.'
      : 'Continuez à comparer vos résultats pour repérer les matières à renforcer.';

  return (
    <main className="general-stats">
      <header className="general-stats-header">
        <div>
          <span className="general-stats-eyebrow">CENTRE DE PILOTAGE</span>
          <h1>Bonjour {firstName}</h1>
        </div>
        <button type="button" className="general-stats-calendar" onClick={() => onNavigate('/client-calendrier')}>
          <span aria-hidden="true">▦</span> Mon calendrier
        </button>
      </header>

      <section className="general-stats-filters" aria-label="Filtres des statistiques générales">
        <div className="general-stats-period" role="group" aria-label="Période">
          {PERIODS.map((option) => <button key={option.value} type="button" className={period === option.value ? 'is-active' : ''} aria-pressed={period === option.value} onClick={() => setPeriod(option.value)}>{option.label}</button>)}
        </div>
        <label>Section<select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">Toutes les sections</option>
          <option value={CATEGORY.mock}>Concours blancs</option>
          <option value={CATEGORY.contest}>Concours des écoles</option>
          <option value={CATEGORY.exam}>Examens nationaux</option>
          <option value={CATEGORY.course}>Cours du Bac</option>
          <option value={CATEGORY.summary}>Résumés</option>
        </select></label>
        <label>Matière<select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="">Toutes les matières</option>{filterOptions.subjects.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label>Année d’activité<select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">Toutes les années</option>{filterOptions.years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </section>

      {activityError && <div className="general-stats-alert" role="status">Les activités de consultation n’ont pas pu être chargées. Les données d’évaluations restent affichées si elles sont disponibles.</div>}
      {schoolError && <div className="general-stats-alert" role="status">L’historique des concours n’a pas pu être chargé. Les scores ne sont pas estimés.</div>}

      <section className="general-stats-kpis" aria-label="Indicateurs clés">
        {kpis.map((item, index) => (
          <article className="general-stats-kpi" key={item.label} style={{ '--kpi-color': item.color }}>
            <span className="general-stats-kpi-icon" aria-hidden="true">{item.icon}</span>
            <span className="general-stats-kpi-label">{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
            {item.unavailable ? <small className="general-stats-comparison">Données indisponibles</small> : item.duration
              ? <small className="general-stats-comparison">{period === 'all' ? 'Comparaison indisponible sur toute la période' : `${previousDuration ? formatDuration(previousDuration) : '0 min'} sur la période précédente`}</small>
              : <span className="general-stats-comparison">{period === 'all' ? 'Comparaison indisponible sur toute la période' : <Comparison current={Number(item.value) || 0} previous={item.previous} />}</span>}
          </article>
        ))}
      </section>

      <section className="general-stats-chart-grid">
        <article className="general-stats-panel general-stats-trend-panel">
          <div className="general-stats-panel-heading"><div><span className="general-stats-eyebrow">RÉSULTATS RÉELS</span><h2>Évolution des évaluations</h2><p>Chaque courbe représente son propre type d’évaluation. Les examens nationaux ne sont pas notés dans les données disponibles.</p></div><span className="general-stats-total-badge">{allScopedAttempts.length} tentatives</span></div>
          {schoolLoading ? <EmptyChart>Chargement des résultats enregistrés…</EmptyChart>
            : schoolError ? <EmptyChart>Résultats indisponibles pour le moment.</EmptyChart>
              : scoreTrend.length ? <div className="general-stats-chart general-stats-main-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={scoreTrend} margin={{ top: 12, right: 12, bottom: 4, left: -18 }}>
                <defs><linearGradient id="generalMockFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7357e8" stopOpacity={0.18} /><stop offset="100%" stopColor="#7357e8" stopOpacity={0} /></linearGradient><linearGradient id="generalContestFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#e9eef6" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="shortDate" tick={{ fill: '#8190a5', fontSize: 11 }} minTickGap={24} /><YAxis domain={[0, 100]} tick={{ fill: '#8190a5', fontSize: 11 }} tickFormatter={(value) => `${value}%`} width={44} /><Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload ? `${payload[0].payload.exam} · ${payload[0].payload.date}` : ''} formatter={(value, name) => [`${value}%`, name]} />
                <Area type="monotone" dataKey={(row) => row.kind === 'Concours blanc' ? row.score : null} name="Concours blancs" stroke="#7357e8" strokeWidth={2.5} fill="url(#generalMockFill)" connectNulls activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey={(row) => row.kind === 'Concours des écoles' ? row.score : null} name="Concours des écoles" stroke="#2563eb" strokeWidth={2.5} fill="url(#generalContestFill)" connectNulls activeDot={{ r: 5 }} />
              </AreaChart></ResponsiveContainer></div> : <EmptyChart>Aucune note de concours ou de concours blanc n’est enregistrée sur cette période.</EmptyChart>}
          <div className="general-stats-legend"><span><i className="is-violet" />Concours blancs</span><span><i className="is-blue" />Concours des écoles</span></div>
        </article>

        <article className="general-stats-panel general-stats-distribution-panel">
          <div className="general-stats-panel-heading"><div><span className="general-stats-eyebrow">VOTRE ACTIVITÉ</span><h2>Répartition par section</h2></div></div>
          {activityLoading ? <EmptyChart>Chargement des activités…</EmptyChart>
            : activityError ? <EmptyChart>Répartition indisponible.</EmptyChart>
              : activityDistribution.some((item) => item.value > 0) ? <>
                <div className="general-stats-donut-wrap"><div className="general-stats-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={activityDistribution.filter((item) => item.value > 0)} dataKey="value" nameKey="name" innerRadius="69%" outerRadius="94%" paddingAngle={3} stroke="none">{activityDistribution.filter((item) => item.value > 0).map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value, name) => [value, name]} /></PieChart></ResponsiveContainer></div><div className="general-stats-donut-center"><strong>{activityDistribution.reduce((sum, item) => sum + item.value, 0)}</strong><span>activités</span></div></div>
                <ul className="general-stats-distribution-list">{activityDistribution.map((item) => <li key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><strong>{item.value}</strong></li>)}</ul>
              </> : <EmptyChart>Aucune activité enregistrée pour cette sélection.</EmptyChart>}
        </article>
      </section>

      <section className="general-stats-performance-grid">
        <article className="general-stats-panel general-stats-performance-panel">
          <div className="general-stats-panel-heading"><div><span className="general-stats-eyebrow">SYNTHÈSE DES ÉVALUATIONS</span><h2>Performance générale</h2></div></div>
          {schoolLoading ? <EmptyChart>Chargement des résultats…</EmptyChart> : schoolError ? <EmptyChart>Les résultats ne sont pas disponibles.</EmptyChart> : scoreRecords.length ? <>
            <div className="general-stats-performance-score"><strong>{average}%</strong><span>moyenne des notes enregistrées</span></div>
            <div className="general-stats-performance-metrics"><div><strong>{successRate === null ? '—' : `${successRate}%`}</strong><span>réponses correctes</span></div><div><strong>{correctAnswers}</strong><span>correctes</span></div><div><strong>{incorrectAnswers}</strong><span>incorrectes*</span></div></div>
            <p className="general-stats-footnote">* Calculé à partir des questions de tentatives terminées ({questionCount} questions au total). Les examens nationaux consultés ne sont pas inclus.</p>
          </> : <EmptyChart>Aucune évaluation terminée avec une note disponible.</EmptyChart>}
        </article>

        <article className="general-stats-panel general-stats-subject-panel">
          <div className="general-stats-panel-heading"><div><span className="general-stats-eyebrow">BASÉ SUR LES NOTES</span><h2>Performance par matière</h2></div></div>
          {schoolLoading ? <EmptyChart>Chargement des performances…</EmptyChart> : schoolError ? <EmptyChart>Les performances ne sont pas disponibles.</EmptyChart> : subjectPerformance.length ? <>
            <div className="general-stats-chart general-stats-subject-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={subjectPerformance} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 4 }}><CartesianGrid stroke="#edf1f6" horizontal={false} /><XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: '#8b98aa', fontSize: 10 }} /><YAxis type="category" dataKey="subject" width={100} tick={{ fill: '#5d6d83', fontSize: 11 }} /><Tooltip formatter={(value, _name, item) => [`${value}% · ${item.payload.attempts} tentative(s)`, 'Moyenne']} /><Bar dataKey="average" radius={[0, 6, 6, 0]} barSize={17}>{subjectPerformance.map((item, index) => <Cell key={item.subject} fill={index === 0 ? '#16a477' : index === subjectPerformance.length - 1 ? '#f08b5c' : '#4c84e8'} />)}</Bar></BarChart></ResponsiveContainer></div>
            <div className="general-stats-subject-highlights"><p><span>Point fort</span><strong>{strongestSubject.subject} · {strongestSubject.average}%</strong></p><p><span>À renforcer</span><strong>{weakestSubject.subject} · {weakestSubject.average}%</strong></p></div>
          </> : <EmptyChart>Les performances par matière apparaîtront après une évaluation notée. Les consultations de cours et de résumés ne sont pas utilisées comme notes.</EmptyChart>}
        </article>
      </section>

      <section className="general-stats-bottom-grid">
        <article className="general-stats-panel general-stats-recent-panel">
          <div className="general-stats-panel-heading"><div><span className="general-stats-eyebrow">DERNIÈRES ACTIVITÉS</span><h2>Votre historique récent</h2></div><button type="button" onClick={() => onNavigate('/client-erreurs?view=saved')}>Questions à revoir <span aria-hidden="true">→</span></button></div>
          {recentItems.length ? <div className="general-stats-recent-list">{recentItems.map((item) => <button type="button" className="general-stats-recent-item" key={item.key} onClick={() => item.path && onNavigate(item.path)}>
            <span className="general-stats-recent-mark" style={{ '--activity-color': CATEGORY_COLORS[item.type] || '#e17737' }}>{item.type === 'Question sauvegardée' ? '!' : item.type.slice(0, 1)}</span><span className="general-stats-recent-copy"><strong>{item.title}</strong><small>{[item.type, item.meta].filter(Boolean).join(' · ')}</small></span><time>{dateLabel(item.date)}</time><b aria-hidden="true">→</b>
          </button>)}</div> : <EmptyChart>Les activités récentes s’afficheront ici après leur enregistrement.</EmptyChart>}
        </article>

        <article className="general-stats-panel general-stats-goals-panel">
          <div className="general-stats-panel-heading"><div><span className="general-stats-eyebrow">RYTHME & OBJECTIFS</span><h2>Votre progression</h2></div></div>
          {activityLoading ? <EmptyChart>Chargement de votre progression…</EmptyChart> : <>
            <div className="general-stats-progress-copy"><div><strong>{completionPercent === null ? '—' : `${completionPercent}%`}</strong><span>ressources consultées marquées comme terminées</span></div><small>{totalActivity === null ? 'Activité indisponible' : `${totalActivity} session${totalActivity > 1 ? 's' : ''} sur la période`}</small></div>
            <div className="general-stats-progress-track"><span style={{ width: `${completionPercent || 0}%` }} /></div>
            <div className="general-stats-goals-heading"><strong>Objectifs personnels</strong><button type="button" onClick={() => onNavigate('/client-calendrier')}>Ouvrir le calendrier →</button></div>
            {upcomingGoals.length ? <ul className="general-stats-goals-list">{upcomingGoals.map((goal) => <li key={goal.id}><span className="general-stats-goal-date">{dateLabel(`${goal.date}T00:00:00`)}</span><span><strong>{goal.title}</strong><small>{goal.subject || 'Objectif personnel'} · {new Date(`${goal.date}T00:00:00`).getTime() < new Date(new Date().toDateString()).getTime() ? 'date passée' : 'planifié'}</small></span></li>)}</ul> : <p className="general-stats-goals-empty">Aucun objectif personnel planifié. Ajoutez-en dans votre calendrier.</p>}
            <div className="general-stats-recommendation"><span aria-hidden="true">✦</span><p>{recommendation}</p></div>
            <small className="general-stats-footnote">Le calendrier ne stocke pas de statut d’accomplissement des objectifs.</small>
          </>}
        </article>
      </section>
    </main>
  );
}
