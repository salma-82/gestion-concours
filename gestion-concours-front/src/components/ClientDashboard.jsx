import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ClientDashboard.css';
import ClientContestStatsDashboard from './ClientContestStatsDashboard';
import ClientMockExamStatsDashboard from './ClientMockExamStatsDashboard';
import ClientNationalExamStatsDashboard from './ClientNationalExamStatsDashboard';
import ClientCourseStatsDashboard from './ClientCourseStatsDashboard';
import ClientSummaryStatsDashboard from './ClientSummaryStatsDashboard';
import ClientGeneralStatsDashboard from './ClientGeneralStatsDashboard';
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
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const API_BASE = '';
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
  .filter((score) => Number.isFinite(score) && score >= 0 && score <= 100);
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
  { label: 'Accueil / Profil', abbreviation: 'Accueil', mode: 'overview', path: '/client-dashboard', icon: 'home' },
  { label: 'Concours réels', abbreviation: 'Concours', mode: 'contests', path: '/client-concours', icon: 'contest' },
  { label: 'Concours Blancs', abbreviation: 'Blancs', mode: 'mock-exams', path: '/client-concours-blanc', icon: 'white-contest' },
  { label: 'Cours BAC', abbreviation: 'Cours', mode: 'courses', path: '/client-cours', icon: 'courses' },
  { label: 'Examens nationaux', abbreviation: 'Examens', mode: 'exams', path: '/client-examens', icon: 'exams' },
  { label: 'Résumés & fiches', abbreviation: 'Résumés', mode: 'summaries', path: '/client-resumes', icon: 'resumes' }
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
  const [activityRetry, setActivityRetry] = useState(0);
  const [schoolCatalog, setSchoolCatalog] = useState([]);
  const [courseCatalog, setCourseCatalog] = useState([]);
  const [courseCatalogLoading, setCourseCatalogLoading] = useState(true);
  const [courseCatalogError, setCourseCatalogError] = useState(false);
  const [courseCatalogRetry, setCourseCatalogRetry] = useState(0);
  const [schoolAttempts, setSchoolAttempts] = useState([]);
  const [schoolDataLoading, setSchoolDataLoading] = useState(true);
  const [schoolRetry, setSchoolRetry] = useState(0);
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
  const [dashboardMode, setDashboardMode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode');
      if (urlMode && ['overview', 'contests', 'mock-exams', 'courses', 'exams', 'summaries'].includes(urlMode)) {
        return urlMode;
      }
    } catch {}
    return 'overview';
  });
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
  }, [activityRetry]);

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE}/api/cours-bac`)
      .then(({ data }) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : (data?.value || data?.cours || []);
        setCourseCatalog(Array.isArray(list) ? list : []);
        setCourseCatalogError(false);
      })
      .catch(() => { if (active) { setCourseCatalog([]); setCourseCatalogError(true); } })
      .finally(() => { if (active) setCourseCatalogLoading(false); });
    return () => { active = false; };
  }, [courseCatalogRetry]);

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
  }, [schoolRetry]);

  const [statPeriod, setStatPeriod] = React.useState(7);

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
  const sectionCompletionRate = sectionActivities.length ? Math.round((sectionCompleted / sectionActivities.length) * 100) : null;
  const sectionVisits = sectionActivities.reduce((total, activity) => total + Number(activity.visits || 0), 0);
  const correctionDocs = sectionActivities.filter((activity) => activity.resourceVariant === 'correction'
    || `${activity.id || ''} ${activity.title || ''}`.toLocaleLowerCase().includes('correction'));
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
    const resources = visibleCourseCatalog;
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
  const courseChapterProgress = courseChapterAnalytics.length ? Math.round((completedCourseChapters / courseChapterAnalytics.length) * 100) : null;
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
    { label: 'Progression', value: courseCatalogLoading ? '…' : courseChapterProgress === null ? '—' : `${courseChapterProgress}%`, note: 'Taux des chapitres validés', icon: '◉', tint: '#dbeafe', color: '#2563eb' },
    { label: 'Temps d’étude', value: `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(courseActivitySeconds / 3600)} h`, note: 'Temps visible dans les cours', icon: '◷', tint: '#e0e7ff', color: '#4f46e5' },
    { label: 'Série de révision', value: `${currentStudyStreak} / ${bestStudyStreak} j`, note: 'Actuelle / meilleure série', icon: '↗', tint: '#d1fae5', color: '#059669' }
  ];
  const activeDashboardStats = dashboardMode === 'courses' ? courseCompletionCards : sectionStats;
  const dashboardProgressValue = dashboardMode === 'courses' ? (courseChapterProgress ?? 0) : scoreMode ? (activeScoreAverage ?? 0) : (sectionCompletionRate ?? 0);
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
  const scoreTrendAttempts = [...activeContestAttempts].filter((attempt) => scoresOf([attempt]).length > 0).sort((a, b) => new Date(a.answeredAt) - new Date(b.answeredAt));
  const scoreTrendData = scoreTrendAttempts.map((attempt, index) => ({
    label: `${index + 1}. ${attempt.resourceTitle || 'QCM'}`,
    score: Number(attempt.score),
    date: formatDate(attempt.answeredAt)
  }));
  const scorePerformanceGroups = dashboardMode === 'mock-exams' ? mockChapterPerformance : concoursSubjectPerformance;
  const scoreBestGroup = scorePerformanceGroups.find((group) => group.attempts > 0 && group.average !== null);
  const scoreImproveGroup = [...scorePerformanceGroups].reverse().find((group) => group.attempts > 0 && group.average !== null);
  const scoreErrorGroup = [...scorePerformanceGroups].sort((a, b) => b.errors - a.errors)[0];

  const activityFilters = !scoreMode && !activityDataError ? (
    <section className="dashboard-score-filters dashboard-panel dashboard-activity-filters" aria-label="Filtres des statistiques">
      <label>Matière<select value={analyticsSubject} onChange={(event) => setAnalyticsSubject(event.target.value)}><option value="">Toutes les matières</option>{availableAnalyticsSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select></label>
      <label>Période<select value={analyticsPeriod} onChange={(event) => setAnalyticsPeriod(event.target.value)}><option value="all">Toute la période</option><option value="30">30 derniers jours</option><option value="90">90 derniers jours</option></select></label>
    </section>
  ) : null;

  const contestProgressActivities = sectionActivities.filter((activity) =>
    statPeriod === 0 || !activity.lastViewedAt || new Date(activity.lastViewedAt).getTime() >= Date.now() - statPeriod * 86400000
  );
  const contestProgressTotal = contestProgressActivities.length;
  const contestProgressCompleted = contestProgressActivities.filter((activity) => activity.completed).length;
  const contestProgressInProgress = Math.max(0, contestProgressTotal - contestProgressCompleted);
  const contestProgressRate = contestProgressTotal ? Math.round((contestProgressCompleted / contestProgressTotal) * 100) : 0;

  return (
    <div className="dashboard-with-rail">
      <nav className="dashboard-quick-rail" aria-label="Raccourcis du tableau de bord">
        {DASHBOARD_SHORTCUTS.map((shortcut, index) => {
          const active = dashboardMode === shortcut.mode;
          return <button
            type="button"
            key={shortcut.path}
            className={`dashboard-rail-link${active ? ' is-active' : ''}`}
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
      <div className="client-dashboard dashboard-bento-shell">
        {dashboardMode === 'exams' ? (
          <ClientNationalExamStatsDashboard
            events={studentActivityEvents}
            loading={activityDataLoading}
            error={activityDataError}
            onRetry={() => { setActivityDataLoading(true); setActivityRetry((value) => value + 1); }}
          />
        ) : (
        <div className="client-dashboard-content bento-dashboard" data-dashboard-mode={dashboardMode}>
        {activityDataLoading && dashboardMode !== 'overview' && <div className="dashboard-panel dashboard-score-empty">Chargement de vos activités enregistrées…</div>}
        {dashboardMode === 'overview' ? (
          <ClientGeneralStatsDashboard
            events={studentActivityEvents}
            activities={studentActivities}
            mockAttempts={mockAttempts}
            concoursAttempts={concoursAttempts}
            activityLoading={activityDataLoading}
            activityError={activityDataError}
            schoolLoading={schoolDataLoading}
            schoolError={schoolHistoryError}
            firstName={firstName}
            onNavigate={navigate}
          />
        )  : dashboardMode === 'contests' ? (
          <ClientContestStatsDashboard
            schoolCatalog={schoolCatalog}
            schoolAttempts={schoolAttempts}
            studentActivities={studentActivities}
            schoolDataLoading={schoolDataLoading}
            schoolCatalogError={schoolCatalogError}
            schoolHistoryError={schoolHistoryError}
            user={user}
          />
        ) : dashboardMode === 'mock-exams' ? (
          <ClientMockExamStatsDashboard
            schoolAttempts={schoolAttempts}
            studentActivities={studentActivities}
            schoolDataLoading={schoolDataLoading}
            schoolHistoryError={schoolHistoryError}
            user={user}
          />
        ) : dashboardMode === 'courses' ? (
          <ClientCourseStatsDashboard
            courseCatalog={courseCatalog}
            courseCatalogLoading={courseCatalogLoading}
            courseCatalogError={courseCatalogError}
            studentActivities={studentActivities}
            user={user}
          />
        ) : dashboardMode === 'summaries' ? (
          <ClientSummaryStatsDashboard
            studentActivities={studentActivities}
            user={user}
          />
        ) : (
          <>
          <section className={`dashboard-mode-hero dashboard-mode-hero-compact${dashboardMode === 'courses' ? ' dashboard-course-mode-hero' : ''}`}>
            <div>
              <span className="dashboard-eyebrow">VOTRE ESPACE DE R&Eacute;VISION</span>
              <h1>{DASHBOARD_MODES[dashboardMode].title}</h1>
              <p>{DASHBOARD_MODES[dashboardMode].subtitle}</p>
            </div>
            <div className="dashboard-mode-progress">
              <div className={`dashboard-ring${dashboardMode === 'courses' ? ' dashboard-course-ring' : ''}`} style={{ '--progress': `${dashboardProgressValue}%` }}>
                <div><strong>{dashboardMode === 'courses' ? (courseChapterProgress === null ? '—' : `${courseChapterProgress}%`) : scoreMode ? (activeScoreAverage === null ? '—' : `${activeScoreAverage}%`) : sectionCompletionRate === null ? '—' : `${sectionCompletionRate}%`}</strong><span>{scoreMode ? 'moyenne' : 'terminé'}</span></div>
              </div>
              <div className="dashboard-overall-copy">
                <strong>{dashboardMode === 'courses' ? 'Chapitres validés' : scoreMode ? 'Score moyen' : 'Progression de la section'}</strong>
                <span>{dashboardMode === 'courses' ? courseCatalogLoading ? 'Chargement du programme' : courseChapterAnalytics.length ? `${completedCourseChapters} sur ${courseChapterAnalytics.length} chapitres` : 'Aucun chapitre disponible' : scoreMode ? `${activeScoreAttempts.length} tentative${activeScoreAttempts.length > 1 ? 's' : ''}` : `${sectionCompleted} sur ${sectionActivities.length} ressources terminées`}</span>
              </div>
            </div>
          </section>

          {/* ── Outlet-summary style donut card ────────────────────────── */}
          {(() => {
            // Compute counts filtered to statPeriod days
            const cutoff = statPeriod === 0 ? 0 : Date.now() - statPeriod * 86400000;
            const filtered = sectionActivities.filter((a) =>
              statPeriod === 0 || !a.lastViewedAt || new Date(a.lastViewedAt).getTime() >= cutoff
            );
            const total = filtered.length;
            const done = filtered.filter((a) => a.completed).length;
            const inProgress = Math.max(0, total - done);
            const pct = total ? Math.round((done / total) * 100) : 0;

            const donutData = total
              ? [
                  { name: 'Terminées', value: done, color: '#059669' },
                  { name: 'En cours', value: inProgress > 0 ? inProgress : (done === 0 ? 1 : 0), color: '#3b82f6' },
                ].filter(d => d.value > 0)
              : [
                  { name: 'Terminées', value: 0, color: '#059669' },
                  { name: 'En cours', value: 1, color: '#e2e8f0' },
                ];

            const PERIODS = [
              { label: '7 jours', value: 7 },
              { label: '30 jours', value: 30 },
              { label: 'Tout', value: 0 },
            ];

            const modeTitle = dashboardMode === 'mock-exams'
              ? 'Concours blancs'
              : dashboardMode === 'contests'
              ? 'Concours réels'
              : dashboardMode === 'courses'
              ? 'Cours BAC'
              : dashboardMode === 'exams'
              ? 'Examens nationaux'
              : 'Fiches & Résumés';

            return (
              <section
                className="dashboard-panel dashboard-mode-activity-summary"
                style={{
                  minWidth: 0,
                  width: 'min(100%, 240px)',
                  maxWidth: '240px',
                  marginLeft: 0,
                  marginRight: 0,
                  boxSizing: 'border-box',
                  background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(226, 232, 240, 0.85)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
                  padding: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* ── Top Header with Title and Filter ── */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '10px',
                }}>
                  <div style={{ display: 'none' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#2563eb',
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '2px',
                    }}>
                      RÉSUMÉ D'ACTIVITÉ
                    </span>
                    <h2 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#18345b',
                      letterSpacing: '-0.02em',
                    }}>
                      {modeTitle} · Synthèse
                    </h2>
                  </div>

                  {/* Period Filter (7 jours / 30 jours / Tout) */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#f1f5f9',
                    padding: '2px',
                    borderRadius: '10px',
                    gap: '2px',
                  }}>
                    {PERIODS.map((p) => {
                      const active = statPeriod === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setStatPeriod(p.value)}
                          style={{
                            padding: '5px 9px',
                            borderRadius: '7px',
                            fontSize: '9px',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: active ? '#2563eb' : 'transparent',
                            color: active ? '#ffffff' : '#64748b',
                            boxShadow: active ? '0 2px 8px rgba(37, 99, 235, 0.28)' : 'none',
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Body: Donut Chart on left, 3 metrics on right (Outlet summary style) ── */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  alignItems: 'center',
                  gap: 0,
                }}>
                  {/* Left: Donut Chart */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: 0,
                  }}>
                    <div style={{ width: 92, height: 92, position: 'relative', flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={29}
                            outerRadius={40}
                            paddingAngle={donutData.length > 1 ? 4 : 0}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            isAnimationActive
                          >
                            {donutData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val, name) => [`${val}`, name]}
                            contentStyle={{
                              borderRadius: '10px',
                              fontSize: '12px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center % text */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}>
                        <strong style={{ fontSize: '17px', fontWeight: 800, color: '#18345b', lineHeight: 1 }}>
                          {pct}%
                        </strong>
                        <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                          terminé
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 500 }}>Terminées</span>
                        <strong style={{ fontSize: '10px', color: '#18345b', marginLeft: 'auto' }}>{done}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 500 }}>En cours</span>
                        <strong style={{ fontSize: '10px', color: '#18345b', marginLeft: 'auto' }}>{inProgress}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 500 }}>Total</span>
                        <strong style={{ fontSize: '10px', color: '#18345b', marginLeft: 'auto' }}>{total}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: The 3 Metrics (Exact layout of Image 2) */}
                  <div style={{
                    display: 'none',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '14px',
                  }}>
                    {/* Metric 1: Total consultées */}
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      border: '1px solid #edf2f7',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total consultés</span>
                      </div>
                      <strong style={{ fontSize: '26px', fontWeight: 800, color: '#18345b', lineHeight: 1.1 }}>
                        {total}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {statPeriod === 7 ? 'Sur 7 jours' : statPeriod === 30 ? 'Sur 30 jours' : 'Toute période'}
                      </span>
                    </div>

                    {/* Metric 2: Terminées */}
                    <div style={{
                      background: '#f0fdf4',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      border: '1px solid #dcfce7',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Terminés</span>
                      </div>
                      <strong style={{ fontSize: '26px', fontWeight: 800, color: '#15803d', lineHeight: 1.1 }}>
                        {done}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#86efac' }}>
                        Marqués complétés
                      </span>
                    </div>

                    {/* Metric 3: Progression */}
                    <div style={{
                      background: '#eff6ff',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      border: '1px solid #dbeafe',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
                        <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>Progression</span>
                      </div>
                      <strong style={{ fontSize: '26px', fontWeight: 800, color: '#2563eb', lineHeight: 1.1 }}>
                        {pct}%
                      </strong>
                      <span style={{ fontSize: '11px', color: '#93c5fd' }}>
                        Taux de complétion
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}

          {activityFilters}

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
                : courseCatalogError ? <div className="dashboard-mode-empty">Impossible de charger le catalogue des cours. <button type="button" className="dashboard-inline-retry" onClick={() => { setCourseCatalogLoading(true); setCourseCatalogRetry((value) => value + 1); }}>Réessayer</button></div>
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
                <div className="dashboard-weekly-bar-chart" role="img" aria-label="Consultations et validations hebdomadaires">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityTrend} margin={{ top: 14, right: 16, bottom: 0, left: -16 }} barGap={7}>
                      <CartesianGrid stroke="#e5edf8" strokeDasharray="4 6" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#73839a', fontSize: 11 }} minTickGap={12} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#73839a', fontSize: 11 }} width={34} />
                      <Tooltip
                        formatter={(value, name) => [value, name === 'views' || name === 'Consultations' ? 'Consultations' : 'Validations']}
                        contentStyle={{ border: '1px solid #dbeafe', borderRadius: 12, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)' }}
                        cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                      />
                      <Bar dataKey="views" name="Consultations" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="completions" name="Validations" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="dashboard-activity-bar-legend"><span>Consultations</span><span>Validations</span></div>
                <svg className="dashboard-score-line-chart dashboard-weekly-activity-line-chart" viewBox="0 0 700 235" role="img" aria-label="Consultations et validations hebdomadaires">
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
              : schoolHistoryError ? <div className="dashboard-panel dashboard-score-empty">Impossible de charger vos résultats enregistrés. <button type="button" className="dashboard-inline-retry" onClick={() => { setSchoolDataLoading(true); setSchoolRetry((value) => value + 1); }}>Réessayer</button></div>
              : <>
                <div className="dashboard-activity-discord-layout">
                <section className="dashboard-panel dashboard-score-trend">
                  <div className="dashboard-panel-heading">
                    <div>
                      <span className="dashboard-section-kicker">RÉSULTATS ENREGISTRÉS</span>
                      <h2>Évolution des scores</h2>
                    </div>
                    <span className="dashboard-school-count">{activeContestAttempts.length} tentative{activeContestAttempts.length > 1 ? 's' : ''}</span>
                  </div>
                  <p className="dashboard-panel-description">Chaque point correspond à une tentative terminée, triée par date.</p>
                  
                  {/* Graphique Recharts toujours visible */}
                  <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                    {!scoreTrendData.length && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.86)',
                        backdropFilter: 'blur(3px)',
                        borderRadius: '16px',
                        gap: '10px',
                        zIndex: 2,
                        padding: '20px',
                        textAlign: 'center',
                      }}>
                        <div style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '14px',
                          background: '#eff6ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '26px',
                          boxShadow: '0 2px 8px rgba(37,99,235,0.12)',
                        }}>
                          📈
                        </div>
                        <strong style={{ color: '#18345b', fontSize: '15px', fontWeight: 800 }}>
                          Graphique d'évolution des scores
                        </strong>
                        <span style={{ color: '#64748b', fontSize: '13px', maxWidth: '400px', lineHeight: 1.5 }}>
                          Aucun concours terminé ne correspond à ces filtres. Vos résultats s'afficheront ici sous forme de courbe dès la fin d'un QCM.
                        </span>
                      </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={scoreTrendData.length ? scoreTrendData : [
                          { date: 'QCM 1', score: 0 },
                          { date: 'QCM 2', score: 0 },
                          { date: 'QCM 3', score: 0 },
                          { date: 'QCM 4', score: 0 },
                          { date: 'QCM 5', score: 0 },
                        ]}
                        margin={{ top: 12, right: 18, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid stroke="#e5edf7" strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} minTickGap={24} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `${value}%`} width={44} />
                        {scoreTrendData.length > 0 && (
                          <Tooltip formatter={(value) => [`${value}%`, 'Score']} labelFormatter={(label, payload) => payload?.[0]?.payload?.label ? `${payload[0].payload.label} · ${label}` : label} />
                        )}
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke={scoreTrendData.length ? "#2563eb" : "#cbd5e1"}
                          strokeDasharray={scoreTrendData.length ? undefined : "5 5"}
                          strokeWidth={3}
                          dot={scoreTrendData.length ? { r: 4, fill: '#2563eb' } : false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {dashboardMode === 'contests' && <section className="dashboard-contest-summary-card dashboard-contest-average-card" aria-label="Score moyen des concours">
                  <div className="dashboard-contest-average-content">
                    <div className="dashboard-ring dashboard-activity-summary-ring" style={{ '--progress': `${activityDataError ? 0 : activeScoreAverage ?? 0}%` }}>
                      <div><strong>{schoolDataLoading ? '…' : activeScoreAverage === null ? '—' : `${activeScoreAverage}%`}</strong><span>moyenne</span></div>
                    </div>
                    <div className="dashboard-contest-average-copy">
                      <strong>Score moyen</strong>
                      <span>{schoolDataLoading ? 'Chargement…' : `${activeScoreAttempts.length} tentative${activeScoreAttempts.length > 1 ? 's' : ''}`}</span>
                    </div>
                  </div>
                </section>}

                {dashboardMode === 'contests' && <section className="dashboard-contest-summary-card dashboard-contest-progress-card" aria-label="Progression des concours">
                  <div className="dashboard-contest-progress-heading">
                    <strong>Progression</strong>
                    <div className="dashboard-contest-periods" role="group" aria-label="Période de progression">
                      {[{ label: '7 jours', value: 7 }, { label: '30 jours', value: 30 }, { label: 'Tout', value: 0 }].map((period) => (
                        <button key={period.value} type="button" aria-pressed={statPeriod === period.value} className={statPeriod === period.value ? 'is-selected' : ''} onClick={() => setStatPeriod(period.value)}>{period.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="dashboard-contest-progress-content">
                    <div className="dashboard-ring dashboard-activity-summary-ring" style={{ '--progress': `${activityDataError ? 0 : contestProgressRate}%` }}>
                      <div><strong>{activityDataLoading || activityDataError || !contestProgressTotal ? '—' : `${contestProgressRate}%`}</strong><span>terminé</span></div>
                    </div>
                    <div className="dashboard-contest-progress-legend">
                      <span><i className="is-complete" />Terminées<strong>{activityDataLoading ? '…' : activityDataError ? '—' : contestProgressCompleted}</strong></span>
                      <span><i className="is-pending" />En cours<strong>{activityDataLoading ? '…' : activityDataError ? '—' : contestProgressInProgress}</strong></span>
                      <span><i className="is-total" />Total<strong>{activityDataLoading ? '…' : activityDataError ? '—' : contestProgressTotal}</strong></span>
                    </div>
                  </div>
                </section>}

                {dashboardMode === 'contests' && <section className="dashboard-quick-links dashboard-discord-panel" aria-label="Communauté">
                  <a className="dashboard-discord-link" href="https://discord.com/app" target="_blank" rel="noreferrer" aria-label="Ouvrir Discord dans un nouvel onglet">
                    <span><svg viewBox="0 0 20 19" aria-hidden="true" focusable="false"><use href="/icons.svg#discord-icon" /></svg></span>
                    <strong>Discord</strong><small>Rejoindre la communaut&eacute;</small><b>{'↗'}</b>
                  </a>
                </section>}
                </div>

                <section className="dashboard-panel dashboard-score-performance">
                  <div className="dashboard-panel-heading">
                    <div>
                      <span className="dashboard-section-kicker">RÉSULTATS PAR {dashboardMode === 'mock-exams' ? 'CHAPITRE' : 'MATIÈRE'}</span>
                      <h2>Performance {dashboardMode === 'mock-exams' ? 'par chapitre' : 'par matière de l’école'}</h2>
                    </div>
                  </div>
                  {scorePerformanceGroups.length ? (
                    <div className="dashboard-score-bars">
                      {scorePerformanceGroups.map((group) => (
                        <button type="button" className="dashboard-score-bar-row" key={group.name} onClick={() => dashboardMode === 'mock-exams' ? setSelectedMockChapter((current) => current === group.name ? '' : group.name) : setSelectedContestSubject((current) => current === group.name ? '' : group.name)}>
                          <span className="dashboard-score-bar-label">{group.name}</span>
                          <span className="dashboard-score-bar-track"><span style={{ width: `${Math.max(0, Math.min(100, group.average ?? 0))}%` }} /></span>
                          <strong>{group.average === null ? '—' : `${group.average}%`}</strong>
                          <small>{group.attempts} tentative{group.attempts > 1 ? 's' : ''} · {group.errors} erreur{group.errors > 1 ? 's' : ''}</small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ position: 'relative', padding: '16px 0' }}>
                      <div className="dashboard-score-bars" style={{ opacity: 0.35, pointerEvents: 'none' }}>
                        {[
                          { name: 'Mathématiques', percent: 0 },
                          { name: 'Physique-Chimie', percent: 0 },
                          { name: 'SVT', percent: 0 },
                        ].map((item) => (
                          <div className="dashboard-score-bar-row" key={item.name}>
                            <span className="dashboard-score-bar-label">{item.name}</span>
                            <span className="dashboard-score-bar-track"><span style={{ width: '0%' }} /></span>
                            <strong>0%</strong>
                            <small>0 tentative · 0 erreur</small>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.82)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        color: '#64748b',
                        fontWeight: 600,
                      }}>
                        📊 Les performances détaillées par matière s'afficheront après vos tentatives.
                      </div>
                    </div>
                  )}
                </section>

                <div className="dashboard-score-insights">
                  <section className="dashboard-panel">
                    <span className="dashboard-section-kicker">POINT FORT</span>
                    <h2>{scoreBestGroup?.name || 'Pas encore de données'}</h2>
                    <p>{scoreBestGroup ? `Meilleure moyenne enregistrée : ${scoreBestGroup.average}% sur ${scoreBestGroup.attempts} tentative${scoreBestGroup.attempts > 1 ? 's' : ''}.` : 'Terminez un concours pour calculer vos points forts.'}</p>
                  </section>
                  <section className="dashboard-panel">
                    <span className="dashboard-section-kicker">À AMÉLIORER</span>
                    <h2>{scoreImproveGroup?.name || 'Pas encore de données'}</h2>
                    <p>{scoreImproveGroup ? `Moyenne enregistrée : ${scoreImproveGroup.average}% · ${scoreErrorGroup?.errors || 0} erreur${(scoreErrorGroup?.errors || 0) > 1 ? 's' : ''} pour ${scoreErrorGroup?.name || scoreImproveGroup.name}.` : 'Les pistes de révision apparaîtront avec vos résultats.'}</p>
                  </section>
                </div>

                <section className="dashboard-panel dashboard-score-history">
                  <div className="dashboard-panel-heading">
                    <div>
                      <span className="dashboard-section-kicker">HISTORIQUE</span>
                      <h2>Concours terminés</h2>
                    </div>
                    <span className="dashboard-week-total">{activeContestAttempts.length} résultat{activeContestAttempts.length > 1 ? 's' : ''}</span>
                  </div>
                  {activeContestAttempts.length ? (
                    <div className="dashboard-score-history-list">
                      {[...activeContestAttempts].sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt)).map((attempt) => {
                        const key = `${attempt.resourceType}|${attempt.resourceId}|${attempt.attemptId}`;
                        const open = selectedAttemptKey === key;
                        return (
                          <div className="dashboard-score-history-item" key={key}>
                            <button type="button" className="dashboard-score-history-button" aria-expanded={open} onClick={() => setSelectedAttemptKey(open ? '' : key)}>
                              <span>
                                <strong>{attempt.resourceTitle || 'Concours'}</strong>
                                <small>{[attempt.school, attempt.subject, attempt.chapter].filter(Boolean).join(' · ') || 'Matière non renseignée'} · {formatDate(attempt.answeredAt)}</small>
                              </span>
                              <b>{Math.round(Number(attempt.score) || 0)}%</b>
                              <span>{attempt.correctAnswers}/{attempt.totalQuestions} bonnes réponses</span>
                              <strong>{open ? '−' : 'Voir les détails'}</strong>
                            </button>
                            {open && (
                              <div className="dashboard-score-answer-list">
                                {(attempt.answers || []).map((answer, index) => (
                                  <article key={answer.questionId || index}>
                                    <strong>Q{answer.questionNumber || index + 1} · {answer.correct ? 'Correcte' : 'À revoir'}</strong>
                                    <span>{answer.questionText || 'Énoncé non enregistré'}</span>
                                    <small>Votre réponse : {answer.selectedChoiceText || answer.selectedChoiceLabel || '—'} · Réponse attendue : {answer.correctChoiceText || answer.correctChoiceLabel || '—'}</small>
                                  </article>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="dashboard-mode-empty">
                      Votre historique s'affichera ici dès que vous aurez validé un QCM.
                    </div>
                  )}
                </section>
              </>}
          </div>}

          {!scoreMode && <div className="dashboard-content-grid dashboard-mode-grid">
            <section className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div><span className="dashboard-section-kicker">ANALYSE</span><h2>Progression par matière</h2></div>
                <button type="button" onClick={() => navigate(DASHBOARD_SHORTCUTS.find((item) => item.mode === dashboardMode)?.path || '/client-dashboard')}>Ouvrir la section <span aria-hidden="true">{'\u2192'}</span></button>
              </div>
              {(() => {
                const chartData = sectionGroups.length
                  ? sectionGroups.map((group) => ({
                      name: group.name.length > 12 ? group.name.slice(0, 12) + '…' : group.name,
                      fullName: group.name,
                      percent: group.percent,
                      score: group.score,
                      completed: group.completed,
                      total: group.total,
                    }))
                  : [
                      { name: 'Maths', fullName: 'Mathématiques', percent: 0 },
                      { name: 'Physique', fullName: 'Physique-Chimie', percent: 0 },
                      { name: 'SVT', fullName: 'SVT', percent: 0 },
                      { name: 'Philo', fullName: 'Philosophie', percent: 0 },
                      { name: 'Anglais', fullName: 'Anglais', percent: 0 },
                    ];
                const hasData = sectionGroups.length > 0;
                const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#0284c7', '#e11d48'];
                return (
                  <>
                    <div style={{ width: '100%', height: 220, marginTop: 8, position: 'relative' }}>
                      {!hasData && (
                        <div style={{
                          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', zIndex: 2,
                          background: 'rgba(255,255,255,0.82)', borderRadius: 10,
                          gap: 6, pointerEvents: 'none',
                        }}>
                          <span style={{ fontSize: 28 }}>📊</span>
                          <strong style={{ color: '#1e3a5f', fontSize: 13 }}>Aucune donnée pour l'instant</strong>
                          <span style={{ color: '#64748b', fontSize: 12 }}>Les barres apparaîtront après vos premières consultations.</span>
                        </div>
                      )}
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                          barSize={32}
                        >
                          <CartesianGrid stroke="#e5edf7" strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickFormatter={(v) => `${v}%`}
                            width={38}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(37,99,235,0.06)', radius: 8 }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              const color = subjectStyle(d.fullName).color;
                              return (
                                <div style={{
                                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                                  padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                                  minWidth: 160,
                                }}>
                                  <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: 4, fontSize: 13 }}>{d.fullName}</div>
                                  <div style={{ color, fontWeight: 700, fontSize: 18 }}>{hasData ? `${d.percent}%` : '—'}</div>
                                  {hasData && d.total !== undefined && (
                                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                                      {d.completed}/{d.total} terminées
                                    </div>
                                  )}
                                </div>
                              );
                            }}
                          />
                          <Bar
                            dataKey="percent"
                            radius={[8, 8, 0, 0]}
                            isAnimationActive
                          >
                            {chartData.map((entry, index) => {
                              const color = subjectStyle(entry.fullName).color || COLORS[index % COLORS.length];
                              return <Cell key={index} fill={color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {hasData && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 10 }}>
                        {sectionGroups.map((group) => {
                          const s = subjectStyle(group.name);
                          return (
                            <div key={group.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: 'inline-block' }} />
                              <span>{group.name}</span>
                              <strong style={{ color: s.color }}>{group.percent}%</strong>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
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
          </>
        )}
        {activityDataError && <div className="dashboard-panel dashboard-score-empty">Vos statistiques personnelles n’ont pas pu être chargées. <button type="button" className="dashboard-inline-retry" onClick={() => { setActivityDataLoading(true); setActivityRetry((value) => value + 1); }}>Réessayer</button></div>}
        </div>
        )}
      </div>
    </div>
  );
}
