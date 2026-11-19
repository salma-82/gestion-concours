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
import './ClientContestStatsDashboard.css';
import './ClientStatsDashboardTheme.css';
import './ClientContestStatsDashboardCompact.css';

// Palette de couleurs premium
const COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#2563eb',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  muted: '#94a3b8',
  slate: '#0f172a',
};

const normalizeFilterValue = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLocaleLowerCase('fr');

const getAttemptYear = (attempt) => {
  const explicitYear = String(attempt?.year || '').trim();
  if (explicitYear) return explicitYear;

  const answeredAt = new Date(attempt?.answeredAt);
  return Number.isNaN(answeredAt.getTime()) ? '' : String(answeredAt.getFullYear());
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
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d);
};

export default function ClientContestStatsDashboard({
  schoolCatalog = [],
  schoolAttempts = [],
  studentActivities = [],
  schoolDataLoading = false,
  schoolCatalogError = false,
  schoolHistoryError = false,
  user = {},
}) {
  const navigate = useNavigate();

  // --------------------------------------------------------------------------
  // 1. ÉTATS DES FILTRES
  // --------------------------------------------------------------------------
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // '7', '30', '90', '180', 'all'
  const [searchTable, setSearchTable] = useState('');
  const [tableYearFilter, setTableYearFilter] = useState('');
  const [tableSort, setTableSort] = useState('date-desc'); // 'date-desc', 'score-desc', 'score-asc'
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAccuracySubject, setSelectedAccuracySubject] = useState('ALL');
  const [selectedAttemptModal, setSelectedAttemptModal] = useState(null);

  // Extraire uniquement les concours réels (exclure les concours blancs)
  const allRealAttempts = useMemo(() => {
    return (schoolAttempts || []).filter(
      (a) => !String(a.resourceType || '').toLowerCase().includes('blanc')
    );
  }, [schoolAttempts]);

  // Écoles disponibles pour le filtre
  const availableSchools = useMemo(() => {
    const set = new Set();
    schoolCatalog.forEach((s) => {
      const name = s.ecole || s.name;
      if (name) set.add(name.trim());
    });
    allRealAttempts.forEach((a) => {
      if (a.school) set.add(a.school.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [schoolCatalog, allRealAttempts]);

  // Matières disponibles
  const availableSubjects = useMemo(() => {
    const set = new Set(['Mathématiques', 'Physique-Chimie', 'SVT']);
    allRealAttempts.forEach((a) => {
      if (a.subject) set.add(a.subject.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [allRealAttempts]);

  // Années du catalogue et des tentatives, adaptées à l'école sélectionnée.
  const availableYears = useMemo(() => {
    const set = new Set();

    schoolCatalog.forEach((contest) => {
      const school = contest.ecole || contest.school || contest.name;
      if (selectedSchool && normalizeFilterValue(school) !== normalizeFilterValue(selectedSchool)) return;

      const year = contest.annee ?? contest.year;
      if (year !== null && year !== undefined && String(year).trim()) set.add(String(year).trim());
    });

    allRealAttempts.forEach((a) => {
      if (selectedSchool && normalizeFilterValue(a.school) !== normalizeFilterValue(selectedSchool)) return;
      const year = getAttemptYear(a);
      if (year) set.add(year);
    });
    return Array.from(set).sort((a, b) => {
      const yearDifference = Number.parseInt(b, 10) - Number.parseInt(a, 10);
      return Number.isNaN(yearDifference) ? b.localeCompare(a, 'fr') : yearDifference;
    });
  }, [schoolCatalog, allRealAttempts, selectedSchool]);

  // --------------------------------------------------------------------------
  // 2. FILTRAGE DYNAMIQUE DES TENTATIVES
  // --------------------------------------------------------------------------
  const filteredAttempts = useMemo(() => {
    const now = Date.now();
    return allRealAttempts.filter((att) => {
      // Filtre école
      if (selectedSchool && normalizeFilterValue(att.school) !== normalizeFilterValue(selectedSchool)) {
        return false;
      }
      // Filtre année
      if (selectedYear && getAttemptYear(att) !== selectedYear) {
        return false;
      }
      // Filtre matière
      if (selectedSubject && String(att.subject || '').toLowerCase() !== selectedSubject.toLowerCase()) {
        return false;
      }
      // Filtre période
      if (selectedPeriod !== 'all') {
        const days = Number(selectedPeriod);
        const attTime = new Date(att.answeredAt).getTime();
        if (!isNaN(attTime) && attTime < now - days * 86400000) {
          return false;
        }
      }
      return true;
    });
  }, [allRealAttempts, selectedSchool, selectedYear, selectedSubject, selectedPeriod]);

  // --------------------------------------------------------------------------
  // 3. CALCUL DES 6 KPIS PRINCIPAUX
  // --------------------------------------------------------------------------
  const kpiData = useMemo(() => {
    const totalAttempts = filteredAttempts.length;
    const uniqueContests = new Set(
      filteredAttempts.map((a) => `${a.resourceType || 'C'}:${a.resourceId}`)
    ).size;

    const validScores = filteredAttempts
      .map((a) => a.score)
      .filter((s) => s !== null && s !== undefined && !isNaN(Number(s)))
      .map(Number);

    const avgScore = validScores.length
      ? Math.round((validScores.reduce((acc, v) => acc + v, 0) / validScores.length) * 10) / 10
      : null;

    let totalCorrect = 0;
    let totalQuestions = 0;
    let totalIncorrect = 0;

    filteredAttempts.forEach((a) => {
      const correct = Number(a.correctAnswers) || 0;
      const questions = Number(a.totalQuestions) || Number(a.expectedQuestions) || correct;
      totalCorrect += correct;
      totalQuestions += questions;
      totalIncorrect += Math.max(0, questions - correct);
    });

    const passRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null;

    // Calcul de la tendance (compare la première moitié des tentatives à la 2e moitié)
    let trend = null;
    if (validScores.length >= 2) {
      const mid = Math.floor(validScores.length / 2);
      const recent = validScores.slice(0, mid); // ordered desc
      const older = validScores.slice(mid);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      const diff = Math.round((recentAvg - olderAvg) * 10) / 10;
      if (diff > 0) trend = { text: `+${diff}%`, status: 'is-up' };
      else if (diff < 0) trend = { text: `${diff}%`, status: 'is-down' };
      else trend = { text: `Stable`, status: 'is-neutral' };
    }

    return {
      uniqueContests,
      totalAttempts,
      avgScore,
      passRate,
      totalCorrect,
      totalIncorrect,
      totalQuestions,
      trend,
    };
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 4. DONNÉES GRAPHIQUE 1 : ÉVOLUTION DES SCORES (Line Chart)
  // --------------------------------------------------------------------------
  const scoreEvolutionData = useMemo(() => {
    // Trier par date croissante
    const sorted = [...filteredAttempts]
      .filter((a) => a.score !== null && a.score !== undefined && !isNaN(Number(a.score)))
      .sort((a, b) => new Date(a.answeredAt) - new Date(b.answeredAt));

    return sorted.map((att, idx) => ({
      idx: idx + 1,
      name: `T${idx + 1}`,
      date: formatShortDate(att.answeredAt),
      fullDate: formatDate(att.answeredAt),
      score: Number(att.score),
      title: att.resourceTitle || 'Concours',
      school: att.school || 'École non renseignée',
      subject: att.subject || 'Matière générale',
      correct: Number(att.correctAnswers) || 0,
      incorrect: Math.max(0, (Number(att.totalQuestions) || 0) - (Number(att.correctAnswers) || 0)),
      total: Number(att.totalQuestions) || 0,
    }));
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 5. DONNÉES GRAPHIQUE 2 : RÉPARTITION DES RÉPONSES (Doughnut Chart)
  // --------------------------------------------------------------------------
  const responseDistributionData = useMemo(() => {
    if (!kpiData.totalQuestions) return [];
    const correct = kpiData.totalCorrect;
    const incorrect = kpiData.totalIncorrect;
    return [
      { name: 'Réponses correctes', value: correct, color: COLORS.success },
      { name: 'Réponses incorrectes', value: incorrect, color: COLORS.danger },
    ];
  }, [kpiData]);

  // --------------------------------------------------------------------------
  // 6. DONNÉES GRAPHIQUE 3 : PERFORMANCE PAR MATIÈRE (Horizontal Bar Chart)
  // --------------------------------------------------------------------------
  const subjectPerformanceData = useMemo(() => {
    const map = new Map();
    filteredAttempts.forEach((a) => {
      const subj = (a.subject || 'Autres').trim();
      const current = map.get(subj) || { attempts: 0, scores: [], correct: 0, total: 0 };
      current.attempts += 1;
      if (a.score !== null && !isNaN(Number(a.score))) current.scores.push(Number(a.score));
      current.correct += Number(a.correctAnswers) || 0;
      current.total += Number(a.totalQuestions) || Number(a.correctAnswers) || 0;
      map.set(subj, current);
    });

    return Array.from(map.entries())
      .map(([subject, stat]) => {
        const avg = stat.scores.length
          ? Math.round(stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length)
          : 0;
        const pass = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0;
        return {
          subject,
          avgScore: avg,
          passRate: pass,
          attempts: stat.attempts,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 7. DONNÉES GRAPHIQUE 4 : PERFORMANCE PAR ÉCOLE (Vertical Bar Chart)
  // --------------------------------------------------------------------------
  const schoolPerformanceData = useMemo(() => {
    const map = new Map();
    filteredAttempts.forEach((a) => {
      const sch = (a.school || 'Autre').trim();
      const current = map.get(sch) || { attempts: 0, contests: new Set(), scores: [], correct: 0, total: 0 };
      current.attempts += 1;
      current.contests.add(a.resourceId);
      if (a.score !== null && !isNaN(Number(a.score))) current.scores.push(Number(a.score));
      current.correct += Number(a.correctAnswers) || 0;
      current.total += Number(a.totalQuestions) || Number(a.correctAnswers) || 0;
      map.set(sch, current);
    });

    return Array.from(map.entries())
      .map(([school, stat]) => {
        const avg = stat.scores.length
          ? Math.round(stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length)
          : 0;
        const pass = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0;
        return {
          school,
          contestsCount: stat.contests.size,
          attempts: stat.attempts,
          avgScore: avg,
          passRate: pass,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 8. DONNÉES GRAPHIQUE 5 : ÉVOLUTION DU TAUX DE RÉUSSITE (Area Chart)
  // --------------------------------------------------------------------------
  const passRateEvolutionData = useMemo(() => {
    const sorted = [...filteredAttempts]
      .filter((a) => (Number(a.totalQuestions) || 0) > 0)
      .sort((a, b) => new Date(a.answeredAt) - new Date(b.answeredAt));

    let runningCorrect = 0;
    let runningTotal = 0;

    return sorted.map((att, idx) => {
      runningCorrect += Number(att.correctAnswers) || 0;
      runningTotal += Number(att.totalQuestions) || 0;
      const cumulativeRate = runningTotal > 0 ? Math.round((runningCorrect / runningTotal) * 100) : 0;
      const attemptRate = att.totalQuestions ? Math.round((Number(att.correctAnswers) / Number(att.totalQuestions)) * 100) : 0;
      return {
        name: `T${idx + 1}`,
        date: formatShortDate(att.answeredAt),
        attemptRate,
        cumulativeRate,
        title: att.resourceTitle || 'Concours',
      };
    });
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 9. DONNÉES GRAPHIQUE 6 : COMPARAISON DES TENTATIVES D'UN MÊME CONCOURS (Bar Chart)
  // --------------------------------------------------------------------------
  const contestComparisonData = useMemo(() => {
    // Grouper par resourceId
    const groups = new Map();
    filteredAttempts.forEach((a) => {
      const list = groups.get(a.resourceId) || [];
      list.push(a);
      groups.set(a.resourceId, list);
    });

    // Prendre le concours qui a le plus de tentatives
    let bestGroup = [];
    let bestTitle = '';
    groups.forEach((list) => {
      if (list.length > bestGroup.length) {
        bestGroup = list;
        bestTitle = list[0]?.resourceTitle || 'Concours';
      }
    });

    if (bestGroup.length < 1) return { title: '', data: [] };

    // Trier chronologiquement
    const sorted = [...bestGroup].sort((a, b) => new Date(a.answeredAt) - new Date(b.answeredAt));
    const data = sorted.map((att, idx) => ({
      attemptLabel: `Essai ${idx + 1}`,
      date: formatShortDate(att.answeredAt),
      score: Number(att.score) || 0,
      correct: Number(att.correctAnswers) || 0,
      total: Number(att.totalQuestions) || 0,
    }));

    return { title: bestTitle, data };
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 10. POINTS FORTS & POINTS À AMÉLIORER (Calculs réels)
  // --------------------------------------------------------------------------
  const insights = useMemo(() => {
    if (!filteredAttempts.length) {
      return { strengths: [], improvements: [] };
    }

    const strengths = [];
    const improvements = [];

    // Matières
    if (subjectPerformanceData.length > 0) {
      const topSubject = subjectPerformanceData[0];
      if (topSubject.avgScore >= 60) {
        strengths.push({
          title: `Maîtrise en ${topSubject.subject}`,
          desc: `Score moyen remarquable de ${topSubject.avgScore}% avec un taux de réussite de ${topSubject.passRate}%.`,
        });
      }
      const lowSubject = [...subjectPerformanceData].reverse()[0];
      if (lowSubject.avgScore < 50 || subjectPerformanceData.length > 1) {
        improvements.push({
          title: `Renforcer la ${lowSubject.subject}`,
          desc: `Moyenne actuelle de ${lowSubject.avgScore}%. Davantage d'entraînements dans cette matière augmentera significativement votre classement.`,
        });
      }
    }

    // Écoles
    if (schoolPerformanceData.length > 0) {
      const topSchool = schoolPerformanceData[0];
      strengths.push({
        title: `Affinité avec les concours ${topSchool.school}`,
        desc: `Excellente performance moyenne de ${topSchool.avgScore}% sur ${topSchool.attempts} tentative(s).`,
      });
    }

    // Progression générale
    if (kpiData.trend?.status === 'is-up') {
      strengths.push({
        title: `Courbe de progression positive (${kpiData.trend.text})`,
        desc: `Vos derniers concours montrent une nette progression par rapport à vos premiers essais.`,
      });
    } else if (kpiData.trend?.status === 'is-down') {
      improvements.push({
        title: `Rythme et régularité à stabiliser`,
        desc: `Une baisse de score a été constatée récemment. Revoir les erreurs avant de tenter une nouvelle épreuve.`,
      });
    }

    // Erreurs
    if (kpiData.totalIncorrect > 5) {
      improvements.push({
        title: `${kpiData.totalIncorrect} réponses incorrectes à analyser`,
        desc: `Consultez les explications dans vos questions sauvegardées pour transformer vos faiblesses en acquis.`,
      });
    }

    // Fallbacks si peu de données
    if (strengths.length === 0) {
      strengths.push({
        title: `Premier pas accompli !`,
        desc: `Vous avez démarré vos entraînements aux concours réels. Poursuivez pour consolider vos acquis.`,
      });
    }
    if (improvements.length === 0) {
      improvements.push({
        title: `Maintenir l'entraînement régulier`,
        desc: `Multipliez les concours d'années antérieures pour couvrir l'intégralité du programme.`,
      });
    }

    return { strengths, improvements };
  }, [filteredAttempts, subjectPerformanceData, schoolPerformanceData, kpiData]);

  // --------------------------------------------------------------------------
  // 11. ANALYSE DÉTAILLÉE PAR MATIÈRE
  // --------------------------------------------------------------------------
  const subjectAccuracyData = useMemo(() => {
    const map = new Map();

    filteredAttempts.forEach((att) => {
      const answers = Array.isArray(att.answers) ? att.answers : [];
      const subject = String(att.subject || 'Matière générale').trim();
      const key = subject.toLocaleLowerCase();

      if (!answers.length) return;

      const current = map.get(key) || {
        subject,
        total: 0,
        correct: 0,
      };

      answers.forEach((ans) => {
        current.total += 1;
        if (ans.correct) current.correct += 1;
      });

      map.set(key, current);
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      incorrect: Math.max(0, item.total - item.correct),
      rate: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    })).sort((a, b) => a.subject.localeCompare(b.subject, 'fr'));
  }, [filteredAttempts]);

  const accuracySubjects = useMemo(() => subjectAccuracyData.map((item) => item.subject), [subjectAccuracyData]);
  const activeAccuracySubject = accuracySubjects.includes(selectedAccuracySubject) ? selectedAccuracySubject : 'ALL';

  const filteredSubjectAccuracy = useMemo(() => {
    if (activeAccuracySubject === 'ALL') return subjectAccuracyData;
    return subjectAccuracyData.filter((item) => item.subject === activeAccuracySubject);
  }, [subjectAccuracyData, activeAccuracySubject]);

  // --------------------------------------------------------------------------
  // 12. HISTORIQUE AVEC RECHERCHE, TRI ET PAGINATION
  // --------------------------------------------------------------------------
  const sortedTableData = useMemo(() => {
    let list = [...filteredAttempts];

    // Recherche par école ou titre
    if (searchTable.trim()) {
      const q = searchTable.toLowerCase().trim();
      list = list.filter(
        (a) =>
          String(a.resourceTitle || '').toLowerCase().includes(q) ||
          String(a.school || '').toLowerCase().includes(q) ||
          String(a.subject || '').toLowerCase().includes(q)
      );
    }

    // Filtre année
    if (tableYearFilter) {
      list = list.filter((a) => String(a.year) === String(tableYearFilter));
    }

    // Tri
    list.sort((a, b) => {
      if (tableSort === 'date-desc') {
        return new Date(b.answeredAt) - new Date(a.answeredAt);
      }
      if (tableSort === 'score-desc') {
        return (Number(b.score) || 0) - (Number(a.score) || 0);
      }
      if (tableSort === 'score-asc') {
        return (Number(a.score) || 0) - (Number(b.score) || 0);
      }
      return 0;
    });

    return list;
  }, [filteredAttempts, searchTable, tableYearFilter, tableSort]);

  const pageSize = 6;
  const totalPages = Math.ceil(sortedTableData.length / pageSize) || 1;
  const paginatedTableData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTableData.slice(start, start + pageSize);
  }, [sortedTableData, currentPage]);

  // --------------------------------------------------------------------------
  // 13. RECOMMANDATIONS INTELLIGENTES DYNAMIQUES
  // --------------------------------------------------------------------------
  const recommendations = useMemo(() => {
    const list = [];

    // Reco 1 : Matière la plus faible
    if (subjectAccuracyData.length > 0) {
      const weakest = [...subjectAccuracyData].sort((a, b) => a.rate - b.rate)[0];
      if (weakest && weakest.rate < 70) {
        list.push({
          icon: '🎯',
          title: `Réviser : ${weakest.subject}`,
          desc: `Votre taux de réussite dans cette matière est de ${weakest.rate}% (${weakest.incorrect} erreur(s)).`,
          actionLabel: `Consulter les cours de ${weakest.subject}`,
          onClick: () => navigate('/client-cours'),
        });
      }
    }

    // Reco 2 : Concours avec score < 50%
    const lowContest = filteredAttempts.find((a) => Number(a.score) < 50);
    if (lowContest) {
      list.push({
        icon: '🔄',
        title: `Retenter : ${lowContest.resourceTitle || 'Épreuve'}`,
        desc: `Score obtenu de ${lowContest.score}%. Retentez le concours pour valider votre assimilation.`,
        actionLabel: `Refaire ce concours`,
        onClick: () => navigate(`/client-concours?ecole=${encodeURIComponent(lowContest.school || '')}`),
      });
    }

    // Reco 3 : Questions incorrectes sauvegardées
    if (kpiData.totalIncorrect > 0) {
      list.push({
        icon: '📝',
        title: `Analyser vos ${kpiData.totalIncorrect} erreurs`,
        desc: `Toutes vos erreurs de concours sont conservées avec les explications officielles.`,
        actionLabel: `Accéder aux erreurs`,
        onClick: () => navigate('/client-erreurs?view=all'),
      });
    }

    // Reco 4 : École cible
    if (schoolPerformanceData.length > 0) {
      const nextSchool = schoolPerformanceData[0];
      list.push({
        icon: '🏆',
        title: `Nouveau concours : ${nextSchool.school}`,
        desc: `Explorez les autres années du concours ${nextSchool.school} pour parfaire votre préparation.`,
        actionLabel: `Explorer les épreuves`,
        onClick: () => navigate(`/client-concours?ecole=${encodeURIComponent(nextSchool.school)}`),
      });
    }

    // Default fallback
    if (list.length === 0) {
      list.push({
        icon: '🚀',
        title: `Commencer votre préparation`,
        desc: `Choisissez une école cible (ENSA, ENCG, ENSAM, Médecine...) et testez-vous en conditions réelles.`,
        actionLabel: `Découvrir les concours`,
        onClick: () => navigate('/client-concours'),
      });
    }

    return list.slice(0, 3);
  }, [subjectAccuracyData, filteredAttempts, kpiData, schoolPerformanceData, navigate]);

  const hasData = filteredAttempts.length > 0;

  return (
    <div className="contest-stats-root">
      {/* --------------------------------------------------------------------
          1. HEADER & FILTRES INTERACTIFS
          -------------------------------------------------------------------- */}
      <header className="contest-stats-header">
        <div className="contest-stats-header-top">
          <div className="contest-title-lockup">
            <div>
              <h1 className="contest-stats-title">Analyse des performances</h1>
            </div>
          </div>
          <div>
            <span className="contest-stats-eyebrow">
              <span>📊</span> ANALYSE DES PERFORMANCES
            </span>
          </div>
        </div>

        {/* Barre de filtres fonctionnels */}
        <div className="contest-stats-filters-bar">
          {/* Filtre 1 : École */}
          <div className="contest-filter-field">
            <label>École</label>
            <select
              value={selectedSchool}
              onChange={(e) => {
                setSelectedSchool(e.target.value);
                setSelectedYear('');
                setTableYearFilter('');
                setCurrentPage(1);
              }}
            >
              <option value="">Toutes les écoles</option>
              {availableSchools.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre 2 : Année */}
          <div className="contest-filter-field">
            <label>Année</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Toutes les années</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre 3 : Matière */}
          <div className="contest-filter-field">
            <label>Matière</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Toutes les matières</option>
              {availableSubjects.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre 4 : Période */}
          <div className="contest-filter-field">
            <label>Période</label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">3 derniers mois</option>
              <option value="180">6 derniers mois</option>
              <option value="all">Toute la période</option>
            </select>
          </div>

        </div>
      </header>

      {/* --------------------------------------------------------------------
          2. GRILLE DES 6 CARTES STATISTIQUES PRINCIPALES
          -------------------------------------------------------------------- */}
      <section className="contest-kpi-grid" aria-label="Indicateurs clés">
        {/* Card 1 – Concours réalisés */}
        <article className="contest-kpi-card">
          <div className="contest-kpi-top">
            <div className="contest-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              🏆
            </div>
            {hasData && (
              <span className="contest-kpi-badge is-neutral">
                {kpiData.uniqueContests} épreuve{kpiData.uniqueContests > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="contest-kpi-body">
            <span className="contest-kpi-label">Concours réalisés</span>
            <strong className="contest-kpi-value">{hasData ? kpiData.uniqueContests : 0}</strong>
            <span className="contest-kpi-note">Concours distincts passés</span>
          </div>
        </article>

        {/* Card 2 – Tentatives effectuées */}
        <article className="contest-kpi-card">
          <div className="contest-kpi-top">
            <div className="contest-kpi-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              🎯
            </div>
            {hasData && (
              <span className="contest-kpi-badge is-neutral">
                {kpiData.totalAttempts} total
              </span>
            )}
          </div>
          <div className="contest-kpi-body">
            <span className="contest-kpi-label">Tentatives effectuées</span>
            <strong className="contest-kpi-value">{hasData ? kpiData.totalAttempts : 0}</strong>
            <span className="contest-kpi-note">Nombre total d'essais</span>
          </div>
        </article>

        {/* Card 3 – Score moyen */}
        <article className="contest-kpi-card">
          <div className="contest-kpi-top">
            <div className="contest-kpi-icon" style={{ background: '#eff6ff', color: '#0284c7' }}>
              📈
            </div>
            {kpiData.trend && (
              <span className={`contest-kpi-badge ${kpiData.trend.status}`}>
                {kpiData.trend.text}
              </span>
            )}
          </div>
          <div className="contest-kpi-body">
            <span className="contest-kpi-label">Score moyen</span>
            <strong className="contest-kpi-value" style={{ color: '#0284c7' }}>
              {hasData && kpiData.avgScore !== null ? `${kpiData.avgScore}%` : '—'}
            </strong>
            <span className="contest-kpi-note">Moyenne générale</span>
          </div>
        </article>

        {/* Card 4 – Taux de réussite */}
        <article className="contest-kpi-card">
          <div className="contest-kpi-top">
            <div className="contest-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              ⭐
            </div>
            {hasData && kpiData.passRate !== null && (
              <span className="contest-kpi-badge is-up">
                {kpiData.passRate >= 60 ? 'Bon niveau' : 'À travailler'}
              </span>
            )}
          </div>
          <div className="contest-kpi-body">
            <span className="contest-kpi-label">Taux de réussite</span>
            <strong className="contest-kpi-value" style={{ color: '#059669' }}>
              {hasData && kpiData.passRate !== null ? `${kpiData.passRate}%` : '—'}
            </strong>
            <span className="contest-kpi-note">% bonnes réponses</span>
          </div>
        </article>

        {/* Card 5 – Réponses correctes */}
        <article className="contest-kpi-card">
          <div className="contest-kpi-top">
            <div className="contest-kpi-icon" style={{ background: '#ecfdf5', color: '#16a34a' }}>
              ✓
            </div>
            {hasData && (
              <span className="contest-kpi-badge is-up">
                +{kpiData.totalCorrect}
              </span>
            )}
          </div>
          <div className="contest-kpi-body">
            <span className="contest-kpi-label">Réponses correctes</span>
            <strong className="contest-kpi-value" style={{ color: '#16a34a' }}>
              {hasData ? kpiData.totalCorrect : 0}
            </strong>
            <span className="contest-kpi-note">Sur {kpiData.totalQuestions} questions</span>
          </div>
        </article>

        {/* Card 6 – Réponses incorrectes */}
        <article className="contest-kpi-card">
          <div className="contest-kpi-top">
            <div className="contest-kpi-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
              ✗
            </div>
            {hasData && kpiData.totalIncorrect > 0 && (
              <span className="contest-kpi-badge is-down">
                À revoir
              </span>
            )}
          </div>
          <div className="contest-kpi-body">
            <span className="contest-kpi-label">Réponses incorrectes</span>
            <strong className="contest-kpi-value" style={{ color: '#dc2626' }}>
              {hasData ? kpiData.totalIncorrect : 0}
            </strong>
            <span className="contest-kpi-note">Points à consolider</span>
          </div>
        </article>
      </section>

      {/* Si aucune donnée n'est disponible */}
      {!hasData && (
        <div className="contest-empty-state">
          <div className="contest-empty-icon">📊</div>
          <h3>Aucune tentative enregistrée</h3>
          <p>
            Vous n'avez pas encore réalisé de concours correspondant à ces filtres.
            Passez votre premier concours pour afficher vos visualisations graphiques et
            vos analyses détaillées.
          </p>
          <button
            type="button"
            className="contest-mistakes-btn"
            onClick={() => navigate('/client-concours')}
          >
            Découvrir les concours disponibles →
          </button>
        </div>
      )}

      {hasData && (
        <>
          {/* ------------------------------------------------------------------
              3. ROW 1 : GRAND GRAPHIQUE ÉVOLUTION (Line) + RÉPARTITION (Doughnut)
              ------------------------------------------------------------------ */}
          <div className="contest-grid-row contest-grid-row--overview">
            {/* Grand Graphique : Évolution des scores */}
            <article className="contest-panel-card contest-col-8">
              <div className="contest-panel-header">
                <div className="contest-panel-header-left">
                  <span className="contest-panel-kicker">CHRONOLOGIE</span>
                  <h2 className="contest-panel-title">Évolution de vos scores</h2>
                  <p className="contest-panel-desc">
                    Scores obtenus à chaque tentative avec la moyenne générale de référence.
                  </p>
                </div>
                <div className="contest-panel-header-right">
                  <span className="contest-count-badge">
                    {scoreEvolutionData.length} tentative{scoreEvolutionData.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', height: 108 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreEvolutionData} margin={{ top: 8, right: 12, left: 8, bottom: 2 }}>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(v) => `${v}%`}
                      axisLine={false}
                      tickLine={false}
                      width={54}
                      tickMargin={8}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 14,
                              padding: '12px 16px',
                              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
                              fontSize: 12,
                            }}
                          >
                            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                              {d.title}
                            </div>
                            <div style={{ color: '#2563eb', fontWeight: 700, marginBottom: 6 }}>
                              {d.school} · {d.subject}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 20, fontWeight: 850, color: '#2563eb' }}>
                                {d.score}%
                              </span>
                              <span style={{ color: '#64748b' }}>obtenu le {d.fullDate}</span>
                            </div>
                            <div style={{ color: '#475569', fontSize: 11.5 }}>
                              ✓ {d.correct} bonnes · ✗ {d.incorrect} erreurs (sur {d.total})
                            </div>
                          </div>
                        );
                      }}
                    />
                    {kpiData.avgScore !== null && (
                      <ReferenceLine
                        y={kpiData.avgScore}
                        stroke="#b9ccf5"
                        strokeDasharray="4 4"
                        label={{
                          value: `Moyenne : ${kpiData.avgScore}%`,
                          position: 'insideBottomRight',
                          offset: 8,
                          fill: '#203b5b',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke="#b9ccf5"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#b9ccf5', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#b9ccf5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* Doughnut Chart : Répartition des réponses */}
            <article className="contest-panel-card contest-col-4">
              <div className="contest-panel-header">
                <div className="contest-panel-header-left">
                  <span className="contest-panel-kicker">PRÉCISION</span>
                  <h2 className="contest-panel-title">Répartition des réponses</h2>
                  <p className="contest-panel-desc">
                    Ratio des réponses correctes vs incorrectes.
                  </p>
                </div>
              </div>

              <div className="contest-donut-container">
                <div className="contest-donut-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={responseDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius="58%"
                        outerRadius="82%"
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {responseDistributionData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="contest-donut-center-label">
                    <strong>{kpiData.totalQuestions}</strong>
                    <span>questions</span>
                  </div>
                </div>

                <div className="contest-donut-legend-list">
                  <div className="contest-donut-legend-item">
                    <div className="contest-donut-legend-left">
                      <span className="contest-donut-legend-dot" style={{ background: COLORS.success }} />
                      <span className="contest-donut-legend-title">Correctes</span>
                    </div>
                    <div className="contest-donut-legend-right">
                      <span className="contest-donut-legend-count" style={{ color: COLORS.success }}>
                        {kpiData.totalCorrect}
                      </span>
                      <span className="contest-donut-legend-pct">
                        ({kpiData.passRate ?? 0}%)
                      </span>
                    </div>
                  </div>

                  <div className="contest-donut-legend-item">
                    <div className="contest-donut-legend-left">
                      <span className="contest-donut-legend-dot" style={{ background: COLORS.danger }} />
                      <span className="contest-donut-legend-title">Incorrectes</span>
                    </div>
                    <div className="contest-donut-legend-right">
                      <span className="contest-donut-legend-count" style={{ color: COLORS.danger }}>
                        {kpiData.totalIncorrect}
                      </span>
                      <span className="contest-donut-legend-pct">
                        ({kpiData.passRate !== null ? 100 - kpiData.passRate : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* ------------------------------------------------------------------
              4. ROW 2 : PERFORMANCE PAR MATIÈRE + PAR ÉCOLE
              ------------------------------------------------------------------ */}
          <div className="contest-grid-row">
            {/* Horizontal Bar Chart : Performance par matière */}
            <article className="contest-panel-card contest-col-6">
              <div className="contest-panel-header">
                <div className="contest-panel-header-left">
                  <span className="contest-panel-kicker">MATIÈRES</span>
                  <h2 className="contest-panel-title">Performance par matière</h2>
                  <p className="contest-panel-desc">
                    Score moyen et taux de réussite obtenus uniquement dans les concours.
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={subjectPerformanceData}
                    margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
                  >
                    <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="subject"
                      type="category"
                      tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      formatter={(val, name) => [
                        `${val}%`,
                        name === 'avgScore' ? 'Score moyen' : 'Taux de réussite',
                      ]}
                    />
                    <Legend
                      formatter={(v) => (v === 'avgScore' ? 'Score moyen' : 'Taux de réussite')}
                    />
                    <Bar
                      dataKey="avgScore"
                      name="avgScore"
                      fill="#b9ccf5"
                      radius={[0, 6, 6, 0]}
                      barSize={14}
                    />
                    <Bar
                      dataKey="passRate"
                      name="passRate"
                      fill="#10b981"
                      radius={[0, 6, 6, 0]}
                      barSize={14}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* Vertical Bar Chart : Performance par école */}
            <article className="contest-panel-card contest-col-6">
              <div className="contest-panel-header">
                <div className="contest-panel-header-left">
                  <span className="contest-panel-kicker">ÉCOLES</span>
                  <h2 className="contest-panel-title">Comparaison des performances par école</h2>
                  <p className="contest-panel-desc">
                    Cliquez sur une école pour filtrer l'ensemble des statistiques.
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={schoolPerformanceData}
                    margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
                    onClick={(state) => {
                      if (state && state.activeLabel) {
                        setSelectedSchool(selectedSchool === state.activeLabel ? '' : state.activeLabel);
                        setSelectedYear('');
                        setTableYearFilter('');
                        setCurrentPage(1);
                      }
                    }}
                  >
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="school"
                      tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      width={54}
                      tickMargin={8}
                    />
                    <Tooltip
                      formatter={(val, name, item) => [
                        `${val}%`,
                        name === 'avgScore'
                          ? `Score moyen (${item.payload.attempts} tentative(s))`
                          : 'Taux de réussite',
                      ]}
                    />
                    <Bar
                      dataKey="avgScore"
                      name="Score moyen"
                      fill="#b9ccf5"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    >
                      {schoolPerformanceData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={selectedSchool === entry.school ? '#b9ccf5' : '#b9ccf5'}
                          cursor="pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          {/* ------------------------------------------------------------------
              5. ROW 3 : ÉVOLUTION DU TAUX DE RÉUSSITE (Area) + COMPARAISON DES TENTATIVES (Bar)
              ------------------------------------------------------------------ */}
          <div className="contest-grid-row">
            {/* Area Chart : Évolution du taux de réussite */}
            <article className="contest-panel-card contest-col-6">
              <div className="contest-panel-header">
                <div className="contest-panel-header-left">
                  <span className="contest-panel-kicker">PROGRESSION</span>
                  <h2 className="contest-panel-title">Évolution du taux de réussite</h2>
                  <p className="contest-panel-desc">
                    Pourcentage cumulé de bonnes réponses au fil des tentatives.
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={passRateEvolutionData}
                    margin={{ top: 12, right: 16, left: 8, bottom: 6 }}
                  >
                    <defs>
                      <linearGradient id="passRateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      width={54}
                      tickMargin={8}
                    />
                    <Tooltip
                      formatter={(val, name) => [
                        `${val}%`,
                        name === 'cumulativeRate' ? 'Taux cumulé' : 'Taux épreuve',
                      ]}
                      labelFormatter={(l, p) => p?.[0]?.payload?.title || l}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeRate"
                      name="Taux cumulé"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#passRateGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* Bar Chart : Comparaison des tentatives d'un même concours */}
            <article className="contest-panel-card contest-col-6">
              <div className="contest-panel-header">
                <div className="contest-panel-header-left">
                  <span className="contest-panel-kicker">ESSAIS MULTIPLES</span>
                  <h2 className="contest-panel-title">Comparaison de vos tentatives</h2>
                  <p className="contest-panel-desc">
                    {contestComparisonData.title
                      ? `Évolution sur : ${contestComparisonData.title}`
                      : "Progression entre la 1ère, 2e et 3e tentative d'un même concours."}
                  </p>
                </div>
              </div>

              {contestComparisonData.data.length > 1 ? (
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={contestComparisonData.data}
                      margin={{ top: 12, right: 16, left: 8, bottom: 6 }}
                    >
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="attemptLabel" tick={{ fontSize: 12, fontWeight: 700 }} />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} width={54} tickMargin={8} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                      <Bar dataKey="score" name="Score" fill="#7c3aed" radius={[8, 8, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 250,
                    textAlign: 'center',
                    color: '#64748b',
                    gap: 8,
                    padding: 20,
                  }}
                >
                  <span style={{ fontSize: 32 }}>🔁</span>
                  <strong style={{ color: '#1e293b' }}>Aucune tentative multiple pour l'instant</strong>
                  <span style={{ fontSize: 13, maxWidth: 360 }}>
                    Retentez un même concours une deuxième fois pour visualiser l'amélioration de votre score.
                  </span>
                </div>
              )}
            </article>
          </div>

          {/* ------------------------------------------------------------------
              6. ROW 4 : POINTS FORTS & POINTS À AMÉLIORER (Side-by-side Cards)
              ------------------------------------------------------------------ */}
          <div className="contest-insights-grid" style={{ marginBottom: 24 }}>
            {/* Points forts */}
            <article className="contest-insight-card is-strength">
              <div className="contest-insight-head">
                <div className="contest-insight-head-icon">✓</div>
                <div className="contest-insight-head-text">
                  <h3>POINTS FORTS</h3>
                  <span>Matières maîtrisées et progrès notables</span>
                </div>
              </div>
              <div className="contest-insight-list">
                {insights.strengths.map((s, idx) => (
                  <div className="contest-insight-item" key={idx}>
                    <span className="contest-insight-item-dot" />
                    <div>
                      <strong>{s.title} : </strong>
                      <span>{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Points à améliorer */}
            <article className="contest-insight-card is-improvement">
              <div className="contest-insight-head">
                <div className="contest-insight-head-icon">!</div>
                <div className="contest-insight-head-text">
                  <h3>À AMÉLIORER</h3>
                  <span>Axes prioritaires de révision</span>
                </div>
              </div>
              <div className="contest-insight-list">
                {insights.improvements.map((im, idx) => (
                  <div className="contest-insight-item" key={idx}>
                    <span className="contest-insight-item-dot" />
                    <div>
                      <strong>{im.title} : </strong>
                      <span>{im.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          {/* ------------------------------------------------------------------
              7. ROW 5 : PERFORMANCE PAR MATIÈRE + QUESTIONS À REVOIR
              ------------------------------------------------------------------ */}
          <div className="contest-grid-row">
            {/* Performance par matière */}
            <article className="contest-panel-card contest-col-7">
              <div className="contest-panel-header">
                <div className="contest-panel-header-left">
                  <span className="contest-panel-kicker">PRÉCISION THÉMATIQUE</span>
                  <h2 className="contest-panel-title">Analyse des performances par matière</h2>
                  <p className="contest-panel-desc">
                    Taux de réussite et réponses évaluées par matière dans vos concours.
                  </p>
                </div>
              </div>

              {/* Filtres par matière */}
              <div className="contest-tabs-pills">
                {['ALL', ...accuracySubjects].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`contest-tab-pill ${activeAccuracySubject === m ? 'is-active' : ''}`}
                    onClick={() => setSelectedAccuracySubject(m)}
                  >
                    {m === 'ALL' ? 'Toutes les matières' : m}
                  </button>
                ))}
              </div>

              <div className="contest-subject-list">
                {filteredSubjectAccuracy.length > 0 ? (
                  filteredSubjectAccuracy.map((subject) => (
                    <div className="contest-subject-item" key={subject.subject}>
                      <div className="contest-subject-item-top">
                        <span className="contest-subject-name">{subject.subject}</span>
                        <strong
                          className="contest-subject-badge"
                          style={{
                            color: subject.rate >= 70 ? '#059669' : subject.rate >= 50 ? '#2563eb' : '#dc2626',
                          }}
                        >
                          {subject.rate}%
                        </strong>
                      </div>
                      <div className="contest-subject-track">
                        <div
                          className="contest-subject-fill"
                          style={{
                            width: `${subject.rate}%`,
                            background: subject.rate >= 70 ? '#10b981' : subject.rate >= 50 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <div className="contest-subject-meta">
                        <span>
                          {subject.correct} correcte(s) / {subject.total} question(s) ({subject.incorrect} erreur(s))
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                    Aucune réponse évaluée par matière pour le moment.
                  </div>
                )}
              </div>
            </article>

            {/* Questions sauvegardées et questions incorrectes */}
            <article className="contest-panel-card contest-col-5">
              <div className="contest-panel-header">
                <div className="contest-panel-header-left">
                  <span className="contest-panel-kicker">RÉVISION CIBLÉE</span>
                  <h2 className="contest-panel-title">Questions à revoir</h2>
                  <p className="contest-panel-desc">
                    Vos erreurs et questions marquées pour révision.
                  </p>
                </div>
              </div>

              <div className="contest-mistakes-overview">
                <div className="contest-mistake-stat-pill">
                  <strong>{kpiData.totalIncorrect}</strong>
                  <span>Erreurs QCM</span>
                </div>
                <div className="contest-mistake-stat-pill">
                  <strong>{filteredAttempts.length}</strong>
                  <span>Épreuves</span>
                </div>
                <div className="contest-mistake-stat-pill">
                  <strong>{kpiData.totalCorrect}</strong>
                  <span>Acquis validés</span>
                </div>
                <div className="contest-mistake-stat-pill">
                  <strong style={{ color: '#2563eb' }}>{kpiData.passRate ?? 0}%</strong>
                  <span>Taux global</span>
                </div>
              </div>

              <div className="contest-mistakes-cta">
                <div className="contest-mistakes-cta-text">
                  <h4>Espace Erreurs & Corrections</h4>
                  <p>
                    Révisez chaque question incorrecte avec sa correction détaillée et son explication pas à pas.
                  </p>
                </div>
                <button
                  type="button"
                  className="contest-mistakes-btn"
                  onClick={() => navigate('/client-erreurs?view=all')}
                >
                  Voir mes questions à revoir →
                </button>
              </div>
            </article>
          </div>

          {/* ------------------------------------------------------------------
              8. ROW 6 : HISTORIQUE COMPLET DES CONCOURS (Tableau)
              ------------------------------------------------------------------ */}
          <article className="contest-panel-card" style={{ marginBottom: 24 }}>
            <div className="contest-panel-header">
              <div className="contest-panel-header-left">
                <span className="contest-panel-kicker">HISTORIQUE DÉTAILLÉ</span>
                <h2 className="contest-panel-title">Historique des concours réalisés</h2>
                <p className="contest-panel-desc">
                  Consultez l'ensemble de vos tentatives, vos scores et le détail des questions.
                </p>
              </div>
              <div className="contest-panel-header-right">
                <span className="contest-count-badge">
                  {sortedTableData.length} résultat{sortedTableData.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Barre de recherche et filtres de tableau */}
            <div className="contest-table-toolbar">
              <input
                type="text"
                className="contest-search-input"
                placeholder="Rechercher par école, titre ou matière..."
                value={searchTable}
                onChange={(e) => {
                  setSearchTable(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                {availableYears.length > 0 && (
                  <select
                    className="contest-filter-field"
                    style={{ height: 40, padding: '0 10px', minWidth: 100 }}
                    value={tableYearFilter}
                    onChange={(e) => {
                      setTableYearFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Toutes années</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  className="contest-filter-field"
                  style={{ height: 40, padding: '0 10px', minWidth: 130 }}
                  value={tableSort}
                  onChange={(e) => setTableSort(e.target.value)}
                >
                  <option value="date-desc">Plus récents</option>
                  <option value="score-desc">Meilleurs scores</option>
                  <option value="score-asc">Scores à améliorer</option>
                </select>
              </div>
            </div>

            {/* Tableau */}
            <div className="contest-table-container">
              <table className="contest-table">
                <thead>
                  <tr>
                    <th>École</th>
                    <th>Concours</th>
                    <th>Année</th>
                    <th>Matière</th>
                    <th>Score</th>
                    <th>Correctes</th>
                    <th>Incorrectes</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTableData.length > 0 ? (
                    paginatedTableData.map((att, idx) => {
                      const scoreNum = Number(att.score) || 0;
                      const isHigh = scoreNum >= 70;
                      const isMid = scoreNum >= 50 && scoreNum < 70;
                      return (
                        <tr key={idx}>
                          <td>
                            <span className="contest-school-badge">{att.school || 'Concours'}</span>
                          </td>
                          <td style={{ fontWeight: 700, maxWidth: 220 }}>
                            {att.resourceTitle || 'Épreuve'}
                          </td>
                          <td>{att.year || '—'}</td>
                          <td>{att.subject || 'Général'}</td>
                          <td>
                            <span
                              className={`contest-score-pill ${
                                isHigh ? 'is-high' : isMid ? 'is-mid' : 'is-low'
                              }`}
                            >
                              {scoreNum}%
                            </span>
                          </td>
                          <td style={{ color: '#059669', fontWeight: 700 }}>
                            {att.correctAnswers || 0}
                          </td>
                          <td style={{ color: '#dc2626', fontWeight: 700 }}>
                            {Math.max(
                              0,
                              (Number(att.totalQuestions) || 0) - (Number(att.correctAnswers) || 0)
                            )}
                          </td>
                          <td style={{ color: '#64748b' }}>{formatDate(att.answeredAt)}</td>
                          <td>
                            <button
                              type="button"
                              className="contest-view-details-btn"
                              onClick={() => setSelectedAttemptModal(att)}
                            >
                              Voir détails 👁
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                        Aucun concours ne correspond à votre recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="contest-pagination">
                <span>
                  Page {currentPage} sur {totalPages} ({sortedTableData.length} résultats)
                </span>
                <div className="contest-pagination-btns">
                  <button
                    type="button"
                    className="contest-page-btn"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`contest-page-btn ${currentPage === p ? 'is-active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="contest-page-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </article>

          {/* ------------------------------------------------------------------
              9. ROW 7 : RECOMMANDATIONS PERSONNALISÉES
              ------------------------------------------------------------------ */}
          <article className="contest-panel-card">
            <div className="contest-panel-header">
              <div className="contest-panel-header-left">
                <span className="contest-panel-kicker">CONSEILS INTELLIGENTS</span>
                <h2 className="contest-panel-title">Recommandations pour progresser</h2>
                <p className="contest-panel-desc">
                  Pistes d'action calculées à partir de vos résultats réels pour maximiser votre classement.
                </p>
              </div>
            </div>

            <div className="contest-recommendations-grid">
              {recommendations.map((rec, idx) => (
                <div className="contest-recommendation-card" key={idx}>
                  <div className="contest-recommendation-top">
                    <div className="contest-recommendation-copy">
                      <h4>{rec.title}</h4>
                      <p>{rec.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="contest-recommendation-action-btn"
                    onClick={rec.onClick}
                  >
                    {rec.actionLabel} →
                  </button>
                </div>
              ))}
            </div>
          </article>
        </>
      )}

      {/* --------------------------------------------------------------------
          MODAL : DÉTAILS COMPLETS D'UNE TENTATIVE
          -------------------------------------------------------------------- */}
      {selectedAttemptModal && (
        <div className="contest-modal-backdrop" onClick={() => setSelectedAttemptModal(null)}>
          <div className="contest-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="contest-modal-header">
              <div>
                <h3>{selectedAttemptModal.resourceTitle || 'Détails du concours'}</h3>
                <p>
                  {selectedAttemptModal.school} · {selectedAttemptModal.subject} · Réalisé le{' '}
                  {formatDate(selectedAttemptModal.answeredAt)}
                </p>
              </div>
              <button
                type="button"
                className="contest-modal-close"
                onClick={() => setSelectedAttemptModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="contest-modal-body">
              {/* Barre de score */}
              <div className="contest-modal-kpi-bar">
                <div className="contest-modal-kpi-item">
                  <strong style={{ color: '#2563eb' }}>
                    {Math.round(Number(selectedAttemptModal.score) || 0)}%
                  </strong>
                  <span>Score obtenu</span>
                </div>
                <div className="contest-modal-kpi-item">
                  <strong style={{ color: '#059669' }}>
                    {selectedAttemptModal.correctAnswers || 0}
                  </strong>
                  <span>Bonnes réponses</span>
                </div>
                <div className="contest-modal-kpi-item">
                  <strong style={{ color: '#dc2626' }}>
                    {Math.max(
                      0,
                      (Number(selectedAttemptModal.totalQuestions) || 0) -
                        (Number(selectedAttemptModal.correctAnswers) || 0)
                    )}
                  </strong>
                  <span>Erreurs</span>
                </div>
                <div className="contest-modal-kpi-item">
                  <strong>{selectedAttemptModal.totalQuestions || 0}</strong>
                  <span>Total questions</span>
                </div>
              </div>

              {/* Liste des questions */}
              <h4 style={{ margin: '8px 0 0 0', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                Questions et réponses de la session :
              </h4>

              {Array.isArray(selectedAttemptModal.answers) && selectedAttemptModal.answers.length > 0 ? (
                selectedAttemptModal.answers.map((ans, qIdx) => (
                  <div
                    key={qIdx}
                    className={`contest-modal-question-item ${
                      ans.correct ? 'is-correct' : 'is-wrong'
                    }`}
                  >
                    <div className="contest-modal-question-top">
                      <strong style={{ fontSize: 13, color: '#0f172a' }}>
                        Question {ans.questionNumber || qIdx + 1}
                      </strong>
                      <span className="contest-modal-question-badge">
                        {ans.correct ? '✓ Correcte' : '✗ À revoir'}
                      </span>
                    </div>

                    <div className="contest-modal-question-text">
                      {ans.questionText || 'Énoncé de la question'}
                    </div>

                    <div className="contest-modal-answers-diff">
                      <div className="contest-modal-choice-box">
                        <strong style={{ color: ans.correct ? '#059669' : '#dc2626' }}>
                          Votre réponse :
                        </strong>
                        <span>
                          {ans.selectedChoiceText || ans.selectedChoiceLabel || 'Non répondu'}
                        </span>
                      </div>
                      <div className="contest-modal-choice-box">
                        <strong style={{ color: '#059669' }}>Réponse attendue :</strong>
                        <span>{ans.correctChoiceText || ans.correctChoiceLabel || '—'}</span>
                      </div>
                    </div>

                    {ans.explanation && (
                      <div className="contest-modal-explanation">
                        <strong>💡 Explication : </strong>
                        <span>{ans.explanation}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748b', fontSize: 13, padding: 20, textAlign: 'center' }}>
                  Le détail des questions individuelles n'est pas enregistré pour cette ancienne tentative.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

