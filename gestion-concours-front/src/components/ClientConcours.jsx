import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { filterByStudentPack, getSchoolCode } from '../packAccess';
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
  const [viewerTab, setViewerTab] = useState('sujet'); // 'sujet' | 'correction'

  useEffect(() => {
    setSelectedYearFilter('all');
    setOpenYear(null);
    setActiveSubject(null);
    setActiveQuestion(1);
    setViewerTab('sujet');
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
      setConcoursList(filterByStudentPack(data));
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
    setViewerTab('sujet');

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
                  {/* Bannière bleue dégradée avec grande année, mascotte et boutons matières réelles (hauteur identique à la page Cours : 182px) */}
                  <div style={{
                    position: 'relative',
                    height: '182px',
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
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
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
                        padding: '12px 20px',
                        fontFamily: 'inherit',
                        fontWeight: 800,
                        fontSize: '14px',
                        color: '#ffffff',
                        background: 'linear-gradient(90deg, #1859cf 0%, #2563eb 100%)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(24, 101, 242, 0.28)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        width: '100%',
                        marginTop: '4px'
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
              grid-template-columns: 168px minmax(0, 1fr);
              gap: 24px;
              align-items: start;
            }
            .concours-sidebar-wrap {
              width: 100%;
              min-width: 0;
              box-sizing: border-box;
              scrollbar-width: none;
              -ms-overflow-style: none;
              background: transparent !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }
            .concours-sidebar-wrap::-webkit-scrollbar {
              display: none;
              width: 0;
            }
            html[data-theme="dark"] .concours-question-item:not(.is-current) {
              background: var(--surface, #1b2940) !important;
              border-color: var(--border-subtle, #223247) !important;
            }
            html[data-theme="dark"] .concours-question-item.is-current {
              background: var(--surface-hover, #263854) !important;
              border-color: var(--primary, #60a5fa) !important;
            }
            html[data-theme="dark"] .concours-question-item > span:first-child {
              color: #e2e8f0 !important;
            }
            html[data-theme="dark"] .concours-question-item.is-current > span:first-child,
            html[data-theme="dark"] .concours-question-status {
              color: #93c5fd !important;
            }
            .concours-qcm-heading {
              display: none !important;
            }
            @media (max-width: 900px) {
              .concours-layout-grid {
                grid-template-columns: 1fr !important;
                gap: 12px;
              }
              .concours-sidebar-wrap {
                position: static !important;
                width: min(100%, 210px) !important;
                max-width: 210px !important;
                max-height: none !important;
                margin-bottom: 4px !important;
                padding: 10px 8px !important;
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
                flex: 0 0 58px !important;
                min-height: 46px;
                justify-content: center !important;
                padding: 10px !important;
              }
              .concours-question-status,
              .concours-question-item svg {
                display: none !important;
              }
              .concours-qcm-panel {
                min-height: calc(100vh - 190px) !important;
                padding: 8px 0 !important;
              }
            }
          `}</style>

          {/* SIDEBAR VERTICAL COMPACT (INSPIRÉ DE LA CAPTURE FOURNIE) */}
          <aside className="concours-sidebar-wrap" style={{
            position: 'sticky',
            top: '8px',
            maxHeight: 'calc(100vh - 110px)',
            overflowY: 'auto',
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Bouton Changer de concours (Pill bleu doux avec chevron gauche) */}
            <button
              type="button"
              onClick={() => setOpenYear(null)}
              style={{
                alignSelf: 'flex-start',
                border: '1px solid #dbeafe',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontFamily: 'inherit',
                fontWeight: 750,
                fontSize: '12px',
                cursor: 'pointer',
                padding: '6px 7px',
                borderRadius: '9999px',
                marginBottom: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span style={{ fontSize: '11px' }}>Changer de concours</span>
            </button>

            {/* Matières réelles sous forme de sections accordéon sans icônes */}
            {currentYearSubjects.map(subKey => {
              const conc = currentOpenYearData.subjectsMap[subKey];
              const prog = getConcoursProgress(conc);
              const isExpanded = (subKey === activeSubject);
              const displayName = getSubjectDisplayTitle(subKey);

              if (isExpanded) {
                return (
                  <div key={subKey} className="concours-sidebar-section" style={{ marginBottom: '12px' }}>
                    {/* En-tête de la matière ouverte : Nom en gras + badge score/questions */}
                    <div
                      onClick={() => setActiveSubject(null)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                        gap: '8px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      title="Cliquer pour réduire cette matière"
                    >
                      <h2 style={{
                        margin: 0,
                        fontSize: '22px',
                        fontWeight: 850,
                        color: 'var(--text, #0f2a6b)',
                        letterSpacing: '-0.35px',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {displayName}
                      </h2>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        padding: '5px 9px',
                        flexShrink: 0,
                        borderRadius: '9999px',
                        backgroundColor: 'var(--surface-2, #f1f5f9)',
                        color: 'var(--text, #0f2a6b)',
                        border: '1px solid var(--border, #e2e8f0)'
                      }}>
                        {prog.answeredCount}/{prog.totalQuestions}
                      </span>
                    </div>

                    {/* Liste des questions Q1, Q2, Q3... sans doublons */}
                    <div className="concours-question-list" style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {Array.from({ length: prog.totalQuestions }, (_, i) => {
                        const qNum = i + 1;
                        const isCurrent = (qNum === activeQuestion);

                        return (
                          <div
                            key={qNum}
                            className={`concours-question-item${isCurrent ? ' is-current' : ''}`}
                            onClick={() => handleSelectQuestion(qNum)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '9px 12px',
                              minHeight: '44px',
                              boxSizing: 'border-box',
                              borderRadius: '11px',
                              cursor: 'pointer',
                              border: isCurrent ? '1px solid var(--primary, #2563eb)' : '1px solid var(--border-subtle, #e8edf5)',
                              backgroundColor: isCurrent ? 'var(--surface-hover, #eff6ff)' : 'var(--surface, #ffffff)',
                              boxShadow: isCurrent ? '0 2px 8px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(15, 42, 107, 0.03)',
                              transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrent) {
                                e.currentTarget.style.backgroundColor = '#f8fafc';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isCurrent) {
                                e.currentTarget.style.backgroundColor = 'var(--surface, #ffffff)';
                                e.currentTarget.style.borderColor = '#e8edf5';
                              }
                            }}
                          >
                            <span style={{
                              fontSize: '14px',
                              fontWeight: 800,
                              color: isCurrent ? 'var(--primary, #1d4ed8)' : 'var(--text, #0f2a6b)'
                            }}>
                              Q{qNum}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isCurrent && (
                                <span className="concours-question-status" style={{
                                  fontSize: '12.5px',
                                  fontWeight: 750,
                                  color: '#2563eb'
                                }}>
                                  En cours
                                </span>
                              )}
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={isCurrent ? '#2563eb' : '#94a3b8'}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Section matière réduite : barre bleue à gauche, libellé sans icône, chevron bas
              return (
                <div
                  key={subKey}
                  onClick={() => {
                    setActiveSubject(subKey);
                    const nextQ = prog.answeredCount < prog.totalQuestions ? prog.answeredCount + 1 : 1;
                    setActiveQuestion(nextQ);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '11px',
                border: '1px solid #e8edf5',
                backgroundColor: 'var(--surface, #ffffff)',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#e8edf5';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '3.5px',
                      height: '18px',
                      borderRadius: '9999px',
                      backgroundColor: '#1865f2'
                    }} />
                    <span style={{
                      fontSize: '15.5px',
                      fontWeight: 800,
                      color: '#0f2a6b'
                    }}>
                      {displayName}
                    </span>
                  </div>

                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0f2a6b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              );
            })}
          </aside>

          {/* CONTENU PRINCIPAL DE DROITE (CHARGEMENT DIRECT DU CONTENU QCM HTML DE L'ADMIN) */}
          <main className="concours-qcm-panel" style={{
            padding: '8px 0',
            minHeight: '640px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {currentActiveConcours ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Barre de titre et onglets Sujet / Corrigé */}
                <div style={{
                  display: (currentActiveConcours.htmlCorrectionUrl || currentActiveConcours.pdfCorrectionUrl) ? 'flex' : 'none',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingBottom: '14px',
                  borderBottom: '1px solid var(--border, #e2e8f0)'
                }}>
                  <div className="concours-qcm-heading">
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 850,
                      color: '#1865f2',
                      letterSpacing: '0.6px',
                      textTransform: 'uppercase'
                    }}>
                      {activeSubject?.toUpperCase()} · CONCOURS {openYear}
                    </span>
                    <h3 style={{ margin: '3px 0 0', fontSize: '20px', fontWeight: 850, color: 'var(--text, #0f2a6b)' }}>
                      {currentActiveConcours.titre || `Concours ${openYear} — ${activeSubject}`}
                    </h3>
                  </div>

                  {/* Boutons Sujet / Corrigé si le corrigé existe */}
                  {(currentActiveConcours.htmlCorrectionUrl || currentActiveConcours.pdfCorrectionUrl) && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setViewerTab('sujet')}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 750,
                          cursor: 'pointer',
                          border: viewerTab === 'sujet' ? '1.5px solid #1865f2' : '1px solid var(--border, #cbd5e1)',
                          backgroundColor: viewerTab === 'sujet' ? '#eff6ff' : '#ffffff',
                          color: viewerTab === 'sujet' ? '#1865f2' : 'var(--text-secondary, #64748b)'
                        }}
                      >
                        📄 Sujet
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewerTab('correction')}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 750,
                          cursor: 'pointer',
                          border: viewerTab === 'correction' ? '1.5px solid #10b981' : '1px solid var(--border, #cbd5e1)',
                          backgroundColor: viewerTab === 'correction' ? '#ecfdf5' : '#ffffff',
                          color: viewerTab === 'correction' ? '#047857' : 'var(--text-secondary, #64748b)'
                        }}
                      >
                        ✅ Corrigé
                      </button>
                    </div>
                  )}
                </div>

                {/* Affichage du QCM HTML réel ajouté par l'administrateur */}
                {currentActiveConcours.htmlUrl ? (
                  <div style={{ flex: 1, minHeight: '680px', borderRadius: '16px', overflow: 'hidden' }}>
                    <TrackedQcmFrame
                      src={getPdfUrl(viewerTab === 'sujet' ? currentActiveConcours.htmlUrl : (currentActiveConcours.htmlCorrectionUrl || currentActiveConcours.pdfCorrectionUrl || currentActiveConcours.htmlUrl))}
                      title={`${currentActiveConcours.titre} - ${viewerTab}`}
                      sourceType="Concours"
                      resourceId={currentActiveConcours.id}
                      resourceTitle={currentActiveConcours.titre}
                      subject={activeSubject}
                      school={currentActiveConcours.ecole || requestedEcole || ''}
                      year={openYear}
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
