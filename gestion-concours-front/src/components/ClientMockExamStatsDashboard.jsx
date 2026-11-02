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
import MathContent from './MathContent';
import { readStudentMistakes } from '../studentProgress';
import './ClientMockExamStatsDashboard.css';

const API_BASE = '';

const COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  purple: '#8b5cf6',
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

export default function ClientMockExamStatsDashboard({
  schoolAttempts = [],
  studentActivities = [],
  schoolDataLoading = false,
  schoolHistoryError = false,
  user = {},
}) {
  const navigate = useNavigate();

  // --------------------------------------------------------------------------
  // 1. FILTERS STATE
  // --------------------------------------------------------------------------
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // '7', '30', '90', '180', 'all'
  const [selectedMockExamId, setSelectedMockExamId] = useState('');
  const [latestAttemptOnly, setLatestAttemptOnly] = useState(false);

  // Table filters & pagination
  const [searchTable, setSearchTable] = useState('');
  const [tableSubjectFilter, setTableSubjectFilter] = useState('');
  const [tablePeriodFilter, setTablePeriodFilter] = useState('all');
  const [tableSort, setTableSort] = useState('date-desc'); // 'date-desc', 'score-desc', 'score-asc'
  const [currentPage, setCurrentPage] = useState(1);

  // Active chapter tab filter
  const [activeChapterTab, setActiveChapterTab] = useState('all');

  // Selected exam for multi-attempt comparison
  const [selectedComparisonExamId, setSelectedComparisonExamId] = useState('');

  // Modal detail view
  const [modalAttempt, setModalAttempt] = useState(null);

  // Saved mistakes from API / local
  const [savedMistakesList, setSavedMistakesList] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchSavedMistakes = async () => {
      let studentId = user?.id;
      if (!studentId) {
        try { studentId = JSON.parse(localStorage.getItem('user') || '{}')?.id; } catch { }
      }
      try {
        const localSaved = readStudentMistakes().filter(m => m.savedForReview);
        const token = localStorage.getItem('authToken');
        if (studentId && token) {
          const res = await axios.get(`${API_BASE}/api/student-mistakes`, {
            params: { studentId, kind: 'all' },
            headers: { Authorization: `Bearer ${token}` }
          });
          if (active && Array.isArray(res.data)) {
            const merged = res.data.map(item => ({ ...item, savedForReview: true }));
            const keys = new Set(merged.map((item) => `${item.sourceType || item.resourceType || ''}|${item.resourceId}|${item.questionId || item.questionNumber || ''}|${item.savedManually === false ? 'automatic' : 'manual'}`));
            localSaved.forEach(local => {
              const key = `${local.sourceType || local.resourceType || ''}|${local.resourceId}|${local.questionId || local.questionNumber || ''}|${local.savedManually === false ? 'automatic' : 'manual'}`;
              if (!keys.has(key)) {
                merged.push(local);
                keys.add(key);
              }
            });
            setSavedMistakesList(merged);
            return;
          }
        }
        if (active) setSavedMistakesList(localSaved);
      } catch {
        if (active) setSavedMistakesList(readStudentMistakes().filter(m => m.savedForReview));
      }
    };
    fetchSavedMistakes();
    window.addEventListener('student-mistakes-updated', fetchSavedMistakes);
    window.addEventListener('student-qcm-history-updated', fetchSavedMistakes);
    return () => {
      active = false;
      window.removeEventListener('student-mistakes-updated', fetchSavedMistakes);
      window.removeEventListener('student-qcm-history-updated', fetchSavedMistakes);
    };
  }, [user?.id]);

  // --------------------------------------------------------------------------
  // 2. RAW MOCK EXAM ATTEMPTS FILTERING
  // --------------------------------------------------------------------------
  const allMockAttempts = useMemo(() => {
    return (schoolAttempts || [])
      .filter((attempt) => {
        const type = String(attempt.resourceType || '').toLowerCase();
        const isMock = type.includes('blanc') || type === 'concours-blanc';
        const answered = Number(attempt.totalQuestions) || 0;
        return isMock && answered > 0;
      })
      .map((attempt) => ({
        ...attempt,
        normalizedSubject: normalizeSubject(attempt.subject),
        scoreNum: Number(attempt.score) || 0,
        correctNum: Number(attempt.correctAnswers) || 0,
        totalNum: Number(attempt.totalQuestions) || 0,
        wrongNum: Math.max(0, (Number(attempt.totalQuestions) || 0) - (Number(attempt.correctAnswers) || 0)),
        dateObj: new Date(attempt.answeredAt),
        timestamp: new Date(attempt.answeredAt).getTime(),
      }))
      .filter((attempt) => !isNaN(attempt.timestamp))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [schoolAttempts]);

  // Options for filter dropdowns
  const availableSubjects = useMemo(() => {
    const list = [...new Set(allMockAttempts.map((a) => a.normalizedSubject).filter(Boolean))];
    return list.sort();
  }, [allMockAttempts]);

  const availableChapters = useMemo(() => {
    const filtered = selectedSubject
      ? allMockAttempts.filter((a) => a.normalizedSubject === selectedSubject)
      : allMockAttempts;
    const chapters = [...new Set(filtered.map((a) => String(a.chapter || '').trim()).filter(Boolean))];
    return chapters.sort();
  }, [allMockAttempts, selectedSubject]);

  const availableMockExams = useMemo(() => {
    const map = new Map();
    allMockAttempts.forEach((a) => {
      const id = String(a.resourceId);
      if (!map.has(id)) {
        map.set(id, {
          resourceId: id,
          title: a.resourceTitle || `Concours Blanc #${id}`,
          subject: a.normalizedSubject,
          chapter: a.chapter || '',
          count: 1
        });
      } else {
        map.get(id).count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [allMockAttempts]);

  // Set default comparison exam if not chosen
  useEffect(() => {
    if (!selectedComparisonExamId && availableMockExams.length > 0) {
      // Pick first exam with multiple attempts, or the first one
      const multi = availableMockExams.find(e => e.count > 1);
      setSelectedComparisonExamId(multi ? multi.resourceId : availableMockExams[0].resourceId);
    }
  }, [availableMockExams, selectedComparisonExamId]);

  // --------------------------------------------------------------------------
  // 3. APPLY FILTERS TO ACTIVE ATTEMPTS
  // --------------------------------------------------------------------------
  const filteredAttempts = useMemo(() => {
    const now = Date.now();
    let result = allMockAttempts.filter((attempt) => {
      // Filter by subject
      if (selectedSubject && attempt.normalizedSubject !== selectedSubject) return false;
      // Filter by chapter
      if (selectedChapter && String(attempt.chapter || '').trim() !== selectedChapter) return false;
      // Filter by mock exam
      if (selectedMockExamId && String(attempt.resourceId) !== String(selectedMockExamId)) return false;
      // Filter by period
      if (selectedPeriod !== 'all') {
        const days = Number(selectedPeriod);
        if (now - attempt.timestamp > days * 86400000) return false;
      }
      return true;
    });

    // If latest attempt only
    if (latestAttemptOnly) {
      const latestMap = new Map();
      result.forEach((a) => {
        const id = String(a.resourceId);
        if (!latestMap.has(id) || a.timestamp > latestMap.get(id).timestamp) {
          latestMap.set(id, a);
        }
      });
      result = Array.from(latestMap.values());
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [allMockAttempts, selectedSubject, selectedChapter, selectedMockExamId, selectedPeriod, latestAttemptOnly]);

  // --------------------------------------------------------------------------
  // 4. STATISTICAL KPI CALCULATIONS
  // --------------------------------------------------------------------------
  const kpiStats = useMemo(() => {
    const totalAttempts = filteredAttempts.length;
    if (totalAttempts === 0) {
      return {
        distinctExams: 0,
        totalAttempts: 0,
        avgScore: 0,
        passRate: 0,
        totalCorrect: 0,
        totalWrong: 0,
        evolutionScore: 0,
        evolutionRate: 0,
      };
    }

    const distinctExams = new Set(filteredAttempts.map((a) => a.resourceId)).size;
    const totalCorrect = filteredAttempts.reduce((sum, a) => sum + a.correctNum, 0);
    const totalQuestions = filteredAttempts.reduce((sum, a) => sum + a.totalNum, 0);
    const totalWrong = filteredAttempts.reduce((sum, a) => sum + a.wrongNum, 0);

    const scores = filteredAttempts.map((a) => a.scoreNum);
    const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    const passRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Progression / Evolution: compare recent half vs older half
    let evolutionScore = 0;
    let evolutionRate = 0;
    if (totalAttempts >= 2) {
      const sortedAsc = [...filteredAttempts].sort((a, b) => a.timestamp - b.timestamp);
      const mid = Math.floor(sortedAsc.length / 2);
      const firstHalf = sortedAsc.slice(0, mid);
      const secondHalf = sortedAsc.slice(mid);

      const avg1 = firstHalf.reduce((s, a) => s + a.scoreNum, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, a) => s + a.scoreNum, 0) / secondHalf.length;
      evolutionScore = Math.round(avg2 - avg1);

      const r1 = firstHalf.reduce((s, a) => s + a.correctNum, 0) / Math.max(1, firstHalf.reduce((s, a) => s + a.totalNum, 0));
      const r2 = secondHalf.reduce((s, a) => s + a.correctNum, 0) / Math.max(1, secondHalf.reduce((s, a) => s + a.totalNum, 0));
      evolutionRate = Math.round((r2 - r1) * 100);
    }

    return {
      distinctExams,
      totalAttempts,
      avgScore,
      passRate,
      totalCorrect,
      totalWrong,
      evolutionScore,
      evolutionRate,
    };
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 5. CHART DATA: LINE CHART (ÉVOLUTION DES SCORES)
  // --------------------------------------------------------------------------
  const scoreEvolutionData = useMemo(() => {
    const chronological = [...filteredAttempts].sort((a, b) => a.timestamp - b.timestamp);
    return chronological.map((attempt, index) => ({
      index: index + 1,
      name: attempt.resourceTitle || `CB #${attempt.resourceId}`,
      rawDate: attempt.answeredAt,
      dateFormatted: formatShortDate(attempt.answeredAt),
      score: attempt.scoreNum,
      correct: attempt.correctNum,
      wrong: attempt.wrongNum,
      subject: attempt.normalizedSubject,
      chapter: attempt.chapter || 'Général',
      attemptId: attempt.attemptId || index + 1,
    }));
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 6. CHART DATA: DOUGHNUT CHART (RÉPARTITION DES RÉPONSES)
  // --------------------------------------------------------------------------
  const doughnutData = useMemo(() => {
    const totalQuestions = filteredAttempts.reduce((sum, a) => sum + (a.totalNum || a.expectedQuestions || 0), 0);
    const correct = filteredAttempts.reduce((sum, a) => sum + a.correctNum, 0);
    const wrong = filteredAttempts.reduce((sum, a) => sum + a.wrongNum, 0);
    const unanswered = Math.max(0, totalQuestions - (correct + wrong));

    return [
      { name: 'Réponses correctes', value: correct, color: COLORS.success },
      { name: 'Réponses incorrectes', value: wrong, color: COLORS.danger },
      { name: 'Non répondues', value: unanswered, color: COLORS.muted },
    ].filter((d) => d.value > 0);
  }, [filteredAttempts]);

  const totalQuestionsSum = useMemo(() => {
    return doughnutData.reduce((sum, d) => sum + d.value, 0);
  }, [doughnutData]);

  // --------------------------------------------------------------------------
  // 7. CHART DATA: HORIZONTAL BAR CHART (PERFORMANCE PAR MATIÈRE)
  // --------------------------------------------------------------------------
  const subjectPerformanceData = useMemo(() => {
    const map = new Map();
    const subjects = ['Mathématiques', 'Physique-Chimie', 'SVT'];

    subjects.forEach(sub => {
      map.set(sub, { subject: sub, attemptsCount: 0, totalScore: 0, correct: 0, totalQuestions: 0 });
    });

    filteredAttempts.forEach((a) => {
      const sub = a.normalizedSubject;
      if (!map.has(sub)) {
        map.set(sub, { subject: sub, attemptsCount: 0, totalScore: 0, correct: 0, totalQuestions: 0 });
      }
      const entry = map.get(sub);
      entry.attemptsCount += 1;
      entry.totalScore += a.scoreNum;
      entry.correct += a.correctNum;
      entry.totalQuestions += a.totalNum;
    });

    return Array.from(map.values())
      .map((entry) => ({
        subject: entry.subject,
        attemptsCount: entry.attemptsCount,
        questionsCount: entry.totalQuestions,
        avgScore: entry.attemptsCount > 0 ? Math.round(entry.totalScore / entry.attemptsCount) : 0,
        passRate: entry.totalQuestions > 0 ? Math.round((entry.correct / entry.totalQuestions) * 100) : 0,
      }))
      .filter((s) => s.attemptsCount > 0 || subjects.includes(s.subject));
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 8. CHART DATA: AREA CHART (ÉVOLUTION DU TAUX DE RÉUSSITE)
  // --------------------------------------------------------------------------
  const successRateTrendData = useMemo(() => {
    const chronological = [...filteredAttempts].sort((a, b) => a.timestamp - b.timestamp);
    let cumulativeCorrect = 0;
    let cumulativeTotal = 0;

    return chronological.map((a, index) => {
      cumulativeCorrect += a.correctNum;
      cumulativeTotal += a.totalNum;
      const currentRate = a.totalNum > 0 ? Math.round((a.correctNum / a.totalNum) * 100) : a.scoreNum;
      const runningAvg = cumulativeTotal > 0 ? Math.round((cumulativeCorrect / cumulativeTotal) * 100) : currentRate;

      return {
        step: index + 1,
        dateFormatted: formatShortDate(a.answeredAt),
        rate: currentRate,
        runningAvg,
        name: a.resourceTitle || `CB #${a.resourceId}`,
      };
    });
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 9. CHART DATA: BAR CHART (COMPARAISON DES TENTATIVES D'UN MÊME CONCOURS)
  // --------------------------------------------------------------------------
  const comparisonExamAttempts = useMemo(() => {
    if (!selectedComparisonExamId) return [];
    const matches = allMockAttempts
      .filter((a) => String(a.resourceId) === String(selectedComparisonExamId))
      .sort((a, b) => a.timestamp - b.timestamp);

    return matches.map((attempt, index) => ({
      label: `Tentative ${index + 1}`,
      score: attempt.scoreNum,
      correct: attempt.correctNum,
      wrong: attempt.wrongNum,
      date: formatDate(attempt.answeredAt),
      attemptNumber: index + 1,
      isBest: false,
    }));
  }, [allMockAttempts, selectedComparisonExamId]);

  // Mark best attempt in comparison
  const comparisonDataWithBest = useMemo(() => {
    if (!comparisonExamAttempts.length) return [];
    const maxScore = Math.max(...comparisonExamAttempts.map(a => a.score));
    return comparisonExamAttempts.map(a => ({
      ...a,
      isBest: a.score === maxScore && maxScore > 0
    }));
  }, [comparisonExamAttempts]);

  const bestComparisonScore = useMemo(() => {
    if (!comparisonExamAttempts.length) return null;
    return Math.max(...comparisonExamAttempts.map(a => a.score));
  }, [comparisonExamAttempts]);

  // --------------------------------------------------------------------------
  // 10. STRENGTHS & WEAKNESSES ANALYSIS
  // --------------------------------------------------------------------------
  const insights = useMemo(() => {
    const chapterMap = new Map();
    filteredAttempts.forEach((a) => {
      const ch = String(a.chapter || a.normalizedSubject || 'Général').trim();
      if (!chapterMap.has(ch)) {
        chapterMap.set(ch, { name: ch, subject: a.normalizedSubject, scores: [], wrongTotal: 0, totalQ: 0 });
      }
      const entry = chapterMap.get(ch);
      entry.scores.push(a.scoreNum);
      entry.wrongTotal += a.wrongNum;
      entry.totalQ += a.totalNum;
    });

    const chapterList = Array.from(chapterMap.values()).map((entry) => ({
      name: entry.name,
      subject: entry.subject,
      avgScore: Math.round(entry.scores.reduce((s, v) => s + v, 0) / entry.scores.length),
      wrongTotal: entry.wrongTotal,
      errorRate: entry.totalQ > 0 ? Math.round((entry.wrongTotal / entry.totalQ) * 100) : 0,
      attempts: entry.scores.length,
    }));

    const strengths = chapterList
      .filter((c) => c.avgScore >= 65)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 4);

    const improvements = chapterList
      .filter((c) => c.avgScore < 65 || c.errorRate > 30)
      .sort((a, b) => b.wrongTotal - a.wrongTotal || a.avgScore - b.avgScore)
      .slice(0, 4);

    return { strengths, improvements, allChapters: chapterList };
  }, [filteredAttempts]);

  // --------------------------------------------------------------------------
  // 11. DETAILED CHAPTERS PERFORMANCE (WITH SUBJECT TABS)
  // --------------------------------------------------------------------------
  const detailedChapters = useMemo(() => {
    const filteredByTab = activeChapterTab === 'all'
      ? insights.allChapters
      : insights.allChapters.filter(c => c.subject === activeChapterTab);

    return filteredByTab.sort((a, b) => b.avgScore - a.avgScore);
  }, [insights.allChapters, activeChapterTab]);

  // --------------------------------------------------------------------------
  // 12. ERROR ANALYSIS (TOP CHAPTERS WITH MOST ERRORS)
  // --------------------------------------------------------------------------
  const errorChaptersData = useMemo(() => {
    return [...insights.allChapters]
      .filter(c => c.wrongTotal > 0)
      .sort((a, b) => b.wrongTotal - a.wrongTotal)
      .slice(0, 6)
      .map(c => ({
        chapter: c.name.length > 22 ? `${c.name.slice(0, 20)}…` : c.name,
        fullName: c.name,
        errors: c.wrongTotal,
        errorRate: c.errorRate,
        subject: c.subject,
      }));
  }, [insights.allChapters]);

  // --------------------------------------------------------------------------
  // 13. SAVED QUESTIONS STATS
  // --------------------------------------------------------------------------
  const savedQuestionsStats = useMemo(() => {
    const contestMistakes = savedMistakesList.filter((mistake) => String(mistake.sourceType || mistake.resourceType || '').toLowerCase().includes('blanc'));
    const autoSaved = contestMistakes.filter(m => m.savedManually === false);
    const manualSaved = contestMistakes.filter(m => m.savedManually !== false);
    const reviewed = contestMistakes.filter(m => m.resolved || m.reviewed);

    return {
      total: contestMistakes.length,
      autoCount: autoSaved.length,
      manualCount: manualSaved.length,
      reviewedCount: reviewed.length,
      pendingCount: Math.max(0, contestMistakes.length - reviewed.length),
    };
  }, [savedMistakesList]);

  // --------------------------------------------------------------------------
  // 14. TABLE DATA & PAGINATION (HISTORIQUE DES CONCOURS BLANCS)
  // --------------------------------------------------------------------------
  // Group attempts by mock exam or display individual attempts
  const groupedTableData = useMemo(() => {
    const examMap = new Map();

    allMockAttempts.forEach((attempt) => {
      const id = String(attempt.resourceId);
      if (!examMap.has(id)) {
        examMap.set(id, {
          resourceId: id,
          title: attempt.resourceTitle || `Concours Blanc #${id}`,
          subject: attempt.normalizedSubject,
          chapter: attempt.chapter || '',
          attempts: [],
          latestDate: attempt.answeredAt,
          bestScore: attempt.scoreNum,
          latestScore: attempt.scoreNum,
          totalCorrect: 0,
          totalQuestions: 0,
        });
      }
      const group = examMap.get(id);
      group.attempts.push(attempt);
      if (new Date(attempt.answeredAt) > new Date(group.latestDate)) {
        group.latestDate = attempt.answeredAt;
        group.latestScore = attempt.scoreNum;
      }
      if (attempt.scoreNum > group.bestScore) {
        group.bestScore = attempt.scoreNum;
      }
      group.totalCorrect += attempt.correctNum;
      group.totalQuestions += attempt.totalNum;
    });

    let list = Array.from(examMap.values()).map(g => ({
      ...g,
      attemptsCount: g.attempts.length,
      passRate: g.totalQuestions > 0 ? Math.round((g.totalCorrect / g.totalQuestions) * 100) : g.latestScore,
    }));

    // Search filter
    if (searchTable.trim()) {
      const q = searchTable.toLowerCase().trim();
      list = list.filter(item =>
        item.title.toLowerCase().includes(q)
        || item.subject.toLowerCase().includes(q)
        || item.chapter.toLowerCase().includes(q)
      );
    }

    // Table subject filter
    if (tableSubjectFilter) {
      list = list.filter(item => item.subject === tableSubjectFilter);
    }

    // Table period filter
    if (tablePeriodFilter !== 'all') {
      const days = Number(tablePeriodFilter);
      const now = Date.now();
      list = list.filter(item => (now - new Date(item.latestDate).getTime()) <= days * 86400000);
    }

    // Sorting
    list.sort((a, b) => {
      if (tableSort === 'score-desc') return b.bestScore - a.bestScore;
      if (tableSort === 'score-asc') return a.bestScore - b.bestScore;
      // Default: date-desc
      return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
    });

    return list;
  }, [allMockAttempts, searchTable, tableSubjectFilter, tablePeriodFilter, tableSort]);

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(groupedTableData.length / itemsPerPage));
  const paginatedTableData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedTableData.slice(start, start + itemsPerPage);
  }, [groupedTableData, currentPage]);

  const handleResetFilters = () => {
    setSelectedSubject('');
    setSelectedChapter('');
    setSelectedPeriod('all');
    setSelectedMockExamId('');
    setLatestAttemptOnly(false);
    setSearchTable('');
    setTableSubjectFilter('');
    setTablePeriodFilter('all');
    setTableSort('date-desc');
    setCurrentPage(1);
  };

  // --------------------------------------------------------------------------
  // 15. PERSONALIZED RECOMMENDATIONS GENERATOR
  // --------------------------------------------------------------------------
  const recommendations = useMemo(() => {
    const list = [];

    // Lowest score exam
    if (groupedTableData.length > 0) {
      const lowestExam = [...groupedTableData].sort((a, b) => a.latestScore - b.latestScore)[0];
      if (lowestExam && lowestExam.latestScore < 60) {
        list.push({
          id: 'lowest-exam',
          icon: '🔄',
          title: `Refaire : ${lowestExam.title}`,
          desc: `Votre dernier score est de ${lowestExam.latestScore}%. Une seconde tentative vous permettra de valider les notions non acquises.`,
          actionText: 'Refaire ce concours blanc',
          actionUrl: '/client-concours-blanc',
        });
      }
    }

    // Most vulnerable chapter
    if (insights.improvements.length > 0) {
      const topWeak = insights.improvements[0];
      list.push({
        id: 'weak-chapter',
        icon: '📚',
        title: `Renforcer : ${topWeak.name}`,
        desc: `Ce chapitre concentre ${topWeak.wrongTotal} erreurs. Révisez le cours dédié et les fiches résumés avant le prochain essai.`,
        actionText: 'Réviser le cours',
        actionUrl: '/client-cours',
      });
    }

    // Review saved mistakes
    if (savedQuestionsStats.pendingCount > 0) {
      list.push({
        id: 'review-saved',
        icon: '⚠️',
        title: `Corriger ${savedQuestionsStats.pendingCount} questions en attente`,
        desc: 'Vous avez des questions enregistrées non résolues. Consultez le carnet d’erreurs pour ancrer vos acquis.',
        actionText: 'Ouvrir le carnet d’erreurs',
        actionUrl: '/client-erreurs',
      });
    }

    // General fallback recommendation
    if (list.length < 3) {
      list.push({
        id: 'practice-general',
        icon: '🎯',
        title: 'Tester une simulation chronométrée',
        desc: 'Entraînez-vous dans les conditions réelles du concours pour perfectionner votre gestion du temps.',
        actionText: 'Voir tous les concours blancs',
        actionUrl: '/client-concours-blanc',
      });
    }

    return list.slice(0, 3);
  }, [groupedTableData, insights.improvements, savedQuestionsStats.pendingCount]);

  // Open modal with attempt
  const handleOpenAttemptModal = (examGroup) => {
    // Pick latest attempt of this exam
    const latestAttempt = [...examGroup.attempts].sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt))[0];
    setModalAttempt(latestAttempt || null);
  };

  // --------------------------------------------------------------------------
  // RENDER EMPTY STATE
  // --------------------------------------------------------------------------
  if (allMockAttempts.length === 0 && !schoolDataLoading) {
    return (
      <div className="mock-exam-stats-root">
        <section className="mock-exam-header">
          <div className="mock-exam-header-top">
            <div>
              <span className="mock-exam-eyebrow">DASHBOARD ANALYTICS</span>
              <h1 className="mock-exam-title">Statistiques des concours blancs</h1>
              <p className="mock-exam-subtitle">
                Analysez vos résultats, suivez votre progression et identifiez les chapitres à améliorer grâce à vos performances aux concours blancs.
              </p>
            </div>
          </div>
        </section>

        <div className="mock-exam-empty-state">
          <div className="mock-exam-empty-icon">📝</div>
          <h3>Aucun concours blanc réalisé pour le moment</h3>
          <p>
            Vos statistiques détaillées, l’évolution de vos scores, l’analyse de vos erreurs et vos recommandations apparaîtront ici dès que vous aurez complété votre première simulation.
          </p>
          <button
            type="button"
            className="mock-exam-empty-btn"
            onClick={() => navigate('/client-concours-blanc')}
          >
            Découvrir les concours blancs &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-exam-stats-root">
      {/* --------------------------------------------------------------------
         1. HERO HEADER & FILTERS
         -------------------------------------------------------------------- */}
      <section className="mock-exam-header">
        <div className="mock-exam-header-top">
          <div>
            <span className="mock-exam-eyebrow">ANALYSE DES SIMULATIONS</span>
            <h1 className="mock-exam-title">Statistiques des concours blancs</h1>
            <p className="mock-exam-subtitle">
              Analysez vos résultats, suivez votre progression et identifiez les chapitres à améliorer grâce à vos performances aux concours blancs.
            </p>
          </div>
          <div className="mock-exam-live-badge">
            <span className="mock-exam-live-dot" />
            <span>Données synchronisées</span>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="mock-exam-filters-bar">
          {/* Filter 1: Matière */}
          <div className="mock-exam-filter-field">
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

          {/* Filter 2: Chapitre */}
          <div className="mock-exam-filter-field">
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

          {/* Filter 3: Période */}
          <div className="mock-exam-filter-field">
            <label>Période</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="all">Toute la période</option>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">3 derniers mois</option>
              <option value="180">6 derniers mois</option>
            </select>
          </div>

          {/* Filter 4: Concours blanc spécifique */}
          <div className="mock-exam-filter-field" style={{ flex: '1 1 220px' }}>
            <label>Concours blanc</label>
            <select
              value={selectedMockExamId}
              onChange={(e) => setSelectedMockExamId(e.target.value)}
            >
              <option value="">Tous les concours</option>
              {availableMockExams.map((exam) => (
                <option key={exam.resourceId} value={exam.resourceId}>
                  {exam.title} ({exam.subject})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 5: Tentative (Toutes vs Dernière) */}
          <div className="mock-exam-filter-field" style={{ flex: '1 1 180px' }}>
            <label>Tentative</label>
            <select
              value={latestAttemptOnly ? 'latest' : 'all'}
              onChange={(e) => setLatestAttemptOnly(e.target.value === 'latest')}
            >
              <option value="all">Toutes les tentatives</option>
              <option value="latest">Dernière tentative</option>
            </select>
          </div>

          {/* Reset button */}
          <button
            type="button"
            className="mock-exam-filter-reset-btn"
            onClick={handleResetFilters}
            title="Réinitialiser tous les filtres"
          >
            <span>↺</span> Réinitialiser
          </button>
        </div>
      </section>

      {/* --------------------------------------------------------------------
         2. 6 KPI STAT CARDS
         -------------------------------------------------------------------- */}
      <section className="mock-exam-kpi-grid">
        {/* Card 1: Concours blancs réalisés */}
        <div className="mock-exam-kpi-card">
          <div className="mock-exam-kpi-top">
            <div className="mock-exam-kpi-icon blue">📋</div>
            <span className="mock-exam-kpi-badge is-neutral">Distincts</span>
          </div>
          <div className="mock-exam-kpi-main">
            <span className="mock-exam-kpi-value">{kpiStats.distinctExams}</span>
            <span className="mock-exam-kpi-title">Concours blancs réalisés</span>
          </div>
          <span className="mock-exam-kpi-note">Simulations différentes terminées</span>
        </div>

        {/* Card 2: Tentatives effectuées */}
        <div className="mock-exam-kpi-card">
          <div className="mock-exam-kpi-top">
            <div className="mock-exam-kpi-icon purple">🎯</div>
            <span className="mock-exam-kpi-badge is-neutral">Total</span>
          </div>
          <div className="mock-exam-kpi-main">
            <span className="mock-exam-kpi-value">{kpiStats.totalAttempts}</span>
            <span className="mock-exam-kpi-title">Tentatives effectuées</span>
          </div>
          <span className="mock-exam-kpi-note">Nombre total de QCMs passés</span>
        </div>

        {/* Card 3: Score moyen */}
        <div className="mock-exam-kpi-card">
          <div className="mock-exam-kpi-top">
            <div className="mock-exam-kpi-icon amber">⭐</div>
            {kpiStats.evolutionScore !== 0 ? (
              <span className={`mock-exam-kpi-badge ${kpiStats.evolutionScore > 0 ? 'is-up' : 'is-down'}`}>
                {kpiStats.evolutionScore > 0 ? `+${kpiStats.evolutionScore}%` : `${kpiStats.evolutionScore}%`}
              </span>
            ) : (
              <span className="mock-exam-kpi-badge is-neutral">Stable</span>
            )}
          </div>
          <div className="mock-exam-kpi-main">
            <span className="mock-exam-kpi-value">{kpiStats.avgScore}%</span>
            <span className="mock-exam-kpi-title">Score moyen</span>
          </div>
          <span className="mock-exam-kpi-note">Moyenne générale obtenue</span>
        </div>

        {/* Card 4: Taux de réussite */}
        <div className="mock-exam-kpi-card">
          <div className="mock-exam-kpi-top">
            <div className="mock-exam-kpi-icon green">📈</div>
            {kpiStats.evolutionRate !== 0 ? (
              <span className={`mock-exam-kpi-badge ${kpiStats.evolutionRate > 0 ? 'is-up' : 'is-down'}`}>
                {kpiStats.evolutionRate > 0 ? `+${kpiStats.evolutionRate}%` : `${kpiStats.evolutionRate}%`}
              </span>
            ) : (
              <span className="mock-exam-kpi-badge is-neutral">Global</span>
            )}
          </div>
          <div className="mock-exam-kpi-main">
            <span className="mock-exam-kpi-value">{kpiStats.passRate}%</span>
            <span className="mock-exam-kpi-title">Taux de réussite</span>
          </div>
          <span className="mock-exam-kpi-note">Ratio réponses correctes / total</span>
        </div>

        {/* Card 5: Réponses correctes */}
        <div className="mock-exam-kpi-card">
          <div className="mock-exam-kpi-top">
            <div className="mock-exam-kpi-icon green">✓</div>
            <span className="mock-exam-kpi-badge is-up">Justes</span>
          </div>
          <div className="mock-exam-kpi-main">
            <span className="mock-exam-kpi-value">{kpiStats.totalCorrect}</span>
            <span className="mock-exam-kpi-title">Réponses correctes</span>
          </div>
          <span className="mock-exam-kpi-note">Bonnes réponses validées</span>
        </div>

        {/* Card 6: Réponses incorrectes */}
        <div className="mock-exam-kpi-card">
          <div className="mock-exam-kpi-top">
            <div className="mock-exam-kpi-icon red">✕</div>
            <span className="mock-exam-kpi-badge is-down">Erreurs</span>
          </div>
          <div className="mock-exam-kpi-main">
            <span className="mock-exam-kpi-value">{kpiStats.totalWrong}</span>
            <span className="mock-exam-kpi-title">Réponses incorrectes</span>
          </div>
          <span className="mock-exam-kpi-note">Questions à retravailler</span>
        </div>
      </section>

      {/* --------------------------------------------------------------------
         3. MAIN CHARTS: LINE CHART (SCORE EVOLUTION) & DOUGHNUT CHART
         -------------------------------------------------------------------- */}
      <div className="mock-exam-grid-row">
        {/* Grand Line Chart (Span 8) */}
        <div className="mock-exam-panel-card mock-col-8">
          <div className="mock-exam-panel-header">
            <div className="mock-exam-panel-heading-copy">
              <span className="mock-exam-panel-kicker">CHRONOLOGIE</span>
              <h2 className="mock-exam-panel-title">Évolution de vos scores</h2>
              <p className="mock-exam-panel-subtitle">Suivi chronologique des scores obtenus à chaque tentative</p>
            </div>
            <span className="mock-exam-count-badge">{scoreEvolutionData.length} tentatives</span>
          </div>
          <div className="mock-exam-panel-body" style={{ minHeight: 320 }}>
            {scoreEvolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={scoreEvolutionData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="dateFormatted"
                    stroke="#94a3b8"
                    fontSize={11.5}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#94a3b8"
                    fontSize={11.5}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{
                            background: '#ffffff',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                            fontSize: '12.5px'
                          }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{data.name}</div>
                            <div style={{ color: '#64748b', fontSize: '11.5px', marginBottom: 6 }}>
                              {data.subject} • {formatDate(data.rawDate)}
                            </div>
                            <div style={{ color: '#2563eb', fontWeight: 800, fontSize: '15px' }}>
                              Score : {data.score}%
                            </div>
                            <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: '11.5px' }}>
                              <span style={{ color: '#10b981', fontWeight: 700 }}>✓ {data.correct} justes</span>
                              <span style={{ color: '#ef4444', fontWeight: 700 }}>✕ {data.wrong} erreurs</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={kpiStats.avgScore}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    label={{ value: `Moyenne (${kpiStats.avgScore}%)`, fill: '#64748b', fontSize: 11, position: 'insideTopRight' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7, strokeWidth: 3, stroke: '#bfdbfe' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="mock-exam-empty-state" style={{ padding: '30px 20px' }}>
                <p>Aucune tentative trouvée avec ces critères de filtrage.</p>
              </div>
            )}
          </div>
        </div>

        {/* Doughnut Chart (Span 4) */}
        <div className="mock-exam-panel-card mock-col-4">
          <div className="mock-exam-panel-header">
            <div className="mock-exam-panel-heading-copy">
              <span className="mock-exam-panel-kicker">RÉPARTITION</span>
              <h2 className="mock-exam-panel-title">Répartition de vos réponses</h2>
              <p className="mock-exam-panel-subtitle">Total des réponses enregistrées</p>
            </div>
          </div>
          <div className="mock-exam-panel-body">
            <div className="mock-exam-donut-wrapper">
              <div className="mock-exam-donut-chart-container">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={doughnutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {doughnutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} questions (${Math.round((value / Math.max(1, totalQuestionsSum)) * 100)}%)`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mock-exam-donut-center-label">
                  <strong>{totalQuestionsSum}</strong>
                  <span>QUESTIONS</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="mock-exam-donut-legend-list">
                {doughnutData.map((item) => {
                  const pct = totalQuestionsSum > 0 ? Math.round((item.value / totalQuestionsSum) * 100) : 0;
                  return (
                    <div key={item.name} className="mock-exam-donut-legend-item">
                      <div className="mock-exam-donut-legend-left">
                        <span className="mock-exam-donut-legend-dot" style={{ background: item.color }} />
                        <span className="mock-exam-donut-legend-name">{item.name}</span>
                      </div>
                      <div className="mock-exam-donut-legend-right">
                        <span className="mock-exam-donut-legend-count">{item.value}</span>
                        <span className="mock-exam-donut-legend-pct">({pct}%)</span>
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
         4. SECOND CHARTS ROW: SUBJECT HORIZONTAL BARS & SUCCESS RATE AREA CHART
         -------------------------------------------------------------------- */}
      <div className="mock-exam-grid-row">
        {/* Horizontal Bar Chart: Performance par matière (Span 6) */}
        <div className="mock-exam-panel-card mock-col-6">
          <div className="mock-exam-panel-header">
            <div className="mock-exam-panel-heading-copy">
              <span className="mock-exam-panel-kicker">DISCIPLINES</span>
              <h2 className="mock-exam-panel-title">Performance par matière</h2>
              <p className="mock-exam-panel-subtitle">Score moyen et taux de réussite dans les concours blancs</p>
            </div>
          </div>
          <div className="mock-exam-panel-body" style={{ minHeight: 280 }}>
            {subjectPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={subjectPerformanceData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11.5} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="subject" stroke="#334155" fontSize={12.5} fontWeight={700} width={120} tickLine={false} />
                  <Tooltip
                    formatter={(val, name) => [
                      `${val}%`,
                      name === 'avgScore' ? 'Score moyen' : 'Taux de réussite'
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="avgScore" name="Score moyen" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={14} />
                  <Bar dataKey="passRate" name="Taux de réussite" fill="#10b981" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="mock-exam-empty-state" style={{ padding: '20px' }}>
                <p>Aucune donnée disponible pour ces matières.</p>
              </div>
            )}
          </div>
        </div>

        {/* Area Chart: Évolution du taux de réussite (Span 6) */}
        <div className="mock-exam-panel-card mock-col-6">
          <div className="mock-exam-panel-header">
            <div className="mock-exam-panel-heading-copy">
              <span className="mock-exam-panel-kicker">PROGRESSION</span>
              <h2 className="mock-exam-panel-title">Évolution du taux de réussite</h2>
              <p className="mock-exam-panel-subtitle">Progression de la proportion de bonnes réponses</p>
            </div>
            <span className="mock-exam-count-badge">Tendance</span>
          </div>
          <div className="mock-exam-panel-body" style={{ minHeight: 280 }}>
            {successRateTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={successRateTrendData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="mockRateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="dateFormatted" stroke="#94a3b8" fontSize={11.5} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11.5} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div style={{
                            background: '#ffffff',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 18px rgba(15,23,42,0.1)',
                            fontSize: '12.5px'
                          }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{d.name}</div>
                            <div style={{ color: '#10b981', fontWeight: 800, marginTop: 4 }}>
                              Taux de réussite : {d.rate}%
                            </div>
                            <div style={{ color: '#64748b', fontSize: '11px', marginTop: 2 }}>
                              Moyenne cumulée : {d.runningAvg}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#mockRateGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="runningAvg"
                    stroke="#2563eb"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="mock-exam-empty-state" style={{ padding: '20px' }}>
                <p>Aucune tentative chronologique enregistrée.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
         5. THIRD ROW: ATTEMPTS COMPARISON (FOR SAME MOCK EXAM) (Span 12)
         -------------------------------------------------------------------- */}
      <div className="mock-exam-grid-row">
        <div className="mock-exam-panel-card mock-col-12">
          <div className="mock-exam-panel-header">
            <div className="mock-exam-panel-heading-copy">
              <span className="mock-exam-panel-kicker">HISTORIQUE PAR ÉPREUVE</span>
              <h2 className="mock-exam-panel-title">Comparaison de vos tentatives</h2>
              <p className="mock-exam-panel-subtitle">Mesurez votre progression sur plusieurs essais d'un même concours blanc</p>
            </div>
            {bestComparisonScore !== null && (
              <div className="mock-exam-best-score-badge">
                <span>🏆 Meilleur score :</span>
                <strong>{bestComparisonScore}%</strong>
              </div>
            )}
          </div>

          <div className="mock-exam-panel-body">
            <div className="mock-exam-comparison-toolbar">
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                Sélectionner le concours blanc à comparer :
              </label>
              <select
                className="mock-exam-comparison-select"
                value={selectedComparisonExamId}
                onChange={(e) => setSelectedComparisonExamId(e.target.value)}
              >
                {availableMockExams.map((exam) => (
                  <option key={exam.resourceId} value={exam.resourceId}>
                    {exam.title} ({exam.count} tentative{exam.count > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>

            {comparisonDataWithBest.length > 0 ? (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={comparisonDataWithBest} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" stroke="#334155" fontSize={12} fontWeight={700} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11.5} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div style={{
                              background: '#ffffff',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 4px 18px rgba(15,23,42,0.1)',
                              fontSize: '12.5px'
                            }}>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{d.label}</div>
                              <div style={{ color: '#64748b', fontSize: '11px', marginBottom: 4 }}>{d.date}</div>
                              <div style={{ color: '#2563eb', fontWeight: 850, fontSize: '14px' }}>Score : {d.score}%</div>
                              <div style={{ color: '#10b981', fontWeight: 700, marginTop: 4 }}>✓ {d.correct} correctes</div>
                              <div style={{ color: '#ef4444', fontWeight: 700 }}>✕ {d.wrong} incorrectes</div>
                              {d.isBest && (
                                <div style={{ marginTop: 6, color: '#059669', fontWeight: 800, fontSize: '11px' }}>
                                  ★ Meilleure performance !
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="score" name="Score (%)" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={36}>
                      {comparisonDataWithBest.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isBest ? '#10b981' : '#2563eb'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mock-exam-empty-state" style={{ padding: '24px' }}>
                <p>Aucune tentative trouvée pour ce concours blanc.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
         6. STRENGTHS & POINTS TO IMPROVE (2 CARDS SIDE-BY-SIDE)
         -------------------------------------------------------------------- */}
      <section className="mock-exam-insights-grid">
        {/* Points Forts */}
        <div className="mock-exam-insight-card is-strength">
          <div className="mock-exam-insight-head">
            <div className="mock-exam-insight-head-icon">✓</div>
            <div className="mock-exam-insight-head-text">
              <h3>Points forts</h3>
              <p>Chapitres et matières les mieux maîtrisés (&ge; 65%)</p>
            </div>
          </div>
          <div className="mock-exam-insight-list">
            {insights.strengths.length > 0 ? (
              insights.strengths.map((item) => (
                <div key={item.name} className="mock-exam-insight-item">
                  <div className="mock-exam-insight-item-title">
                    <span className="mock-exam-insight-dot" />
                    <span>{item.name}</span>
                  </div>
                  <span className="mock-exam-insight-item-score">{item.avgScore}%</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', padding: '10px 0' }}>
                Effectuez davantage de tentatives pour identifier vos points forts.
              </div>
            )}
          </div>
        </div>

        {/* À Améliorer */}
        <div className="mock-exam-insight-card is-improvement">
          <div className="mock-exam-insight-head">
            <div className="mock-exam-insight-head-icon">⚡</div>
            <div className="mock-exam-insight-head-text">
              <h3>À améliorer</h3>
              <p>Chapitres nécessitant des révisions ciblées</p>
            </div>
          </div>
          <div className="mock-exam-insight-list">
            {insights.improvements.length > 0 ? (
              insights.improvements.map((item) => (
                <div key={item.name} className="mock-exam-insight-item">
                  <div className="mock-exam-insight-item-title">
                    <span className="mock-exam-insight-dot" />
                    <span>{item.name}</span>
                  </div>
                  <span className="mock-exam-insight-item-score">
                    {item.wrongTotal} erreur{item.wrongTotal > 1 ? 's' : ''} ({item.avgScore}%)
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', padding: '10px 0' }}>
                Félicitations, aucun point critique détecté sur cette période !
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
         7. DETAILED PERFORMANCE BY CHAPTER (WITH SUBJECT TABS)
         -------------------------------------------------------------------- */}
      <div className="mock-exam-grid-row">
        <div className="mock-exam-panel-card mock-col-12">
          <div className="mock-exam-panel-header">
            <div className="mock-exam-panel-heading-copy">
              <span className="mock-exam-panel-kicker">ANALYSE DÉTAILLÉE</span>
              <h2 className="mock-exam-panel-title">Analyse des performances par chapitre</h2>
              <p className="mock-exam-panel-subtitle">Mesurez la maîtrise de chaque chapitre dans vos simulations</p>
            </div>
            <span className="mock-exam-count-badge">{detailedChapters.length} chapitres</span>
          </div>

          <div className="mock-exam-panel-body">
            {/* Subject Filter Pills */}
            <div className="mock-exam-tabs-pills">
              <button
                type="button"
                className={`mock-exam-tab-pill ${activeChapterTab === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveChapterTab('all')}
              >
                Tous les chapitres
              </button>
              {availableSubjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  className={`mock-exam-tab-pill ${activeChapterTab === sub ? 'is-active' : ''}`}
                  onClick={() => setActiveChapterTab(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Chapters Progress Bars */}
            <div className="mock-exam-chapter-list">
              {detailedChapters.length > 0 ? (
                detailedChapters.map((ch) => {
                  const scoreClass = ch.avgScore >= 70 ? 'is-high' : ch.avgScore >= 50 ? 'is-mid' : 'is-low';
                  const fillColor = ch.avgScore >= 70 ? '#10b981' : ch.avgScore >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={ch.name} className="mock-exam-chapter-item">
                      <div className="mock-exam-chapter-header">
                        <span className="mock-exam-chapter-name">{ch.name}</span>
                        <div className="mock-exam-chapter-metrics">
                          <span>{ch.attempts} tentative{ch.attempts > 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span style={{ color: '#ef4444' }}>{ch.wrongTotal} erreur{ch.wrongTotal > 1 ? 's' : ''}</span>
                          <span className={`mock-exam-chapter-score-pill ${scoreClass}`}>
                            {ch.avgScore}%
                          </span>
                        </div>
                      </div>
                      <div className="mock-exam-chapter-track">
                        <div
                          className="mock-exam-chapter-fill"
                          style={{ width: `${Math.min(100, Math.max(5, ch.avgScore))}%`, background: fillColor }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="mock-exam-empty-state" style={{ padding: '24px' }}>
                  <p>Aucun chapitre trouvé pour cette matière.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
         8. ERROR ANALYSIS & SAVED QUESTIONS
         -------------------------------------------------------------------- */}
      <div className="mock-exam-grid-row">
        {/* Analyse des erreurs (Span 7) */}
        <div className="mock-exam-panel-card mock-col-7">
          <div className="mock-exam-panel-header">
            <div className="mock-exam-panel-heading-copy">
              <span className="mock-exam-panel-kicker">POINTS DE VULNÉRABILITÉ</span>
              <h2 className="mock-exam-panel-title">Analyse de vos erreurs</h2>
              <p className="mock-exam-panel-subtitle">Identification des chapitres concentrant le plus d'erreurs</p>
            </div>
          </div>
          <div className="mock-exam-panel-body">
            <div className="mock-exam-mistakes-overview">
              <div className="mock-exam-mistake-stat-pill">
                <span className="mock-exam-mistake-stat-label">Total erreurs</span>
                <span className="mock-exam-mistake-stat-value" style={{ color: '#ef4444' }}>
                  {kpiStats.totalWrong}
                </span>
                <span className="mock-exam-mistake-stat-sub">Sur l'ensemble des QCMs</span>
              </div>
              <div className="mock-exam-mistake-stat-pill">
                <span className="mock-exam-mistake-stat-label">Taux d'erreur</span>
                <span className="mock-exam-mistake-stat-value">
                  {100 - kpiStats.passRate}%
                </span>
                <span className="mock-exam-mistake-stat-sub">Pourcentage de fautes</span>
              </div>
              <div className="mock-exam-mistake-stat-pill">
                <span className="mock-exam-mistake-stat-label">Chapitres ciblés</span>
                <span className="mock-exam-mistake-stat-value">
                  {errorChaptersData.length}
                </span>
                <span className="mock-exam-mistake-stat-sub">Avec au moins 1 erreur</span>
              </div>
              <div className="mock-exam-mistake-stat-pill">
                <span className="mock-exam-mistake-stat-label">Top vulnérable</span>
                <span className="mock-exam-mistake-stat-value" style={{ fontSize: '15px', color: '#b91c1c' }}>
                  {errorChaptersData[0]?.chapter || '—'}
                </span>
                <span className="mock-exam-mistake-stat-sub">
                  {errorChaptersData[0] ? `${errorChaptersData[0].errors} erreurs` : 'Aucune erreur'}
                </span>
              </div>
            </div>

            {/* Horizontal Bar Chart of Errors per Chapter */}
            {errorChaptersData.length > 0 ? (
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart
                    data={errorChaptersData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="chapter" stroke="#334155" fontSize={12} width={130} tickLine={false} />
                    <Tooltip
                      formatter={(val, name, item) => [`${val} erreurs (${item.payload.errorRate}% d'échec)`, item.payload.fullName]}
                    />
                    <Bar dataKey="errors" fill="#ef4444" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mock-exam-empty-state" style={{ padding: '20px' }}>
                <p>Aucune erreur détectée dans vos simulations actuelles.</p>
              </div>
            )}
          </div>
        </div>

        {/* Questions sauvegardées (Span 5) */}
        <div className="mock-exam-panel-card mock-col-5">
          <div className="mock-exam-panel-header">
            <div className="mock-exam-panel-heading-copy">
              <span className="mock-exam-panel-kicker">RÉVISION CIBLÉE</span>
              <h2 className="mock-exam-panel-title">Questions à revoir</h2>
              <p className="mock-exam-panel-subtitle">Carnet de révision et questions sauvegardées</p>
            </div>
            <span className="mock-exam-count-badge">{savedQuestionsStats.total} sauv.</span>
          </div>
          <div className="mock-exam-panel-body">
            <div className="mock-exam-saved-distinction">
              {/* Type A: Sauvegarde automatique (erreurs) */}
              <div className="mock-exam-saved-card">
                <span className="mock-exam-saved-badge auto">A. Automatique</span>
                <span className="mock-exam-saved-count">{savedQuestionsStats.autoCount}</span>
                <span className="mock-exam-saved-desc">
                  Questions échouées lors des QCMs et enregistrées pour révision.
                </span>
              </div>

              {/* Type B: Sauvegarde manuelle (favoris) */}
              <div className="mock-exam-saved-card">
                <span className="mock-exam-saved-badge manual">B. Manuelle</span>
                <span className="mock-exam-saved-count">{savedQuestionsStats.manualCount}</span>
                <span className="mock-exam-saved-desc">
                  Questions marquées en favoris pour être revues plus tard.
                </span>
              </div>
            </div>

            <div className="mock-exam-mistakes-cta">
              <div className="mock-exam-mistakes-cta-text">
                <h4>Carnet d'erreurs et de révision</h4>
                <p>
                  {savedQuestionsStats.pendingCount} question{savedQuestionsStats.pendingCount > 1 ? 's' : ''} en attente de validation
                </p>
              </div>
              <button
                type="button"
                className="mock-exam-mistakes-btn"
                onClick={() => navigate('/client-erreurs?category=blanc')}
              >
                Consulter mes questions &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
         9. DATA TABLE: HISTORIQUE DES CONCOURS BLANCS
         -------------------------------------------------------------------- */}
      <div className="mock-exam-grid-row">
        <div className="mock-exam-panel-card mock-col-12">
          <div className="mock-exam-panel-header">
            <div className="mock-exam-panel-heading-copy">
              <span className="mock-exam-panel-kicker">TABLEAU DE BORD</span>
              <h2 className="mock-exam-panel-title">Historique des concours blancs</h2>
              <p className="mock-exam-panel-subtitle">Consultez l'historique complet de vos simulations et leurs corrections détaillées</p>
            </div>
            <span className="mock-exam-count-badge">{groupedTableData.length} concours</span>
          </div>

          <div className="mock-exam-panel-body">
            {/* Toolbar Filters */}
            <div className="mock-exam-table-toolbar">
              <input
                type="text"
                className="mock-exam-search-input"
                placeholder="Rechercher un concours blanc..."
                value={searchTable}
                onChange={(e) => {
                  setSearchTable(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <div className="mock-exam-table-filters">
                <select
                  className="mock-exam-table-select"
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
                  className="mock-exam-table-select"
                  value={tablePeriodFilter}
                  onChange={(e) => {
                    setTablePeriodFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Toutes dates</option>
                  <option value="7">7 derniers jours</option>
                  <option value="30">30 derniers jours</option>
                  <option value="90">3 derniers mois</option>
                </select>

                <select
                  className="mock-exam-table-select"
                  value={tableSort}
                  onChange={(e) => {
                    setTableSort(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="date-desc">Plus récents d'abord</option>
                  <option value="score-desc">Meilleurs scores</option>
                  <option value="score-asc">Scores à améliorer</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {paginatedTableData.length > 0 ? (
              <div className="mock-exam-table-container">
                <table className="mock-exam-table">
                  <thead>
                    <tr>
                      <th>Nom du concours blanc</th>
                      <th>Matière</th>
                      <th>Dernière date</th>
                      <th>Tentatives</th>
                      <th>Dernier score</th>
                      <th>Meilleur score</th>
                      <th>Taux de réussite</th>
                      <th>Statut</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTableData.map((row) => {
                      const badgeStyle = getSubjectBadgeStyle(row.subject);
                      const isHigh = row.bestScore >= 70;
                      const isMid = row.bestScore >= 50 && row.bestScore < 70;
                      const scoreClass = isHigh ? 'is-high' : isMid ? 'is-mid' : 'is-low';

                      return (
                        <tr key={row.resourceId}>
                          <td>
                            <strong style={{ color: '#0f172a', display: 'block', fontSize: '13.5px' }}>
                              {row.title}
                            </strong>
                            {row.chapter && (
                              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                {row.chapter}
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className="mock-exam-subject-badge"
                              style={{ background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.border}` }}
                            >
                              {row.subject}
                            </span>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '12px' }}>
                            {formatDate(row.latestDate)}
                          </td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{row.attemptsCount}</strong>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: '#334155' }}>
                              {row.latestScore}%
                            </span>
                          </td>
                          <td>
                            <span className={`mock-exam-score-pill ${scoreClass}`}>
                              {row.bestScore}%
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: '#047857' }}>
                              {row.passRate}%
                            </span>
                          </td>
                          <td>
                            {row.bestScore >= 60 ? (
                              <span className="mock-exam-status-pill success">Validé</span>
                            ) : (
                              <span className="mock-exam-status-pill review">À revoir</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="mock-exam-view-details-btn"
                              onClick={() => handleOpenAttemptModal(row)}
                            >
                              Voir les détails
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mock-exam-empty-state" style={{ padding: '30px' }}>
                <p>Aucun concours blanc ne correspond à votre recherche.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mock-exam-pagination">
                <span className="mock-exam-pagination-info">
                  Page {currentPage} sur {totalPages} ({groupedTableData.length} résultats)
                </span>
                <div className="mock-exam-pagination-controls">
                  <button
                    type="button"
                    className="mock-exam-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    &larr; Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`mock-exam-page-btn ${p === currentPage ? 'is-active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="mock-exam-page-btn"
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

      {/* --------------------------------------------------------------------
         10. RECOMMANDATIONS PERSONNALISÉES
         -------------------------------------------------------------------- */}
      <div className="mock-exam-grid-row">
        <div className="mock-exam-panel-card mock-col-12">
          <div className="mock-exam-panel-header">
            <div className="mock-exam-panel-heading-copy">
              <span className="mock-exam-panel-kicker">CONSEILS DU SYSTÈME</span>
              <h2 className="mock-exam-panel-title">Recommandations pour progresser</h2>
              <p className="mock-exam-panel-subtitle">Actions ciblées calculées à partir de vos résultats réels</p>
            </div>
            <span className="mock-exam-count-badge">Personnalisé</span>
          </div>

          <div className="mock-exam-panel-body">
            <div className="mock-exam-recommendations-grid">
              {recommendations.map((rec) => (
                <div key={rec.id} className="mock-exam-recommendation-card">
                  <div className="mock-exam-recommendation-top">
                    <div className="mock-exam-recommendation-icon">{rec.icon}</div>
                    <h3 className="mock-exam-recommendation-title">{rec.title}</h3>
                  </div>
                  <p className="mock-exam-recommendation-desc">{rec.desc}</p>
                  <button
                    type="button"
                    className="mock-exam-recommendation-action-btn"
                    onClick={() => navigate(rec.actionUrl)}
                  >
                    {rec.actionText} &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
         11. MODAL: DÉTAILS DE LA TENTATIVE & CORRECTIONS
         -------------------------------------------------------------------- */}
      {modalAttempt && (
        <div className="mock-exam-modal-backdrop" onClick={() => setModalAttempt(null)}>
          <div className="mock-exam-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mock-exam-modal-header">
              <div className="mock-exam-modal-header-copy">
                <h3>{modalAttempt.resourceTitle || 'Détails de la tentative'}</h3>
                <p>
                  {modalAttempt.normalizedSubject} • {formatDate(modalAttempt.answeredAt)}
                </p>
              </div>
              <button
                type="button"
                className="mock-exam-modal-close"
                onClick={() => setModalAttempt(null)}
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="mock-exam-modal-body">
              {/* Modal KPI Bar */}
              <div className="mock-exam-modal-kpi-bar">
                <div className="mock-exam-modal-kpi-item">
                  <span className="mock-exam-modal-kpi-label">Score obtenu</span>
                  <span className="mock-exam-modal-kpi-value" style={{ color: '#2563eb' }}>
                    {modalAttempt.scoreNum}%
                  </span>
                </div>
                <div className="mock-exam-modal-kpi-item">
                  <span className="mock-exam-modal-kpi-label">Bonnes réponses</span>
                  <span className="mock-exam-modal-kpi-value" style={{ color: '#10b981' }}>
                    {modalAttempt.correctNum}
                  </span>
                </div>
                <div className="mock-exam-modal-kpi-item">
                  <span className="mock-exam-modal-kpi-label">Erreurs</span>
                  <span className="mock-exam-modal-kpi-value" style={{ color: '#ef4444' }}>
                    {modalAttempt.wrongNum}
                  </span>
                </div>
                <div className="mock-exam-modal-kpi-item">
                  <span className="mock-exam-modal-kpi-label">Total questions</span>
                  <span className="mock-exam-modal-kpi-value">
                    {modalAttempt.totalNum}
                  </span>
                </div>
              </div>

              {/* Questions list with correction */}
              <div className="mock-exam-modal-questions-list">
                {Array.isArray(modalAttempt.answers) && modalAttempt.answers.length > 0 ? (
                  modalAttempt.answers.map((q, idx) => {
                    const isCorrect = q.correct === true;
                    return (
                      <div
                        key={q.questionId || idx}
                        className={`mock-exam-modal-question-item ${isCorrect ? 'is-correct' : 'is-wrong'}`}
                      >
                        <div className="mock-exam-modal-question-header">
                          <span className="mock-exam-modal-question-title">
                            Question {q.questionNumber || idx + 1}
                          </span>
                          <span className={`mock-exam-modal-question-status ${isCorrect ? 'correct' : 'wrong'}`}>
                            {isCorrect ? '✓ Correcte' : '✕ Incorrecte'}
                          </span>
                        </div>

                        {q.questionText && (
                          <div className="mock-exam-modal-question-statement">
                            <MathContent>{q.questionText}</MathContent>
                          </div>
                        )}

                        <div className="mock-exam-modal-answers-diff">
                          <div className={`mock-exam-modal-answer-box user-choice ${isCorrect ? 'is-valid' : ''}`}>
                            <span className="mock-exam-modal-answer-label">Votre réponse :</span>
                            <strong>
                              {q.selectedChoiceLabel ? `${q.selectedChoiceLabel}. ` : ''}
                              <MathContent>{q.selectedChoiceText || 'Aucune réponse'}</MathContent>
                            </strong>
                          </div>

                          <div className="mock-exam-modal-answer-box correct-choice">
                            <span className="mock-exam-modal-answer-label">Bonne réponse :</span>
                            <strong>
                              {q.correctChoiceLabel ? `${q.correctChoiceLabel}. ` : ''}
                              <MathContent>{q.correctChoiceText || '—'}</MathContent>
                            </strong>
                          </div>
                        </div>

                        {q.explanation && (
                          <div className="mock-exam-modal-explanation">
                            <strong>Explication : </strong>
                            <MathContent>{q.explanation}</MathContent>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="mock-exam-empty-state" style={{ padding: '24px' }}>
                    <p>Le détail question par question n'est pas disponible pour cette tentative.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

