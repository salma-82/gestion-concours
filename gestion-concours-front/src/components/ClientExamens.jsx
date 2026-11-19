import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import AutoHeightHtmlFrame from './AutoHeightHtmlFrame';
import { toBackendResourceUrl } from '../backendResourceUrl';
import {
  fetchStudentActivityCompletionMap,
  getStudentActivityStatusKey,
  readStudentProgress,
  recordStudentActivity,
  setStudentActivityCompleted
} from '../studentProgress';
import cardMascot from '../assets/logo-mascot.png';
import './ClientExamens.css';
import './ClientCatalogCards.css';
import { demoContentClass, DemoAccessBadge, guardDemoContent } from '../demoAccess';

const isPdfDocument = (url) => /\.pdf(?:$|[?#])/i.test(String(url || ''));

/* ─────────────────────────────────────────────
   HELPERS : Filière & Matière
   ───────────────────────────────────────────── */
const matchOption = (itemOption, targetFiliere) => {
  if (!targetFiliere) return true;
  if (!itemOption) return true;
  const item = itemOption.trim().toLowerCase();
  const target = targetFiliere.trim().toLowerCase();

  if (item === target) return true;
  if (item.includes('toutes') || target.includes('toutes')) return true;

  const isSmA = (s) => (s.includes('sm') && s.includes('a')) || s.includes('mathématiques a') || s.includes('maths a');
  const isSmB = (s) => (s.includes('sm') && s.includes('b')) || s.includes('mathématiques b') || s.includes('maths b');
  const isPc = (s) => s.includes('pc') || s.includes('physique');
  const isSvt = (s) => s.includes('svt') || s.includes('vie') || s.includes('terre');
  const isEco = (s) => s.includes('eco') || s.includes('économie') || s.includes('gestion');
  const isSte = (s) => s.includes('ste') || s.includes('électrique');
  const isStm = (s) => s.includes('stm') || s.includes('mécanique');
  const isLettres = (s) => s.includes('lettre') || s.includes('humaine');

  if (isSmA(target) && isSmA(item)) return true;
  if (isSmB(target) && isSmB(item)) return true;
  if (isPc(target) && isPc(item)) return true;
  if (isSvt(target) && isSvt(item)) return true;
  if (isEco(target) && isEco(item)) return true;
  if (isSte(target) && isSte(item)) return true;
  if (isStm(target) && isStm(item)) return true;
  if (isLettres(target) && isLettres(item)) return true;

  return item.includes(target) || target.includes(item);
};

const matchMatiere = (value, configId) => {
  if (!value || !configId) return false;
  const v = value.toLowerCase().trim();
  const c = configId.toLowerCase().trim();
  if (c.includes('math')) return v.includes('math');
  if (c.includes('phys')) return v.includes('phys') || v.includes('chimie') || v === 'pc';
  if (c.includes('svt') || c.includes('vie') || c.includes('terre')) return v.includes('svt') || v.includes('vie') || v.includes('terre');
  if (c.includes('philo')) return v.includes('philo');
  if (c.includes('ang') || c.includes('eng')) return v.includes('ang') || v.includes('eng');
  return v.includes(c) || c.includes(v);
};

const getExamMatiere = (exam) => {
  const source = String(exam?.matiere || '').trim();
  const title = String(exam?.titre || '').trim();
  const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const resolve = (value) => {
    const normalized = normalize(value);
    if (normalized.includes('math')) return 'Mathématiques';
    if (normalized.includes('phys') || normalized.includes('chim')) return 'Physique - Chimie';
    if (normalized.includes('svt') || normalized.includes('vie') || normalized.includes('terre')) return 'Sciences de la Vie et de la Terre';
    if (normalized.includes('philo')) return 'Philosophie';
    if (normalized.includes('anglais') || normalized.includes('english')) return 'Anglais';
    return '';
  };
  return resolve(source) || resolve(title) || source || title;
};

const getExamSession = (exam) => {
  const explicit = String(exam?.session || '').trim().toLowerCase();
  const title = String(exam?.titre || '').trim().toLowerCase();
  if (explicit.includes('rattrapage') || title.includes('rattrapage')) return 'Rattrapage';
  return 'Normale';
};

/* ─────────────────────────────────────────────
   SECTIONS OFFICIELLES PAR MATIÈRE
   ───────────────────────────────────────────── */
const EXAM_SECTIONS = [
  {
    id: 'Mathématiques',
    nom: 'Mathématiques',
    headingTitle: 'Math',
    tag: 'MATH',
    fullTag: 'MATHEMATIQUES',
    subtitle: 'Examens nationaux de mathématiques.',
    formulas: '∑  f(x)  ∫dx  lim',
    defaultDuration: '3 h'
  },
  {
    id: 'Physique - Chimie',
    nom: 'Physique - Chimie',
    headingTitle: 'Physique - Chimie',
    tag: 'PHYSIQUE',
    fullTag: 'PHYSIQUE - CHIMIE',
    subtitle: 'Examens nationaux de physique-chimie.',
    formulas: 'E=mc²  F=ma  U=RI  λ',
    defaultDuration: '3 h'
  },
  {
    id: 'Sciences de la Vie et de la Terre',
    nom: 'Sciences de la Vie et de la Terre',
    headingTitle: 'Sciences de la Vie et de la Terre',
    tag: 'SVT',
    fullTag: 'SCIENCES DE LA VIE ET DE LA TERRE',
    subtitle: 'Examens nationaux de SVT.',
    formulas: 'ADN  ATP  CO₂  O₂',
    defaultDuration: '3 h'
  },
  {
    id: 'Philosophie',
    nom: 'Philosophie',
    headingTitle: 'Philosophie',
    tag: 'PHILO',
    fullTag: 'PHILOSOPHIE',
    subtitle: 'Examens nationaux de philosophie.',
    formulas: 'Logos  Vérité  Devoir  Morale',
    defaultDuration: '2 h'
  },
  {
    id: 'Anglais',
    nom: 'Anglais',
    headingTitle: 'Anglais',
    tag: 'ENGLISH',
    fullTag: 'ANGLAIS',
    subtitle: 'Examens nationaux d’anglais.',
    formulas: 'Grammar  Reading  Writing  Vocab',
    defaultDuration: '2 h'
  }
];

const SUBJECT_PILLS = [
  'Toutes',
  'Mathématiques',
  'Physique - Chimie',
  'Sciences de la Vie et de la Terre',
  'Philosophie',
  'Anglais'
];

export default function ClientExamens() {
  const [searchParams] = useSearchParams();
  const filiereParam = searchParams.get('filiere') || '';
  const requestedExamId = searchParams.get('examId') || '';
  const requestedDocument = searchParams.get('document') || 'sujet';

  let profileFiliere = '';
  try {
    profileFiliere = JSON.parse(localStorage.getItem('user') || '{}')?.filiere || '';
  } catch { }

  const [selectedFiliere, setSelectedFiliere] = useState(filiereParam || profileFiliere);
  const [examens, setExamens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres
  const [selectedSubjectPill, setSelectedSubjectPill] = useState('Toutes');
  const [selectedSession, setSelectedSession] = useState('Toutes'); // 'Toutes' | 'Normale' | 'Rattrapage'
  const [selectedAnnee, setSelectedAnnee] = useState(''); // '' = toutes les années

  // Suivi de progression étudiant
  const [completionMap, setCompletionMap] = useState({});
  const [progressList, setProgressList] = useState(() => readStudentProgress());
  const [isFinishingExam, setIsFinishingExam] = useState(false);
  const [finishExamError, setFinishExamError] = useState('');

  // Mode Visionneuse
  const [activeExam, setActiveExam] = useState(null);
  const [activeDocType, setActiveDocType] = useState('sujet'); // 'sujet' | 'correction'
  const openedExamRequestRef = useRef('');

  // Synchronisation avec les paramètres d'URL
  useEffect(() => {
    const f = searchParams.get('filiere') || '';
    setSelectedFiliere(f || profileFiliere);
  }, [searchParams, profileFiliere]);

  // Chargement des données d'examens
  useEffect(() => {
    fetchExamens();
  }, []);

  const fetchExamens = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/examens-nationaux', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      setExamens(data);
    } catch (err) {
      console.error('Erreur fetch examens:', err);
      setError('Impossible de charger les examens nationaux. Vérifiez que le serveur est démarré.');
    } finally {
      setLoading(false);
    }
  };

  // Chargement de la map de complétion
  useEffect(() => {
    let isMounted = true;
    fetchStudentActivityCompletionMap()
      .then((map) => { if (isMounted) setCompletionMap((previous) => ({ ...previous, ...(map || {}) })); })
      .catch(() => { });

    const handleProgressUpdate = () => {
      setProgressList(readStudentProgress());
      fetchStudentActivityCompletionMap()
        .then((map) => { if (isMounted) setCompletionMap((previous) => ({ ...previous, ...(map || {}) })); })
        .catch(() => { });
    };

    window.addEventListener('student-progress-updated', handleProgressUpdate);
    window.addEventListener('student-server-activity-updated', handleProgressUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('student-progress-updated', handleProgressUpdate);
      window.removeEventListener('student-server-activity-updated', handleProgressUpdate);
    };
  }, []);

  const getFullUrl = (url) => {
    if (!url) return '';
    const normalizedUrl = toBackendResourceUrl(url);
    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) return normalizedUrl;
    return `/${normalizedUrl.startsWith('/') ? normalizedUrl.substring(1) : normalizedUrl}`;
  };

  // Pages du document actif (Sujet ou Corrigé)
  const getActivePages = (exam, docType) => {
    if (!exam) return [];
    if (docType === 'sujet') {
      return (exam.sujetPageImages || []).map(getFullUrl);
    }
    return (exam.correctionPageImages || []).map(getFullUrl);
  };

  // Ouvrir le lecteur pour une épreuve
  const handleOpenReader = useCallback((exam, type = 'sujet') => {
    setActiveExam(exam);
    setActiveDocType(type);
    recordStudentActivity({
      type: 'Examen national',
      resourceId: `${exam.id}:${type}`,
      title: exam.titre || `Examen National ${exam.annee || ''}`.trim(),
      subject: getExamMatiere(exam) || '',
      chapter: exam.annee ? String(exam.annee) : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Gestion du deep-linking via query params (?examId=...&document=...)
  useEffect(() => {
    if (!requestedExamId) {
      openedExamRequestRef.current = '';
      return;
    }
    const requestKey = `${requestedExamId}:${requestedDocument}`;
    if (!examens.length || openedExamRequestRef.current === requestKey) return;
    const exam = examens.find((item) => String(item.id) === requestedExamId);
    if (!exam) return;
    const documentType = requestedDocument === 'correction' ? 'correction' : 'sujet';
    if (documentType === 'correction' && !exam.pdfCorrectionUrl && !exam.correctionPageImages?.length) return;
    openedExamRequestRef.current = requestKey;
    handleOpenReader(exam, documentType);
  }, [examens, requestedExamId, requestedDocument, handleOpenReader]);

  // Synchronisation avec la mascotte globale du layout
  useEffect(() => {
    const stage = activeExam ? activeDocType : 'selection';
    const context = activeExam
      ? [getExamMatiere(activeExam), activeExam.annee, activeExam.titre].filter(Boolean).join(' · ')
      : [selectedFiliere, selectedSubjectPill !== 'Toutes' ? selectedSubjectPill : '', selectedAnnee].filter(Boolean).join(' · ');
    window.dispatchEvent(new CustomEvent('client-mascot-stage', { detail: { stage, context } }));
  }, [activeExam, activeDocType, selectedFiliere, selectedSubjectPill, selectedAnnee]);

  // Document switcher
  const handleSelectDocument = (type) => {
    if (!activeExam || activeDocType === type) return;
    setActiveDocType(type);
    recordStudentActivity({
      type: 'Examen national',
      resourceId: `${activeExam.id}:${type}`,
      title: activeExam.titre || `Examen National ${activeExam.annee || ''}`.trim(),
      subject: getExamMatiere(activeExam) || '',
      chapter: activeExam.annee ? String(activeExam.annee) : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Marquer l'examen comme terminé
  const activeExamIsCompleted = useMemo(() => {
    if (!activeExam) return false;
    const keyWithDoc = getStudentActivityStatusKey('Examen national', `${activeExam.id}:${activeDocType}`);
    const keyGeneral = getStudentActivityStatusKey('Examen national', activeExam.id);
    return completionMap[keyWithDoc] === true || completionMap[keyGeneral] === true;
  }, [activeExam, activeDocType, completionMap]);

  const handleFinishExam = async () => {
    if (!activeExam || isFinishingExam || activeExamIsCompleted) return;
    const activityId = `Examen national:${activeExam.id}:${activeDocType}`;
    setIsFinishingExam(true);
    setFinishExamError('');
    try {
      const saved = await setStudentActivityCompleted(activityId, true);
      if (!saved) {
        setFinishExamError('L’enregistrement a échoué. Veuillez réessayer.');
        return;
      }
      const key = getStudentActivityStatusKey('Examen national', `${activeExam.id}:${activeDocType}`);
      setCompletionMap((prev) => ({ ...prev, [key]: true }));
      setProgressList(readStudentProgress());
    } catch {
      setFinishExamError('L’enregistrement a échoué. Veuillez réessayer.');
    } finally {
      setIsFinishingExam(false);
    }
  };

  // Années disponibles dans le jeu de données pour le sélecteur
  const availableYears = useMemo(() => {
    const relevantExams = selectedFiliere
      ? examens.filter((e) => matchOption(e.optionBac, selectedFiliere))
      : examens;
    return [...new Set(
      relevantExams.map((e) => e.annee).filter((annee) => annee !== null && annee !== undefined && annee !== '')
    )].sort((a, b) => Number(b) - Number(a));
  }, [examens, selectedFiliere]);

  // Examens filtrés globalement (filière, recherche, session, année)
  const filteredExams = useMemo(() => {
    return examens.filter((e) => {
      // Filtre filière (si une filière est définie dans le profil ou l'URL)
      if (selectedFiliere && !matchOption(e.optionBac, selectedFiliere)) {
        return false;
      }

      // Filtre année
      if (selectedAnnee && String(e.annee) !== String(selectedAnnee)) {
        return false;
      }

      // Filtre session
      if (selectedSession !== 'Toutes') {
        const session = getExamSession(e);
        if (session.toLowerCase() !== selectedSession.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [examens, selectedFiliere, selectedAnnee, selectedSession]);

  // Calcul du statut et pourcentage de progression d'une épreuve
  const getExamProgressData = useCallback((exam) => {
    const examId = exam?.id;
    const keyWithSujet = getStudentActivityStatusKey('Examen national', `${examId}:sujet`);
    const keyGeneral = getStudentActivityStatusKey('Examen national', examId);
    const keyWithCorr = getStudentActivityStatusKey('Examen national', `${examId}:correction`);

    const isCompleted =
      completionMap[keyWithSujet] === true ||
      completionMap[keyGeneral] === true ||
      completionMap[keyWithCorr] === true;

    if (isCompleted) {
      return {
        status: 'Terminé',
        pct: 100,
        label: 'Terminé',
        btnText: 'Revoir',
        statusClass: 'status-completed'
      };
    }

    const activity = progressList.find(
      (p) =>
        p.id === `Examen national:${examId}` ||
        p.id === `Examen national:${examId}:sujet` ||
        (p.title && exam.titre && p.title.trim().toLowerCase() === exam.titre.trim().toLowerCase())
    );

    if (activity && (activity.visits > 0 || activity.durationSeconds > 0)) {
      const pct = activity.durationSeconds > 180 ? 60 : activity.durationSeconds > 40 ? 45 : 30;
      return {
        status: 'En cours',
        pct,
        label: 'En cours',
        btnText: 'Commencer',
        statusClass: 'status-in-progress'
      };
    }

    return {
      status: 'Nouveau',
      pct: 0,
      label: 'Nouveau',
      btnText: 'Commencer',
      statusClass: 'status-new'
    };
  }, [completionMap, progressList]);

  // Sections à afficher selon la pilule matière sélectionnée
  const visibleSections = useMemo(() => {
    if (selectedSubjectPill === 'Toutes') {
      return EXAM_SECTIONS;
    }
    return EXAM_SECTIONS.filter((s) => s.nom === selectedSubjectPill || s.id === selectedSubjectPill);
  }, [selectedSubjectPill]);

  // =========================================================================
  // RENDU VUE 1 : VISIONNEUSE DU DOCUMENT (LECTEUR PLEIN ÉCRAN)
  // =========================================================================
  if (activeExam) {
    const docUrl = activeDocType === 'correction'
      ? (activeExam.pdfCorrectionUrl || activeExam.htmlUrl)
      : (activeExam.pdfSujetUrl || activeExam.htmlUrl);

    const activePages = getActivePages(activeExam, activeDocType);
    const hasCorrection = Boolean(activeExam.pdfCorrectionUrl || (activeExam.correctionPageImages && activeExam.correctionPageImages.length > 0));

    return (
      <div className="client-examens-container">
        <div className="client-exam-viewer">
          {/* Barre de commande supérieure du lecteur */}
          <div className="client-exam-viewer-bar">
            <button
              type="button"
              className="client-exam-viewer-back"
              onClick={() => setActiveExam(null)}
              aria-label="Retourner à la liste des examens"
            >
              <span>←</span>
              <span>Retour aux examens</span>
            </button>

            <div className="client-exam-viewer-controls">
              {/* Sélecteur Sujet / Corrigé */}
              <button
                type="button"
                className={`client-exam-viewer-pill-btn ${activeDocType === 'sujet' ? 'is-active-sujet' : ''}`}
                onClick={() => handleSelectDocument('sujet')}
              >
                <span>📄</span>
                <span>Sujet</span>
              </button>

              <button
                type="button"
                className={`client-exam-viewer-pill-btn ${activeDocType === 'correction' ? 'is-active-correction' : ''}`}
                onClick={() => handleSelectDocument('correction')}
                disabled={!hasCorrection}
                title={!hasCorrection ? 'Aucun corrigé déposé pour cette épreuve' : 'Consulter le corrigé officiel'}
              >
                <span>✅</span>
                <span>Corrigé</span>
              </button>

              {/* Bouton Terminer */}
              <button
                type="button"
                className={`client-exam-viewer-finish ${activeExamIsCompleted ? 'is-completed' : ''}`}
                onClick={handleFinishExam}
                disabled={isFinishingExam || activeExamIsCompleted}
              >
                {isFinishingExam ? 'Enregistrement…' : activeExamIsCompleted ? 'Terminé ✓' : 'Terminer'}
              </button>
              {finishExamError && (
                <span role="alert" style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 600 }}>
                  {finishExamError}
                </span>
              )}
            </div>
          </div>

          {/* Affichage du contenu du document */}
          <div className="client-exam-viewer-content">
            {(() => {
              if (activePages.length > 0) {
                return (
                  <div style={{ width: '100%', minHeight: 'calc(100vh - 220px)' }}>
                    {activePages.map((url, index) => (
                      <img
                        key={`${url}-${index}`}
                        src={url}
                        alt={`Page ${index + 1}`}
                        loading={index > 1 ? 'lazy' : 'eager'}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                    ))}
                  </div>
                );
              }

              if (docUrl && isPdfDocument(docUrl)) {
                return (
                  <iframe
                    key={`${activeExam.id}-${activeDocType}`}
                    src={getFullUrl(docUrl)}
                    title={activeExam.titre || 'Examen National'}
                    style={{
                      width: '100%',
                      height: 'calc(100vh - 200px)',
                      minHeight: '600px',
                      border: 'none',
                      display: 'block',
                    }}
                  />
                );
              }

              if (docUrl && !isPdfDocument(docUrl)) {
                return (
                  <AutoHeightHtmlFrame
                    key={`${activeExam.id}-${activeDocType}`}
                    src={getFullUrl(docUrl)}
                    title={activeExam.titre || 'Examen National'}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    integrated
                    style={{
                      width: '100%',
                      minHeight: '600px',
                      border: 'none',
                      display: 'block',
                      background: 'transparent'
                    }}
                  />
                );
              }

              return (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '14px' }}>📄</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                    Document {activeDocType === 'correction' ? 'de correction' : 'du sujet'} non disponible
                  </h3>
                  <p style={{ margin: '0 0 20px', fontSize: '14px' }}>
                    L’administrateur n’a pas encore déposé ce fichier.
                  </p>
                  <button
                    type="button"
                    className="client-examens-reset-btn"
                    onClick={() => setActiveExam(null)}
                  >
                    ← Retourner aux examens
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDU VUE 2 : CATALOGUE COMPLET DES EXAMENS (MATCH SCREENSHOT 1)
  // =========================================================================
  return (
    <div className="client-examens-container">
      {/* 3. Pilules de matières (Toutes | Mathématiques | Physique - Chimie...) */}
      <div className="client-examens-pills-row" role="tablist" aria-label="Matières d'examens">
        {SUBJECT_PILLS.map((pillLabel) => (
          <button
            key={pillLabel}
            type="button"
            className={`client-examens-pill ${selectedSubjectPill === pillLabel ? 'is-active' : ''}`}
            onClick={() => setSelectedSubjectPill(pillLabel)}
            role="tab"
            aria-selected={selectedSubjectPill === pillLabel}
          >
            {pillLabel}
          </button>
        ))}
      </div>

      {/* 4. Barre des filtres secondaires (Session & Année) */}
      <div className="client-examens-filters-row">
        {/* Contrôle segmenté de Session */}
        <div className="client-examens-filter-group">
          <span className="client-examens-filter-label">Session</span>
          <div className="client-examens-segmented" role="group" aria-label="Filtrer par session">
            {['Toutes', 'Normale', 'Rattrapage'].map((session) => (
              <button
                key={session}
                type="button"
                className={`client-examens-segmented-btn ${selectedSession === session ? 'is-active' : ''}`}
                onClick={() => setSelectedSession(session)}
              >
                {session}
              </button>
            ))}
          </div>
        </div>

        {/* Menu déroulant arrondi pour l'Année */}
        <div className="client-examens-filter-group">
          <span className="client-examens-filter-label">Année</span>
          <div className="client-examens-select-wrap">
            <select
              className="client-examens-select"
              value={selectedAnnee}
              onChange={(e) => setSelectedAnnee(e.target.value)}
              aria-label="Filtrer par année"
            >
              <option value="">Toutes les années</option>
              {availableYears.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
            <span className="client-examens-select-chevron" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* 5. Chargement / Erreur */}
      {loading && (
        <div className="client-examens-cards-grid">
          {[1, 2, 3, 4, 5].map((skeletonIdx) => (
            <div key={skeletonIdx} className="client-exam-skeleton">
              <div className="client-exam-skeleton-banner" />
              <div className="client-exam-skeleton-body">
                <div className="client-exam-skeleton-line" style={{ width: '80%' }} />
                <div className="client-exam-skeleton-line" style={{ width: '50%' }} />
                <div className="client-exam-skeleton-line" style={{ width: '100%', marginTop: 'auto' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="client-examens-empty-state" style={{ borderColor: '#fca5a5' }}>
          <div className="client-examens-empty-icon">⚠️</div>
          <h3 className="client-examens-empty-title" style={{ color: '#dc2626' }}>
            Erreur de chargement
          </h3>
          <p className="client-examens-empty-desc">{error}</p>
          <button type="button" className="client-examens-reset-btn" onClick={fetchExamens}>
            Réessayer
          </button>
        </div>
      )}

      {/* 6. Grille des matières et examens */}
      {!loading && !error && (
        <>
          {(() => {
            let totalRenderedExams = 0;

            const sectionsContent = visibleSections.map((section) => {
              const sectionExams = filteredExams.filter((exam) => {
                const examMatiere = getExamMatiere(exam);
                return matchMatiere(examMatiere, section.id);
              });

              if (sectionExams.length === 0) return null;
              totalRenderedExams += sectionExams.length;

              return (
                <section key={section.id} className="client-examens-section">
                  {/* Titre de section avec barre indicatrice bleue à gauche */}
                  <div className="client-examens-section-heading">
                    <div className="client-examens-indicator" />
                    <h2 className="client-examens-section-title">{section.headingTitle}</h2>
                  </div>
                  <p className="client-examens-section-subtitle">{section.subtitle}</p>

                  {/* Grille responsive des cartes d'examen (5 colonnes) */}
                  <div className="client-examens-cards-grid client-catalog-grid">
                    {sectionExams.map((exam, idx) => {
                      const examKey = exam.id || `${section.id}-${idx}`;
                      const session = getExamSession(exam);
                      const isRattrapage = session === 'Rattrapage';
                      const duration = exam.duree
                        ? (String(exam.duree).toLowerCase().includes('h') ? exam.duree : `${exam.duree} h`)
                        : section.defaultDuration;
                      const progress = getExamProgressData(exam);

                      return (
                        <article key={examKey} className={`client-exam-card client-catalog-card client-catalog-theme-${section.tag.toLowerCase()} ${demoContentClass(exam)}`}>
                          <DemoAccessBadge item={exam} />
                          {/* Couverture : Dégradé bleu royal, abréviation, formules et mascotte */}
                          <div className="client-exam-cover client-catalog-card-cover">
                            <span className="client-catalog-subject-pill">
                              {section.tag === 'SVT' ? 'SVT' : section.nom}
                            </span>
                            {/* Formules en haut à droite */}
                            <div className="client-exam-formulas">{section.formulas}</div>

                            {/* Titre matière et pill sombre */}
                            <div className="client-exam-cover-main">
                              <h3 className="client-exam-subject-abbr">{section.tag}</h3>
                            </div>

                            {/* Mascotte chouette perchée dans le coin inférieur droit */}
                            <div className="client-exam-mascot-wrap">
                              <img src={cardMascot} alt="Mascotte E-Concours" aria-hidden="true" />
                            </div>
                          </div>

                          {/* Corps de la carte */}
                          <div className="client-exam-body client-catalog-card-body">
                            {/* Titre de l'épreuve */}
                            <h4 className="client-exam-title client-catalog-card-title">
                              {exam.titre || `Examen National ${exam.annee || ''}`}
                            </h4>

                            {/* Badges : Session, Année, Durée */}
                            <div className="client-exam-badges-row">
                              <span
                                className={`client-exam-badge ${
                                  isRattrapage ? 'badge-session-rattrapage' : 'badge-session-normale'
                                }`}
                              >
                                {session}
                              </span>
                              {exam.annee && (
                                <span className="client-exam-badge badge-meta">
                                  {exam.annee}
                                </span>
                              )}
                              <span className="client-exam-badge badge-meta">
                                {duration}
                              </span>
                            </div>

                            {/* Barre de progression */}
                              <div className="client-exam-progress-track client-catalog-progress-track">
                              <div
                                className={`client-exam-progress-fill client-catalog-progress-fill ${
                                  progress.pct === 100 ? 'fill-completed' : progress.statusClass
                                }`}
                                style={{ width: `${progress.pct}%` }}
                              />
                            </div>

                            {/* Ligne d'état de progression */}
                            <div className="client-exam-progress-row client-catalog-progress-row">
                              <span className={`client-exam-status-text ${progress.statusClass}`}>
                                {progress.statusClass === 'status-new' ? 'Pas commencé' : progress.label}
                              </span>
                              <span className="client-exam-pct-text">
                                {progress.pct} %
                              </span>
                            </div>

                            {/* Bouton d'action principal */}
                            <button
                              type="button"
                              className={`client-exam-action-btn client-catalog-action ${progress.statusClass}`}
                              onClick={guardDemoContent(exam, () => handleOpenReader(exam, 'sujet'))}
                            >
                              {progress.btnText}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            });

            if (totalRenderedExams === 0) {
              return (
                <div className="client-examens-empty-state">
                  <div className="client-examens-empty-icon">📂</div>
                  <h3 className="client-examens-empty-title">
                    Aucun examen disponible pour le moment
                  </h3>
                  <p className="client-examens-empty-desc">
                    Aucune épreuve ne correspond à vos filtres actuels.
                  </p>
                  {(selectedSession !== 'Toutes' || selectedAnnee || selectedSubjectPill !== 'Toutes') && (
                    <button
                      type="button"
                      className="client-examens-reset-btn"
                      onClick={() => {
                        setSelectedSession('Toutes');
                        setSelectedAnnee('');
                        setSelectedSubjectPill('Toutes');
                      }}
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              );
            }

            return sectionsContent;
          })()}
        </>
      )}
    </div>
  );
}
