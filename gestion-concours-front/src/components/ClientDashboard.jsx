import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ClientDashboard.css';
import {
  fetchStudentActivityEvents,
  setStudentActivityCompleted
} from '../studentProgress';
import { filterByStudentPack } from '../packAccess';
import {
  aggregateStudentActivityEvents,
  buildActivityTrend,
  filterDashboardActivities,
  normalizeActivityCategory,
  summarizeDashboardActivities
} from '../studentDashboardStats';

const API_BASE = 'http://localhost:8081';
const normalizeSchool = (name) => String(name || '').trim().toLocaleLowerCase();
const normalizeCourseValue = (value) => String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
const courseFiliereFamily = (value) => {
  const normalized = normalizeCourseValue(value);
  if (/(^|\s)(sm\s*[- ]?\s*a|math(?:e|é)?matiques?\s*a|maths?\s*a)(\s|$)/.test(normalized)) return 'sma';
  if (/(^|\s)(sm\s*[- ]?\s*b|math(?:e|é)?matiques?\s*b|maths?\s*b)(\s|$)/.test(normalized)) return 'smb';
  if (normalized.includes('physique') || normalized === 'pc' || normalized.includes(' sciences pc')) return 'pc';
  if (normalized.includes('svt') || normalized.includes('vie et de la terre')) return 'svt';
  if (normalized.includes('econom') || normalized.includes('gestion')) return 'eco';
  return normalized;
};
const courseFiliereMatches = (courseFiliere, selectedFiliere) => !courseFiliere || !selectedFiliere
  || courseFiliereFamily(courseFiliere) === courseFiliereFamily(selectedFiliere)
  || normalizeCourseValue(courseFiliere).includes(normalizeCourseValue(selectedFiliere))
  || normalizeCourseValue(selectedFiliere).includes(normalizeCourseValue(courseFiliere));
const localDayKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const scoresOf = (records) => records
  .map((record) => record.score)
  .filter((score) => score !== null && score !== undefined && score !== '')
  .map(Number)
  .filter(Number.isFinite);
const isWithinPeriod = (attempt, period) => period === 'all'
  || (Number.isFinite(new Date(attempt.answeredAt).getTime()) && new Date(attempt.answeredAt).getTime() >= Date.now() - Number(period) * 86400000);

const subjectStyle = (subject) => {
  const normalized = String(subject || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('math')) return { name: 'Math\u00e9matiques', icon: '\u2211', color: '#2563eb', tint: '#eff6ff' };
  if (normalized.includes('phys') || normalized.includes('chim') || normalized === 'pc') return { name: 'Physique-Chimie', icon: '\u03A8', color: '#7c3aed', tint: '#f5f3ff' };
  if (normalized.includes('svt') || normalized.includes('vie') || normalized.includes('terre')) return { name: 'SVT', icon: '\u25C9', color: '#059669', tint: '#ecfdf5' };
  if (normalized.includes('philo')) return { name: 'Philosophie', icon: '\u03A6', color: '#d97706', tint: '#fffbeb' };
  if (normalized.includes('ang') || normalized.includes('eng')) return { name: 'Anglais', icon: 'A', color: '#0284c7', tint: '#f0f9ff' };
  return { name: subject || 'Autres ressources', icon: '\u25A4', color: '#475569', tint: '#f1f5f9' };
};

const formatDate = (value) => {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
};

const DASHBOARD_SHORTCUTS = [
  { label: 'Profil', abbreviation: '', mode: 'overview', path: '/client-dashboard', icon: 'home' },
  { label: 'Concours', abbreviation: 'Conc.', mode: 'contests', path: '/client-concours', icon: 'contest' },
  { label: 'Concours Blancs', abbreviation: 'C.B.', mode: 'mock-exams', path: '/client-concours-blanc', icon: 'white-contest' },
  { label: 'Cours', abbreviation: 'Crs.', mode: 'courses', path: '/client-cours', icon: 'courses' },
  { label: 'Examens', abbreviation: 'Exm.', mode: 'exams', path: '/client-examens', icon: 'exams' },
  { label: 'Résumés', abbreviation: 'Res.', mode: 'summaries', path: '/client-resumes', icon: 'resumes' }
];

const DASHBOARD_MODES = {
  overview: { title: 'Votre espace de révision', subtitle: 'Retrouvez votre progression et reprenez vos révisions là où vous les avez laissées.' },
  contests: { title: 'Performance aux concours', subtitle: 'Consultez vos tentatives, vos scores et vos résultats par école.' },
  courses: { title: 'Suivi des cours', subtitle: 'Consultez vos cours étudiés, leur progression et votre rythme de travail.' },
  exams: { title: 'Suivi des examens nationaux', subtitle: 'Retrouvez les épreuves et corrections consultées et votre progression de révision.' },
  'mock-exams': { title: 'Performance aux concours blancs', subtitle: 'Suivez vos scores, vos simulations et vos résultats par matière.' },
  summaries: { title: 'Progression des résumés', subtitle: 'Suivez les fiches consultées, terminées et vos révisions par matière.' }
};

const DashboardShortcutIcon = ({ name }) => {
  if (name === 'home') return <><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H18a2 2 0 0 1 2 2v15H7.5A2.5 2.5 0 0 1 5 17.5z" /><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H20M12.5 8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM9.5 14c.7-1.5 5.3-1.5 6 0" /></>;
  if (name === 'contest') return <><path d="M8 4h8v4a4 4 0 0 1-8 0zM8 6H5v2a4 4 0 0 0 4 4M16 6h3v2a4 4 0 0 1-4 4M12 12v4M9 20h6M10 16h4" /><path d="M9 20v-2a3 3 0 0 1 6 0v2" /></>;
  if (name === 'white-contest') return <><path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V9h5M12 12v3l2 1" /><circle cx="12" cy="15" r="4" /></>;
  if (name === 'courses') return <><path d="M6 4.5h12v17l-6-3.5-6 3.5z" /><path d="M9 9h6" /></>;
  if (name === 'exams') return <><path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V9h5M9 13h6M9 17h6" /></>;
  return <><path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V9h5M9 13h6M9 17h4" /><circle cx="16.5" cy="17.5" r="2.5" /></>;
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  let user = {};
  try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch { user = {}; }
  const firstName = user.prenom || user.nom || 'Etudiant';

  const [studentActivities, setStudentActivities] = useState([]);
  const [studentActivityEvents, setStudentActivityEvents] = useState([]);
  const [activityDataLoading, setActivityDataLoading] = useState(true);
  const [activityDataError, setActivityDataError] = useState(false);
  const [schoolCatalog, setSchoolCatalog] = useState([]);
  const [courseCatalog, setCourseCatalog] = useState([]);
  const [courseCatalogLoading, setCourseCatalogLoading] = useState(true);
  const [schoolAttempts, setSchoolAttempts] = useState([]);
  const [schoolDataLoading, setSchoolDataLoading] = useState(true);
  const [schoolCatalogError, setSchoolCatalogError] = useState(false);
  const [schoolHistoryError, setSchoolHistoryError] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedContestSubject, setSelectedContestSubject] = useState('');
  const [selectedMockSubject, setSelectedMockSubject] = useState('');
  const [selectedMockChapter, setSelectedMockChapter] = useState('');
  const [scorePeriod, setScorePeriod] = useState('all');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('all');
  const [analyticsSubject, setAnalyticsSubject] = useState('');
  const [selectedAttemptKey, setSelectedAttemptKey] = useState('');
  const [dashboardMode, setDashboardMode] = useState('overview');
  const [courseSubjectFilter, setCourseSubjectFilter] = useState('all');
  const [selectedRevisionSubject, setSelectedRevisionSubject] = useState('');

  useEffect(() => {
    let active = true;
    const refreshData = async () => {
      setActivityDataLoading(true);
      try {
        const events = await fetchStudentActivityEvents();
        if (!active) return;
        setStudentActivityEvents(events);
        setStudentActivities(aggregateStudentActivityEvents(events));
        setActivityDataError(false);
      } catch {
        if (!active) return;
        setStudentActivityEvents([]);
        setStudentActivities([]);
        setActivityDataError(true);
      } finally {
        if (active) setActivityDataLoading(false);
      }
    };
    const handleStorage = (event) => { if (!event.key || event.key === 'authToken') refreshData(); };
    refreshData();
    window.addEventListener('student-server-activity-updated', refreshData);
    window.addEventListener('storage', handleStorage);
    return () => {
      active = false;
      window.removeEventListener('student-server-activity-updated', refreshData);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE}/api/cours-bac`)
      .then(({ data }) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : (data?.value || data?.cours || []);
        setCourseCatalog(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (active) setCourseCatalog([]); })
      .finally(() => { if (active) setCourseCatalogLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSchoolData = async () => {
      const sessionToken = localStorage.getItem('authToken');
      const [catalogResult, attemptsResult] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/concours`),
        sessionToken
          ? axios.get(`${API_BASE}/api/qcm/mes-concours`, { headers: { Authorization: `Bearer ${sessionToken}` } })
          : Promise.reject(new Error('Aucune session serveur.'))
      ]);
      if (!active) return;
      setSchoolCatalogError(catalogResult.status === 'rejected');
      setSchoolHistoryError(attemptsResult.status === 'rejected');
      setSchoolCatalog(catalogResult.status === 'fulfilled' && Array.isArray(catalogResult.value.data) ? filterByStudentPack(catalogResult.value.data) : []);
      setSchoolAttempts(attemptsResult.status === 'fulfilled' && Array.isArray(attemptsResult.value.data?.attempts) ? attemptsResult.value.data.attempts : []);
      setSchoolDataLoading(false);
    };
    loadSchoolData();
    window.addEventListener('student-qcm-history-updated', loadSchoolData);
    return () => {
      active = false;
      window.removeEventListener('student-qcm-history-updated', loadSchoolData);
    };
  }, []);

  const analyticsActivities = filterDashboardActivities(studentActivities, { mode: dashboardMode, subject: analyticsSubject, period: analyticsPeriod });
  const completedCount = analyticsActivities.filter((activity) => activity.completed).length;
  const resourceCount = analyticsActivities.length;
  const overallProgress = resourceCount ? Math.round((completedCount / resourceCount) * 100) : 0;
  const pendingMistakes = schoolAttempts.reduce((count, attempt) => count + (attempt.answers || []).filter((answer) => !answer.correct).length, 0);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activitiesThisWeek = studentActivityEvents.filter((event) => {
    const timestamp = new Date(event.occurredAt).getTime();
    const category = dashboardMode === 'overview' ? '' : ({ contests: 'Concours', 'mock-exams': 'Concours blanc', courses: 'Cours', exams: 'Examen national', summaries: 'Résumé' })[dashboardMode];
    return event.eventType === 'VIEW' && Number.isFinite(timestamp) && timestamp >= weekAgo
      && (!category || normalizeActivityCategory(event.type) === category)
      && (!analyticsSubject || event.subject === analyticsSubject);
  }).length;

  const progressBySubject = useMemo(() => {
    const groups = analyticsActivities.reduce((result, activity) => {
      const style = subjectStyle(activity.subject);
      const group = result[style.name] || { ...style, total: 0, completed: 0 };
      group.total += 1;
      if (activity.completed) group.completed += 1;
      result[style.name] = group;
      return result;
    }, {});
    return Object.values(groups)
      .map((group) => ({ ...group, percent: group.total ? Math.round((group.completed / group.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [analyticsActivities]);

  const schoolCards = useMemo(() => {
    const grouped = new Map();
    schoolCatalog.forEach((contest) => {
      const name = String(contest.ecole || '').trim();
      const key = normalizeSchool(name);
      if (!key) return;
      const current = grouped.get(key) || { name, contestCount: 0, subjects: new Set(), years: new Set() };
      current.contestCount += 1;
      if (String(contest.matiere || '').trim()) current.subjects.add(String(contest.matiere).trim());
      if (contest.annee) current.years.add(String(contest.annee));
      grouped.set(key, current);
    });

    return [...grouped.values()].map((school) => {
      const attempts = schoolAttempts.filter((attempt) => normalizeSchool(attempt.school) === normalizeSchool(school.name));
      const scored = scoresOf(attempts);
      const subjects = [...new Set(attempts.map((attempt) => String(attempt.subject || '').trim()).filter(Boolean))]
        .map((name) => {
          const records = attempts.filter((attempt) => String(attempt.subject || '').trim() === name);
          const scores = scoresOf(records);
          return {
            name,
            attempts: records.length,
            average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null
          };
        })
        .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
      return {
        ...school,
        subjects: [...school.subjects],
        years: [...school.years].sort((a, b) => Number(b) - Number(a)),
        attemptCount: attempts.length,
        attemptedContests: new Set(attempts.map((attempt) => `${attempt.resourceType || ''}:${attempt.resourceId}`)).size,
        average: scored.length ? Math.round(scored.reduce((sum, score) => sum + score, 0) / scored.length) : null,
        best: scored.length ? Math.max(...scored) : null,
        successRate: scored.length ? Math.round((scored.filter((score) => score >= 50).length / scored.length) * 100) : null,
        subjectStats: subjects
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [schoolCatalog, schoolAttempts]);
  const selectedSchoolStats = schoolCards.find((school) => normalizeSchool(school.name) === normalizeSchool(selectedSchool));

  const recentActivities = [...analyticsActivities]
    .sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime())
    .slice(0, 5);

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const count = studentActivityEvents.filter((event) => {
      const viewed = new Date(event.occurredAt);
      const category = dashboardMode === 'overview' ? '' : ({ contests: 'Concours', 'mock-exams': 'Concours blanc', courses: 'Cours', exams: 'Examen national', summaries: 'Résumé' })[dashboardMode];
      return event.eventType === 'VIEW' && !Number.isNaN(viewed.getTime())
        && viewed.getFullYear() === date.getFullYear()
        && viewed.getMonth() === date.getMonth()
        && viewed.getDate() === date.getDate()
        && (!category || normalizeActivityCategory(event.type) === category)
        && (!analyticsSubject || event.subject === analyticsSubject);
    }).length;
    return { label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', ''), count, key: date.toISOString() };
  });
  const maxDayCount = Math.max(1, ...weekDays.map((day) => day.count));

  const stats = [
    { label: 'Ressources consult\u00e9es', value: activityDataError ? '\u2014' : resourceCount, note: 'Ressources consult\u00e9es et enregistr\u00e9es', icon: '\u25A4', tint: '#eff6ff', color: '#2563eb' },
    { label: 'Ressources termin\u00e9es', value: activityDataError ? '\u2014' : completedCount, note: 'Validations enregistr\u00e9es', icon: '\u2713', tint: '#ecfdf5', color: '#059669' },
    { label: 'Activite cette semaine', value: activityDataError ? '\u2014' : activitiesThisWeek, note: 'Consultations enregistr\u00e9es en base', icon: '\u2197', tint: '#f5f3ff', color: '#7c3aed' },
    { label: 'Erreurs a revoir', value: schoolDataLoading || schoolHistoryError ? '\u2014' : pendingMistakes, note: 'R\u00e9ponses incorrectes des QCM', icon: '!', tint: '#fff7ed', color: '#ea580c' }
  ];

  const sectionActivities = useMemo(() => filterDashboardActivities(studentActivities, {
    mode: dashboardMode,
    subject: analyticsSubject,
    period: analyticsPeriod
  }), [dashboardMode, studentActivities, analyticsSubject, analyticsPeriod]);
  const sectionSummary = useMemo(() => summarizeDashboardActivities(sectionActivities), [sectionActivities]);
  const availableAnalyticsSubjects = [...new Set(filterDashboardActivities(studentActivities, { mode: dashboardMode }).map((activity) => activity.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  const sectionEvents = studentActivityEvents.filter((event) => {
    const category = dashboardMode === 'overview' ? '' : ({ contests: 'Concours', 'mock-exams': 'Concours blanc', courses: 'Cours', exams: 'Examen national', summaries: 'Résumé' })[dashboardMode];
    if (category && normalizeActivityCategory(event.type) !== category) return false;
    if (analyticsSubject && event.subject !== analyticsSubject) return false;
    if (analyticsPeriod !== 'all' && (!event.occurredAt || new Date(event.occurredAt).getTime() < Date.now() - Number(analyticsPeriod) * 86400000)) return false;
    return true;
  });
  const activityTrend = useMemo(() => buildActivityTrend(sectionEvents, { mode: dashboardMode }), [sectionEvents, dashboardMode]);
  const activityTrendMax = Math.max(1, ...activityTrend.map((week) => Math.max(week.views, week.completions)));
  const activityTrendPoints = activityTrend.map((week, index) => `${40 + index * (620 / Math.max(1, activityTrend.length - 1))},${190 - week.views / activityTrendMax * 145}`).join(' ');
  const completionTrendPoints = activityTrend.map((week, index) => `${40 + index * (620 / Math.max(1, activityTrend.length - 1))},${190 - week.completions / activityTrendMax * 145}`).join(' ');
  const sectionCompleted = sectionActivities.filter((activity) => activity.completed).length;
  const sectionCompletionRate = sectionActivities.length ? Math.round((sectionCompleted / sectionActivities.length) * 100) : 0;
  const sectionVisits = sectionActivities.reduce((total, activity) => total + Number(activity.visits || 0), 0);
  const correctionDocs = sectionActivities.filter((activity) => `${activity.id || ''} ${activity.title || ''}`.toLocaleLowerCase().includes('correction'));
  const examDocs = sectionActivities.filter((activity) => !correctionDocs.includes(activity));
  const completedQcmAttempts = useMemo(() => schoolAttempts.filter((attempt) => {
    const answered = Number(attempt.totalQuestions) || 0;
    const expected = Number(attempt.expectedQuestions) || answered;
    const sameFiliere = !user.filiere || normalizeCourseValue(attempt.filiere) === normalizeCourseValue(user.filiere);
    return sameFiliere && answered > 0 && answered >= expected;
  }), [schoolAttempts, user.filiere]);
  const mockAttempts = useMemo(() => {
    const latestByAttempt = new Map();
    completedQcmAttempts.filter((attempt) => String(attempt.resourceType || '').toLocaleLowerCase().includes('blanc')).forEach((attempt) => {
      const key = `${attempt.resourceId}:${attempt.attemptId ?? attempt.answeredAt}`;
      const previous = latestByAttempt.get(key);
      if (!previous || new Date(attempt.answeredAt) > new Date(previous.answeredAt)) latestByAttempt.set(key, attempt);
    });
    return [...latestByAttempt.values()].sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt));
  }, [completedQcmAttempts]);
  const concoursAttempts = useMemo(() => {
    const latestByAttempt = new Map();
    filterByStudentPack(completedQcmAttempts.filter((attempt) => !String(attempt.resourceType || '').toLocaleLowerCase().includes('blanc')), 'school').forEach((attempt) => {
      const key = `${attempt.resourceId}:${attempt.attemptId ?? attempt.answeredAt}`;
      const previous = latestByAttempt.get(key);
      if (!previous || new Date(attempt.answeredAt) > new Date(previous.answeredAt)) latestByAttempt.set(key, attempt);
    });
    return [...latestByAttempt.values()].sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt));
  }, [completedQcmAttempts]);
  const filteredMockAttempts = useMemo(() => mockAttempts.filter((attempt) =>
    (!selectedMockSubject || String(attempt.subject || '') === selectedMockSubject)
    && (!selectedMockChapter || String(attempt.chapter || '') === selectedMockChapter)
    && isWithinPeriod(attempt, scorePeriod)
  ), [mockAttempts, selectedMockSubject, selectedMockChapter, scorePeriod]);
  const filteredConcoursAttempts = useMemo(() => concoursAttempts.filter((attempt) =>
    (!selectedSchool || normalizeSchool(attempt.school) === normalizeSchool(selectedSchool))
    && (!selectedContestSubject || String(attempt.subject || '') === selectedContestSubject)
    && isWithinPeriod(attempt, scorePeriod)
  ), [concoursAttempts, selectedSchool, selectedContestSubject, scorePeriod]);
  const mockScores = scoresOf(filteredMockAttempts);
  const mockAverage = mockScores.length ? Math.round(mockScores.reduce((sum, score) => sum + score, 0) / mockScores.length) : null;
  const mockBest = mockScores.length ? Math.max(...mockScores) : null;
  const mockPassRate = filteredMockAttempts.length ? Math.round(filteredMockAttempts.reduce((sum, attempt) => sum + Number(attempt.correctAnswers || 0), 0) * 100 / Math.max(1, filteredMockAttempts.reduce((sum, attempt) => sum + Number(attempt.totalQuestions || 0), 0))) : null;
  const concoursScores = scoresOf(filteredConcoursAttempts);
  const concoursAverage = concoursScores.length ? Math.round(concoursScores.reduce((sum, score) => sum + score, 0) / concoursScores.length) : null;
  const concoursBest = concoursScores.length ? Math.max(...concoursScores) : null;
  const concoursPassRate = filteredConcoursAttempts.length ? Math.round(filteredConcoursAttempts.reduce((sum, attempt) => sum + Number(attempt.correctAnswers || 0), 0) * 100 / Math.max(1, filteredConcoursAttempts.reduce((sum, attempt) => sum + Number(attempt.totalQuestions || 0), 0))) : null;
  const mockSubjectPerformance = useMemo(() => {
    const grouped = new Map();
    filteredMockAttempts.forEach((attempt) => {
      const name = String(attempt.subject || 'Autres matières').trim();
      const group = grouped.get(name) || { name, scores: [], attempts: 0 };
      group.attempts += 1;
      if (attempt.score !== null && attempt.score !== undefined && attempt.score !== '' && Number.isFinite(Number(attempt.score))) group.scores.push(Number(attempt.score));
      grouped.set(name, group);
    });
    return [...grouped.values()].map((group) => ({
      ...group,
      average: group.scores.length ? Math.round(group.scores.reduce((sum, score) => sum + score, 0) / group.scores.length) : null
    })).sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
  }, [filteredMockAttempts]);
  const mockChapterPerformance = useMemo(() => {
    const grouped = new Map();
    filteredMockAttempts.forEach((attempt) => {
      const name = String(attempt.chapter || 'Chapitre non renseigné').trim();
      const group = grouped.get(name) || { name, scores: [], attempts: 0, correct: 0, questions: 0, errors: 0 };
      group.attempts += 1;
      if (Number.isFinite(Number(attempt.score))) group.scores.push(Number(attempt.score));
      group.correct += Number(attempt.correctAnswers) || 0;
      group.questions += Number(attempt.totalQuestions) || 0;
      group.errors += Math.max(0, (Number(attempt.totalQuestions) || 0) - (Number(attempt.correctAnswers) || 0));
      grouped.set(name, group);
    });
    return [...grouped.values()].map((group) => ({ ...group, average: group.scores.length ? Math.round(group.scores.reduce((sum, score) => sum + score, 0) / group.scores.length) : null, accuracy: group.questions ? Math.round(group.correct * 100 / group.questions) : null })).sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
  }, [filteredMockAttempts]);
  const concoursSchoolPerformance = useMemo(() => {
    const grouped = new Map();
    filteredConcoursAttempts.forEach((attempt) => {
      const name = String(attempt.school || 'Autres concours').trim();
      const group = grouped.get(name) || { name, scores: [], attempts: 0 };
      group.attempts += 1;
      if (attempt.score !== null && attempt.score !== undefined && attempt.score !== '' && Number.isFinite(Number(attempt.score))) group.scores.push(Number(attempt.score));
      grouped.set(name, group);
    });
    return [...grouped.values()].map((group) => ({
      ...group,
      average: group.scores.length ? Math.round(group.scores.reduce((sum, score) => sum + score, 0) / group.scores.length) : null
    })).sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
  }, [filteredConcoursAttempts]);
  const concoursSubjectPerformance = useMemo(() => {
    const grouped = new Map();
    filteredConcoursAttempts.forEach((attempt) => {
      const name = String(attempt.subject || 'Matière non renseignée').trim();
      const group = grouped.get(name) || { name, scores: [], attempts: 0, correct: 0, questions: 0, errors: 0 };
      group.attempts += 1;
      if (Number.isFinite(Number(attempt.score))) group.scores.push(Number(attempt.score));
      group.correct += Number(attempt.correctAnswers) || 0;
      group.questions += Number(attempt.totalQuestions) || 0;
      group.errors += Math.max(0, (Number(attempt.totalQuestions) || 0) - (Number(attempt.correctAnswers) || 0));
      grouped.set(name, group);
    });
    return [...grouped.values()].map((group) => ({ ...group, average: group.scores.length ? Math.round(group.scores.reduce((sum, score) => sum + score, 0) / group.scores.length) : null, accuracy: group.questions ? Math.round(group.correct * 100 / group.questions) : null })).sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
  }, [filteredConcoursAttempts]);
  const sectionStats = dashboardMode === 'contests' ? [
    { label: 'Concours réalisés', value: filteredConcoursAttempts.length, note: 'Tentatives terminées', icon: '◉', tint: '#eff6ff', color: '#2563eb' },
    { label: 'Score moyen', value: concoursAverage === null ? '—' : `${concoursAverage}%`, note: `${concoursScores.length} score${concoursScores.length > 1 ? 's' : ''} enregistré${concoursScores.length > 1 ? 's' : ''}`, icon: '↗', tint: '#f5f3ff', color: '#7c3aed' },
    { label: 'Meilleur score', value: concoursBest === null ? '—' : `${concoursBest}%`, note: 'Sur vos concours réalisés', icon: '★', tint: '#fffbeb', color: '#d97706' },
    { label: 'Bonnes réponses', value: concoursPassRate === null ? '—' : `${concoursPassRate}%`, note: 'Correctes / questions évaluées', icon: '✓', tint: '#ecfdf5', color: '#059669' }
  ] : dashboardMode === 'mock-exams' ? [
    { label: 'Concours blancs réalisés', value: filteredMockAttempts.length, note: 'Tentatives terminées', icon: '◉', tint: '#eff6ff', color: '#2563eb' },
    { label: 'Score moyen', value: mockAverage === null ? '—' : `${mockAverage}%`, note: `${mockScores.length} score${mockScores.length > 1 ? 's' : ''} enregistré${mockScores.length > 1 ? 's' : ''}`, icon: '↗', tint: '#f5f3ff', color: '#7c3aed' },
    { label: 'Meilleur score', value: mockBest === null ? '—' : `${mockBest}%`, note: 'Sur vos concours blancs', icon: '★', tint: '#fffbeb', color: '#d97706' },
    { label: 'Bonnes réponses', value: mockPassRate === null ? '—' : `${mockPassRate}%`, note: 'Correctes / questions évaluées', icon: '✓', tint: '#ecfdf5', color: '#059669' }
  ] : dashboardMode === 'exams' ? [
    { label: 'Épreuves consultées', value: examDocs.length, note: 'Examens nationaux ouverts', icon: '▤', tint: '#eff6ff', color: '#2563eb' },
    { label: 'Corrections consultées', value: correctionDocs.length, note: 'Corrections ouvertes', icon: '✓', tint: '#ecfdf5', color: '#059669' },
    { label: 'Documents terminés', value: sectionCompleted, note: 'Marqués comme terminés', icon: '▣', tint: '#f5f3ff', color: '#7c3aed' },
    { label: 'Séances de révision', value: sectionVisits, note: 'Ouvertures d’épreuves et corrections', icon: '↗', tint: '#fff7ed', color: '#ea580c' }
  ] : [
    { label: dashboardMode === 'courses' ? 'Cours consultés' : 'Fiches consultées', value: sectionActivities.length, note: 'Ressources distinctes', icon: '▤', tint: '#eff6ff', color: '#2563eb' },
    { label: dashboardMode === 'courses' ? 'Cours terminés' : 'Fiches terminées', value: sectionCompleted, note: 'Marqués comme terminés', icon: '✓', tint: '#ecfdf5', color: '#059669' },
    { label: 'Progression', value: sectionActivities.length ? `${sectionCompletionRate}%` : '—', note: 'Taux de complétion', icon: '◉', tint: '#f5f3ff', color: '#7c3aed' },
    { label: 'Séances de révision', value: sectionVisits, note: 'Consultations enregistrées', icon: '↗', tint: '#fff7ed', color: '#ea580c' }
  ];
  const sectionGroups = dashboardMode === 'contests'
    ? concoursSchoolPerformance.map((group) => ({ name: group.name, total: group.attempts, completed: group.attempts, percent: group.average ?? 0, score: group.average }))
    : dashboardMode === 'mock-exams'
      ? mockSubjectPerformance.map((group) => ({ name: group.name, total: group.attempts, completed: group.attempts, percent: group.average ?? 0, score: group.average }))
      : sectionSummary.subjects.map((group) => ({ name: group.name, total: group.resources, completed: group.completed, percent: group.completionRate ?? 0, visits: group.visits }));
  const sectionRecent = dashboardMode === 'contests'
    ? filteredConcoursAttempts.slice(0, 6)
    : dashboardMode === 'mock-exams'
    ? filteredMockAttempts.slice(0, 6)
    : [...sectionActivities].sort((a, b) => new Date(b.lastViewedAt) - new Date(a.lastViewedAt));
  const scoreMode = dashboardMode === 'contests' || dashboardMode === 'mock-exams';
  const activeScoreAverage = dashboardMode === 'contests' ? concoursAverage : mockAverage;
  const activeScoreAttempts = dashboardMode === 'contests' ? filteredConcoursAttempts : filteredMockAttempts;
  const courseActivities = useMemo(() => filterDashboardActivities(studentActivities, { mode: 'courses', subject: analyticsSubject }), [studentActivities, analyticsSubject]);
  const visibleCourseCatalog = useMemo(() => courseCatalog.filter((course) =>
    courseFiliereMatches(course.filiere, user.filiere)
    && (!analyticsSubject || normalizeCourseValue(course.matiere) === normalizeCourseValue(analyticsSubject))
  ), [courseCatalog, user.filiere, analyticsSubject]);
  const courseChapterAnalytics = useMemo(() => {
    const resources = visibleCourseCatalog.length ? visibleCourseCatalog : courseActivities.map((activity) => ({
      id: String(activity.id || '').replace(/^Cours:/, ''),
      matiere: activity.subject,
      chapitre: activity.chapter
    }));
    const byResource = new Map(courseActivities.map((activity) => [String(activity.id || '').replace(/^Cours:/, ''), activity]));
    const chapters = new Map();
    resources.forEach((resource) => {
      const chapter = String(resource.chapitre || 'Chapitre général').trim();
      const subject = String(resource.matiere || 'Autres matières').trim();
      const key = `${normalizeCourseValue(subjectStyle(subject).name)}|${normalizeCourseValue(chapter)}`;
      const group = chapters.get(key) || { subject, name: chapter, resourceIds: [] };
      if (resource.id !== null && resource.id !== undefined && !group.resourceIds.includes(String(resource.id))) group.resourceIds.push(String(resource.id));
      chapters.set(key, group);
    });
    return [...chapters.values()].map((chapter) => {
      const tracked = chapter.resourceIds.map((id) => byResource.get(id)).filter(Boolean);
      const completed = tracked.filter((activity) => activity.completed).length;
      const total = chapter.resourceIds.length;
      const percent = total ? Math.round((completed / total) * 100) : 0;
      return { ...chapter, completed, tracked: tracked.length, total, percent, validated: total > 0 && tracked.length === total && completed === total };
    }).sort((a, b) => a.subject.localeCompare(b.subject) || a.name.localeCompare(b.name));
  }, [visibleCourseCatalog, courseActivities]);
  const completedCourseChapters = courseChapterAnalytics.filter((chapter) => chapter.validated).length;
  const courseChapterProgress = courseChapterAnalytics.length ? Math.round((completedCourseChapters / courseChapterAnalytics.length) * 100) : 0;
  const courseActivitySeconds = courseActivities.reduce((total, activity) => total + (Number(activity.durationSeconds) || 0), 0);
  const courseRevisionDistribution = useMemo(() => {
    const subjects = new Map();
    visibleCourseCatalog.forEach((course) => {
      const style = subjectStyle(course.matiere);
      if (!subjects.has(style.name)) subjects.set(style.name, { ...style, revisions: 0 });
    });
    courseActivities.forEach((activity) => {
      const style = subjectStyle(activity.subject);
      const subject = subjects.get(style.name) || { ...style, revisions: 0 };
      subject.revisions += Math.max(0, Number(activity.visits) || 0);
      subjects.set(style.name, subject);
    });
    const palette = ['#4f91ee', '#77c995', '#f3a078', '#f4cf61', '#a88be8', '#55b7c4', '#e783a7'];
    const entries = [...subjects.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    const total = entries.reduce((sum, subject) => sum + subject.revisions, 0);
    let offset = 0;
    return entries.map((subject, index) => {
      const percent = total ? Math.round(subject.revisions / total * 100) : 0;
      const entry = { ...subject, color: palette[index % palette.length], percent, offset };
      offset += total ? subject.revisions / total * 100 : 0;
      return entry;
    });
  }, [visibleCourseCatalog, courseActivities]);
  const courseRevisionCount = courseRevisionDistribution.reduce((sum, subject) => sum + subject.revisions, 0);
  const courseStudyDaySet = useMemo(() => {
    const days = new Set();
    courseActivities.forEach((activity) => {
      Object.entries(activity.durationByDay || {}).forEach(([day, seconds]) => { if (Number(seconds) > 0) days.add(day); });
      if (activity.lastViewedAt && Number.isFinite(new Date(activity.lastViewedAt).getTime())) days.add(localDayKey(activity.lastViewedAt));
    });
    return days;
  }, [courseActivities]);
  const currentStudyStreak = (() => {
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    let key = localDayKey(cursor);
    if (!courseStudyDaySet.has(key)) {
      cursor.setDate(cursor.getDate() - 1);
      key = localDayKey(cursor);
    }
    let streak = 0;
    while (courseStudyDaySet.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      key = localDayKey(cursor);
    }
    return streak;
  })();
  const bestStudyStreak = (() => {
    const days = [...courseStudyDaySet].sort();
    let best = 0;
    let current = 0;
    let previous = null;
    days.forEach((day) => {
      const date = new Date(`${day}T00:00:00Z`);
      const previousDate = previous ? new Date(`${previous}T00:00:00Z`) : null;
      if (previousDate && (date - previousDate) / 86400000 === 1) current += 1;
      else current = 1;
      best = Math.max(best, current);
      previous = day;
    });
    return best;
  })();
  const weeklyStudyHours = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = localDayKey(date);
    const seconds = courseActivities.reduce((sum, activity) => sum + (Number(activity.durationByDay?.[key]) || 0), 0);
    return { key, label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', ''), hours: seconds / 3600 };
  }), [courseActivities]);
  const weeklyCourseHoursTotal = weeklyStudyHours.reduce((sum, day) => sum + day.hours, 0);
  const courseChapterCards = courseChapterAnalytics.filter((chapter) => (!selectedRevisionSubject || subjectStyle(chapter.subject).name === selectedRevisionSubject)
    && (courseSubjectFilter === 'all' || (courseSubjectFilter === 'strengths' ? chapter.percent >= 70 : chapter.percent < 70)));
  const courseCompletionCards = [
    { label: 'Chapitres validés', value: courseCatalogLoading ? '…' : courseChapterAnalytics.length ? `${completedCourseChapters}/${courseChapterAnalytics.length}` : '—', note: courseChapterAnalytics.length ? 'Tous les cours du chapitre terminés' : 'Aucun chapitre disponible', icon: '✓', tint: '#d1fae5', color: '#059669' },
    { label: 'Progression', value: courseCatalogLoading ? '…' : `${courseChapterProgress}%`, note: 'Taux des chapitres validés', icon: '◉', tint: '#dbeafe', color: '#2563eb' },
    { label: 'Temps d’étude', value: `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(courseActivitySeconds / 3600)} h`, note: 'Temps visible dans les cours', icon: '◷', tint: '#e0e7ff', color: '#4f46e5' },
    { label: 'Série de révision', value: `${currentStudyStreak} / ${bestStudyStreak} j`, note: 'Actuelle / meilleure série', icon: '↗', tint: '#d1fae5', color: '#059669' }
  ];
  const activeDashboardStats = dashboardMode === 'courses' ? courseCompletionCards : sectionStats;
  const dashboardProgressValue = dashboardMode === 'courses' ? courseChapterProgress : scoreMode ? (activeScoreAverage ?? 0) : sectionCompletionRate;
  const weeklyStudyChartMax = Math.max(0.25, ...weeklyStudyHours.map((day) => day.hours));
  const weeklyStudyChartPoints = weeklyStudyHours.map((day, index) => `${30 + index * 106},${178 - (day.hours / weeklyStudyChartMax) * 130}`).join(' ');
  const availableSchools = [...new Set([...schoolCatalog.map((school) => school.ecole || school.name), ...concoursAttempts.map((attempt) => attempt.school)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  const availableMockSubjects = [...new Set(mockAttempts.map((attempt) => String(attempt.subject || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  const availableMockChapters = [...new Set(mockAttempts.filter((attempt) => !selectedMockSubject || attempt.subject === selectedMockSubject).map((attempt) => String(attempt.chapter || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  const availableContestSubjects = [...new Set([
    ...schoolCatalog.filter((school) => !selectedSchool || normalizeSchool(school.ecole || school.name) === normalizeSchool(selectedSchool)).map((school) => String(school.matiere || '').trim()),
    ...concoursAttempts.filter((attempt) => !selectedSchool || normalizeSchool(attempt.school) === normalizeSchool(selectedSchool)).map((attempt) => String(attempt.subject || '').trim())
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  const activeContestAttempts = activeScoreAttempts;
  const scoreTrendAttempts = [...activeContestAttempts].sort((a, b) => new Date(a.answeredAt) - new Date(b.answeredAt));
  const trendMax = Math.max(100, ...scoreTrendAttempts.map((attempt) => Number(attempt.score) || 0));
  const scoreTrendPoints = scoreTrendAttempts.map((attempt, index) => `${scoreTrendAttempts.length === 1 ? 350 : 40 + index * (620 / (scoreTrendAttempts.length - 1))},${200 - (Number(attempt.score) || 0) / trendMax * 160}`).join(' ');
  const scorePerformanceGroups = dashboardMode === 'mock-exams' ? mockChapterPerformance : concoursSubjectPerformance;
  const scoreBestGroup = scorePerformanceGroups.find((group) => group.attempts > 0 && group.average !== null);
  const scoreImproveGroup = [...scorePerformanceGroups].reverse().find((group) => group.attempts > 0 && group.average !== null);
  const scoreErrorGroup = [...scorePerformanceGroups].sort((a, b) => b.errors - a.errors)[0];

  return (
    <div className="dashboard-with-rail">
      <nav className="dashboard-quick-rail" aria-label="Raccourcis du tableau de bord">
        {DASHBOARD_SHORTCUTS.map((shortcut, index) => {
          const active = dashboardMode === shortcut.mode;
          return <button
            type="button"
            key={shortcut.path}
            className={`dashboard-rail-link${index === 0 ? ' is-primary' : ''}${active ? ' is-active' : ''}`}
            aria-label={shortcut.label}
            aria-pressed={active}
            title={shortcut.label}
            onClick={() => { setDashboardMode(shortcut.mode); setAnalyticsSubject(''); setAnalyticsPeriod('all'); }}
          >
            <svg className="dashboard-rail-icon" viewBox="0 0 24 24" aria-hidden="true"><DashboardShortcutIcon name={shortcut.icon} /></svg>
            {shortcut.abbreviation && <span>{shortcut.abbreviation}</span>}
          </button>;
        })}
      </nav>
      <div className="client-dashboard">
        <div className="client-dashboard-content">
        {!scoreMode && !activityDataError && <section className="dashboard-score-filters dashboard-panel dashboard-activity-filters" aria-label="Filtres des statistiques">
          <label>Matière<select value={analyticsSubject} onChange={(event) => setAnalyticsSubject(event.target.value)}><option value="">Toutes les matières</option>{availableAnalyticsSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select></label>
          <label>Période<select value={analyticsPeriod} onChange={(event) => setAnalyticsPeriod(event.target.value)}><option value="all">Toute la période</option><option value="30">30 derniers jours</option><option value="90">90 derniers jours</option></select></label>
        </section>}
        {activityDataLoading && <div className="dashboard-panel dashboard-score-empty">Chargement de vos activités enregistrées…</div>}
        {dashboardMode === 'overview' ? <>
        <section className="dashboard-welcome">
          <div className="dashboard-welcome-copy">
            <h1>Bonjour, {firstName}</h1>
            <div className="dashboard-welcome-actions">
              <button type="button" className="dashboard-primary-action" onClick={() => navigate('/client-cours')}>Continuer mes r&eacute;visions <span aria-hidden="true">{'\u2192'}</span></button>
              <button type="button" className="dashboard-secondary-action" onClick={() => navigate('/client-examens')}>Voir les examens</button>
            </div>
          </div>
        </section>

        <section className="dashboard-overview-summary" aria-label="Résumé de votre progression">
        <section className="dashboard-stats" aria-label="Statistiques de progression">
          {stats.map((stat) => (
            <article className="dashboard-stat-card" key={stat.label}>
              <span className="dashboard-stat-icon" style={{ color: stat.color, background: stat.tint }}>{stat.icon}</span>
              <div className="dashboard-stat-copy"><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small></div>
            </article>
          ))}
        </section>
        <section className="dashboard-overall-card dashboard-overall-standalone" aria-label="Progression générale">
          <div className="dashboard-overall-copy">
            <strong>Progression g&eacute;n&eacute;rale</strong>
          </div>
          <div className="dashboard-overall-content">
            <div className="dashboard-ring" style={{ '--progress': `${activityDataError ? 0 : overallProgress}%` }}>
              <div><strong>{activityDataError || !resourceCount ? '—' : `${overallProgress}%`}</strong><span>termin&eacute;</span></div>
            </div>
            <div className="dashboard-overall-copy">
              <span>{activityDataError ? 'Données indisponibles' : `${completedCount} sur ${resourceCount} ressources enregistrées`}</span>
            </div>
          </div>
        </section>
        </section>

        <div className="dashboard-activity-discord-layout">
        <section className="dashboard-panel dashboard-score-trend dashboard-activity-trend">
          <div className="dashboard-panel-heading"><div><span className="dashboard-section-kicker">ACTIVITÉ RÉELLE</span><h2>Évolution de vos consultations</h2></div></div>
          {sectionEvents.some((event) => event.eventType === 'VIEW' || event.eventType === 'COMPLETE')
            ? <><p className="dashboard-panel-description">Consultations et validations enregistrées par semaine, selon les filtres choisis.</p>
              <svg className="dashboard-score-line-chart" viewBox="0 0 700 235" role="img" aria-label="Consultations et validations par semaine">
                {[45, 90, 135, 180].map((y) => <line key={y} x1="40" x2="660" y1={y} y2={y} className="dashboard-study-gridline" />)}
                <polyline points={activityTrendPoints} className="dashboard-study-line" />
                <polyline points={completionTrendPoints} className="dashboard-study-line dashboard-activity-completion-line" />
                {activityTrend.map((week, index) => {
                  const x = 40 + index * (620 / Math.max(1, activityTrend.length - 1));
                  const y = 190 - week.views / activityTrendMax * 145;
                  return <g key={week.key}><circle cx={x} cy={y} r="4" className="dashboard-study-point"><title>{`${week.label} : ${week.views} consultations`}</title></circle></g>;
                })}
                <text x="40" y="222" className="dashboard-study-day-label">{activityTrend[0]?.label}</text><text x="660" y="222" textAnchor="end" className="dashboard-study-day-label">{activityTrend.at(-1)?.label}</text>
              </svg><div className="dashboard-activity-trend-legend"><span>Consultations</span><span>Validations</span></div></>
            : <div className="dashboard-mode-empty">La chronologie apparaîtra après une consultation ou une validation enregistrée.</div>}
        </section>
        <section className="dashboard-quick-links dashboard-discord-panel" aria-label="Communauté">
          <a className="dashboard-discord-link" href="https://discord.com/app" target="_blank" rel="noreferrer" aria-label="Ouvrir Discord dans un nouvel onglet">
            <span><svg viewBox="0 0 20 19" aria-hidden="true" focusable="false"><use href="/icons.svg#discord-icon" /></svg></span>
            <strong>Discord</strong><small>Rejoindre la communaut&eacute;</small><b>{'\u2197'}</b>
          </a>
        </section>
        </div>
        {sectionSummary.resources > 0 && <div className="dashboard-score-insights dashboard-overview-insights">
          <section className="dashboard-panel"><span className="dashboard-section-kicker">POINT FORT</span><h2>{sectionSummary.strength?.name || 'Pas encore de données'}</h2><p>{sectionSummary.strength ? `${sectionSummary.strength.completionRate}% de vos ressources consultées sont terminées dans cette matière.` : 'Les points forts apparaîtront après vos premières activités.'}</p></section>
          {sectionSummary.subjects.length > 1 && sectionSummary.difficulty && <section className="dashboard-panel"><span className="dashboard-section-kicker">À RENFORCER</span><h2>{sectionSummary.difficulty?.name}</h2><p>{`${sectionSummary.difficulty.completionRate}% de vos ressources consultées sont terminées dans cette matière.`}</p></section>}
        </div>}
        <section className="dashboard-panel dashboard-school-section" aria-label="Statistiques par école">
          <div className="dashboard-panel-heading">
            <div><span className="dashboard-section-kicker">VOS OBJECTIFS</span><h2>Progression par &eacute;cole</h2></div>
            <span className="dashboard-school-count">{schoolCards.length} &eacute;cole{schoolCards.length > 1 ? 's' : ''}</span>
          </div>
          <p className="dashboard-panel-description">Choisissez une &eacute;cole pour consulter vos r&eacute;sultats et votre progression.</p>
          {schoolDataLoading ? <div className="dashboard-school-message">Chargement des &eacute;coles et des r&eacute;sultats...</div>
            : schoolCatalogError ? <div className="dashboard-school-message">Impossible de charger la liste des &eacute;coles pour le moment.</div>
            : schoolCards.length ? <>
              <div className="dashboard-school-cards">
                {schoolCards.map((school) => (
                  <button type="button" key={school.name} className={`dashboard-school-card ${normalizeSchool(selectedSchool) === normalizeSchool(school.name) ? 'is-selected' : ''}`} onClick={() => setSelectedSchool(normalizeSchool(selectedSchool) === normalizeSchool(school.name) ? '' : school.name)} aria-pressed={normalizeSchool(selectedSchool) === normalizeSchool(school.name)}>
                    <span className="dashboard-school-mark" aria-hidden="true">{school.name.slice(0, 1).toUpperCase()}</span>
                    <span className="dashboard-school-card-copy"><strong>{school.name}</strong><small>{school.contestCount} concours &middot; {school.subjects.length} mati&egrave;re{school.subjects.length > 1 ? 's' : ''}</small></span>
                    <span className="dashboard-school-average">{school.average === null ? '--' : `${school.average}%`}<small>moyenne</small></span>
                  </button>
                ))}
              </div>
              {selectedSchoolStats && <div className="dashboard-school-detail">
                <div className="dashboard-school-detail-heading"><div><span>VOTRE DASHBOARD</span><h3>{selectedSchoolStats.name}</h3></div><button type="button" onClick={() => setSelectedSchool('')} aria-label="Fermer le dashboard de cette école">&times;</button></div>
                <div className="dashboard-school-metrics">
                  <article><span>Concours disponibles</span><strong>{selectedSchoolStats.contestCount}</strong></article>
                  <article><span>Concours tent&eacute;s</span><strong>{selectedSchoolStats.attemptedContests}</strong><small>{selectedSchoolStats.attemptCount} tentative{selectedSchoolStats.attemptCount > 1 ? 's' : ''}</small></article>
                  <article><span>Score moyen</span><strong>{selectedSchoolStats.average === null ? '--' : `${selectedSchoolStats.average}%`}</strong></article>
                  <article><span>Meilleur score</span><strong>{selectedSchoolStats.best === null ? '--' : `${selectedSchoolStats.best}%`}</strong></article>
                  <article><span>Scores &agrave; 50% ou plus</span><strong>{selectedSchoolStats.successRate === null ? '--' : `${selectedSchoolStats.successRate}%`}</strong></article>
                </div>
                {!!selectedSchoolStats.years.length && <div className="dashboard-school-years"><strong>Ann&eacute;es disponibles</strong>{selectedSchoolStats.years.map((year) => <span key={year}>{year}</span>)}</div>}
                {schoolHistoryError ? <div className="dashboard-school-no-data">Impossible de charger vos r&eacute;sultats pour le moment.</div>
                  : selectedSchoolStats.attemptCount ? <>
                  <div className="dashboard-school-detail-title">R&eacute;sultats par mati&egrave;re</div>
                  {selectedSchoolStats.subjectStats.length ? <div className="dashboard-school-subjects">
                    {selectedSchoolStats.subjectStats.map((subject) => <div className="dashboard-school-subject-row" key={subject.name}><strong>{subject.name}</strong><span>{subject.attempts} tentative{subject.attempts > 1 ? 's' : ''}</span><b>{subject.average === null ? '--' : `${subject.average}%`}</b></div>)}
                  </div> : <p className="dashboard-school-no-data">Les mati&egrave;res ne sont pas disponibles dans les r&eacute;sultats enregistr&eacute;s.</p>}
                </> : <div className="dashboard-school-no-data">Aucune tentative enregistr&eacute;e pour cette &eacute;cole pour le moment. Vos r&eacute;sultats appara&icirc;tront ici apr&egrave;s un concours.</div>}
              </div>}
            </> : <div className="dashboard-school-message">Aucune &eacute;cole avec des concours publi&eacute;s pour le moment.</div>}
        </section>

        <div className="dashboard-content-grid">
          <section className="dashboard-panel dashboard-subject-panel">
            <div className="dashboard-panel-heading">
              <div><span className="dashboard-section-kicker">VOTRE APPRENTISSAGE</span><h2>Progression par mati&egrave;re</h2></div>
              <button type="button" onClick={() => navigate('/client-cours')}>Parcourir les cours <span aria-hidden="true">{'\u2192'}</span></button>
            </div>
            {progressBySubject.length ? (
              <div className="dashboard-subject-list">
                {progressBySubject.map((subject) => (
                  <article className="dashboard-subject-row" key={subject.name}>
                    <span className="dashboard-subject-icon" style={{ color: subject.color, background: subject.tint }}>{subject.icon}</span>
                    <div className="dashboard-subject-main">
                      <div className="dashboard-subject-title"><strong>{subject.name}</strong><span>{subject.completed}/{subject.total} termin&eacute;es</span></div>
                      <div className="dashboard-progress-track"><span style={{ width: `${subject.percent}%`, background: subject.color }} /></div>
                    </div>
                    <strong className="dashboard-subject-percent" style={{ color: subject.color }}>{subject.percent}%</strong>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <span>{'\u25CB'}</span><strong>Votre progression appara&icirc;tra ici</strong>
                <p>Consultez un cours, un r&eacute;sum&eacute; ou un sujet pour commencer &agrave; suivre votre avanc&eacute;e.</p>
                <button type="button" onClick={() => navigate('/client-cours')}>D&eacute;couvrir les cours</button>
              </div>
            )}
          </section>

          <section className="dashboard-panel dashboard-week-panel">
            <div className="dashboard-panel-heading">
              <div><span className="dashboard-section-kicker">R&Eacute;GULARIT&Eacute;</span><h2>Cette semaine</h2></div>
              <span className="dashboard-week-total">{activitiesThisWeek} ressource{activitiesThisWeek > 1 ? 's' : ''}</span>
            </div>
            <p className="dashboard-panel-description">Ressources consult&eacute;es au cours des sept derniers jours.</p>
            <div className="dashboard-week-chart" aria-label="Ressources consultees par jour">
              {weekDays.map((day) => (
                <div className="dashboard-week-day" key={day.key}>
                  <span className="dashboard-week-count">{day.count || ''}</span>
                  <div className="dashboard-week-bar-track"><span style={{ height: `${day.count ? Math.max(10, day.count / maxDayCount * 100) : 4}%` }} /></div>
                  <span className="dashboard-week-label">{day.label}</span>
                </div>
              ))}
            </div>
            <div className="dashboard-week-footer"><span className="dashboard-week-dot" />Votre activit&eacute; est mise &agrave; jour automatiquement</div>
          </section>
        </div>

        <section className="dashboard-panel dashboard-activity-panel">
          <div className="dashboard-panel-heading">
            <div><span className="dashboard-section-kicker">REPRENDRE</span><h2>Activit&eacute;s r&eacute;centes</h2></div>
            <button type="button" onClick={() => navigate('/client-erreurs?view=all')}>R&eacute;viser mes erreurs <span aria-hidden="true">{'\u2192'}</span></button>
          </div>
          {recentActivities.length ? (
            <div className="dashboard-activity-list">
              {recentActivities.map((activity) => {
                const subject = subjectStyle(activity.subject);
                return (
                  <article className="dashboard-activity-row" key={activity.id}>
                    <span className="dashboard-activity-type" style={{ color: subject.color, background: subject.tint }}>{String(activity.type || 'Ressource').slice(0, 3).toUpperCase()}</span>
                    <div className="dashboard-activity-copy"><strong>{activity.title}</strong><span>{[activity.subject, activity.chapter].filter(Boolean).join(' / ') || subject.name}</span></div>
                    <time>{formatDate(activity.lastViewedAt)}</time>
                    <button className={`dashboard-completion-button ${activity.completed ? 'is-complete' : ''}`} type="button" onClick={() => setStudentActivityCompleted(activity.id, !activity.completed)}>
                      {activity.completed ? 'Termin&eacute;e \u2713' : 'Marquer termin&eacute;e'}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-activity-empty">Vos ressources consult&eacute;es appara&icirc;tront ici. Commencez par choisir un cours ou un examen.</div>
          )}
        </section>

        </> : <>
          <section className={`dashboard-mode-hero${dashboardMode === 'courses' ? ' dashboard-course-mode-hero' : ''}`}>
            <div>
              <span className="dashboard-eyebrow">VOTRE ESPACE DE R&Eacute;VISION</span>
              <h1>{DASHBOARD_MODES[dashboardMode].title}</h1>
              <p>{DASHBOARD_MODES[dashboardMode].subtitle}</p>
            </div>
            <div className="dashboard-mode-progress">
              <div className={`dashboard-ring${dashboardMode === 'courses' ? ' dashboard-course-ring' : ''}`} style={{ '--progress': `${dashboardProgressValue}%` }}>
                <div><strong>{dashboardMode === 'courses' ? `${courseChapterProgress}%` : scoreMode ? (activeScoreAverage === null ? '—' : `${activeScoreAverage}%`) : `${sectionCompletionRate}%`}</strong><span>{scoreMode ? 'moyenne' : 'terminé'}</span></div>
              </div>
              <div className="dashboard-overall-copy">
                <strong>{dashboardMode === 'courses' ? 'Chapitres validés' : scoreMode ? 'Score moyen' : 'Progression de la section'}</strong>
                <span>{dashboardMode === 'courses' ? courseCatalogLoading ? 'Chargement du programme' : courseChapterAnalytics.length ? `${completedCourseChapters} sur ${courseChapterAnalytics.length} chapitres` : 'Aucun chapitre disponible' : scoreMode ? `${activeScoreAttempts.length} tentative${activeScoreAttempts.length > 1 ? 's' : ''}` : `${sectionCompleted} sur ${sectionActivities.length} ressources terminées`}</span>
              </div>
            </div>
          </section>

          <section className={`dashboard-stats${dashboardMode === 'courses' ? ' dashboard-courses-stats' : ''}`} aria-label={`Indicateurs ${DASHBOARD_MODES[dashboardMode].title}`}>
            {activeDashboardStats.map((stat) => (
              <article className="dashboard-stat-card" key={stat.label}>
                <span className="dashboard-stat-icon" style={{ color: stat.color, background: stat.tint }}>{stat.icon}</span>
                <div className="dashboard-stat-copy"><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small></div>
              </article>
            ))}
          </section>

          {dashboardMode === 'courses' ? <div className="dashboard-course-analytics">
            <section className="dashboard-panel dashboard-study-chart-panel">
              <div className="dashboard-panel-heading">
                <div><span className="dashboard-section-kicker">RYTHME HEBDOMADAIRE</span><h2>Temps de révision</h2></div>
                <span className="dashboard-week-total">{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(weeklyCourseHoursTotal)} h cette semaine</span>
              </div>
              <p className="dashboard-panel-description">Temps mesuré lorsque le lecteur de cours reste ouvert et visible.</p>
              <svg className="dashboard-study-line-chart" viewBox="0 0 700 230" role="img" aria-label="Heures d'étude par jour sur les sept derniers jours">
                <defs><linearGradient id="courseStudyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" stopOpacity=".32" /><stop offset="100%" stopColor="#60a5fa" stopOpacity="0" /></linearGradient></defs>
                {[48, 88, 128, 168].map((y) => <line key={y} x1="30" x2="670" y1={y} y2={y} className="dashboard-study-gridline" />)}
                <polygon points={`30,178 ${weeklyStudyChartPoints} 666,178`} fill="url(#courseStudyFill)" />
                <polyline points={weeklyStudyChartPoints} className="dashboard-study-line" />
                {weeklyStudyHours.map((day, index) => {
                  const x = 30 + index * 106;
                  const y = 178 - (day.hours / weeklyStudyChartMax) * 130;
                  return <g key={day.key}><circle cx={x} cy={y} r="5" className="dashboard-study-point"><title>{`${day.label}: ${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(day.hours)} h`}</title></circle><text x={x} y="207" textAnchor="middle" className="dashboard-study-day-label">{day.label}</text></g>;
                })}
              </svg>
            </section>

            <section className="dashboard-panel dashboard-revision-distribution-panel">
              <div className="dashboard-panel-heading">
                <div><span className="dashboard-section-kicker">VOS CONSULTATIONS</span><h2>Répartition des révisions</h2></div>
                <span className="dashboard-school-count">{courseRevisionCount} consultation{courseRevisionCount > 1 ? 's' : ''}</span>
              </div>
              <p className="dashboard-panel-description">Répartition calculée à partir des ouvertures de cours enregistrées pour chaque matière.</p>
              {courseRevisionCount ? <div className="dashboard-revision-distribution">
                <div className="dashboard-revision-donut-wrap">
                  <svg className="dashboard-revision-donut" viewBox="0 0 220 220" role="img" aria-label="Répartition des consultations de cours par matière">
                    <circle className="dashboard-revision-donut-track" cx="110" cy="110" r="78" />
                    {courseRevisionDistribution.filter((subject) => subject.revisions > 0).map((subject) => {
                      const circumference = 2 * Math.PI * 78;
                      const segmentLength = subject.revisions / courseRevisionCount * circumference;
                      const gap = Math.min(3, segmentLength / 3);
                      return <circle key={subject.name} className="dashboard-revision-donut-segment" cx="110" cy="110" r="78" fill="none" stroke={subject.color} strokeWidth="31" strokeDasharray={`${Math.max(0, segmentLength - gap)} ${circumference - Math.max(0, segmentLength - gap)}`} strokeDashoffset={-subject.offset / 100 * circumference} transform="rotate(-90 110 110)"><title>{`${subject.name} : ${subject.revisions} consultation${subject.revisions > 1 ? 's' : ''} (${subject.percent} %)`}</title></circle>;
                    })}
                  </svg>
                  <div className="dashboard-revision-donut-center"><strong>{courseRevisionCount}</strong><span>consultations</span></div>
                </div>
                <div className="dashboard-revision-legend" aria-label="Révisions par matière">
                  {courseRevisionDistribution.map((subject) => <button className={`dashboard-revision-legend-item${selectedRevisionSubject === subject.name ? ' is-selected' : ''}`} type="button" key={subject.name} aria-pressed={selectedRevisionSubject === subject.name} onClick={() => setSelectedRevisionSubject((current) => current === subject.name ? '' : subject.name)}>
                    <span className="dashboard-revision-legend-dot" style={{ backgroundColor: subject.color }} />
                    <span className="dashboard-revision-legend-name">{subject.name}</span>
                    <strong>{subject.percent}%</strong>
                    <small>{subject.revisions} consultation{subject.revisions > 1 ? 's' : ''}</small>
                  </button>)}
                </div>
              </div> : <div className="dashboard-mode-empty">La répartition apparaîtra après vos premières consultations de cours.</div>}
            </section>

            <section className="dashboard-panel dashboard-course-progress-panel">
              <div className="dashboard-panel-heading">
                <div><span className="dashboard-section-kicker">VOTRE PROGRAMME</span><h2>Chapitres par matière</h2></div>
                <span className="dashboard-school-count">{courseCatalogLoading ? 'Chargement…' : `${completedCourseChapters}/${courseChapterAnalytics.length} validés`}</span>
              </div>
              <div className="dashboard-course-filters" role="group" aria-label="Filtrer les chapitres">
                {[['all', 'Tous'], ['strengths', 'Points forts'], ['review', 'À revoir']].map(([value, label]) => <button key={value} type="button" className={courseSubjectFilter === value ? 'is-selected' : ''} aria-pressed={courseSubjectFilter === value} onClick={() => setCourseSubjectFilter(value)}>{label}</button>)}
              </div>
              {courseCatalogLoading ? <div className="dashboard-mode-empty">Chargement du programme de cours…</div>
                : courseChapterCards.length ? <div className="dashboard-course-card-grid">
                  {courseChapterCards.map((chapter) => <button type="button" className={`dashboard-course-chapter-card${chapter.percent >= 70 ? ' is-strength' : ''}`} key={`${chapter.subject}:${chapter.name}`} onClick={() => navigate('/client-cours')}>
                    <div className="dashboard-course-card-top"><span>{chapter.subject}</span><strong>{chapter.percent}%</strong></div>
                    <h3>{chapter.name}</h3>
                    <div className="dashboard-course-track"><span style={{ width: `${chapter.percent}%` }} /></div>
                    <small>{chapter.completed}/{chapter.total} cours terminés · {chapter.tracked} consultés</small>
                  </button>)}
                </div> : <div className="dashboard-mode-empty">Aucun chapitre disponible pour votre filière pour le moment.</div>}
            </section>
          </div> : <>
          {dashboardMode === 'exams' && <p className="dashboard-data-note">Les examens nationaux sont suivis par consultation des sujets et corrections. Aucun score de QCM n’est enregistré pour ces documents.</p>}

          {!scoreMode && dashboardMode !== 'overview' && <section className="dashboard-panel dashboard-score-trend dashboard-activity-trend">
            <div className="dashboard-panel-heading"><div><span className="dashboard-section-kicker">PROGRESSION CHRONOLOGIQUE</span><h2>Activité par semaine</h2></div><span className="dashboard-school-count">{sectionVisits} consultation{sectionVisits > 1 ? 's' : ''}</span></div>
            {sectionEvents.some((event) => event.eventType === 'VIEW' || event.eventType === 'COMPLETE')
              ? <><p className="dashboard-panel-description">Évolution des consultations et validations à partir des événements enregistrés.</p>
                <svg className="dashboard-score-line-chart" viewBox="0 0 700 235" role="img" aria-label="Consultations et validations hebdomadaires">
                  {[45, 90, 135, 180].map((y) => <line key={y} x1="40" x2="660" y1={y} y2={y} className="dashboard-study-gridline" />)}
                  <polyline points={activityTrendPoints} className="dashboard-study-line" />
                  <polyline points={completionTrendPoints} className="dashboard-study-line dashboard-activity-completion-line" />
                  {activityTrend.map((week, index) => {
                    const x = 40 + index * (620 / Math.max(1, activityTrend.length - 1));
                    const y = 190 - week.views / activityTrendMax * 145;
                    return <g key={week.key}><circle cx={x} cy={y} r="4" className="dashboard-study-point"><title>{`${week.label} : ${week.views} consultations`}</title></circle></g>;
                  })}
                  <text x="40" y="222" className="dashboard-study-day-label">{activityTrend[0]?.label}</text><text x="660" y="222" textAnchor="end" className="dashboard-study-day-label">{activityTrend.at(-1)?.label}</text>
                </svg><div className="dashboard-activity-trend-legend"><span>Consultations</span><span>Validations</span></div></>
              : <div className="dashboard-mode-empty">Les données chronologiques apparaîtront après une consultation enregistrée.</div>}
            {sectionSummary.resources > 0 && <div className="dashboard-score-insights">
              <section className="dashboard-panel"><span className="dashboard-section-kicker">POINT FORT</span><h2>{sectionSummary.strength?.name || 'Pas encore de données'}</h2><p>{sectionSummary.strength ? `${sectionSummary.strength.completionRate}% des ressources consultées sont terminées dans cette matière.` : 'Les points forts apparaîtront après vos premières activités.'}</p></section>
              {sectionSummary.subjects.length > 1 && sectionSummary.difficulty && <section className="dashboard-panel"><span className="dashboard-section-kicker">À RENFORCER</span><h2>{sectionSummary.difficulty?.name}</h2><p>{`${sectionSummary.difficulty.completionRate}% des ressources consultées sont terminées dans cette matière.`}</p></section>}
            </div>}
          </section>}
          {scoreMode && <div className="dashboard-score-dashboard">
            <section className="dashboard-score-filters dashboard-panel" aria-label="Filtres des résultats">
              {dashboardMode === 'contests' && <label>École<select value={selectedSchool} onChange={(event) => { setSelectedSchool(event.target.value); setSelectedContestSubject(''); }}><option value="">Toutes les écoles</option>{availableSchools.map((school) => <option key={school} value={school}>{school}</option>)}</select></label>}
              <label>Matière<select value={dashboardMode === 'contests' ? selectedContestSubject : selectedMockSubject} onChange={(event) => dashboardMode === 'contests' ? setSelectedContestSubject(event.target.value) : (setSelectedMockSubject(event.target.value), setSelectedMockChapter(''))}><option value="">Toutes les matières</option>{(dashboardMode === 'contests' ? availableContestSubjects : availableMockSubjects).map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select></label>
              {dashboardMode === 'mock-exams' && <label>Chapitre<select value={selectedMockChapter} onChange={(event) => setSelectedMockChapter(event.target.value)}><option value="">Tous les chapitres</option>{availableMockChapters.map((chapter) => <option key={chapter} value={chapter}>{chapter}</option>)}</select></label>}
              <label>Période<select value={scorePeriod} onChange={(event) => setScorePeriod(event.target.value)}><option value="all">Toute la période</option><option value="30">30 derniers jours</option><option value="90">90 derniers jours</option></select></label>
            </section>

            {schoolDataLoading ? <div className="dashboard-panel dashboard-score-empty">Chargement des résultats enregistrés…</div>
              : schoolHistoryError ? <div className="dashboard-panel dashboard-score-empty">Impossible de charger vos résultats enregistrés. Reconnectez-vous puis réessayez.</div>
              : !activeContestAttempts.length ? <div className="dashboard-activity-discord-layout">
                <div className="dashboard-panel dashboard-score-empty">Aucun concours terminé ne correspond à ces filtres. Vos résultats apparaîtront ici après la fin d’un QCM.</div>
                {dashboardMode === 'contests' && <section className="dashboard-quick-links dashboard-discord-panel" aria-label="Communauté">
                  <a className="dashboard-discord-link" href="https://discord.com/app" target="_blank" rel="noreferrer" aria-label="Ouvrir Discord dans un nouvel onglet">
                    <span><svg viewBox="0 0 20 19" aria-hidden="true" focusable="false"><use href="/icons.svg#discord-icon" /></svg></span>
                    <strong>Discord</strong><small>Rejoindre la communaut&eacute;</small><b>{'\u2197'}</b>
                  </a>
                </section>}
              </div>
              : <>
                <div className="dashboard-activity-discord-layout">
                <section className="dashboard-panel dashboard-score-trend">
                  <div className="dashboard-panel-heading"><div><span className="dashboard-section-kicker">RÉSULTATS ENREGISTRÉS</span><h2>Évolution des scores</h2></div><span className="dashboard-school-count">{activeContestAttempts.length} tentative{activeContestAttempts.length > 1 ? 's' : ''}</span></div>
                  <p className="dashboard-panel-description">Chaque point correspond à une tentative terminée, triée par date.</p>
                  <svg className="dashboard-score-line-chart" viewBox="0 0 700 235" role="img" aria-label="Évolution chronologique des scores enregistrés">
                    {[40, 80, 120, 160, 200].map((y) => <line key={y} x1="40" x2="660" y1={y} y2={y} className="dashboard-study-gridline" />)}
                    {scoreTrendAttempts.length > 1 && <polyline points={scoreTrendPoints} className="dashboard-study-line" />}
                    {scoreTrendAttempts.map((attempt, index) => {
                      const x = scoreTrendAttempts.length === 1 ? 350 : 40 + index * (620 / (scoreTrendAttempts.length - 1));
                      const y = 200 - (Number(attempt.score) || 0) / trendMax * 160;
                      return <g key={`${attempt.resourceType}|${attempt.resourceId}|${attempt.attemptId}`}><circle cx={x} cy={y} r="5" className="dashboard-study-point"><title>{`${attempt.resourceTitle || 'QCM'} · ${Math.round(Number(attempt.score) || 0)}% · ${formatDate(attempt.answeredAt)}`}</title></circle></g>;
                    })}
                    <text x="40" y="226" className="dashboard-study-day-label">{formatDate(scoreTrendAttempts[0]?.answeredAt)}</text><text x="660" y="226" textAnchor="end" className="dashboard-study-day-label">{formatDate(scoreTrendAttempts.at(-1)?.answeredAt)}</text>
                  </svg>
                </section>
                {dashboardMode === 'contests' && <section className="dashboard-quick-links dashboard-discord-panel" aria-label="Communauté">
                  <a className="dashboard-discord-link" href="https://discord.com/app" target="_blank" rel="noreferrer" aria-label="Ouvrir Discord dans un nouvel onglet">
                    <span><svg viewBox="0 0 20 19" aria-hidden="true" focusable="false"><use href="/icons.svg#discord-icon" /></svg></span>
                    <strong>Discord</strong><small>Rejoindre la communaut&eacute;</small><b>{'\u2197'}</b>
                  </a>
                </section>}
                </div>

                <section className="dashboard-panel dashboard-score-performance">
                  <div className="dashboard-panel-heading"><div><span className="dashboard-section-kicker">RÉSULTATS PAR {dashboardMode === 'mock-exams' ? 'CHAPITRE' : 'MATIÈRE'}</span><h2>Performance {dashboardMode === 'mock-exams' ? 'par chapitre' : 'par matière de l’école'}</h2></div></div>
                  {scorePerformanceGroups.length ? <div className="dashboard-score-bars">{scorePerformanceGroups.map((group) => <button type="button" className="dashboard-score-bar-row" key={group.name} onClick={() => dashboardMode === 'mock-exams' ? setSelectedMockChapter((current) => current === group.name ? '' : group.name) : setSelectedContestSubject((current) => current === group.name ? '' : group.name)}>
                    <span className="dashboard-score-bar-label">{group.name}</span><span className="dashboard-score-bar-track"><span style={{ width: `${Math.max(0, Math.min(100, group.average ?? 0))}%` }} /></span><strong>{group.average === null ? '—' : `${group.average}%`}</strong><small>{group.attempts} tentative{group.attempts > 1 ? 's' : ''} · {group.errors} erreur{group.errors > 1 ? 's' : ''}</small>
                  </button>)}</div> : <div className="dashboard-mode-empty">Aucune performance n’est disponible pour ces filtres.</div>}
                </section>

                <div className="dashboard-score-insights">
                  <section className="dashboard-panel"><span className="dashboard-section-kicker">POINT FORT</span><h2>{scoreBestGroup?.name || 'Pas encore de données'}</h2><p>{scoreBestGroup ? `Meilleure moyenne enregistrée : ${scoreBestGroup.average}% sur ${scoreBestGroup.attempts} tentative${scoreBestGroup.attempts > 1 ? 's' : ''}.` : 'Terminez un concours pour calculer vos points forts.'}</p></section>
                  <section className="dashboard-panel"><span className="dashboard-section-kicker">À AMÉLIORER</span><h2>{scoreImproveGroup?.name || 'Pas encore de données'}</h2><p>{scoreImproveGroup ? `Moyenne enregistrée : ${scoreImproveGroup.average}% · ${scoreErrorGroup?.errors || 0} erreur${(scoreErrorGroup?.errors || 0) > 1 ? 's' : ''} pour ${scoreErrorGroup?.name || scoreImproveGroup.name}.` : 'Les pistes de révision apparaîtront avec vos résultats.'}</p></section>
                </div>

                <section className="dashboard-panel dashboard-score-history">
                  <div className="dashboard-panel-heading"><div><span className="dashboard-section-kicker">HISTORIQUE</span><h2>Concours terminés</h2></div><span className="dashboard-week-total">{activeContestAttempts.length} résultat{activeContestAttempts.length > 1 ? 's' : ''}</span></div>
                  <div className="dashboard-score-history-list">{[...activeContestAttempts].sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt)).map((attempt) => {
                    const key = `${attempt.resourceType}|${attempt.resourceId}|${attempt.attemptId}`;
                    const open = selectedAttemptKey === key;
                    return <div className="dashboard-score-history-item" key={key}><button type="button" className="dashboard-score-history-button" aria-expanded={open} onClick={() => setSelectedAttemptKey(open ? '' : key)}><span><strong>{attempt.resourceTitle || 'Concours'}</strong><small>{[attempt.school, attempt.subject, attempt.chapter].filter(Boolean).join(' · ') || 'Matière non renseignée'} · {formatDate(attempt.answeredAt)}</small></span><b>{Math.round(Number(attempt.score) || 0)}%</b><span>{attempt.correctAnswers}/{attempt.totalQuestions} bonnes réponses</span><strong>{open ? '−' : 'Voir les détails'}</strong></button>
                      {open && <div className="dashboard-score-answer-list">{(attempt.answers || []).map((answer, index) => <article key={answer.questionId || index}><strong>Q{answer.questionNumber || index + 1} · {answer.correct ? 'Correcte' : 'À revoir'}</strong><span>{answer.questionText || 'Énoncé non enregistré'}</span><small>Votre réponse : {answer.selectedChoiceText || answer.selectedChoiceLabel || '—'} · Réponse attendue : {answer.correctChoiceText || answer.correctChoiceLabel || '—'}</small></article>)}</div>}
                    </div>;
                  })}</div>
                </section>
              </>}
          </div>}

          {!scoreMode && <div className="dashboard-content-grid dashboard-mode-grid">
            <section className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div><span className="dashboard-section-kicker">ANALYSE</span><h2>{scoreMode ? `Classement personnel par ${dashboardMode === 'contests' ? 'école' : 'matière'}` : 'Progression par matière'}</h2></div>
                <button type="button" onClick={() => navigate(DASHBOARD_SHORTCUTS.find((item) => item.mode === dashboardMode)?.path || '/client-dashboard')}>Ouvrir la section <span aria-hidden="true">{ '\u2192' }</span></button>
              </div>
              {sectionGroups.length ? <div className="dashboard-subject-list">
                {sectionGroups.map((group, index) => (
                  <article className="dashboard-subject-row" key={group.name}>
                    <span className="dashboard-subject-icon" style={{ color: subjectStyle(group.name).color, background: subjectStyle(group.name).tint }}>{subjectStyle(group.name).icon}</span>
                    <div className="dashboard-subject-main">
                      <div className="dashboard-subject-title"><strong>{group.name}</strong><span>{scoreMode ? `#${index + 1} · ${group.total} tentative${group.total > 1 ? 's' : ''}` : `${group.completed}/${group.total} terminées`}</span></div>
                      <div className="dashboard-progress-track"><span style={{ width: `${group.percent}%`, background: scoreMode ? '#2563eb' : subjectStyle(group.name).color }} /></div>
                    </div>
                    <strong className="dashboard-subject-percent" style={{ color: scoreMode ? '#2563eb' : subjectStyle(group.name).color }}>{scoreMode ? (group.score === null ? '—' : `${group.score}%`) : `${group.percent}%`}</strong>
                  </article>
                ))}
              </div> : <div className="dashboard-mode-empty">Les statistiques par matière apparaîtront après vos premières consultations ou tentatives.</div>}
            </section>

            <section className="dashboard-panel dashboard-mode-history">
              <div className="dashboard-panel-heading">
                <div><span className="dashboard-section-kicker">HISTORIQUE</span><h2>{dashboardMode === 'contests' ? 'Derniers concours' : dashboardMode === 'mock-exams' ? 'Dernières simulations' : 'Dernières activités'}</h2></div>
                <span className="dashboard-week-total">{sectionRecent.length} activité{sectionRecent.length > 1 ? 's' : ''}</span>
              </div>
              {sectionRecent.length ? <div className="dashboard-mode-history-list">
                {sectionRecent.map((item, index) => {
                  const isAttempt = scoreMode;
                  const subject = subjectStyle(item.subject);
                  return <article className="dashboard-mode-history-row" key={isAttempt ? `${item.resourceId}-${item.attemptId || index}` : item.id}>
                    <span className="dashboard-activity-type" style={{ color: subject.color, background: subject.tint }}>{isAttempt ? 'QCM' : String(item.type || 'DOC').slice(0, 3).toUpperCase()}</span>
                    <div className="dashboard-activity-copy"><strong>{isAttempt ? item.resourceTitle || (dashboardMode === 'contests' ? 'Concours' : 'Concours blanc') : item.title}</strong><span>{[dashboardMode === 'contests' ? item.school : '', item.subject, item.chapter].filter(Boolean).join(' / ') || subject.name}</span></div>
                    <time>{formatDate(isAttempt ? item.answeredAt : item.lastViewedAt)}</time>
                    <strong className="dashboard-mode-score" style={{ color: isAttempt && Number(item.score) >= 50 ? '#059669' : undefined }}>{isAttempt ? (item.score === null || item.score === undefined ? '—' : `${item.score}%`) : item.completed ? 'Terminée' : 'En cours'}</strong>
                  </article>;
                })}
              </div> : <div className="dashboard-mode-empty">Votre historique s’affichera ici dès que vous aurez consulté une ressource de cette section.</div>}
            </section>
          </div>}
          </>}
        </>}
        {activityDataError && <div className="dashboard-panel dashboard-score-empty">Vos statistiques personnelles n’ont pas pu être chargées. Vérifiez votre connexion puis reconnectez-vous.</div>}
        </div>
      </div>
    </div>
  );
}
