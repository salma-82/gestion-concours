import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import './ClientCourseStatsDashboard.css';
import './ClientStatsDashboardTheme.css';
import './ClientCourseStatsDashboardCompact.css';

const COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#2563eb',
  purple: '#8b5cf6',
  indigo: '#4f46e5',
  cyan: '#06b6d4',
  muted: '#94a3b8',
  slate: '#0f172a',
};

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
};

const formatShortDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short'
  }).format(d);
};

const formatSecondsToHoursAndMinutes = (totalSeconds) => {
  const sec = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours === 0 && minutes === 0 && sec > 0) return `${sec}s`;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours}h ${minutes}min`;
};

const normalizeCourseValue = (value) => String(value || '')
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase();

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

const getSubjectBadgeStyle = (subject) => {
  const norm = normalizeCourseValue(subject);
  if (norm.includes('math')) return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  if (norm.includes('phys') || norm.includes('chim') || norm === 'pc') return { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' };
  if (norm.includes('svt') || norm.includes('vie')) return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
  if (norm.includes('philo')) return { bg: '#fffbeb', color: '#2563eb', border: '#b9ccf5' };
  if (norm.includes('anglais') || norm.includes('eng')) return { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' };
  return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
};

export default function ClientCourseStatsDashboard({
  courseCatalog = [],
  courseCatalogLoading = false,
  courseCatalogError = false,
  studentActivities = [],
  user = {},
}) {
  const navigate = useNavigate();

  // --------------------------------------------------------------------------
  // 1. FILTERS STATE
  // --------------------------------------------------------------------------
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // '7', '30', '90', 'all'
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all', 'completed', 'in-progress', 'unstarted'

  // Table filters & pagination
  const [searchTable, setSearchTable] = useState('');
  const [tableSubjectFilter, setTableSubjectFilter] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('all');
  const [tableSort, setTableSort] = useState('date-desc'); // 'date-desc', 'time-desc', 'title-asc'
  const [currentPage, setCurrentPage] = useState(1);

  // Active chapter tab
  const [activeChapterTab, setActiveChapterTab] = useState('all');

  // --------------------------------------------------------------------------
  // 2. RAW COURSE ACTIVITIES FILTERING
  // --------------------------------------------------------------------------
  const allCourseActivities = useMemo(() => {
    return (studentActivities || [])
      .filter((activity) => {
        const type = String(activity.type || '').toLowerCase();
        return type === 'cours' || type === 'course';
      })
      .map((activity) => ({
        ...activity,
        rawId: String(activity.id || '').replace(/^Cours:/, ''),
        durationSec: Math.max(0, Number(activity.durationSeconds) || 0),
        visitsCount: Math.max(0, Number(activity.visits) || 0),
        lastDate: activity.lastViewedAt ? new Date(activity.lastViewedAt) : null,
        timestamp: activity.lastViewedAt ? new Date(activity.lastViewedAt).getTime() : 0,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [studentActivities]);

  // --------------------------------------------------------------------------
  // 3. CURRICULUM CATALOG FILTERING (REAL PROGRAM COVERAGE)
  // --------------------------------------------------------------------------
  const programCatalog = useMemo(() => {
    return (courseCatalog || []).filter((course) =>
      courseFiliereMatches(course.filiere, user.filiere)
    );
  }, [courseCatalog, user.filiere]);

  // Map of course activities by raw ID
  const activityByCourseId = useMemo(() => {
    const map = new Map();
    allCourseActivities.forEach((act) => {
      map.set(act.rawId, act);
    });
    return map;
  }, [allCourseActivities]);

  // Available subjects from program
  const availableSubjects = useMemo(() => {
    const set = new Set();
    programCatalog.forEach((c) => {
      if (c.matiere) set.add(c.matiere.trim());
    });
    // Also include any subjects from activities
    allCourseActivities.forEach((a) => {
      if (a.subject) set.add(a.subject.trim());
    });
    return Array.from(set).sort();
  }, [programCatalog, allCourseActivities]);

  // Available chapters from program (filtered by selected subject)
  const availableChapters = useMemo(() => {
    const set = new Set();
    const source = selectedSubject
      ? programCatalog.filter((c) => normalizeCourseValue(c.matiere) === normalizeCourseValue(selectedSubject))
      : programCatalog;

    source.forEach((c) => {
      if (c.chapitre) set.add(c.chapitre.trim());
    });
    return Array.from(set).sort();
  }, [programCatalog, selectedSubject]);

  // --------------------------------------------------------------------------
  // 4. CHAPTER LEVEL ANALYTICS (REAL CURRICULUM VS STUDENT PROGRESS)
  // --------------------------------------------------------------------------
  const programChapters = useMemo(() => {
    const chapterMap = new Map();

    programCatalog.forEach((course) => {
      const subject = String(course.matiere || 'Matière générale').trim();
      const chapter = String(course.chapitre || 'Chapitre général').trim();
      const key = `${normalizeCourseValue(subject)}|${normalizeCourseValue(chapter)}`;

      if (!chapterMap.has(key)) {
        chapterMap.set(key, {
          key,
          subject,
          name: chapter,
          courses: [],
          totalDuration: 0,
          totalVisits: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          lastViewedAt: null,
        });
      }

      const grp = chapterMap.get(key);
      const courseId = String(course.id);
      const activity = activityByCourseId.get(courseId);

      const isCompleted = Boolean(activity?.completed);
      const isStarted = Boolean(activity && (activity.visitsCount > 0 || activity.durationSec > 0));
      const duration = activity ? activity.durationSec : 0;
      const visits = activity ? activity.visitsCount : 0;

      grp.courses.push({
        ...course,
        courseId,
        completed: isCompleted,
        started: isStarted,
        duration,
        visits,
        lastViewedAt: activity?.lastViewedAt || null,
      });

      grp.totalDuration += duration;
      grp.totalVisits += visits;
      if (isCompleted) grp.completedCourses += 1;
      else if (isStarted) grp.inProgressCourses += 1;

      if (activity?.lastViewedAt) {
        if (!grp.lastViewedAt || new Date(activity.lastViewedAt) > new Date(grp.lastViewedAt)) {
          grp.lastViewedAt = activity.lastViewedAt;
        }
      }
    });

    return Array.from(chapterMap.values()).map((ch) => {
      const totalCourses = ch.courses.length;
      const percent = totalCourses > 0 ? Math.round((ch.completedCourses / totalCourses) * 100) : 0;
      const isValidated = totalCourses > 0 && ch.completedCourses === totalCourses;
      const isStarted = ch.completedCourses > 0 || ch.inProgressCourses > 0;
      const status = isValidated ? 'completed' : isStarted ? 'in-progress' : 'unstarted';

      return {
        ...ch,
        totalCourses,
        percent,
        isValidated,
        isStarted,
        status,
      };
    }).sort((a, b) => a.subject.localeCompare(b.subject) || a.name.localeCompare(b.name));
  }, [programCatalog, activityByCourseId]);

  // --------------------------------------------------------------------------
  // 5. APPLY USER FILTERS TO CHAPTERS AND ACTIVITIES
  // --------------------------------------------------------------------------
  const filteredChapters = useMemo(() => {
    return programChapters.filter((ch) => {
      if (selectedSubject && normalizeCourseValue(ch.subject) !== normalizeCourseValue(selectedSubject)) return false;
      if (selectedChapter && normalizeCourseValue(ch.name) !== normalizeCourseValue(selectedChapter)) return false;
      if (selectedStatus !== 'all' && ch.status !== selectedStatus) return false;
      return true;
    });
  }, [programChapters, selectedSubject, selectedChapter, selectedStatus]);

  const filteredActivities = useMemo(() => {
    const now = Date.now();
    return allCourseActivities.filter((act) => {
      if (selectedSubject && normalizeCourseValue(act.subject) !== normalizeCourseValue(selectedSubject)) return false;
      if (selectedChapter && normalizeCourseValue(act.chapter) !== normalizeCourseValue(selectedChapter)) return false;
      if (selectedStatus === 'completed' && !act.completed) return false;
      if (selectedStatus === 'in-progress' && (act.completed || act.visitsCount === 0)) return false;
      if (selectedStatus === 'unstarted' && act.visitsCount > 0) return false;

      // Period filter
      if (selectedPeriod !== 'all') {
        const days = Number(selectedPeriod);
        if (!act.timestamp || now - act.timestamp > days * 86400000) return false;
      }
      return true;
    });
  }, [allCourseActivities, selectedSubject, selectedChapter, selectedStatus, selectedPeriod]);

  // --------------------------------------------------------------------------
  // 6. STATISTICAL KPIS
  // --------------------------------------------------------------------------
  const kpiStats = useMemo(() => {
    const totalConsulted = allCourseActivities.filter(a => a.visitsCount > 0).length;
    const chaptersStudiedCount = programChapters.filter(ch => ch.isStarted).length;
    const totalProgramChapters = programChapters.length;
    const subjectsStartedCount = new Set(allCourseActivities.filter(a => a.visitsCount > 0).map(a => normalizeCourseValue(a.subject))).size;
    const totalSeconds = allCourseActivities.reduce((sum, a) => sum + a.durationSec, 0);
    const completedCoursesCount = allCourseActivities.filter((activity) => activity.completed).length;

    const validatedChaptersCount = programChapters.filter(ch => ch.isValidated).length;

    // Last activity
    const lastActivity = allCourseActivities[0] || null;

    return {
      totalConsulted,
      chaptersStudiedCount,
      totalProgramChapters,
      validatedChaptersCount,
      subjectsStartedCount,
      totalSeconds,
      completedCoursesCount,
      formattedTime: formatSecondsToHoursAndMinutes(totalSeconds),
      lastActivity,
    };
  }, [allCourseActivities, programChapters]);


  // --------------------------------------------------------------------------
  // 8. CHART 1: ÉVOLUTION DU TEMPS CONSACRÉ AUX COURS (DAILY STUDY TIME)
  // --------------------------------------------------------------------------
  const studyTimeTrendData = useMemo(() => {
    const daysCount = selectedPeriod === '7' ? 7 : selectedPeriod === '30' ? 30 : selectedPeriod === '90' ? 90 : 14;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const list = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      let seconds = 0;
      filteredActivities.forEach((act) => {
        if (act.durationByDay && act.durationByDay[dayKey]) {
          seconds += Number(act.durationByDay[dayKey]) || 0;
        }
      });

      const hours = Number((seconds / 3600).toFixed(2));
      const minutes = Math.round(seconds / 60);

      list.push({
        dateKey: dayKey,
        label: new Intl.DateTimeFormat('fr-FR', {
          day: 'numeric',
          month: daysCount > 14 ? 'numeric' : 'short'
        }).format(d),
        hours,
        minutes,
        seconds,
      });
    }

    return list;
  }, [filteredActivities, selectedPeriod]);

  // --------------------------------------------------------------------------
  // 9. CHART 2: PROGRESSION DE L'APPRENTISSAGE PAR MATIÈRE
  // --------------------------------------------------------------------------
  const subjectProgressData = useMemo(() => {
    const map = new Map();

    programChapters.forEach((ch) => {
      const sub = ch.subject;
      if (!map.has(sub)) {
        map.set(sub, {
          subject: sub,
          totalChapters: 0,
          validatedChapters: 0,
          totalCourses: 0,
          completedCourses: 0,
          totalSeconds: 0,
        });
      }
      const entry = map.get(sub);
      entry.totalChapters += 1;
      if (ch.isValidated) entry.validatedChapters += 1;
      entry.totalCourses += ch.totalCourses;
      entry.completedCourses += ch.completedCourses;
      entry.totalSeconds += ch.totalDuration;
    });

    return Array.from(map.values()).map((entry) => {
      const chapterRate = entry.totalChapters > 0
        ? Math.round((entry.validatedChapters / entry.totalChapters) * 100)
        : 0;
      const courseRate = entry.totalCourses > 0
        ? Math.round((entry.completedCourses / entry.totalCourses) * 100)
        : 0;
      const hours = Number((entry.totalSeconds / 3600).toFixed(1));

      return {
        subject: entry.subject,
        chapterRate,
        courseRate,
        hours,
        validated: entry.validatedChapters,
        total: entry.totalChapters,
      };
    }).sort((a, b) => b.chapterRate - a.chapterRate || b.hours - a.hours);
  }, [programChapters]);

  // --------------------------------------------------------------------------
  // 10. CHART 3: RÉPARTITION DES CHAPITRES (DOUGHNUT)
  // --------------------------------------------------------------------------
  const chaptersDistributionData = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let unstarted = 0;

    filteredChapters.forEach((ch) => {
      if (ch.status === 'completed') completed += 1;
      else if (ch.status === 'in-progress') inProgress += 1;
      else unstarted += 1;
    });

    return [
      { name: 'Chapitres validés', value: completed, color: COLORS.success },
      { name: 'En cours', value: inProgress, color: COLORS.primary },
      { name: 'Non commencés', value: unstarted, color: COLORS.muted },
    ].filter(d => d.value > 0);
  }, [filteredChapters]);

  const totalFilteredChaptersCount = useMemo(() => {
    return filteredChapters.length;
  }, [filteredChapters]);

  // --------------------------------------------------------------------------
  // 11. CHART 4: COMPARAISON DU TEMPS D'ÉTUDE ENTRE LES MATIÈRES (BAR CHART)
  // --------------------------------------------------------------------------
  const subjectTimeComparisonData = useMemo(() => {
    return subjectProgressData
      .filter((s) => s.hours > 0)
      .map((s) => ({
        subject: s.subject,
        hours: s.hours,
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [subjectProgressData]);

  // --------------------------------------------------------------------------
  // 12. PERFORMANCE INSIGHTS (STRENGTHS & TO IMPROVE)
  // --------------------------------------------------------------------------
  const insights = useMemo(() => {
    // Most studied subjects
    const mostStudiedSubjects = [...subjectProgressData]
      .filter(s => s.hours > 0 || s.validated > 0)
      .slice(0, 3);

    // Subjects needing attention (0% or low coverage in program)
    const attentionSubjects = [...subjectProgressData]
      .filter(s => s.chapterRate < 50)
      .sort((a, b) => a.chapterRate - b.chapterRate)
      .slice(0, 3);

    // Most viewed chapters
    const mostViewedChapters = [...programChapters]
      .filter(ch => ch.totalVisits > 0 || ch.totalDuration > 0)
      .sort((a, b) => b.totalDuration - a.totalDuration || b.totalVisits - a.totalVisits)
      .slice(0, 4);

    // Unstarted chapters to begin
    const unstartedChapters = programChapters
      .filter(ch => ch.status === 'unstarted')
      .slice(0, 4);

    return {
      mostStudiedSubjects,
      attentionSubjects,
      mostViewedChapters,
      unstartedChapters,
    };
  }, [subjectProgressData, programChapters]);

  // --------------------------------------------------------------------------
  // 13. DETAILED CHAPTERS FOR PROGRESS BARS (WITH TABS)
  // --------------------------------------------------------------------------
  const tabChaptersList = useMemo(() => {
    if (activeChapterTab === 'all') return programChapters;
    return programChapters.filter(ch => normalizeCourseValue(ch.subject) === normalizeCourseValue(activeChapterTab));
  }, [programChapters, activeChapterTab]);

  // --------------------------------------------------------------------------
  // 14. TABLE DATA & PAGINATION (HISTORIQUE DES SESSIONS D'APPRENTISSAGE)
  // --------------------------------------------------------------------------
  const sessionsTableData = useMemo(() => {
    let list = [...allCourseActivities];

    // Search query
    if (searchTable.trim()) {
      const q = searchTable.toLowerCase().trim();
      list = list.filter(item =>
        String(item.title || '').toLowerCase().includes(q)
        || String(item.subject || '').toLowerCase().includes(q)
        || String(item.chapter || '').toLowerCase().includes(q)
      );
    }

    // Table subject filter
    if (tableSubjectFilter) {
      list = list.filter(item => normalizeCourseValue(item.subject) === normalizeCourseValue(tableSubjectFilter));
    }

    // Table status filter
    if (tableStatusFilter !== 'all') {
      if (tableStatusFilter === 'completed') list = list.filter(item => item.completed);
      else if (tableStatusFilter === 'in-progress') list = list.filter(item => !item.completed && item.visitsCount > 0);
      else if (tableStatusFilter === 'unstarted') list = list.filter(item => item.visitsCount === 0);
    }

    // Sorting
    list.sort((a, b) => {
      if (tableSort === 'time-desc') return b.durationSec - a.durationSec;
      if (tableSort === 'title-asc') return String(a.title || '').localeCompare(String(b.title || ''));
      // Default: date-desc
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    return list;
  }, [allCourseActivities, searchTable, tableSubjectFilter, tableStatusFilter, tableSort]);

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(sessionsTableData.length / itemsPerPage));
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sessionsTableData.slice(start, start + itemsPerPage);
  }, [sessionsTableData, currentPage]);

  // --------------------------------------------------------------------------
  // RENDER EMPTY STATE IF NO CATALOG AND NO ACTIVITY
  // --------------------------------------------------------------------------
  if (allCourseActivities.length === 0 && programCatalog.length === 0 && !courseCatalogLoading) {
    return (
      <div className="course-stats-root">
        <section className="course-stats-header">
          <div className="course-stats-header-top">
            <div>
              <div className="course-title-lockup">
                <div><h1 className="course-stats-title">Suivi pédagogique du Bac</h1></div>
              </div>
              <span className="course-stats-eyebrow">DASHBOARD COURS</span>
            </div>
          </div>
        </section>

        <div className="course-empty-state">
          <div className="course-empty-icon">📖</div>
          <h3>Aucun cours consulté pour le moment</h3>
          <p>
            Vos statistiques d'apprentissage, votre temps de travail et votre couverture du programme s'afficheront ici dès que vous aurez ouvert votre premier cours.
          </p>
          <button
            type="button"
            className="course-empty-btn"
            onClick={() => navigate('/client-cours')}
          >
            Accéder aux cours du Bac &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-stats-root">
      {/* --------------------------------------------------------------------
         1. HERO HEADER & FILTERS
         -------------------------------------------------------------------- */}
      <section className="course-stats-header">
        <div className="course-stats-header-top">
          <div>
            <span className="course-stats-eyebrow">SUIVI PÉDAGOGIQUE DU BAC</span>
          </div>
        </div>

        <div className="course-title-lockup">
          <div><h1 className="course-stats-title">Suivi pédagogique du Bac</h1></div>
        </div>

        {/* Filters Bar */}
        <div className="course-stats-filters-bar">
          {/* Matière */}
          <div className="course-filter-field">
            <label>Matière</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedChapter('');
              }}
            >
              <option value="">Toutes les matières</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Chapitre */}
          <div className="course-filter-field">
            <label>Chapitre</label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
            >
              <option value="">Tous les chapitres</option>
              {availableChapters.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          {/* Période */}
          <div className="course-filter-field">
            <label>Période</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="all">Toute la période</option>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">3 derniers mois</option>
            </select>
          </div>

          {/* Statut */}
          <div className="course-filter-field">
            <label>Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Chapitres terminés</option>
              <option value="in-progress">En cours d'étude</option>
              <option value="unstarted">Non commencés</option>
            </select>
          </div>

        </div>
      </section>

      {/* --------------------------------------------------------------------
         3. 6 KPI STAT CARDS
         -------------------------------------------------------------------- */}
      <section className="course-kpi-grid">
        {/* Card 1: Cours consultés */}
        <div className="course-kpi-card">
          <div className="course-kpi-top">
            <div className="course-kpi-icon blue">📖</div>
            <span className="course-kpi-badge is-neutral">Actifs</span>
          </div>
          <div className="course-kpi-main">
            <span className="course-kpi-value">{kpiStats.totalConsulted}</span>
            <span className="course-kpi-title">Cours consultés</span>
          </div>
          <span className="course-kpi-note">Ressources distinctes ouvertes</span>
        </div>

        {/* Card 2: Chapitres étudiés */}
        <div className="course-kpi-card">
          <div className="course-kpi-top">
            <div className="course-kpi-icon indigo">📑</div>
            <span className="course-kpi-badge is-highlight">Programme</span>
          </div>
          <div className="course-kpi-main">
            <span className="course-kpi-value">
              {kpiStats.validatedChaptersCount} / {kpiStats.totalProgramChapters}
            </span>
            <span className="course-kpi-title">Chapitres validés</span>
          </div>
          <span className="course-kpi-note">{kpiStats.chaptersStudiedCount} chapitres entamés</span>
        </div>

        {/* Card 3: Matières commencées */}
        <div className="course-kpi-card">
          <div className="course-kpi-top">
            <div className="course-kpi-icon purple">🎓</div>
            <span className="course-kpi-badge is-neutral">Disciplines</span>
          </div>
          <div className="course-kpi-main">
            <span className="course-kpi-value">{kpiStats.subjectsStartedCount}</span>
            <span className="course-kpi-title">Matières étudiées</span>
          </div>
          <span className="course-kpi-note">Sur {availableSubjects.length} matières du Bac</span>
        </div>

        {/* Card 4: Temps total passé */}
        <div className="course-kpi-card">
          <div className="course-kpi-top">
            <div className="course-kpi-icon amber">⏱️</div>
            <span className="course-kpi-badge is-neutral">Visible</span>
          </div>
          <div className="course-kpi-main">
            <span className="course-kpi-value">{kpiStats.formattedTime}</span>
            <span className="course-kpi-title">Temps de travail</span>
          </div>
          <span className="course-kpi-note">Durée mesurée dans le lecteur</span>
        </div>

        {/* Card 5: Cours terminés */}
        <div className="course-kpi-card">
          <div className="course-kpi-top">
            <div className="course-kpi-icon green">🎯</div>
            <span className="course-kpi-badge is-up">Global</span>
          </div>
          <div className="course-kpi-main">
            <span className="course-kpi-value">{kpiStats.completedCoursesCount}</span>
            <span className="course-kpi-title">Cours terminés</span>
          </div>
          <span className="course-kpi-note">Cours marqués comme terminés</span>
        </div>

        {/* Card 6: Dernière activité */}
        <div className="course-kpi-card">
          <div className="course-kpi-top">
            <div className="course-kpi-icon cyan">🕒</div>
            <span className="course-kpi-badge is-neutral">Récents</span>
          </div>
          <div className="course-kpi-main">
            <span className="course-kpi-value" style={{ fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>
              {kpiStats.lastActivity?.lastDate ? formatShortDate(kpiStats.lastActivity.lastDate) : '—'}
            </span>
            <span className="course-kpi-title">Dernière activité</span>
          </div>
          <span className="course-kpi-note" title={kpiStats.lastActivity?.title || 'Aucun cours'}>
            {kpiStats.lastActivity?.title || 'Aucune activité récente'}
          </span>
        </div>
      </section>

      {/* --------------------------------------------------------------------
         4. CHARTS ROW 1: ÉVOLUTION DU TEMPS (LINE CHART) & RÉPARTITION (DOUGHNUT)
         -------------------------------------------------------------------- */}
      <div className="course-grid-row">
        {/* Line Chart: Évolution du temps (Span 8) */}
        <div className="course-panel-card course-col-8">
          <div className="course-panel-header">
            <div className="course-panel-heading-copy">
              <span className="course-panel-kicker">CHRONOLOGIE DU TRAVAIL</span>
              <h2 className="course-panel-title">Évolution du temps consacré aux cours</h2>
              <p className="course-panel-subtitle">Heures d'apprentissage par jour sur la période sélectionnée</p>
            </div>
            <span className="course-count-badge">
              {studyTimeTrendData.reduce((s, d) => s + d.hours, 0).toFixed(1)} h au total
            </span>
          </div>

          <div className="course-panel-body" style={{ minHeight: 205 }}>
            <ResponsiveContainer width="100%" height={205}>
              <AreaChart data={studyTimeTrendData} margin={{ top: 10, right: 12, left: 4, bottom: 12 }}>
                <defs>
                  <linearGradient id="courseTimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b9ccf5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#b9ccf5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10.5} tickLine={false} tickMargin={6} minTickGap={20} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10.5}
                  width={48}
                  tickLine={false}
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div style={{
                          background: 'var(--surface, #ffffff)',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border, #e2e8f0)',
                          boxShadow: 'var(--shadow-sm, 0 4px 18px rgba(15,23,42,0.1))',
                          fontSize: '12.5px'
                        }}>
                          <div style={{ fontWeight: 800, color: 'var(--text, #0f172a)' }}>{d.dateKey}</div>
                          <div style={{ color: 'var(--primary, #2563eb)', fontWeight: 850, marginTop: 4, fontSize: '14px' }}>
                            {d.hours} h ({d.minutes} min)
                          </div>
                          <div style={{ color: 'var(--text-secondary, #64748b)', fontSize: '11px', marginTop: 2 }}>
                            Temps mesuré lecteur actif
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#b9ccf5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#courseTimeGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart: Répartition des chapitres (Span 4) */}
        <div className="course-panel-card course-col-4">
          <div className="course-panel-header">
            <div className="course-panel-heading-copy">
              <span className="course-panel-kicker">AVANCEMENT</span>
              <h2 className="course-panel-title">Répartition des chapitres</h2>
              <p className="course-panel-subtitle">État d'avancement du programme</p>
            </div>
          </div>

          <div className="course-panel-body">
            <div className="course-donut-wrapper">
              <div className="course-donut-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chaptersDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="62%"
                      outerRadius="88%"
                      paddingAngle={3}
                      stroke="none"
                    >
                      {chaptersDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${value} chapitres (${Math.round((value / Math.max(1, totalFilteredChaptersCount)) * 100)}%)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="course-donut-center-label">
                  <strong>{totalFilteredChaptersCount}</strong>
                  <span>CHAPITRES</span>
                </div>
              </div>

              {/* Legend */}
              <div className="course-donut-legend-list">
                {chaptersDistributionData.map((item) => {
                  const pct = totalFilteredChaptersCount > 0
                    ? Math.round((item.value / totalFilteredChaptersCount) * 100)
                    : 0;
                  return (
                    <div key={item.name} className="course-donut-legend-item">
                      <div className="course-donut-legend-left">
                        <span className="course-donut-legend-dot" style={{ background: item.color }} />
                        <span className="course-donut-legend-name">{item.name}</span>
                      </div>
                      <div className="course-donut-legend-right">
                        <span className="course-donut-legend-count">{item.value}</span>
                        <span className="course-donut-legend-pct">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
         5. CHARTS ROW 2: PROGRESSION PAR MATIÈRE & TEMPS PAR MATIÈRE
         -------------------------------------------------------------------- */}
      <div className="course-grid-row">
        {/* Progression de l'apprentissage par matière (Span 6) */}
        <div className="course-panel-card course-col-6">
          <div className="course-panel-header">
            <div className="course-panel-heading-copy">
              <span className="course-panel-kicker">DISCIPLINES</span>
              <h2 className="course-panel-title">Progression par matière</h2>
              <p className="course-panel-subtitle">Taux de couverture du programme pour chaque matière du Bac</p>
            </div>
          </div>

          <div className="course-panel-body" style={{ minHeight: 220 }}>
            {subjectProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={subjectProgressData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11.5} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="subject" stroke="#334155" fontSize={12.5} fontWeight={700} width={120} tickLine={false} />
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val}% (${item.payload.validated}/${item.payload.total} chapitres)`,
                      'Taux validé'
                    ]}
                  />
                  <Bar dataKey="chapterRate" name="Taux validé" fill="#b9ccf5" radius={[0, 6, 6, 0]} barSize={18}>
                    {subjectProgressData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.chapterRate >= 70 ? '#10b981' : entry.chapterRate >= 30 ? '#b9ccf5' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="course-empty-state" style={{ padding: '24px' }}>
                <p>Aucune matière disponible pour cette filière.</p>
              </div>
            )}
          </div>
        </div>

        {/* Comparaison du temps d'étude entre les matières (Span 6) */}
        <div className="course-panel-card course-col-6">
          <div className="course-panel-header">
            <div className="course-panel-heading-copy">
              <span className="course-panel-kicker">RÉPARTITION DU TEMPS</span>
              <h2 className="course-panel-title">Temps d'étude par matière</h2>
              <p className="course-panel-subtitle">Comparaison des heures consacrées à chaque matière</p>
            </div>
            <span className="course-count-badge">Temps réel</span>
          </div>

          <div className="course-panel-body" style={{ minHeight: 220 }}>
            {subjectTimeComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subjectTimeComparisonData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="subject" stroke="#334155" fontSize={11.5} fontWeight={700} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11.5} tickLine={false} tickFormatter={(v) => `${v}h`} />
                  <Tooltip
                    formatter={(val) => [`${val} heures passées`, 'Temps d’étude']}
                  />
                  <Bar dataKey="hours" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={34}>
                    {subjectTimeComparisonData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#b9ccf5', '#7c3aed', '#059669', '#b9ccf5', '#0891b2'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="course-empty-state" style={{ padding: '24px' }}>
                <p>Le temps d'étude par matière s'affichera dès que vous aurez ouvert vos cours.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
         6. ANALYSE DES PERFORMANCES (MATIÈRES ÉTUDIÉES VS ATTENTION)
         -------------------------------------------------------------------- */}
      <section className="course-insights-grid">
        {/* Matières les plus étudiées */}
        <div className="course-insight-card is-strength">
          <div className="course-insight-head">
            <div className="course-insight-head-text">
              <h3>Matières les plus étudiées</h3>
              <p>Disciplines où votre investissement en temps est le plus fort</p>
            </div>
          </div>
          <div className="course-insight-list">
            {insights.mostStudiedSubjects.length > 0 ? (
              insights.mostStudiedSubjects.map((s) => (
                <div key={s.subject} className="course-insight-item">
                  <div className="course-insight-item-title">
                    <span className="course-insight-dot" />
                    <span>{s.subject}</span>
                  </div>
                  <span className="course-insight-item-score">
                    {s.hours} h • {s.chapterRate}% validé
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', padding: '10px 0' }}>
                Commencez vos révisions pour voir vos matières principales ici.
              </div>
            )}
          </div>
        </div>

        {/* Matières nécessitant de l'attention */}
        <div className="course-insight-card is-improvement">
          <div className="course-insight-head">
            <div className="course-insight-head-text">
              <h3>Matières à prioriser</h3>
              <p>Matières du programme avec le moins d'avancement</p>
            </div>
          </div>
          <div className="course-insight-list">
            {insights.attentionSubjects.length > 0 ? (
              insights.attentionSubjects.map((s) => (
                <div key={s.subject} className="course-insight-item">
                  <div className="course-insight-item-title">
                    <span className="course-insight-dot" />
                    <span>{s.subject}</span>
                  </div>
                  <span className="course-insight-item-score">
                    {s.validated}/{s.total} chapitres ({s.chapterRate}%)
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', padding: '10px 0' }}>
                Félicitations ! Toutes les matières de votre filière sont avancées.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
         7. DETAILED PROGRESSION BY CHAPTER (WITH TABS)
         -------------------------------------------------------------------- */}
      <div className="course-grid-row">
        <div className="course-panel-card course-col-12">
          <div className="course-panel-header">
            <div className="course-panel-heading-copy">
              <span className="course-panel-kicker">PROGRAMME OFFICIEL</span>
              <h2 className="course-panel-title">Progression par chapitre</h2>
              <p className="course-panel-subtitle">Détail de validation des chapitres de cours disponibles pour votre filière</p>
            </div>
            <span className="course-count-badge">{tabChaptersList.length} chapitres</span>
          </div>

          <div className="course-panel-body">
            {/* Subject Tabs */}
            <div className="course-tabs-pills">
              <button
                type="button"
                className={`course-tab-pill ${activeChapterTab === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveChapterTab('all')}
              >
                Tous les chapitres
              </button>
              {availableSubjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  className={`course-tab-pill ${activeChapterTab === sub ? 'is-active' : ''}`}
                  onClick={() => setActiveChapterTab(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Chapter progress list */}
            <div className="course-chapter-list">
              {tabChaptersList.length > 0 ? (
                tabChaptersList.map((ch) => {
                  const badgeClass = ch.isValidated
                    ? 'is-validated'
                    : ch.isStarted
                    ? 'is-progress'
                    : 'is-empty';
                  const fillColor = ch.isValidated
                    ? '#10b981'
                    : ch.isStarted
                    ? '#b9ccf5'
                    : '#cbd5e1';

                  return (
                    <div key={ch.key} className="course-chapter-item">
                      <div className="course-chapter-header">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="course-chapter-name">{ch.name}</span>
                          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                            {ch.subject} • {ch.completedCourses} sur {ch.totalCourses} cours validés
                          </span>
                        </div>

                        <div className="course-chapter-metrics">
                          {ch.totalDuration > 0 && (
                            <span>{formatSecondsToHoursAndMinutes(ch.totalDuration)}</span>
                          )}
                          <span className={`course-chapter-score-pill ${badgeClass}`}>
                            {ch.isValidated ? '✓ Validé' : ch.isStarted ? `${ch.percent}%` : 'Non commencé'}
                          </span>
                        </div>
                      </div>

                      <div className="course-chapter-track">
                        <div
                          className="course-chapter-fill"
                          style={{
                            width: `${Math.max(ch.isStarted ? 6 : 0, ch.percent)}%`,
                            background: fillColor
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="course-empty-state" style={{ padding: '24px' }}>
                  <p>Aucun chapitre trouvé pour cette sélection.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
         8. SESSIONS HISTORY & RECENT COURSES TABLE
         -------------------------------------------------------------------- */}
      <div className="course-grid-row">
        <div className="course-panel-card course-col-12">
          <div className="course-panel-header">
            <div className="course-panel-heading-copy">
              <span className="course-panel-kicker">HISTORIQUE D'APPRENTISSAGE</span>
              <h2 className="course-panel-title">Historique des sessions d'apprentissage</h2>
              <p className="course-panel-subtitle">Suivi chronologique des cours consultés, temps consacré et état de complétion</p>
            </div>
            <span className="course-count-badge">{sessionsTableData.length} cours</span>
          </div>

          <div className="course-panel-body">
            {/* Table toolbar */}
            <div className="course-table-toolbar">
              <input
                type="text"
                className="course-search-input"
                placeholder="Rechercher un cours ou un chapitre..."
                value={searchTable}
                onChange={(e) => {
                  setSearchTable(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <div className="course-table-filters">
                <select
                  className="course-table-select"
                  value={tableSubjectFilter}
                  onChange={(e) => {
                    setTableSubjectFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Toutes les matières</option>
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  className="course-table-select"
                  value={tableStatusFilter}
                  onChange={(e) => {
                    setTableStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="completed">Terminés</option>
                  <option value="in-progress">En cours</option>
                </select>

                <select
                  className="course-table-select"
                  value={tableSort}
                  onChange={(e) => {
                    setTableSort(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="date-desc">Plus récents d'abord</option>
                  <option value="time-desc">Plus de temps passé</option>
                  <option value="title-asc">Titre alphabétique</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {paginatedSessions.length > 0 ? (
              <div className="course-table-container">
                <table className="course-table">
                  <thead>
                    <tr>
                      <th>Titre du cours</th>
                      <th>Matière</th>
                      <th>Chapitre</th>
                      <th>Temps passé</th>
                      <th>Visites</th>
                      <th>Dernière consultation</th>
                      <th>Statut</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSessions.map((session) => {
                      const badgeStyle = getSubjectBadgeStyle(session.subject);
                      const isDone = session.completed;

                      return (
                        <tr key={session.id || session.rawId}>
                          <td>
                            <strong style={{ color: '#0f172a', display: 'block', fontSize: '13.5px' }}>
                              {session.title || 'Cours sans titre'}
                            </strong>
                          </td>
                          <td>
                            <span
                              className="course-subject-badge"
                              style={{ background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}` }}
                            >
                              {session.subject || 'Général'}
                            </span>
                          </td>
                          <td style={{ color: '#475569', fontSize: '12.5px' }}>
                            {session.chapter || '—'}
                          </td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>
                              {formatSecondsToHoursAndMinutes(session.durationSec)}
                            </strong>
                          </td>
                          <td style={{ color: '#64748b' }}>
                            {session.visitsCount} consultation{session.visitsCount > 1 ? 's' : ''}
                          </td>
                          <td style={{ color: '#64748b', fontSize: '12px' }}>
                            {formatDate(session.lastViewedAt)}
                          </td>
                          <td>
                            {isDone ? (
                              <span className="course-status-pill completed">✓ Terminé</span>
                            ) : (
                              <span className="course-status-pill in-progress">En cours</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="course-view-link-btn"
                              onClick={() => navigate(`/client-cours?matiere=${encodeURIComponent(session.subject || '')}`)}
                            >
                              Accéder au cours &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="course-empty-state" style={{ padding: '30px' }}>
                <p>Aucune session d'apprentissage trouvée pour cette recherche.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="course-pagination">
                <span className="course-pagination-info">
                  Page {currentPage} sur {totalPages} ({sessionsTableData.length} cours)
                </span>
                <div className="course-pagination-controls">
                  <button
                    type="button"
                    className="course-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    &larr; Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`course-page-btn ${p === currentPage ? 'is-active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="course-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Suivant &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

