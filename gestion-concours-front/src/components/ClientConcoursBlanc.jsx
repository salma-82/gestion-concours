import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  fetchStudentActivityCompletionMap,
  getStudentActivityStatusKey,
  recordStudentActivity
} from '../studentProgress';
import { toBackendResourceUrl } from '../backendResourceUrl';
import TrackedQcmFrame from './TrackedQcmFrame';
import cardMascot from '../assets/logo-mascot.png';
import { demoContentClass, DemoAccessBadge, guardDemoContent } from '../demoAccess';

const API = '';

/* ─────────────────────────────────────────────────────────
   CONFIGURATION DES 3 MATIÈRES (CONCOURS BLANCS)
   ───────────────────────────────────────────────────────── */
const SECTIONS_CONFIG = [
  {
    id: 'MATH',
    nom: 'Math',
    fullName: 'Mathématiques',
    filterLabel: 'Mathématiques',
    tag: 'MATH',
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    formulas: '∑ f(x) ≡ ∫dx'
  },
  {
    id: 'PHYSIQUE',
    nom: 'Physique - Chimie',
    fullName: 'Physique - Chimie',
    filterLabel: 'Physique - Chimie',
    tag: 'PHYSIQUE',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
    formulas: 'E = mc²'
  },
  {
    id: 'SVT',
    nom: 'SVT',
    fullName: 'Sciences de la Vie et de la Terre',
    filterLabel: 'Sciences de la Vie et de la Terre',
    tag: 'SVT',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    formulas: 'ADN ATP CO₂ O₂'
  }
];

const FILTER_PILLS = [
  'Toutes',
  'Mathématiques',
  'Physique - Chimie',
  'Sciences de la Vie et de la Terre'
];

const getFullUrl = (url) => {
  if (!url) return '';
  const normalizedUrl = toBackendResourceUrl(url);
  if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) return normalizedUrl;
  return `/${normalizedUrl.startsWith('/') ? normalizedUrl.substring(1) : normalizedUrl}`;
};

const formatDuree = (minutes) => {
  if (!minutes || isNaN(minutes)) return '1h30';
  const m = Number(minutes);
  const hours = Math.floor(m / 60);
  const remainingMins = m % 60;
  if (hours > 0 && remainingMins > 0) return `${hours}h${remainingMins > 9 ? remainingMins : `0${remainingMins}`}`;
  if (hours > 0) return `${hours}h`;
  return `${m} min`;
};

const matchSection = (concoursMatiere = '', sectionId = '') => {
  const m = (concoursMatiere || '').toLowerCase().trim();
  if (sectionId === 'MATH') return m.includes('math');
  if (sectionId === 'PHYSIQUE') return m.includes('phys') || m.includes('chim') || m === 'pc';
  if (sectionId === 'SVT') return m.includes('svt') || m.includes('vie') || m.includes('terre') || m.includes('bio');
  return false;
};

export default function ClientConcoursBlanc() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extraction du filtre de matière depuis l'URL
  const requestedMatiere = new URLSearchParams(location.search).get('matiere');

  // Synchronisation avec l'URL : MATH -> Mathématiques, PHYSIQUE -> Physique - Chimie, SVT -> SVT
  const activePill = useMemo(() => {
    if (!requestedMatiere) return 'Toutes';
    const lower = requestedMatiere.toLowerCase().trim();
    if (lower.includes('math')) return 'Mathématiques';
    if (lower.includes('phys') || lower.includes('chim')) return 'Physique - Chimie';
    if (lower.includes('svt') || lower.includes('vie') || lower.includes('terre') || lower.includes('bio')) {
      return 'Sciences de la Vie et de la Terre';
    }
    return 'Toutes';
  }, [requestedMatiere]);

  // États locaux
  const [concoursList, setConcoursList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionStatuses, setCompletionStatuses] = useState({});

  // QCM actif pour le lecteur
  const [activeConcours, setActiveConcours] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // 1. Récupération des concours blancs publiés
  const fetchConcours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API}/api/concours-blancs/publies`);

      let dataToSet = [];
      if (Array.isArray(response.data)) {
        dataToSet = response.data;
      } else if (response.data && Array.isArray(response.data.concours)) {
        dataToSet = response.data.concours;
      }

      setConcoursList(dataToSet);
    } catch (err) {
      console.error("Erreur chargement concours blancs:", err);
      setError("Impossible de charger les concours blancs pour le moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Récupération des statuts de complétion de l'étudiant
  const refreshCompletion = useCallback(() => {
    fetchStudentActivityCompletionMap()
      .then((statuses) => setCompletionStatuses(statuses || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchConcours();
    refreshCompletion();
  }, [fetchConcours, refreshCompletion]);

  // Gestion du clic sur une pilule de matière
  const handlePillClick = (label) => {
    if (label === 'Toutes') {
      navigate('/client-concours-blanc');
    } else if (label === 'Mathématiques') {
      navigate('/client-concours-blanc?matiere=MATH');
    } else if (label === 'Physique - Chimie') {
      navigate('/client-concours-blanc?matiere=PHYSIQUE');
    } else if (label === 'Sciences de la Vie et de la Terre') {
      navigate('/client-concours-blanc?matiere=SVT');
    }
  };

  // Ouverture du lecteur de QCM
  const handleOpenQcm = (concours) => {
    setActiveConcours(concours);
    setIsPlayerOpen(true);
    recordStudentActivity({
      type: 'Concours blanc',
      resourceId: concours.id,
      title: concours.titre || concours.title || 'Concours blanc',
      subject: concours.matiere || '',
      chapter: concours.chapitre || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setActiveConcours(null);
    refreshCompletion();
  };

  // Filtrage des sections selon la pilule active
  const displayedSections = useMemo(() => {
    if (activePill === 'Toutes') return SECTIONS_CONFIG;
    return SECTIONS_CONFIG.filter(sec => sec.filterLabel === activePill);
  }, [activePill]);

  // Filtrage des concours blancs par matière et recherche
  const getConcoursForSection = useCallback((sectionId) => {
    return concoursList.filter(c => {
      // Vérification matière
      if (!matchSection(c.matiere, sectionId)) return false;
      // Vérification recherche par titre
      return true;
    });
  }, [concoursList]);

  // Vérifier si au moins une carte est affichée
  const hasAnyResults = useMemo(() => {
    return displayedSections.some(sec => getConcoursForSection(sec.id).length > 0);
  }, [displayedSections, getConcoursForSection]);

  // Calcul du statut de carte pour chaque concours
  const getCardStatus = useCallback((concours) => {
    const key = getStudentActivityStatusKey('Concours blanc', concours.id);
    const isCompleted = completionStatuses[key] === true;

    if (isCompleted) {
      return {
        label: 'Terminé',
        statusClass: 'status-completed',
        pct: 100,
        pctLabel: '100%',
        btnLabel: '✓ Terminé',
        btnClass: 'btn-completed',
        isCompleted: true
      };
    }

    return {
      label: 'Nouveau',
      statusClass: 'status-new',
      pct: 0,
      pctLabel: '0%',
      btnLabel: 'Commencer',
      btnClass: 'btn-primary',
      isCompleted: false
    };
  }, [completionStatuses]);

  /* ══════════════════════════════════════════════════════════
     VUE JOUEUR / PLAYER DU QCM
     ══════════════════════════════════════════════════════════ */
  if (isPlayerOpen && activeConcours) {
    return (
      <div style={{
        width: '100%',
        maxWidth: 'none',
        margin: '0',
        padding: '8px 20px 60px',
        boxSizing: 'border-box',
        fontFamily: "'Nunito', system-ui, -apple-system, sans-serif"
      }}>
        {/* Barre retour */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: 0
        }}>
          <button
            type="button"
            onClick={handleClosePlayer}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#eaf2ff',
              border: 'none',
              borderRadius: '12px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 750,
              color: '#1d4ed8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eaf2ff'; }}
          >
            ← Retour aux concours blancs
          </button>

        </div>

        {/* QCM intégré directement dans la page */}
        <div style={{ width: '100%', maxWidth: 'none', margin: 0 }}>
          {activeConcours.htmlUrl ? (
            <TrackedQcmFrame
              src={getFullUrl(activeConcours.htmlUrl)}
              title={activeConcours.titre}
              sourceType="Concours blanc"
              resourceId={activeConcours.id}
              resourceTitle={activeConcours.titre || activeConcours.title}
              subject={activeConcours.matiere || ''}
              chapter={activeConcours.chapitre || ''}
              enableTimer={false}
              style={{ width: '100%', height: '84vh', border: 'none', display: 'block' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--text, #0f172a)' }}>Aucun document interactif</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary, #64748b)' }}>Le fichier HTML de cette épreuve n'est pas encore disponible.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     VUE PRINCIPALE : RECHERCHE + PILLS + SECTIONS MATIÈRES
     ══════════════════════════════════════════════════════════ */
  return (
    <div style={{
      width: '100%',
      maxWidth: 'none',
      margin: '0',
      padding: '24px 24px 60px',
      boxSizing: 'border-box',
      fontFamily: "'Nunito', system-ui, -apple-system, sans-serif",
      color: 'var(--text, #0f172a)'
    }}>

      {/* ── 1. Barre de recherche arrondie en haut ── */}
      {/* ── 2. Filtres en pilules arrondies ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '32px'
      }} role="tablist" aria-label="Filtre par matière">
        {FILTER_PILLS.map((pillLabel) => {
          const isActive = activePill === pillLabel;
          return (
            <button
              key={pillLabel}
              type="button"
              onClick={() => handlePillClick(pillLabel)}
              role="tab"
              aria-selected={isActive}
              style={{
                appearance: 'none',
                border: isActive ? '1.5px solid #2563eb' : '1.5px solid var(--border, #cbd5e1)',
                background: isActive ? '#eff6ff' : 'var(--surface, #ffffff)',
                color: isActive ? '#1d4ed8' : 'var(--text, #334155)',
                fontFamily: 'inherit',
                fontSize: '13px',
                fontWeight: 750,
                padding: '8px 18px',
                borderRadius: '9999px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.16)' : '0 1px 3px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.color = '#1d4ed8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border, #cbd5e1)';
                  e.currentTarget.style.color = 'var(--text, #334155)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {pillLabel}
            </button>
          );
        })}
      </div>

      {/* ── 3. État de chargement & Erreur ── */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--surface, #ffffff)',
          borderRadius: '24px',
          border: '1px solid var(--border, #e2e8f0)'
        }}>
          <div style={{
            display: 'inline-block',
            width: '38px',
            height: '38px',
            border: '4px solid #dbeafe',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '14px'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text, #0f172a)' }}>
            Chargement des concours blancs...
          </div>
        </div>
      ) : error ? (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '16px',
          padding: '18px 22px',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 700 }}>⚠️ {error}</span>
          <button
            onClick={fetchConcours}
            style={{
              background: '#ffffff',
              border: '1px solid #fca5a5',
              padding: '6px 14px',
              borderRadius: '8px',
              color: '#b91c1c',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      ) : !hasAnyResults ? (

        /* ── Aucun résultat ── */
        <div style={{
          textAlign: 'center',
          padding: '70px 20px',
          background: 'var(--surface, #ffffff)',
          borderRadius: '24px',
          border: '2px dashed var(--border, #cbd5e1)'
        }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 850, color: 'var(--text, #0f172a)' }}>
            Aucun résultat
          </h3>
          <p style={{ margin: '0 0 16px', color: 'var(--text-secondary, #64748b)', fontSize: '14px' }}>
            Aucun concours blanc n'a été publié pour cette matière.
          </p>
          {activePill !== 'Toutes' && (
            <button
              onClick={() => navigate('/client-concours-blanc')}
              style={{
                background: 'linear-gradient(90deg, #1859cf 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '9px 20px',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(24, 101, 242, 0.25)'
              }}
            >
              Afficher tous les concours blancs
            </button>
          )}
        </div>
      ) : (

        /* ── 4. Sections de matières avec grille de cartes ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '38px' }}>
          {displayedSections.map((sec) => {
            const list = getConcoursForSection(sec.id);
            if (list.length === 0) return null; // Si aucune carte pour cette section après filtrage, la masquer

            return (
              <section key={sec.id} aria-labelledby={`heading-${sec.id}`}>
                {/* En-tête de section avec barre verticale colorée à gauche */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '4px',
                    height: '30px',
                    borderRadius: '9999px',
                    backgroundColor: sec.color,
                    flexShrink: 0
                  }} />
                  <h2
                    id={`heading-${sec.id}`}
                    style={{
                      margin: 0,
                      fontSize: '22px',
                      fontWeight: 850,
                      color: 'var(--text, #0f172a)',
                      letterSpacing: '-0.3px'
                    }}
                  >
                    {sec.nom}
                  </h2>
                </div>

                {/* Grille responsive des cartes (max ~490px) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 394px))',
                  gap: '20px'
                }}>
                  {list.map((c) => {
                    const cardStatus = getCardStatus(c);
                    const qCount = c.nombreQuestions || 20;
                    const durationText = formatDuree(c.dureeMnutes);

                    return (
                      <article
                        key={c.id}
                        className={demoContentClass(c)}
                        style={{
                          position: 'relative',
                          boxSizing: 'border-box',
                          height: '284px',
                          backgroundColor: 'var(--surface, #ffffff)',
                          border: '1.5px solid var(--border, #e2e8f0)',
                          borderRadius: '24px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s, border-color 0.22s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 10px 22px rgba(0,0,0,0.08)';
                          e.currentTarget.style.borderColor = '#93c5fd';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.04)';
                          e.currentTarget.style.borderColor = 'var(--border, #e2e8f0)';
                        }}
                      >
                        <DemoAccessBadge item={c} />
                        {/* Couverture avec dégradé de la matière */}
                        <div style={{
                          height: '110px',
                          flex: '0 0 110px',
                          background: sec.gradient,
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          boxSizing: 'border-box',
                          userSelect: 'none'
                        }}>
                          {/* Texte formule en haut à gauche */}
                          <div style={{
                            fontSize: '14.5px',
                            fontWeight: 750,
                            letterSpacing: '1.2px',
                            color: 'rgba(255, 255, 255, 0.88)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                            position: 'relative',
                            zIndex: 2,
                            maxWidth: '50%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {sec.formulas}
                          </div>

                          {/* Nom de la matière en bas à gauche en gros, blanc, gras */}
                          <div style={{ position: 'relative', zIndex: 1, marginTop: '6px', maxWidth: '48%', pointerEvents: 'none' }}>
                            <h3 style={{
                              margin: 0,
                              fontSize: 'clamp(20px, 2vw, 28px)',
                              fontWeight: 900,
                              color: '#ffffff',
                              letterSpacing: '0.5px',
                              lineHeight: 1.1,
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {sec.tag}
                            </h3>
                          </div>

                          {/* Mascotte officielle (identique à la page Cours) */}
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
                          flex: 1
                        }}>
                          {/* Titre du concours blanc */}
                          <h4
                            title={c.titre}
                            style={{
                              margin: '0 0 8px 0',
                              fontSize: '16px',
                              fontWeight: 850,
                              color: 'var(--text, #0f172a)',
                              lineHeight: 1.35,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {c.titre}
                          </h4>

                          {/* Ligne d'infos : nombre de questions et durée */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '12.5px',
                            fontWeight: 650,
                            color: 'var(--text-secondary, #64748b)',
                            marginBottom: '10px'
                          }}>
                            <span>{qCount} questions</span>
                            <span>{durationText}</span>
                          </div>

                          {/* Progression et statut si existant */}
                          {cardStatus.isCompleted && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{
                                height: '5px',
                                backgroundColor: '#d1fae5',
                                borderRadius: '9999px',
                                overflow: 'hidden',
                                marginBottom: '6px'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: '100%',
                                  backgroundColor: '#10b981',
                                  borderRadius: '9999px'
                                }} />
                              </div>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                color: '#059669'
                              }}>
                                <span>Terminé</span>
                                <span>100%</span>
                              </div>
                            </div>
                          )}

                          {/* Bouton pilule pleine largeur Commencer / Continuer / Terminé */}
                          <button
                            type="button"
                            onClick={guardDemoContent(c, () => handleOpenQcm(c))}
                            style={{
                              marginTop: 'auto',
                              width: '100%',
                              padding: '8px 18px',
                              borderRadius: '9999px',
                              border: 'none',
                              fontFamily: 'inherit',
                              fontSize: '14px',
                              fontWeight: 800,
                              color: '#ffffff',
                              background: cardStatus.isCompleted
                                ? '#10b981'
                                : 'linear-gradient(90deg, #1859cf 0%, #2563eb 100%)',
                              cursor: 'pointer',
                              boxShadow: cardStatus.isCompleted
                                ? '0 4px 12px rgba(16, 185, 129, 0.28)'
                                : '0 4px 14px rgba(24, 101, 242, 0.28)',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = cardStatus.isCompleted
                                ? '0 6px 16px rgba(16, 185, 129, 0.38)'
                                : '0 6px 18px rgba(24, 101, 242, 0.38)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = cardStatus.isCompleted
                                ? '0 4px 12px rgba(16, 185, 129, 0.28)'
                                : '0 4px 14px rgba(24, 101, 242, 0.28)';
                            }}
                          >
                            {cardStatus.btnLabel}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
