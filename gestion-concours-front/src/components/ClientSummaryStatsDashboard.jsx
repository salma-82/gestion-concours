import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import { filterByStudentPack } from '../packAccess';
import './ClientSummaryStatsDashboard.css';
import './ClientStatsDashboardTheme.css';

const API_BASE = '';

const COLORS = {
  purple: '#7c3aed',
  primary: '#2563eb',
  success: '#10b981',
  danger: '#ef4444',
  amber: '#f59e0b',
  rose: '#e11d48',
  cyan: '#0891b2',
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

const normalizeSubject = (val) => {
  const norm = String(val || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (norm.includes('math')) return 'Mathématiques';
  if (norm.includes('phys') || norm.includes('chim') || norm === 'pc') return 'Physique-Chimie';
  if (norm.includes('svt') || norm.includes('vie')) return 'SVT';
  return String(val || 'Autre').trim();
};

const getSubjectBadgeStyle = (subject) => {
  const norm = normalizeSubject(subject);
  if (norm === 'Mathématiques') return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  if (norm === 'Physique-Chimie') return { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' };
  if (norm === 'SVT') return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
  return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
};

export default function ClientSummaryStatsDashboard({
  studentActivities = [],
  user = {},
}) {
  const navigate = useNavigate();

  // --------------------------------------------------------------------------
  // 1. STATE & FILTERS
  // --------------------------------------------------------------------------
  const [resumesCatalog, setResumesCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);

  // Favorites state persisted in localStorage
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const stored = localStorage.getItem('econcours_resume_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id) => {
    const strId = String(id);
    let updated;
    if (favoriteIds.includes(strId)) {
      updated = favoriteIds.filter((item) => item !== strId);
    } else {
      updated = [...favoriteIds, strId];
    }
    setFavoriteIds(updated);
    try {
      localStorage.setItem('econcours_resume_favorites', JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new Event('resume-favorites-updated'));
  };

  // Filters state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // '7', '30', '90', 'all'
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all', 'viewed', 'completed', 'favorite', 'unviewed'

  // Table filters & pagination
  const [searchTable, setSearchTable] = useState('');
  const [tableSubjectFilter, setTableSubjectFilter] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('all');
  const [tableSort, setTableSort] = useState('date-desc'); // 'date-desc', 'time-desc', 'title-asc'
  const [currentPage, setCurrentPage] = useState(1);

  // --------------------------------------------------------------------------
  // 2. FETCH RESUMES CATALOG
  // --------------------------------------------------------------------------
  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    axios.get(`${API_BASE}/api/resumes`)
      .then(({ data }) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : (data?.value || data?.resumes || []);
        const filtered = filterByStudentPack(Array.isArray(list) ? list : [], 'ecole', true);
        setResumesCatalog(filtered);
        setCatalogError(false);
      })
      .catch(() => {
        if (active) setCatalogError(true);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => { active = false; };
  }, []);

  // --------------------------------------------------------------------------
  // 3. RAW RESUMES ACTIVITIES FILTERING
  // --------------------------------------------------------------------------
  const allResumeActivities = useMemo(() => {
    return (studentActivities || [])
      .filter((activity) => {
        const type = String(activity.type || '').toLowerCase();
        return type === 'résumé' || type === 'resume' || type === 'fiche';
      })
      .map((activity) => ({
        ...activity,
        rawId: String(activity.id || '').replace(/^Résumé:/, ''),
        normalizedSubject: normalizeSubject(activity.subject),
        durationSec: Math.max(0, Number(activity.durationSeconds) || 0),
        visitsCount: Math.max(0, Number(activity.visits) || 0),
        lastDate: activity.lastViewedAt ? new Date(activity.lastViewedAt) : null,
        timestamp: activity.lastViewedAt ? new Date(activity.lastViewedAt).getTime() : 0,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [studentActivities]);

  // Map activities by rawId
  const activityMap = useMemo(() => {
    const map = new Map();
    allResumeActivities.forEach((act) => {
      map.set(act.rawId, act);
    });
    return map;
  }, [allResumeActivities]);

  // Combined fiches catalog (merging available resumes with activity status)
  const allCombinedResumes = useMemo(() => {
    // If catalog is loaded, use catalog items
    if (resumesCatalog.length > 0) {
      return resumesCatalog.map((r) => {
        const id = String(r.id);
        const act = activityMap.get(id);
        const isFav = favoriteIds.includes(id);
        const visits = act ? act.visitsCount : 0;
        const duration = act ? act.durationSec : 0;
        const isCompleted = Boolean(act?.completed);
        const isViewed = visits > 0 || duration > 0;

        return {
          id,
          title: r.titre || r.title || 'Fiche de résumé',
          subject: normalizeSubject(r.matiere),
          chapter: (r.chapitre || 'Général').trim(),
          description: r.description || '',
          pdfUrl: r.pdfUrl || '',
          htmlUrl: r.htmlUrl || '',
          visits,
          duration,
          isCompleted,
          isViewed,
          isFavorite: isFav,
          lastViewedAt: act?.lastViewedAt || null,
          timestamp: act ? act.timestamp : 0,
          durationByDay: act?.durationByDay || {},
        };
      });
    }

    // Fallback: build from recorded activities if catalog is empty or failing
    return allResumeActivities.map((act) => {
      const id = String(act.rawId);
      const isFav = favoriteIds.includes(id);
      return {
        id,
        title: act.title || 'Fiche de résumé',
        subject: act.normalizedSubject,
        chapter: (act.chapter || 'Général').trim(),
        description: '',
        pdfUrl: '',
        htmlUrl: '',
        visits: act.visitsCount,
        duration: act.durationSec,
        isCompleted: act.completed,
        isViewed: true,
        isFavorite: isFav,
        lastViewedAt: act.lastViewedAt,
        timestamp: act.timestamp,
        durationByDay: act.durationByDay || {},
      };
    });
  }, [resumesCatalog, activityMap, favoriteIds, allResumeActivities]);

  // Dropdown options
  const availableSubjects = useMemo(() => {
    const set = new Set();
    allCombinedResumes.forEach((r) => {
      if (r.subject) set.add(r.subject);
    });
    return Array.from(set).sort();
  }, [allCombinedResumes]);

  const availableChapters = useMemo(() => {
    const filtered = selectedSubject
      ? allCombinedResumes.filter((r) => r.subject === selectedSubject)
      : allCombinedResumes;
    const set = new Set();
    filtered.forEach((r) => {
      if (r.chapter) set.add(r.chapter);
    });
    return Array.from(set).sort();
  }, [allCombinedResumes, selectedSubject]);

  // --------------------------------------------------------------------------
  // 4. APPLY USER FILTERS
  // --------------------------------------------------------------------------
  const filteredResumes = useMemo(() => {
    const now = Date.now();
    return allCombinedResumes.filter((item) => {
      // Subject filter
      if (selectedSubject && item.subject !== selectedSubject) return false;
      // Chapter filter
      if (selectedChapter && item.chapter !== selectedChapter) return false;

      // Status filter
      if (selectedStatus === 'completed' && !item.isCompleted) return false;
      if (selectedStatus === 'viewed' && !item.isViewed) return false;
      if (selectedStatus === 'favorite' && !item.isFavorite) return false;
      if (selectedStatus === 'unviewed' && item.isViewed) return false;

      // Period filter (only filters viewed items by their lastViewedAt)
      if (selectedPeriod !== 'all') {
        const days = Number(selectedPeriod);
        if (!item.timestamp || (now - item.timestamp > days * 86400000)) return false;
      }

      return true;
    });
  }, [allCombinedResumes, selectedSubject, selectedChapter, selectedStatus, selectedPeriod]);

  // --------------------------------------------------------------------------
  // 5. STATISTICAL KPIS
  // --------------------------------------------------------------------------
  const kpiStats = useMemo(() => {
    const totalConsulted = allCombinedResumes.filter((r) => r.isViewed).length;
    const totalCompleted = allCombinedResumes.filter((r) => r.isCompleted).length;
    const totalFavorites = allCombinedResumes.filter((r) => r.isFavorite).length;
    const totalDurationSec = allCombinedResumes.reduce((sum, r) => sum + r.duration, 0);
    const totalAvailable = allCombinedResumes.length;

    const completionRate = totalAvailable > 0
      ? Math.round((totalCompleted / totalAvailable) * 100)
      : 0;

    // Subject with most visits / revisions
    const subjectVisitsMap = new Map();
    allCombinedResumes.filter(r => r.isViewed).forEach((r) => {
      const prev = subjectVisitsMap.get(r.subject) || 0;
      subjectVisitsMap.set(r.subject, prev + r.visits);
    });

    let topSubject = '—';
    let maxVisits = 0;
    subjectVisitsMap.forEach((count, sub) => {
      if (count > maxVisits) {
        maxVisits = count;
        topSubject = sub;
      }
    });

    return {
      totalConsulted,
      totalCompleted,
      totalFavorites,
      totalDurationSec,
      formattedTime: formatSecondsToHoursAndMinutes(totalDurationSec),
      totalAvailable,
      completionRate,
      topSubject,
      topSubjectVisits: maxVisits,
    };
  }, [allCombinedResumes]);

  // --------------------------------------------------------------------------
  // 6. CHART 1: ÉVOLUTION DES CONSULTATIONS DANS LE TEMPS (AREA CHART)
  // --------------------------------------------------------------------------
  const consultationTrendData = useMemo(() => {
    const daysCount = selectedPeriod === '7' ? 7 : selectedPeriod === '30' ? 30 : selectedPeriod === '90' ? 90 : 14;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const list = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      let seconds = 0;
      let views = 0;

      filteredResumes.forEach((r) => {
        if (r.durationByDay && r.durationByDay[dayKey]) {
          seconds += Number(r.durationByDay[dayKey]) || 0;
        }
        if (r.lastViewedAt) {
          const lDate = new Date(r.lastViewedAt);
          const lKey = `${lDate.getFullYear()}-${String(lDate.getMonth() + 1).padStart(2, '0')}-${String(lDate.getDate()).padStart(2, '0')}`;
          if (lKey === dayKey) views += 1;
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
        views,
      });
    }

    return list;
  }, [filteredResumes, selectedPeriod]);

  // --------------------------------------------------------------------------
  // 7. CHART 2: RÉPARTITION DES CONSULTATIONS PAR MATIÈRE (DOUGHNUT)
  // --------------------------------------------------------------------------
  const subjectDistributionData = useMemo(() => {
    const map = new Map();
    filteredResumes.filter(r => r.isViewed).forEach((r) => {
      const sub = r.subject;
      const prev = map.get(sub) || 0;
      map.set(sub, prev + r.visits);
    });

    const palette = [COLORS.purple, COLORS.primary, COLORS.success, COLORS.amber, COLORS.rose];
    const result = Array.from(map.entries()).map(([name, value], index) => ({
      name,
      value,
      color: palette[index % palette.length],
    }));

    if (result.length === 0) {
      return [{ name: 'Aucune consultation', value: 1, color: COLORS.muted }];
    }

    return result;
  }, [filteredResumes]);

  const totalSubjectVisits = useMemo(() => {
    return filteredResumes.filter(r => r.isViewed).reduce((sum, r) => sum + r.visits, 0);
  }, [filteredResumes]);

  // --------------------------------------------------------------------------
  // 8. CHART 3: CLASSEMENT DES MATIÈRES LES PLUS CONSULTÉES (HORIZONTAL BAR)
  // --------------------------------------------------------------------------
  const subjectRankingData = useMemo(() => {
    const map = new Map();

    availableSubjects.forEach((sub) => {
      map.set(sub, { subject: sub, visits: 0, durationSec: 0, viewedCount: 0 });
    });

    filteredResumes.forEach((r) => {
      const entry = map.get(r.subject);
      if (entry) {
        entry.visits += r.visits;
        entry.durationSec += r.duration;
        if (r.isViewed) entry.viewedCount += 1;
      }
    });

    return Array.from(map.values())
      .map((entry) => ({
        subject: entry.subject,
        visits: entry.visits,
        hours: Number((entry.durationSec / 3600).toFixed(1)),
        viewedCount: entry.viewedCount,
      }))
      .sort((a, b) => b.visits - a.visits || b.hours - a.hours);
  }, [availableSubjects, filteredResumes]);

  // --------------------------------------------------------------------------
  // 9. CHART 4: PROGRESSION PAR RAPPORT AUX RÉSUMÉS DISPONIBLES
  // --------------------------------------------------------------------------
  const coverageComparisonData = useMemo(() => {
    const map = new Map();

    availableSubjects.forEach((sub) => {
      map.set(sub, { subject: sub, available: 0, viewed: 0, completed: 0 });
    });

    allCombinedResumes.forEach((r) => {
      const entry = map.get(r.subject);
      if (entry) {
        entry.available += 1;
        if (r.isViewed) entry.viewed += 1;
        if (r.isCompleted) entry.completed += 1;
      }
    });

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      completionRate: entry.available > 0 ? Math.round((entry.completed / entry.available) * 100) : 0,
      viewRate: entry.available > 0 ? Math.round((entry.viewed / entry.available) * 100) : 0,
    }));
  }, [availableSubjects, allCombinedResumes]);

  // --------------------------------------------------------------------------
  // 10. DETAILED ANALYSIS (INSIGHTS: TOP FICHES & À DÉCOUVRIR)
  // --------------------------------------------------------------------------
  const insights = useMemo(() => {
    // Most consulted fiches
    const topConsulted = [...allCombinedResumes]
      .filter((r) => r.isViewed)
      .sort((a, b) => b.visits - a.visits || b.duration - a.duration)
      .slice(0, 4);

    // Unviewed fiches to discover
    const unviewedToDiscover = [...allCombinedResumes]
      .filter((r) => !r.isViewed)
      .slice(0, 4);

    // Favorite fiches
    const favoriteFiches = [...allCombinedResumes]
      .filter((r) => r.isFavorite)
      .slice(0, 4);

    return {
      topConsulted,
      unviewedToDiscover,
      favoriteFiches,
    };
  }, [allCombinedResumes]);

  // --------------------------------------------------------------------------
  // 11. SESSIONS & HISTORY TABLE (WITH SEARCH, SORT, PAGINATION)
  // --------------------------------------------------------------------------
  const sessionsTableData = useMemo(() => {
    let list = [...filteredResumes];

    // Search query
    if (searchTable.trim()) {
      const q = searchTable.toLowerCase().trim();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q)
        || r.subject.toLowerCase().includes(q)
        || r.chapter.toLowerCase().includes(q)
      );
    }

    // Table subject filter
    if (tableSubjectFilter) {
      list = list.filter((r) => r.subject === tableSubjectFilter);
    }

    // Table status filter
    if (tableStatusFilter !== 'all') {
      if (tableStatusFilter === 'completed') list = list.filter((r) => r.isCompleted);
      else if (tableStatusFilter === 'in-progress') list = list.filter((r) => r.isViewed && !r.isCompleted);
      else if (tableStatusFilter === 'favorite') list = list.filter((r) => r.isFavorite);
      else if (tableStatusFilter === 'unstarted') list = list.filter((r) => !r.isViewed);
    }

    // Sorting
    list.sort((a, b) => {
      if (tableSort === 'time-desc') return b.duration - a.duration;
      if (tableSort === 'visits-desc') return b.visits - a.visits;
      if (tableSort === 'title-asc') return a.title.localeCompare(b.title);
      // Default: date-desc
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    return list;
  }, [filteredResumes, searchTable, tableSubjectFilter, tableStatusFilter, tableSort]);

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(sessionsTableData.length / itemsPerPage));
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sessionsTableData.slice(start, start + itemsPerPage);
  }, [sessionsTableData, currentPage]);

  // --------------------------------------------------------------------------
  // RENDER EMPTY STATE IF NO DATA
  // --------------------------------------------------------------------------
  if (allCombinedResumes.length === 0 && !catalogLoading) {
    return (
      <div className="summary-stats-root">
        <section className="summary-stats-header">
          <div className="summary-stats-header-top">
            <div>
              <span className="summary-stats-eyebrow">DASHBOARD RÉSUMÉS</span>
            </div>
          </div>
        </section>

        <div className="summary-empty-state">
          <div className="summary-empty-icon">📑</div>
          <h3>Aucune fiche de résumé disponible</h3>
          <p>
            Vos fiches de révision et vos statistiques d'apprentissage apparaîtront ici dès que les résumés seront disponibles dans votre espace.
          </p>
          <button
            type="button"
            className="summary-empty-btn"
            onClick={() => navigate('/client-resumes')}
          >
            Découvrir les fiches résumés &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-stats-root">
      {/* --------------------------------------------------------------------
         1. HERO HEADER & FILTERS
         -------------------------------------------------------------------- */}
      <section className="summary-stats-header">
        <div className="summary-stats-header-top">
          <div>
            <span className="summary-stats-eyebrow">FICHES DE SYNTHÈSE</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="summary-stats-filters-bar">
          {/* Matière */}
          <div className="summary-filter-field">
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
          <div className="summary-filter-field">
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
          <div className="summary-filter-field">
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
          <div className="summary-filter-field">
            <label>Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="viewed">Fiches consultées</option>
              <option value="completed">Fiches terminées</option>
              <option value="favorite">En favoris ⭐</option>
              <option value="unviewed">Non encore consultées</option>
            </select>
          </div>

        </div>
      </section>

      {/* --------------------------------------------------------------------
         2. 6 KPI STAT CARDS
         -------------------------------------------------------------------- */}
      <section className="summary-kpi-grid">
        {/* Card 1: Total résumés consultés */}
        <div className="summary-kpi-card">
          <div className="summary-kpi-top">
            <div className="summary-kpi-icon purple">📑</div>
            <span className="summary-kpi-badge is-neutral">Actifs</span>
          </div>
          <div className="summary-kpi-main">
            <span className="summary-kpi-value">{kpiStats.totalConsulted}</span>
            <span className="summary-kpi-title">Résumés consultés</span>
          </div>
          <span className="summary-kpi-note">Sur {kpiStats.totalAvailable} fiches disponibles</span>
        </div>

        {/* Card 2: Résumés terminés */}
        <div className="summary-kpi-card">
          <div className="summary-kpi-top">
            <div className="summary-kpi-icon green">✓</div>
            <span className="summary-kpi-badge is-up">Validés</span>
          </div>
          <div className="summary-kpi-main">
            <span className="summary-kpi-value">{kpiStats.totalCompleted}</span>
            <span className="summary-kpi-title">Résumés terminés</span>
          </div>
          <span className="summary-kpi-note">{kpiStats.completionRate}% du programme de révision</span>
        </div>

        {/* Card 3: En favoris */}
        <div className="summary-kpi-card">
          <div className="summary-kpi-top">
            <div className="summary-kpi-icon amber">⭐</div>
            <span className="summary-kpi-badge is-highlight">Favoris</span>
          </div>
          <div className="summary-kpi-main">
            <span className="summary-kpi-value">{kpiStats.totalFavorites}</span>
            <span className="summary-kpi-title">Fiches en favoris</span>
          </div>
          <span className="summary-kpi-note">Épinglées pour révision rapide</span>
        </div>

        {/* Card 4: Temps total */}
        <div className="summary-kpi-card">
          <div className="summary-kpi-top">
            <div className="summary-kpi-icon blue">⏱️</div>
            <span className="summary-kpi-badge is-neutral">Temps</span>
          </div>
          <div className="summary-kpi-main">
            <span className="summary-kpi-value">{kpiStats.formattedTime}</span>
            <span className="summary-kpi-title">Temps de consultation</span>
          </div>
          <span className="summary-kpi-note">Durée active de lecture</span>
        </div>

        {/* Card 5: Matière favorite */}
        <div className="summary-kpi-card">
          <div className="summary-kpi-top">
            <div className="summary-kpi-icon rose">❤️</div>
            <span className="summary-kpi-badge is-neutral">Top matière</span>
          </div>
          <div className="summary-kpi-main">
            <span className="summary-kpi-value" style={{ fontSize: '18px', color: '#0f172a' }}>
              {kpiStats.topSubject}
            </span>
            <span className="summary-kpi-title">Matière la plus lue</span>
          </div>
          <span className="summary-kpi-note">{kpiStats.topSubjectVisits} consultations enregistrées</span>
        </div>

        {/* Card 6: Progression globale */}
        <div className="summary-kpi-card">
          <div className="summary-kpi-top">
            <div className="summary-kpi-icon cyan">📊</div>
            <span className="summary-kpi-badge is-up">Taux</span>
          </div>
          <div className="summary-kpi-main">
            <span className="summary-kpi-value">{kpiStats.completionRate}%</span>
            <span className="summary-kpi-title">Taux de complétion</span>
          </div>
          <span className="summary-kpi-note">Fiches marquées comme terminées</span>
        </div>
      </section>

      {/* --------------------------------------------------------------------
         3. CHARTS ROW 1: ÉVOLUTION DES CONSULTATIONS & RÉPARTITION PAR MATIÈRE
         -------------------------------------------------------------------- */}
      <div className="summary-grid-row">
        {/* Area Chart: Évolution des consultations (Span 8) */}
        <div className="summary-panel-card summary-col-8">
          <div className="summary-panel-header">
            <div className="summary-panel-heading-copy">
              <span className="summary-panel-kicker">CHRONOLOGIE DES LECTURES</span>
              <h2 className="summary-panel-title">Évolution des consultations</h2>
              <p className="summary-panel-subtitle">Volume quotidien d'heures et de lectures de résumés</p>
            </div>
            <span className="summary-count-badge">
              {consultationTrendData.reduce((s, d) => s + d.hours, 0).toFixed(1)} h totales
            </span>
          </div>

          <div className="summary-panel-body summary-trend-chart-body">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={consultationTrendData} margin={{ top: 10, right: 14, left: -10, bottom: 2 }}>
                <defs>
                  <linearGradient id="summaryTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11.5} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11.5} tickLine={false} tickFormatter={(v) => `${v}h`} />
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
                          <div style={{ color: '#7c3aed', fontWeight: 850, marginTop: 4, fontSize: '14px' }}>
                            {d.hours} h ({d.minutes} min)
                          </div>
                          <div style={{ color: 'var(--text-secondary, #64748b)', fontSize: '11px', marginTop: 2 }}>
                            {d.views} consultation{d.views > 1 ? 's' : ''} ce jour
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
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#summaryTrendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart: Répartition par matière (Span 4) */}
        <div className="summary-panel-card summary-col-4">
          <div className="summary-panel-header">
            <div className="summary-panel-heading-copy">
              <span className="summary-panel-kicker">DISCIPLINES</span>
              <h2 className="summary-panel-title">Répartition des lectures</h2>
              <p className="summary-panel-subtitle">Part des consultations par matière</p>
            </div>
          </div>

          <div className="summary-panel-body">
            <div className="summary-donut-wrapper">
              <div className="summary-donut-chart-container">
                <ResponsiveContainer width={190} height={190}>
                  <PieChart>
                    <Pie
                      data={subjectDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {subjectDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${value} consultation${value > 1 ? 's' : ''} (${Math.round((value / Math.max(1, totalSubjectVisits)) * 100)}%)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="summary-donut-center-label">
                  <strong>{totalSubjectVisits}</strong>
                  <span>VISITES</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="summary-donut-legend-list">
                {subjectDistributionData.map((item) => {
                  const pct = totalSubjectVisits > 0 ? Math.round((item.value / totalSubjectVisits) * 100) : 0;
                  return (
                    <div key={item.name} className="summary-donut-legend-item">
                      <div className="summary-donut-legend-left">
                        <span className="summary-donut-legend-dot" style={{ background: item.color }} />
                        <span className="summary-donut-legend-name">{item.name}</span>
                      </div>
                      <div className="summary-donut-legend-right">
                        <span className="summary-donut-legend-count">{item.value}</span>
                        <span className="summary-donut-legend-pct">({pct}%)</span>
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
         4. CHARTS ROW 2: CLASSEMENT MATIÈRES & COUVERTURE DES FICHES
         -------------------------------------------------------------------- */}
      <div className="summary-grid-row">
        {/* Horizontal Bar: Classement des matières les plus consultées (Span 6) */}
        <div className="summary-panel-card summary-col-6">
          <div className="summary-panel-header">
            <div className="summary-panel-heading-copy">
              <span className="summary-panel-kicker">CLASSEMENT</span>
              <h2 className="summary-panel-title">Matières les plus consultées</h2>
              <p className="summary-panel-subtitle">Nombre de consultations et temps d'étude par matière</p>
            </div>
          </div>

          <div className="summary-panel-body summary-ranking-chart-body">
            {subjectRankingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={subjectRankingData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11.5} allowDecimals={false} />
                  <YAxis type="category" dataKey="subject" stroke="#334155" fontSize={12.5} fontWeight={700} width={120} tickLine={false} />
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val} consultations (${item.payload.hours}h passées)`,
                      'Consultations'
                    ]}
                  />
                  <Bar dataKey="visits" name="Consultations" fill="#7c3aed" radius={[0, 6, 6, 0]} barSize={18}>
                    {subjectRankingData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#7c3aed', '#2563eb', '#10b981', '#f59e0b'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="summary-empty-state" style={{ padding: '24px' }}>
                <p>Aucune consultation enregistrée pour ces matières.</p>
              </div>
            )}
          </div>
        </div>

        {/* Grouped Bar: Fiches disponibles vs consultées vs terminées (Span 6) */}
        <div className="summary-panel-card summary-col-6">
          <div className="summary-panel-header">
            <div className="summary-panel-heading-copy">
              <span className="summary-panel-kicker">COUVERTURE</span>
              <h2 className="summary-panel-title">Disponibles vs Terminées</h2>
              <p className="summary-panel-subtitle">Progression des fiches lues par rapport au catalogue</p>
            </div>
            <span className="summary-count-badge">Catalogue</span>
          </div>

          <div className="summary-panel-body summary-coverage-chart-body">
            {coverageComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={coverageComparisonData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="subject" stroke="#334155" fontSize={11.5} fontWeight={700} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11.5} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(val, name) => [
                      `${val} fiches`,
                      name === 'available' ? 'Fiches disponibles' : name === 'viewed' ? 'Consultées' : 'Terminées'
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="available" name="Disponibles" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="viewed" name="Consultées" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="completed" name="Terminées" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="summary-empty-state" style={{ padding: '24px' }}>
                <p>Aucune fiche disponible pour la comparaison.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
         5. DETAILED ANALYSIS (INSIGHTS: TOP FICHES & À DÉCOUVRIR)
         -------------------------------------------------------------------- */}
      <section className="summary-insights-grid">
        {/* Fiches les plus consultées */}
        <div className="summary-insight-card is-top">
          <div className="summary-insight-head">
            <div className="summary-insight-head-text">
              <h3>Fiches les plus consultées</h3>
              <p>Résumés sur lesquels vous revenez le plus souvent</p>
            </div>
          </div>
          <div className="summary-insight-list">
            {insights.topConsulted.length > 0 ? (
              insights.topConsulted.map((item) => (
                <div key={item.id} className="summary-insight-item">
                  <div className="summary-insight-item-title">
                    <span className="summary-insight-dot" />
                    <span>{item.title}</span>
                  </div>
                  <span className="summary-insight-item-meta">
                    {item.visits} visite{item.visits > 1 ? 's' : ''} • {formatSecondsToHoursAndMinutes(item.duration)}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', padding: '10px 0' }}>
                Consultez vos premiers résumés pour voir vos fiches favorites ici.
              </div>
            )}
          </div>
        </div>

        {/* Fiches à découvrir */}
        <div className="summary-insight-card is-discover">
          <div className="summary-insight-head">
            <div className="summary-insight-head-text">
              <h3>Fiches à découvrir</h3>
              <p>Résumés disponibles non encore consultés dans votre programme</p>
            </div>
          </div>
          <div className="summary-insight-list">
            {insights.unviewedToDiscover.length > 0 ? (
              insights.unviewedToDiscover.map((item) => (
                <div key={item.id} className="summary-insight-item">
                  <div className="summary-insight-item-title">
                    <span className="summary-insight-dot" />
                    <span>{item.title}</span>
                  </div>
                  <span className="summary-insight-item-meta">
                    {item.subject} • {item.chapter}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', padding: '10px 0' }}>
                Félicitations, vous avez déjà ouvert toutes les fiches disponibles !
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
         6. SESSIONS & HISTORY TABLE (WITH FAVORITES TOGGLE)
         -------------------------------------------------------------------- */}
      <div className="summary-grid-row">
        <div className="summary-panel-card summary-col-12">
          <div className="summary-panel-header">
            <div className="summary-panel-heading-copy">
              <span className="summary-panel-kicker">HISTORIQUE DES FICHES</span>
              <h2 className="summary-panel-title">Historique des fiches consultées</h2>
              <p className="summary-panel-subtitle">Liste complète des résumés, temps de lecture et gestion de vos favoris</p>
            </div>
            <span className="summary-count-badge">{sessionsTableData.length} fiches</span>
          </div>

          <div className="summary-panel-body">
            {/* Table Toolbar */}
            <div className="summary-table-toolbar">
              <input
                type="text"
                className="summary-search-input"
                placeholder="Rechercher une fiche ou un chapitre..."
                value={searchTable}
                onChange={(e) => {
                  setSearchTable(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <div className="summary-table-filters">
                <select
                  className="summary-table-select"
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
                  className="summary-table-select"
                  value={tableStatusFilter}
                  onChange={(e) => {
                    setTableStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="completed">Terminées</option>
                  <option value="in-progress">En cours</option>
                  <option value="favorite">Favoris ⭐</option>
                </select>

                <select
                  className="summary-table-select"
                  value={tableSort}
                  onChange={(e) => {
                    setTableSort(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="date-desc">Plus récents d'abord</option>
                  <option value="visits-desc">Plus consultés</option>
                  <option value="time-desc">Plus de temps passé</option>
                  <option value="title-asc">Titre alphabétique</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {paginatedSessions.length > 0 ? (
              <div className="summary-table-container">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: 'center' }}>Fav</th>
                      <th>Titre du résumé</th>
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
                    {paginatedSessions.map((item) => {
                      const badgeStyle = getSubjectBadgeStyle(item.subject);
                      const isFav = item.isFavorite;

                      return (
                        <tr key={item.id}>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className={`summary-fav-btn ${isFav ? 'is-active' : ''}`}
                              onClick={() => toggleFavorite(item.id)}
                              title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            >
                              {isFav ? '★' : '☆'}
                            </button>
                          </td>
                          <td>
                            <strong style={{ color: '#0f172a', display: 'block', fontSize: '13.5px' }}>
                              {item.title}
                            </strong>
                          </td>
                          <td>
                            <span
                              className="summary-subject-badge"
                              style={{ background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}` }}
                            >
                              {item.subject}
                            </span>
                          </td>
                          <td style={{ color: '#475569', fontSize: '12.5px' }}>
                            {item.chapter}
                          </td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>
                              {formatSecondsToHoursAndMinutes(item.duration)}
                            </strong>
                          </td>
                          <td style={{ color: '#64748b' }}>
                            {item.visits} visite{item.visits > 1 ? 's' : ''}
                          </td>
                          <td style={{ color: '#64748b', fontSize: '12px' }}>
                            {formatDate(item.lastViewedAt)}
                          </td>
                          <td>
                            {item.isCompleted ? (
                              <span className="summary-status-pill completed">✓ Terminée</span>
                            ) : item.isViewed ? (
                              <span className="summary-status-pill in-progress">En cours</span>
                            ) : (
                              <span className="summary-status-pill unstarted">Non débutée</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="summary-view-link-btn"
                              onClick={() => navigate(`/client-resumes?matiere=${encodeURIComponent(item.subject)}`)}
                            >
                              Ouvrir la fiche &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="summary-empty-state" style={{ padding: '30px' }}>
                <p>Aucune fiche de résumé ne correspond à votre recherche.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="summary-pagination">
                <span className="summary-pagination-info">
                  Page {currentPage} sur {totalPages} ({sessionsTableData.length} fiches)
                </span>
                <div className="summary-pagination-controls">
                  <button
                    type="button"
                    className="summary-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    &larr; Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`summary-page-btn ${p === currentPage ? 'is-active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="summary-page-btn"
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

