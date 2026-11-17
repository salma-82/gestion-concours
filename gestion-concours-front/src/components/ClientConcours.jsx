import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSchoolCode, isSchoolIncluded } from '../packAccess';
import { toBackendResourceUrl } from '../backendResourceUrl';
import { recordStudentActivity, getStudentScope } from '../studentProgress';
import TrackedQcmFrame from './TrackedQcmFrame';
import cardMascot from '../assets/logo-mascot.png';
import { demoContentClass, DemoAccessBadge, isDemoFree, isDemoMode } from '../demoAccess';

const API_BASE = '';

const getPdfUrl = (url) => {
  if (!url) return '';
  const normalizedUrl = toBackendResourceUrl(url);
  if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://') || normalizedUrl.startsWith('/')) {
    return normalizedUrl;
  }
  return `/uploads/${normalizedUrl}`;
};

// Normalisation des matières pour affichage court dans les boutons
const getSubjectShortCode = (rawName = '') => {
  const trimmed = (rawName || '').trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('math')) return 'MATH';
  if (lower.includes('phys') || lower.includes('chim')) return 'PHYSIQUE';
  if (lower.includes('svt') || lower.includes('bio') || lower.includes('terre')) return 'SVT';
  if (lower.includes('philo')) return 'PHILOSOPHIE';
  if (lower.includes('angl')) return 'ANGLAIS';
  if (lower.includes('fran')) return 'FRANÇAIS';
  if (lower.includes('info')) return 'INFORMATIQUE';
  return trimmed.toUpperCase();
};

// Libellé de section élégant et compact pour le sidebar (inspiré de la capture : Maths, Physique, SVT)
const getSubjectDisplayTitle = (rawName = '') => {
  const trimmed = (rawName || '').trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('math')) return 'Maths';
  if (lower.includes('phys') || lower.includes('chim')) return 'Physique';
  if (lower.includes('svt') || lower.includes('bio') || lower.includes('terre')) return 'SVT';
  if (lower.includes('philo')) return 'Philosophie';
  if (lower.includes('angl')) return 'Anglais';
  if (lower.includes('fran')) return 'Français';
  if (lower.includes('info')) return 'Informatique';
  return trimmed || 'Général';
};

export default function ClientConcours() {
  const location = useLocation();
  const navigate = useNavigate();
  const requestedEcole = new URLSearchParams(location.search).get('ecole');

  // Données réelles issues de l'API / Base de données
  const [concoursList, setConcoursList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation et filtres
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [openYear, setOpenYear] = useState(null); // null = Liste des cartes, string = Année ouverte (ex: '2025')
  const [activeSubject, setActiveSubject] = useState(null); // Matière actuellement sélectionnée
  const [activeQuestion, setActiveQuestion] = useState(1);

  useEffect(() => {
    setSelectedYearFilter('all');
    setOpenYear(null);
    setActiveSubject(null);
    setActiveQuestion(1);
  }, [requestedEcole]);

  // Clé de stockage de la progression spécifique à cet étudiant
  const studentScope = useMemo(() => getStudentScope(), []);
  const progressStorageKey = `econ_concours_progress:${studentScope}`;

  // Progression réelle par concours : { [concoursId]: { answeredCount, correctCount, wrongCount, totalQuestions, score, percentage, status, answers: {} } }
  const [progressMap, setProgressMap] = useState(() => {
    try {
      const saved = localStorage.getItem(progressStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const saveProgressMap = useCallback((newMap) => {
    setProgressMap(newMap);
    try {
      localStorage.setItem(progressStorageKey, JSON.stringify(newMap));
      window.dispatchEvent(new CustomEvent('student-progress-updated'));
    } catch {}
  }, [progressStorageKey]);

  // Chargement dynamique des concours réels depuis le serveur
  const fetchAllConcours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/concours`);
      const data = Array.isArray(res.data) ? res.data : [];
      // Keep every published contest visible. Pack access is checked before loading its QCM below.
      setConcoursList(data);
    } catch (err) {
      console.error("Erreur chargement concours:", err);
      setError("Impossible de charger les concours pour le moment. Veuillez vérifier la connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllConcours();
  }, [fetchAllConcours]);

  // Concours filtrés par école (si demandé dans l'URL par la navbar)
  const scopedConcoursList = useMemo(() => {
    if (!requestedEcole) return concoursList;
    const requestedSchoolCode = getSchoolCode(requestedEcole);
    const normalizeSchoolName = (value) => String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    return concoursList.filter((concours) => {
      if (requestedSchoolCode) return getSchoolCode(concours.ecole) === requestedSchoolCode;
      return normalizeSchoolName(concours.ecole) === normalizeSchoolName(requestedEcole);
    });
  }, [concoursList, requestedEcole]);

  // Regroupement 100% DYNAMIQUE par année à partir EXCLUSIVEMENT des données de la base de données
  const dynamicYearsData = useMemo(() => {
    const map = {};

    scopedConcoursList.forEach(c => {
      if (!c.annee) return;
      const yr = String(c.annee).trim();
      const subjectName = (c.matiere && c.matiere.trim()) ? c.matiere.trim() : 'Général';

      if (!map[yr]) {
        map[yr] = {
          year: yr,
          concoursList: [],
          subjectsMap: {}, // { [subjectName]: concoursObj }
          subjectsList: [] // Liste des matières distinctes
        };
      }

      map[yr].concoursList.push(c);
      if (!map[yr].subjectsMap[subjectName]
        || (isDemoMode() && isDemoFree(c) && !isDemoFree(map[yr].subjectsMap[subjectName]))) {
        map[yr].subjectsMap[subjectName] = c;
      }
      if (!map[yr].subjectsList.includes(subjectName)) {
        map[yr].subjectsList.push(subjectName);
      }
    });

    const list = Object.values(map);
    // Trier les années par ordre décroissant (du plus récent au plus ancien)
    list.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    return list;
  }, [scopedConcoursList]);

  // Liste des années réelles disponibles
  const availableYears = useMemo(() => {
    return dynamicYearsData.map(g => g.year);
  }, [dynamicYearsData]);

  // Années filtrées par le sélecteur "ANNÉE"
  const filteredYears = useMemo(() => {
    if (selectedYearFilter === 'all') return dynamicYearsData;
    return dynamicYearsData.filter(g => g.year === selectedYearFilter);
  }, [dynamicYearsData, selectedYearFilter]);

  // Données de l'année actuellement ouverte en détail
  const currentOpenYearData = useMemo(() => {
    if (!openYear) return null;
    return dynamicYearsData.find(g => g.year === openYear) || null;
  }, [dynamicYearsData, openYear]);

  // Liste des matières réellement uploadées pour l'année ouverte
  const currentYearSubjects = useMemo(() => {
    if (!currentOpenYearData) return [];
    return currentOpenYearData.subjectsList;
  }, [currentOpenYearData]);

  // Concours spécifique actif
  const currentActiveConcours = useMemo(() => {
    if (!currentOpenYearData || !activeSubject) return null;
    return currentOpenYearData.subjectsMap[activeSubject] || null;
  }, [currentOpenYearData, activeSubject]);

  // Synchronisation de la matière active lors de l'ouverture ou changement d'année
  useEffect(() => {
    if (currentOpenYearData && currentYearSubjects.length > 0) {
      if (!activeSubject || !currentYearSubjects.includes(activeSubject)) {
        const firstAvailable = isDemoMode()
          ? currentYearSubjects.find((subject) => isDemoFree(currentOpenYearData.subjectsMap[subject]))
          : null;
        setActiveSubject(firstAvailable || currentYearSubjects[0]);
        setActiveQuestion(1);
      }
    }
  }, [currentOpenYearData, currentYearSubjects, activeSubject]);

  // Calcul du suivi de progression pour un concours donné
  const getConcoursProgress = useCallback((concours) => {
    if (!concours || !concours.id) {
      return {
        answeredCount: 0,
        correctCount: 0,
        wrongCount: 0,
        totalQuestions: 10,
        score: 0,
        percentage: 0,
        status: 'Nouveau'
      };
    }

    const saved = progressMap[concours.id] || {};
    const totalQuestions = saved.totalQuestions || 10;
    const answeredCount = Math.min(totalQuestions, saved.answeredCount || 0);
    const correctCount = saved.correctCount || 0;
    const wrongCount = saved.wrongCount || 0;
    const score = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const percentage = Math.min(100, Math.round((answeredCount / totalQuestions) * 100));

    let status = 'Nouveau';
    if (percentage === 100) status = 'Terminé';
    else if (answeredCount > 0) status = 'En cours';

    return {
      answeredCount,
      correctCount,
      wrongCount,
      totalQuestions,
      score,
      percentage,
      status
    };
  }, [progressMap]);

  // Calcul de la progression globale d'une année
  const getYearOverallProgress = useCallback((yr) => {
    const yrData = dynamicYearsData.find(g => g.year === yr);
    if (!yrData || yrData.subjectsList.length === 0) {
      return { percentage: 0, status: 'Nouveau', answered: 0, total: 0 };
    }

    let totalQuestions = 0;
    let totalAnswered = 0;

    yrData.subjectsList.forEach(subjectName => {
      const conc = yrData.subjectsMap[subjectName];
      const prog = getConcoursProgress(conc);
      totalQuestions += prog.totalQuestions;
      totalAnswered += prog.answeredCount;
    });

    const percentage = totalQuestions > 0 ? Math.min(100, Math.round((totalAnswered / totalQuestions) * 100)) : 0;
    let status = 'Nouveau';
    if (percentage === 100) status = 'Terminé';
    else if (totalAnswered > 0) status = 'En cours';

    return {
      percentage,
      status,
      answered: totalAnswered,
      total: totalQuestions
    };
  }, [dynamicYearsData, getConcoursProgress]);

  // Écoute des réponses envoyées depuis l'iframe TrackedQcmFrame pour enregistrer la progression réelle
  useEffect(() => {
    const handleQcmMessage = (event) => {
      if (!event.data || !currentActiveConcours) return;

      // Détection d'une réponse à une question dans le QCM
      if (event.data.type === 'econcourse-qcm-mistake' || event.data.type === 'econcourse-qcm-answer') {
        const mistake = event.data.mistake;
        const totalQ = Number(event.data.totalQuestions) || 10;
        const concId = currentActiveConcours.id;
        const qNum = mistake?.questionNumber ? Number(mistake.questionNumber) : activeQuestion;
        const isWrong = mistake && mistake.selectedChoiceLabel !== mistake.correctChoiceLabel;

        setProgressMap(prev => {
          const current = prev[concId] || {
            concoursId: concId,
            year: openYear,
            subject: activeSubject,
            answeredCount: 0,
            correctCount: 0,
            wrongCount: 0,
            totalQuestions: totalQ,
            answers: {}
          };

          const prevAnswer = current.answers?.[qNum];
          const isNewAnswer = !prevAnswer;

          const updatedAnswers = {
            ...(current.answers || {}),
            [qNum]: {
              selected: mistake?.selectedChoiceLabel || 'answered',
              isCorrect: !isWrong,
              timestamp: Date.now()
            }
          };

          const newAnsweredCount = Object.keys(updatedAnswers).length;
          let newCorrect = 0;
          let newWrong = 0;
          Object.values(updatedAnswers).forEach(ans => {
            if (ans.isCorrect) newCorrect++;
            else newWrong++;
          });

          const newPercentage = Math.min(100, Math.round((newAnsweredCount / totalQ) * 100));
          const newStatus = newPercentage === 100 ? 'Terminé' : (newAnsweredCount > 0 ? 'En cours' : 'Nouveau');

          const updatedMap = {
            ...prev,
            [concId]: {
              ...current,
              totalQuestions: totalQ,
              answeredCount: newAnsweredCount,
              correctCount: newCorrect,
              wrongCount: newWrong,
              score: newAnsweredCount > 0 ? Math.round((newCorrect / newAnsweredCount) * 100) : 0,
              percentage: newPercentage,
              status: newStatus,
              answers: updatedAnswers,
              lastActiveQuestion: qNum,
              updatedAt: new Date().toISOString()
            }
          };

          try {
            localStorage.setItem(progressStorageKey, JSON.stringify(updatedMap));
          } catch {}

          return updatedMap;
        });

        // Enregistrer l'activité dans le suivi général
        recordStudentActivity({
          type: 'Concours',
          resourceId: `${currentActiveConcours.id}`,
          title: currentActiveConcours.titre || `Concours ${openYear} - ${activeSubject}`,
          subject: activeSubject,
          chapter: String(openYear)
        });
      }

      // Synchronisation de la question courante si modifiée dans le QCM
      if (event.data.type === 'econcourse-qcm-cur-changed' && event.data.questionNumber) {
        setActiveQuestion(Number(event.data.questionNumber));
      }

      // Synchronisation du nombre total réel de questions du QCM
      if (event.data.type === 'econcourse-qcm-meta' && event.data.totalQuestions && currentActiveConcours) {
        const detectedTotal = Number(event.data.totalQuestions);
        if (detectedTotal > 0) {
          setProgressMap(prev => {
            const current = prev[currentActiveConcours.id] || {};
            if (current.totalQuestions === detectedTotal) return prev;
            return {
              ...prev,
              [currentActiveConcours.id]: {
                ...current,
                totalQuestions: detectedTotal
              }
            };
          });
        }
      }
    };

    window.addEventListener('message', handleQcmMessage);
    return () => window.removeEventListener('message', handleQcmMessage);
  }, [currentActiveConcours, openYear, activeSubject, activeQuestion, progressStorageKey]);

  // Clic sur un bouton matière en haut à droite d'une carte
  const handleOpenSubjectFromCard = (year, subjectName) => {
    const yrData = dynamicYearsData.find(g => g.year === year);
    if (!yrData || !yrData.subjectsMap[subjectName]) return;

    const conc = yrData.subjectsMap[subjectName];
    if (isDemoMode() && !isDemoFree(conc)) {
      window.dispatchEvent(new CustomEvent('econcours-demo-paywall'));
      return;
    }
    const prog = getConcoursProgress(conc);
    const nextQ = prog.answeredCount < prog.totalQuestions ? prog.answeredCount + 1 : 1;

    setOpenYear(year);
    setActiveSubject(subjectName);
    setActiveQuestion(nextQ);

    recordStudentActivity({
      type: 'Concours',
      resourceId: `${conc.id}`,
      title: conc.titre || `Concours ${year} - ${subjectName}`,
      subject: subjectName,
      chapter: year
    });
  };

  // Clic sur le gros bouton CTA (Commencer / Continuer / Revoir)
  const handleOpenYearCTA = (year) => {
    const yrData = dynamicYearsData.find(g => g.year === year);
    if (!yrData || yrData.subjectsList.length === 0) return;

    if (isDemoMode()) {
      const freeSubject = yrData.subjectsList.find((subject) => isDemoFree(yrData.subjectsMap[subject]));
      if (!freeSubject) {
        window.dispatchEvent(new CustomEvent('econcours-demo-paywall'));
        return;
      }
      handleOpenSubjectFromCard(year, freeSubject);
      return;
    }

    // Trouver la première matière non terminée
    let targetSub = yrData.subjectsList[0];
    for (const sub of yrData.subjectsList) {
      const conc = yrData.subjectsMap[sub];
      const prog = getConcoursProgress(conc);
      if (prog.status !== 'Terminé') {
        targetSub = sub;
        break;
      }
    }

    handleOpenSubjectFromCard(year, targetSub);
  };

  // Sélection d'une question dans le sommaire et saut dans le QCM
  const handleSelectQuestion = (qNum) => {
    setActiveQuestion(qNum);
    try {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(f => {
        f.contentWindow?.postMessage({
          type: 'goto-question',
          index: qNum - 1,
          questionNumber: qNum
        }, '*');
      });
    } catch {}
  };

  const renderSubjectButton = (subKey) => {
    const conc = currentOpenYearData.subjectsMap[subKey];
    const prog = getConcoursProgress(conc);
    const isExpanded = subKey === activeSubject;
    const isSubLocked = isDemoMode() && !isDemoFree(conc);
    const displayName = getSubjectDisplayTitle(subKey);

    return (
      <button
        type="button"
        key={subKey}
        className={`concours-subject-accordion${isExpanded ? ' is-active' : ''}`}
        aria-pressed={isExpanded}
        onClick={() => {
          if (isSubLocked) {
            window.dispatchEvent(new CustomEvent('econcours-demo-paywall'));
            return;
          }
          setActiveSubject(subKey);
          const nextQ = prog.answeredCount < prog.totalQuestions ? prog.answeredCount + 1 : 1;
          setActiveQuestion(nextQ);
        }}
        title={isSubLocked ? 'Contenu réservé aux abonnés' : `Ouvrir ${displayName}`}
      >
        <span className="concours-subject-title-wrap">
          <span className="concours-subject-accent" style={{ backgroundColor: isSubLocked ? '#94a3b8' : '#2563eb' }} />
          <span className="concours-subject-title" style={{ color: isSubLocked ? '#64748b' : 'var(--text, #0f2a6b)' }}>
            {displayName} {isSubLocked && <span aria-label="Verrouillé">🔒</span>}
          </span>
        </span>
        <svg
          className="concours-subject-chevron"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    );
  };

  return (
    <div style={{
      maxWidth: 'none',
      margin: '0',
      padding: `${openYear ? '8px' : '24px'} 20px 80px`,
      fontFamily: "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif",
      color: 'var(--text, #0f2a6b)'
    }}>
      {/* =========================================================================
          ÉTAT DE CHARGEMENT & ERREURS
      ========================================================================= */}
      {loading ? (
        <div style={{
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '20px',
          padding: '80px 20px',
          textAlign: 'center',
          border: '1px solid var(--border, #e2e8f0)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            display: 'inline-block',
            width: '42px',
            height: '42px',
            border: '4px solid #dbeafe',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text, #0f2a6b)' }}>
            Chargement des concours...
          </div>
          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary, #64748b)', marginTop: '4px' }}>
            Synchronisation en direct avec la base de données
          </div>
        </div>
      ) : error ? (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '16px',
          padding: '20px 24px',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>
            ⚠️ {error}
          </div>
          <button
            onClick={fetchAllConcours}
            style={{
              background: '#ffffff',
              border: '1px solid #fca5a5',
              padding: '7px 16px',
              borderRadius: '8px',
              color: '#b91c1c',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      ) : dynamicYearsData.length === 0 ? (

        /* Aucun concours trouvé dans la base de données pour cette école */
        <div style={{
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '24px',
          padding: '80px 20px',
          textAlign: 'center',
          border: '2px dashed var(--border, #cbd5e1)'
        }}>
          <div style={{ fontSize: '50px', marginBottom: '14px' }}>📚</div>
          <h2 style={{ fontSize: '20px', fontWeight: 850, color: 'var(--text, #0f2a6b)', margin: '0 0 8px 0' }}>
            Aucun concours disponible pour le moment
          </h2>
          <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '14px', margin: '0 0 20px 0', maxWidth: '480px', marginInline: 'auto' }}>
            {requestedEcole
              ? `L'administrateur n'a pas encore ajouté de concours pour l'école « ${requestedEcole} ».`
              : "Seuls les concours réellement téléversés et publiés par l'administrateur depuis le panneau d'administration apparaîtront ici."}
          </p>
          <button
            onClick={fetchAllConcours}
            style={{
              background: 'linear-gradient(90deg, #1859cf 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(24, 101, 242, 0.28)'
            }}
          >
            Actualiser
          </button>
        </div>
      ) : openYear === null ? (

        /* =========================================================================
            VUE 1 : GRILLE DES CARTES DE CONCOURS DYNAMIQUES (SCREENSHOT 1)
        ========================================================================= */
        <div>
          {/* Header de la page */}
          <div style={{ marginBottom: '28px' }}>
            {/* Label & Filtre ANNÉE (Uniquement les années réelles de la base) */}
            <div style={{ position: 'relative', display: 'inline-block', minWidth: '240px' }}>
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  width: '100%',
                  padding: '11px 42px 11px 20px',
                  borderRadius: '9999px',
                  border: '1.5px solid var(--border, #e2e8f0)',
                  backgroundColor: 'var(--surface, #ffffff)',
                  color: 'var(--text, #0f2a6b)',
                  fontSize: '14px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  outline: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%232d8cff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 18px center'
                }}
              >
                <option value="all">Toutes les années</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grille des cartes par année (100% dynamiques) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 394px))',
            gap: '24px'
          }}>
            {filteredYears.map(item => {
              const yr = item.year;
              const subs = item.subjectsList; // Uniquement les matières réelles uploadées par l'admin !
              const overallProg = getYearOverallProgress(yr);
              const isOk = overallProg.status === 'Terminé';
              const isInProgress = overallProg.status === 'En cours';
              const ctaText = isOk ? 'Revoir' : (isInProgress ? 'Continuer' : 'Commencer');
              const demoAccessItem = item.concoursList.find(isDemoFree) || item.concoursList[0];

              return (
                <div
                  key={yr}
                  className={demoContentClass(demoAccessItem)}
                  style={{
                    position: 'relative',
                    backgroundColor: 'var(--surface, #ffffff)',
                    boxSizing: 'border-box',
                    height: '284px',
                    borderRadius: '26px',
                    border: '1px solid var(--border, #e2e8f0)',
                    boxShadow: '0 4px 20px -2px rgba(24, 101, 242, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(24, 101, 242, 0.16)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(24, 101, 242, 0.08)';
                  }}
                >
                  <DemoAccessBadge item={demoAccessItem} />
                  {/* Bannière bleue compacte avec grande année, mascotte et boutons matières réelles */}
                  <div style={{
                    position: 'relative',
                    height: '110px',
                    flex: '0 0 110px',
                    background: 'linear-gradient(135deg, #1859cf 0%, #2563eb 52%, #38a3ff 100%)',
                    overflow: 'hidden',
                    userSelect: 'none'
                  }}>
                    {/* Boutons matières réelles en haut à droite (cliquables !) */}
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      right: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '6px',
                      zIndex: 5
                    }}>
                      {subs.map(s => {
                        const shortCode = getSubjectShortCode(s);
                        const subjectConcours = item.subjectsMap[s];
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSubjectFromCard(yr, s);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(255, 255, 255, 0.92)',
                              opacity: isDemoMode() && !isDemoFree(subjectConcours) ? 0.58 : 1,
                              fontFamily: 'inherit',
                              fontSize: '11px',
                              fontWeight: 850,
                              letterSpacing: '0.6px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              lineHeight: 1.2
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.92)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title={`Ouvrir le concours ${s} ${yr}`}
                          >
                            {shortCode}{isDemoMode() && !isDemoFree(subjectConcours) ? ' 🔒' : ''}
                          </button>
                        );
                      })}
                    </div>

                    {/* Grande Année sur le côté gauche */}
                    <div style={{
                      position: 'absolute',
                      left: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '46px',
                      fontWeight: 900,
                      color: '#ffffff',
                      lineHeight: 1,
                      letterSpacing: '-1.5px',
                      zIndex: 2,
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
                    }}>
                      {yr}
                    </div>

                    {/* Mascotte E-Concours peeking bottom right (style identique à la page Cours & Concours Blancs) */}
                    <div style={{
                      position: 'absolute',
                      right: '-6px',
                      bottom: '-8px',
                      width: 'min(58%, 220px)',
                      aspectRatio: '577 / 350',
                      pointerEvents: 'none',
                      zIndex: 10,
                      filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.22))'
                    }}>
                      <img
                        src={cardMascot}
                        alt="Mascotte E-Concours"
                        style={{
                          display: 'block',
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          objectPosition: 'right bottom'
                        }}
                      />
                    </div>
                  </div>

                  {/* Corps de la carte */}
                  <div style={{
                    boxSizing: 'border-box',
                    minHeight: 0,
                    padding: '10px 14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flex: 1
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 850,
                      color: 'var(--text, #0f2a6b)',
                      letterSpacing: '-0.2px'
                    }}>
                      Concours {yr}
                    </h3>

                    {/* Pastilles type & nombre réel de matières */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        backgroundColor: '#eff6ff',
                        color: '#1865f2'
                      }}>
                        Concours
                      </span>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--surface-2, #f8fafc)',
                        color: 'var(--text-secondary, #64748b)',
                        border: '1px solid var(--border, #e2e8f0)'
                      }}>
                        {subs.length} matière{subs.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Barre de progression */}
                    <div style={{
                      height: '6px',
                      backgroundColor: 'var(--border, #e2e8f0)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      marginTop: '2px'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${overallProg.percentage}%`,
                        backgroundColor: isOk ? '#10b981' : '#1865f2',
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    {/* Statut & Pourcentage réel */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      color: 'var(--text-secondary, #64748b)'
                    }}>
                      <span style={{
                        color: isOk ? '#10b981' : (isInProgress ? '#1865f2' : 'var(--text-secondary, #64748b)'),
                        fontWeight: 800
                      }}>
                        {overallProg.status}
                      </span>
                      <span>{overallProg.percentage} %</span>
                    </div>

                    {/* Gros bouton CTA */}
                    <button
                      type="button"
                      onClick={() => handleOpenYearCTA(yr)}
                      style={{
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '8px 16px',
                        fontFamily: 'inherit',
                        fontWeight: 800,
                        fontSize: '14px',
                        color: '#ffffff',
                        background: 'linear-gradient(90deg, #1859cf 0%, #2563eb 100%)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(24, 101, 242, 0.28)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        width: '100%',
                        marginTop: 'auto'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(24, 101, 242, 0.38)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(24, 101, 242, 0.28)';
                      }}
                    >
                      {ctaText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (

        /* =========================================================================
            VUE 2 : PAGE DÉDIÉE AU CONCOURS SÉLECTIONNÉ AVEC SIDEBAR COMPACT
        ========================================================================= */
        <div className="concours-layout-grid">
          <style>{`
            .concours-layout-grid {
              display: grid;
              grid-template-columns: 210px minmax(0, 1fr);
              gap: 12px;
              align-items: start;
            }
            .concours-sidebar-wrap {
              width: 100%;
              min-width: 0;
              box-sizing: border-box;
              background: transparent;
              border: none;
              border-radius: 0;
              padding: 0;
              box-shadow: none;
              position: static;
              max-height: none;
              overflow: visible;
            }
            .concours-back-btn {
              align-self: flex-start;
              border: none;
              background-color: #eaf2ff;
              color: #1d4ed8;
              font-family: inherit;
              font-weight: 750;
              font-size: 13px;
              cursor: pointer;
              padding: 7px 14px;
              border-radius: 12px;
              margin-bottom: 16px;
              display: inline-flex;
              align-items: center;
              gap: 6px;
              transition: all 0.15s ease;
            }
            .concours-back-btn:hover {
              background-color: #dbeafe;
            }
            html[data-theme="dark"] .concours-back-btn {
              background-color: rgba(37, 99, 235, 0.2) !important;
              color: #93c5fd !important;
            }
            html[data-theme="dark"] .concours-back-btn:hover {
              background-color: rgba(37, 99, 235, 0.3) !important;
            }
            .concours-question-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 5cm;
              max-width: 5cm;
              margin-inline: 0;
              padding: 10px 14px;
              min-height: 44px;
              box-sizing: border-box;
              border-radius: 12px;
              cursor: pointer;
              border: 1px solid var(--border-subtle, #edf2f7);
              background-color: var(--surface, #ffffff);
              transition: all 0.15s ease;
              user-select: none;
            }
            .concours-question-item:not(.is-current):hover {
              background-color: var(--surface-hover, #f8fafc);
              border-color: var(--border, #e2e8f0);
            }
            .concours-question-item.is-current {
              border: 1.5px solid #3b82f6 !important;
              background-color: #eff6ff !important;
              box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
            }
            html[data-theme="dark"] .concours-question-item:not(.is-current) {
              background-color: var(--surface, #1e293b) !important;
              border-color: #334155 !important;
            }
            html[data-theme="dark"] .concours-question-item:not(.is-current):hover {
              background-color: var(--surface-hover, #263854) !important;
              border-color: #475569 !important;
            }
            html[data-theme="dark"] .concours-question-item.is-current {
              background-color: rgba(37, 99, 235, 0.18) !important;
              border-color: #60a5fa !important;
            }
            .concours-question-item.is-correct {
              border-color: #16a34a !important;
              background-color: #e8f7ee !important;
            }
            .concours-question-item.is-wrong {
              border-color: #ef2424 !important;
              background-color: #feecec !important;
            }
            .concours-question-item.is-correct.is-current,
            .concours-question-item.is-wrong.is-current {
              box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.16) !important;
            }
            .concours-question-status {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 26px;
              height: 26px;
              border-radius: 50%;
              color: #fff;
              font-size: 15px;
              font-weight: 900;
              line-height: 1;
              flex: 0 0 auto;
            }
            .concours-question-status.is-correct { background-color: #16a34a; }
            .concours-question-status.is-wrong { background-color: #ef2424; }
            html[data-theme="dark"] .concours-question-item.is-correct {
              border-color: #34d399 !important;
              background-color: #123325 !important;
            }
            html[data-theme="dark"] .concours-question-item.is-wrong {
              border-color: #f87171 !important;
              background-color: #3b2024 !important;
            }
            html[data-theme="dark"] .concours-question-item > span:first-child {
              color: #e2e8f0 !important;
            }
            html[data-theme="dark"] .concours-question-item.is-current > span:first-child {
              color: #93c5fd !important;
            }
            html[data-theme="dark"] .concours-question-status { color: #fff !important; }
            .concours-subject-tabs {
              display: grid;
              grid-template-columns: minmax(0, 5cm);
              gap: 8px;
              margin: 0 0 14px;
            }
            .concours-subject-accordion {
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 5cm;
              max-width: 5cm;
              min-width: 0;
              min-height: 44px;
              box-sizing: border-box;
              gap: 6px;
              padding: 8px 9px;
              border-radius: 13px;
              border: 1px solid var(--border-subtle, #edf2f7);
              background-color: var(--surface, #ffffff);
              cursor: pointer;
              margin: 0;
              color: var(--text, #0f2a6b);
              font: inherit;
              text-align: left;
              transition: all 0.15s ease;
              user-select: none;
            }
            .concours-subject-title-wrap {
              display: flex;
              align-items: center;
              flex: 1;
              min-width: 0;
              gap: 7px;
            }
            .concours-subject-accent {
              display: block;
              flex: 0 0 3.5px;
              height: 20px;
              border-radius: 9999px;
            }
            .concours-subject-title {
              flex: 1;
              min-width: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 12px !important;
              line-height: 1.2;
            }
            .concours-subject-chevron {
              flex-shrink: 0;
            }
            .concours-subject-accordion:hover {
              background-color: var(--surface-hover, #f8fafc);
              border-color: var(--border, #e2e8f0);
            }
            .concours-subject-accordion.is-active {
              border-color: #3b82f6 !important;
              background-color: #eff6ff !important;
              box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
            }
            .concours-subject-accordion.is-active .concours-subject-chevron {
              transform: rotate(180deg);
            }
            html[data-theme="dark"] .concours-subject-accordion {
              background-color: var(--surface, #1e293b) !important;
              border-color: #334155 !important;
            }
            html[data-theme="dark"] .concours-subject-accordion:hover {
              background-color: var(--surface-hover, #263854) !important;
              border-color: #475569 !important;
            }
            html[data-theme="dark"] .concours-subject-accordion.is-active {
              background-color: rgba(37, 99, 235, 0.18) !important;
              border-color: #60a5fa !important;
            }
            html[data-theme="dark"] .concours-subject-title {
              color: #f1f5f9 !important;
            }
            html[data-theme="dark"] .concours-subject-chevron {
              stroke: #cbd5e1 !important;
            }
            .concours-qcm-heading {
              display: none !important;
            }
            @media (max-width: 900px) {
              .concours-layout-grid {
                grid-template-columns: 1fr !important;
                gap: 12px;
              }
              .concours-subject-tabs {
                grid-template-columns: minmax(0, 5cm);
                justify-content: start;
              }
              .concours-sidebar-wrap {
                position: static !important;
                width: 100% !important;
                max-width: none !important;
                max-height: none !important;
                overflow: visible !important;
                margin-bottom: 8px !important;
                padding: 0 !important;
              }
              .concours-sidebar-section {
                margin-bottom: 0 !important;
              }
              .concours-question-list {
                flex-direction: row !important;
                gap: 8px !important;
                overflow-x: auto;
                padding-bottom: 6px;
                scrollbar-width: thin;
                -webkit-overflow-scrolling: touch;
              }
              .concours-question-item {
                flex: 0 0 5cm !important;
                width: 5cm !important;
                max-width: 5cm !important;
                min-height: 46px;
                justify-content: center !important;
                padding: 10px !important;
              }
              .concours-question-item svg {
                display: none !important;
              }
              .concours-question-status { display: inline-flex !important; }
              .concours-qcm-panel {
                min-height: calc(100vh - 190px) !important;
                padding: 8px 0 !important;
              }
            }
            @media (max-width: 280px) {
              .concours-subject-tabs { grid-template-columns: minmax(0, 1fr); }
              .concours-subject-accordion { width: 100%; max-width: none; }
              .concours-question-item { flex: 0 0 100% !important; width: 100% !important; max-width: 100% !important; }
            }
          `}</style>

          {/* Navigation verticale des matières et liste des questions */}
          <aside className="concours-sidebar-wrap">
            {/* Bouton Changer de concours (Pill bleu doux avec chevron gauche) */}
            <button
              type="button"
              className="concours-back-btn"
              onClick={() => setOpenYear(null)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Changer de concours</span>
            </button>

            {currentYearSubjects.length > 0 && (
              <div className="concours-subject-tabs" role="group" aria-label="Matières du concours">
                {[activeSubject, ...currentYearSubjects.filter(subKey => subKey !== activeSubject)]
                  .filter(Boolean)
                  .map(subKey => renderSubjectButton(subKey))}
              </div>
            )}

            {/* Questions de la matière sélectionnée */}
            {currentYearSubjects.map(subKey => {
              if (subKey !== activeSubject) return null;
              const prog = getConcoursProgress(currentOpenYearData.subjectsMap[subKey]);

              return (
                <div key={subKey} className="concours-sidebar-section">
                  <div className="concours-question-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Array.from({ length: prog.totalQuestions }, (_, i) => {
                      const qNum = i + 1;
                      const isCurrent = qNum === activeQuestion;
                      const ans = prog.answers?.[qNum];
                      const isAnswered = Boolean(ans);
                      const isCorrect = ans?.isCorrect === true;
                      const isWrong = ans?.isCorrect === false;

                      const questionCard = (
                        <div
                          key={`question-${qNum}`}
                          className={`concours-question-item${isCurrent ? ' is-current' : ''}${isCorrect ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}
                          onClick={() => handleSelectQuestion(qNum)}
                        >
                          <span style={{
                            fontSize: '14.5px',
                            fontWeight: 800,
                            color: isCurrent && !isAnswered ? '#1d4ed8' : 'var(--text, #0f2a6b)'
                          }}>
                            Q{qNum}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isCorrect || isWrong ? (
                              <span
                                className={`concours-question-status ${isCorrect ? 'is-correct' : 'is-wrong'}`}
                                aria-label={isCorrect ? 'Réponse correcte' : 'Réponse incorrecte'}
                                title={isCorrect ? 'Réponse correcte' : 'Réponse incorrecte'}
                              >
                                {isCorrect ? '✓' : '×'}
                              </span>
                            ) : (
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={isCurrent ? '#2563eb' : '#94a3b8'}
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );

                      return questionCard;
                    })}
                  </div>
                </div>
              );
            })}

          </aside>

          {/* CONTENU PRINCIPAL DE DROITE (CHARGEMENT DIRECT DU CONTENU QCM HTML DE L'ADMIN) */}
          <main className="concours-qcm-panel" style={{
            padding: '8px 0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {currentActiveConcours ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Affichage du QCM HTML réel ajouté par l'administrateur */}
                {!isSchoolIncluded(currentActiveConcours.ecole) ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    backgroundColor: 'var(--bg, #f8fafc)',
                    borderRadius: '16px',
                    border: '1.5px dashed var(--border, #cbd5e1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '42px', marginBottom: '12px' }}>🔒</div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: 'var(--text, #0f2a6b)' }}>
                      Concours visible — accès réservé
                    </h4>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary, #64748b)', maxWidth: '420px' }}>
                      Cette épreuve est disponible dans le pack {getSchoolCode(currentActiveConcours.ecole) || 'correspondant'}.
                    </p>
                  </div>
                ) : currentActiveConcours.htmlUrl ? (
                  <div style={{ flex: 1, minHeight: 0, borderRadius: '16px', overflow: 'visible' }}>
                    <TrackedQcmFrame
                      src={getPdfUrl(currentActiveConcours.htmlUrl)}
                      title={`${currentActiveConcours.titre} - Sujet`}
                      sourceType="Concours"
                      resourceId={currentActiveConcours.id}
                      resourceTitle={currentActiveConcours.titre}
                      subject={activeSubject}
                      school={currentActiveConcours.ecole || requestedEcole || ''}
                      year={openYear}
                      enableTimer={false}
                      style={{ width: '100%', height: '80vh', border: 'none', display: 'block', background: 'transparent' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    backgroundColor: 'var(--bg, #f8fafc)',
                    borderRadius: '16px',
                    border: '1.5px dashed var(--border, #cbd5e1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '42px', marginBottom: '12px' }}>📂</div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: 'var(--text, #0f2a6b)' }}>
                      Aucun fichier QCM HTML téléversé
                    </h4>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary, #64748b)', maxWidth: '420px' }}>
                      L'administrateur n'a pas encore ajouté de fichier QCM pour l'épreuve de {activeSubject} ({openYear}). Dès qu'un fichier sera téléversé depuis le panneau Admin, il apparaîtra ici automatiquement.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary, #64748b)'
              }}>
                Sélectionnez une matière pour afficher son contenu.
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
