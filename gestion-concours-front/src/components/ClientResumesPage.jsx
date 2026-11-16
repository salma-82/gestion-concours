import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import AutoHeightHtmlFrame from './AutoHeightHtmlFrame';
import { toBackendResourceUrl } from '../backendResourceUrl';
import { filterByStudentPack } from '../packAccess';
import {
  fetchStudentActivityCompletionMap,
  getStudentActivityStatusKey,
  readStudentProgress,
  recordStudentActivity,
  setStudentActivityCompleted
} from '../studentProgress';
import cardMascot from '../assets/logo-mascot.png';
import './ClientResumesPage.css';
import { demoContentClass, DemoAccessBadge, guardDemoContent } from '../demoAccess';

const API = '';

const isPdfDocument = (url) => /\.pdf(?:$|[?#])/i.test(String(url || ''));

/* ─────────────────────────────────────────────
   CONFIGURATION VISUELLE DES MATIÈRES DE RÉSUMÉS
   ───────────────────────────────────────────── */
const RESUME_SUBJECTS = [
  {
    id: 'Mathématiques',
    nom: 'Mathématiques',
    headingTitle: 'Math',
    tag: 'MATH',
    subtitle: 'Chapitres et résumés de mathématiques.',
    formulas: '∑  f(x)  ∫dx  lim',
    fontClass: 'font-large'
  },
  {
    id: 'Physique - Chimie',
    nom: 'Physique - Chimie',
    headingTitle: 'Physique - Chimie',
    tag: 'PHYSIQUE',
    subtitle: 'Chapitres et résumés de physique-chimie.',
    formulas: 'E=mc²  F=ma  U=RI  λ',
    fontClass: 'font-small'
  },
  {
    id: 'SVT',
    nom: 'SVT',
    headingTitle: 'SVT',
    tag: 'SVT',
    subtitle: 'Chapitres et résumés de SVT.',
    formulas: 'ADN  ATP  CO₂  O₂',
    fontClass: 'font-large'
  }
];

const SUBJECT_PILLS = ['Toutes', 'Mathématiques', 'Physique - Chimie', 'SVT'];

/* ─────────────────────────────────────────────
   HELPERS : Matière matching flexible
   ───────────────────────────────────────────── */
const matchMatiere = (value, configId) => {
  if (!value || !configId) return false;
  const v = value.toLowerCase().replace(/[\s\-_]/g, '');
  const c = configId.toLowerCase().replace(/[\s\-_]/g, '');
  if (c.includes('math')) return v.includes('math');
  if (c.includes('phys') || c.includes('chim')) return v.includes('phys') || v.includes('chim') || v === 'pc';
  if (c.includes('svt') || c.includes('vie') || c.includes('terre')) return v.includes('svt') || v.includes('vie') || v.includes('terre');
  return v.includes(c) || c.includes(v);
};

const normalizeSubjectChip = (param) => {
  if (!param) return 'Toutes';
  const p = param.toLowerCase().replace(/[\s\-_]/g, '');
  if (p.includes('math')) return 'Mathématiques';
  if (p.includes('phys') || p.includes('chim')) return 'Physique - Chimie';
  if (p.includes('svt') || p.includes('vie') || p.includes('terre')) return 'SVT';
  return 'Toutes';
};

/* ─────────────────────────────────────────────
   HELPER : Découpage du titre et du numéro de chapitre
   ───────────────────────────────────────────── */
const parseChapterInfo = (resume, index) => {
  const rawChapter = String(resume?.chapitre || '').trim();
  const rawTitle = String(resume?.titre || '').trim();
  const fullText = rawChapter || rawTitle || `Chapitre ${index + 1}`;

  // Cas 1 : "Chapitre X : Titre" ou "Chapitre X - Titre" ou "Ch X : Titre"
  const colonMatch = fullText.match(/^(?:Chapitre|Ch\.?)\s*(\d+)\s*[:\-–]\s*(.*)$/i);
  if (colonMatch) {
    return {
      chapterNum: `Chapitre ${colonMatch[1]}`,
      title: colonMatch[2].trim() || rawTitle || rawChapter
    };
  }

  // Cas 2 : Numéro de chapitre dans le texte
  const numMatch = fullText.match(/(?:Chapitre|Ch\.?)\s*(\d+)/i);
  const chapterNum = numMatch ? `Chapitre ${numMatch[1]}` : `Chapitre ${index + 1}`;

  // Titre propre sans préfixe "Chapitre X"
  let cleanTitle = rawTitle;
  if (!cleanTitle || cleanTitle.toLowerCase().startsWith('chapitre')) {
    cleanTitle = rawChapter.replace(/^(?:Chapitre|Ch\.?)\s*\d+\s*[:\-–]?\s*/i, '').trim() || rawTitle || `Chapitre ${index + 1}`;
  }

  return { chapterNum, title: cleanTitle };
};

export default function ClientResumesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMatiere = searchParams.get('matiere') || '';

  // Filtres
  const [selectedSubjectChip, setSelectedSubjectChip] = useState(() => normalizeSubjectChip(requestedMatiere));
  const [selectedStatus, setSelectedStatus] = useState('Tous'); // 'Tous' | 'Commencé' | 'Terminé'

  // Données
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Progression étudiant
  const [completionStatuses, setCompletionStatuses] = useState({});
  const [progressList, setProgressList] = useState(() => readStudentProgress());
  const [completingActivityKey, setCompletingActivityKey] = useState('');
  const [completionErrorKey, setCompletionErrorKey] = useState('');

  // Mode Lecteur
  const [activeResume, setActiveResume] = useState(null);

  // Synchronisation avec les changements de l'URL (?matiere=...)
  useEffect(() => {
    const chip = normalizeSubjectChip(searchParams.get('matiere'));
    setSelectedSubjectChip(chip);
    setActiveResume(null);
  }, [searchParams]);

  // Synchronisation avec la mascotte globale du layout
  useEffect(() => {
    const stage = activeResume ? 'reader' : 'selection';
    const context = activeResume
      ? [activeResume.matiere, activeResume.chapitre || activeResume.titre].filter(Boolean).join(' · ')
      : [selectedSubjectChip !== 'Toutes' ? selectedSubjectChip : '', selectedStatus !== 'Tous' ? selectedStatus : ''].filter(Boolean).join(' · ');
    window.dispatchEvent(new CustomEvent('client-mascot-stage', { detail: { stage, context } }));
  }, [activeResume, selectedSubjectChip, selectedStatus]);

  // Chargement des résumés depuis l'API
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`${API}/api/resumes`);
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data?.value || data?.resumes || (data ? [data] : []));
        setResumes(filterByStudentPack(list, 'ecole', true));
      } catch (err) {
        if (!isMounted) return;
        console.error('Erreur chargement résumés:', err);
        setError('Impossible de récupérer les résumés.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Chargement de la map de complétion
  useEffect(() => {
    let isMounted = true;
    fetchStudentActivityCompletionMap()
      .then((statuses) => { if (isMounted) setCompletionStatuses(statuses || {}); })
      .catch(() => {});

    const handleProgressUpdate = () => {
      setProgressList(readStudentProgress());
      fetchStudentActivityCompletionMap()
        .then((statuses) => { if (isMounted) setCompletionStatuses(statuses || {}); })
        .catch(() => {});
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

  // Calcul du statut et pourcentage d'un résumé
  const getResumeProgress = useCallback((resume) => {
    const resumeId = resume?.id;
    const statusKey = getStudentActivityStatusKey('Résumé', resumeId);
    const isCompleted = completionStatuses[statusKey] === true;

    if (isCompleted) {
      return {
        status: 'Terminé',
        pct: 100,
        btnText: 'Relire',
        statusClass: 'status-completed'
      };
    }

    const activity = progressList.find(
      (p) =>
        p.id === `Résumé:${resumeId}` ||
        (p.title && resume.titre && p.title.trim().toLowerCase() === resume.titre.trim().toLowerCase())
    );

    if (activity && (activity.visits > 0 || activity.durationSeconds > 0)) {
      const pct = activity.durationSeconds > 180 ? 60 : activity.durationSeconds > 40 ? 40 : 30;
      return {
        status: 'Commencé',
        pct,
        btnText: 'Continuer',
        statusClass: 'status-in-progress'
      };
    }

    return {
      status: 'Nouveau',
      pct: 0,
      btnText: 'Lire',
      statusClass: 'status-new'
    };
  }, [completionStatuses, progressList]);

  // Ouverture du lecteur pour un résumé
  const openResume = (resume) => {
    setActiveResume(resume);
    recordStudentActivity({
      type: 'Résumé',
      resourceId: resume.id,
      title: resume.titre || resume.chapitre || 'Résumé',
      subject: resume.matiere || '',
      chapter: resume.chapitre || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Marquer le résumé comme terminé
  const activeResumeStatusKey = activeResume?.id
    ? getStudentActivityStatusKey('Résumé', activeResume.id)
    : '';
  const activeResumeCompleted = completionStatuses[activeResumeStatusKey] === true;

  const handleCompleteActiveResume = async () => {
    if (!activeResume?.id || activeResumeCompleted || completingActivityKey === activeResumeStatusKey) return;
    setCompletingActivityKey(activeResumeStatusKey);
    setCompletionErrorKey('');
    try {
      const saved = await setStudentActivityCompleted(`Résumé:${activeResume.id}`, true);
      if (!saved) throw new Error('Impossible d’enregistrer la progression.');
      setCompletionStatuses((current) => ({ ...current, [activeResumeStatusKey]: true }));
      setProgressList(readStudentProgress());
    } catch (saveError) {
      console.error('Erreur lors de l’enregistrement de la progression du résumé:', saveError);
      setCompletionErrorKey(activeResumeStatusKey);
    } finally {
      setCompletingActivityKey('');
    }
  };

  // Filtrage des résumés selon la recherche et le statut
  const filteredResumes = useMemo(() => {
    return resumes.filter((r) => {
      // Filtre texte
      // Filtre statut ('Tous' | 'Commencé' | 'Terminé')
      if (selectedStatus !== 'Tous') {
        const progress = getResumeProgress(r);
        if (progress.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [resumes, selectedStatus, getResumeProgress]);

  // Sections visibles selon le chip matière
  const visibleSubjects = useMemo(() => {
    if (selectedSubjectChip === 'Toutes') {
      return RESUME_SUBJECTS;
    }
    return RESUME_SUBJECTS.filter((s) => s.nom === selectedSubjectChip || s.id === selectedSubjectChip);
  }, [selectedSubjectChip]);

  // =========================================================================
  // VUE 1 : LECTEUR DU RÉSUMÉ (PLEIN ÉCRAN)
  // =========================================================================
  if (activeResume) {
    return (
      <div className="client-resumes-container">
        <div className="client-resume-viewer">
          {/* Barre de navigation supérieure du lecteur */}
          <div className="client-resume-viewer-bar">
            <button
              type="button"
              className="client-resume-viewer-back"
              onClick={() => setActiveResume(null)}
              aria-label="Retourner à la liste des résumés"
            >
              <span>←</span>
              <span>Retour aux résumés</span>
            </button>

            <div className="client-resume-viewer-controls">
              <button
                type="button"
                className={`client-resume-viewer-finish ${activeResumeCompleted ? 'is-completed' : ''}`}
                onClick={handleCompleteActiveResume}
                disabled={activeResumeCompleted || completingActivityKey === activeResumeStatusKey}
              >
                {activeResumeCompleted ? '✓ Terminé' : completingActivityKey === activeResumeStatusKey ? 'Enregistrement…' : 'Terminer'}
              </button>
              {completionErrorKey === activeResumeStatusKey && (
                <span role="alert" style={{ color: '#b91c1c', fontSize: '11px', fontWeight: 600 }}>
                  Erreur d’enregistrement.
                </span>
              )}
            </div>
          </div>

          {/* Affichage du document */}
          <div className="client-resume-viewer-content">
            {activeResume.htmlUrl ? (
              <AutoHeightHtmlFrame
                src={getFullUrl(activeResume.htmlUrl)}
                title={activeResume.titre || activeResume.chapitre || 'Résumé'}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                integrated
                hideDocumentHeader
                style={{
                  width: '100%',
                  minHeight: '620px',
                  border: 'none',
                  display: 'block',
                  background: 'transparent'
                }}
              />
            ) : activeResume.pageImages?.length ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0, background: 'transparent' }}>
                {activeResume.pageImages.map((url, index) => (
                  <img
                    key={`${url}-${index}`}
                    src={getFullUrl(url)}
                    alt={`Page ${index + 1}`}
                    style={{ width: '100%', maxWidth: 'none', height: 'auto', borderRadius: 0 }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
                <div style={{ fontSize: '48px', marginBottom: '14px' }}>📄</div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                  Document non disponible
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: '14px' }}>
                  Aucun fichier n'a encore été rattaché à ce résumé par l'administrateur.
                </p>
                <button
                  type="button"
                  className="client-resumes-reset-btn"
                  onClick={() => setActiveResume(null)}
                >
                  ← Retourner aux résumés
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VUE 2 : CATALOGUE COMPLET DES RÉSUMÉS (MATCH SCREENSHOT 2 & 3)
  // =========================================================================
  return (
    <div className="client-resumes-container">
      {/* 1. Titre et sous-titre de la page */}
      {/* 3. Pilules de matières (Toutes | Mathématiques | Physique - Chimie | SVT) */}
      <div className="client-resumes-pills-row" role="tablist" aria-label="Matières des résumés">
        {SUBJECT_PILLS.map((pillLabel) => (
          <button
            key={pillLabel}
            type="button"
            className={`client-resumes-pill ${selectedSubjectChip === pillLabel ? 'is-active' : ''}`}
            onClick={() => setSelectedSubjectChip(pillLabel)}
            role="tab"
            aria-selected={selectedSubjectChip === pillLabel}
          >
            {pillLabel}
          </button>
        ))}
      </div>

      {/* 4. Barre du filtre de Statut (Tous | Commencé | Terminé) */}
      <div className="client-resumes-filters-row">
        <div className="client-resumes-filter-group">
          <span className="client-resumes-filter-label">Statut</span>
          <div className="client-resumes-segmented" role="group" aria-label="Filtrer par statut">
            {['Tous', 'Commencé', 'Terminé'].map((status) => (
              <button
                key={status}
                type="button"
                className={`client-resumes-segmented-btn ${selectedStatus === status ? 'is-active' : ''}`}
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. État de chargement / Erreur */}
      {loading && (
        <div className="client-resumes-cards-grid">
          {[1, 2, 3, 4, 5].map((skeletonIdx) => (
            <div key={skeletonIdx} className="client-resume-skeleton">
              <div className="client-resume-skeleton-banner" />
              <div className="client-resume-skeleton-body">
                <div className="client-resume-skeleton-line" style={{ width: '80%' }} />
                <div className="client-resume-skeleton-line" style={{ width: '50%' }} />
                <div className="client-resume-skeleton-line" style={{ width: '100%', marginTop: 'auto' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="client-resumes-empty-state" style={{ borderColor: '#fca5a5' }}>
          <div className="client-resumes-empty-icon">⚠️</div>
          <h3 className="client-resumes-empty-title" style={{ color: '#dc2626' }}>
            Erreur de chargement
          </h3>
          <p className="client-resumes-empty-desc">{error}</p>
        </div>
      )}

      {/* 6. Grille des matières et chapitres */}
      {!loading && !error && (
        <>
          {(() => {
            let totalRendered = 0;

            const sectionsContent = visibleSubjects.map((subject) => {
              const subjectResumes = filteredResumes.filter((r) => matchMatiere(r.matiere, subject.id));

              if (subjectResumes.length === 0) return null;
              totalRendered += subjectResumes.length;

              return (
                <section key={subject.id} className="client-resumes-section">
                  {/* Titre de la section avec barre bleue verticale */}
                  <div className="client-resumes-section-heading">
                    <div className="client-resumes-indicator" />
                    <h2 className="client-resumes-section-title">{subject.headingTitle}</h2>
                  </div>
                  <p className="client-resumes-section-subtitle">{subject.subtitle}</p>

                  {/* Grille responsive des cartes de résumés */}
                  <div className="client-resumes-cards-grid">
                    {subjectResumes.map((resume, idx) => {
                      const resumeKey = resume.id || `${subject.id}-${idx}`;
                      const { chapterNum, title } = parseChapterInfo(resume, idx);
                      const progress = getResumeProgress(resume);
                      return (
                        <article key={resumeKey} className={`client-resume-card ${demoContentClass(resume)}`}>
                          <DemoAccessBadge item={resume} />
                          {/* Bannière de couverture avec abréviation et mascotte */}
                          <div className="client-resume-cover">
                            {/* Formules en haut à droite */}
                            <div className="client-resume-formulas">{subject.formulas}</div>

                            {/* Nom de la matière en grand sur la gauche */}
                            <div className="client-resume-cover-left">
                              <h3 className={`client-resume-subject-title ${subject.fontClass}`}>
                                {subject.tag}
                              </h3>
                            </div>

                            {/* Mascotte chouette perchée dans le coin inférieur droit */}
                            <div className="client-resume-mascot-wrap">
                              <img src={cardMascot} alt="Mascotte E-Concours" aria-hidden="true" />
                            </div>
                          </div>

                          {/* Corps de la carte */}
                          <div className="client-resume-body">
                            {/* Titre du chapitre */}
                            <h4 className="client-resume-title" title={title}>
                              {title}
                            </h4>

                            {/* Badges : Résumé + Chapitre X */}
                            <div className="client-resume-badges-row">
                              <span className="client-resume-badge badge-blue">
                                Résumé
                              </span>
                              <span className="client-resume-badge badge-gray">
                                {chapterNum}
                              </span>
                            </div>

                            {/* Barre de progression */}
                            <div className="client-resume-progress-track">
                              <div
                                className={`client-resume-progress-fill ${
                                  progress.pct === 100 ? 'fill-completed' : ''
                                }`}
                                style={{ width: `${progress.pct}%` }}
                              />
                            </div>

                            {/* Ligne d'état de progression */}
                            <div className="client-resume-progress-row">
                              <span className={`client-resume-status-text ${progress.statusClass}`}>
                                {progress.status}
                              </span>
                              <span className="client-resume-pct-text">
                                {progress.pct} %
                              </span>
                            </div>

                            {/* Bouton d'action + Téléchargement PDF */}
                            <div className="client-resume-actions-row">
                              <button
                                type="button"
                                className="client-resume-action-btn"
                                onClick={guardDemoContent(resume, () => openResume(resume))}
                              >
                                {progress.btnText}
                              </button>

                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            });

            if (totalRendered === 0) {
              return (
                <div className="client-resumes-empty-state">
                  <div className="client-resumes-empty-icon">📂</div>
                  <h3 className="client-resumes-empty-title">
                    Aucun résumé disponible pour le moment
                  </h3>
                  <p className="client-resumes-empty-desc">
                    Aucun résumé ne correspond aux filtres sélectionnés.
                  </p>
                  {(selectedStatus !== 'Tous' || selectedSubjectChip !== 'Toutes') && (
                    <button
                      type="button"
                      className="client-resumes-reset-btn"
                      onClick={() => {
                        setSelectedStatus('Tous');
                        setSelectedSubjectChip('Toutes');
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
