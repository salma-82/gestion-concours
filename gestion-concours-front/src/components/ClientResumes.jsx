import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function ClientResumes({ clientId: propsClientId }) {
  const { id, clientId: paramClientId } = useParams();
  const clientId = propsClientId || id || paramClientId || 1;
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedChapitre, setSelectedChapitre] = useState('');

  // Mode Lecteur (Visionneuse de document)
  const [activeResume, setActiveResume] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('scroll'); // 'scroll' ou 'single'
  const [zoomLevel, setZoomLevel] = useState(100); // 80, 100, 125, 150, 175, 200
  const [showThumbnails, setShowThumbnails] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, [clientId]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      let response;
      try {
        response = await axios.get(`http://localhost:8081/api/clients/${clientId}/resumes`);
      } catch (clientErr) {
        response = await axios.get('http://localhost:8081/api/resumes');
      }

      let dataToSet = [];
      if (Array.isArray(response.data)) {
        dataToSet = response.data;
      } else if (response.data && Array.isArray(response.data.resumes)) {
        dataToSet = response.data.resumes;
      } else if (response.data && typeof response.data === 'object') {
        dataToSet = [response.data];
      }

      setResumes(dataToSet);
    } catch (err) {
      setError("Erreur lors de la récupération des résumés : " + (err.response?.statusText || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Liste des matières et chapitres uniques pour les filtres
  const matieresList = [...new Set(resumes.map(r => r.matiere).filter(Boolean))];
  const chapitresList = [...new Set(
    resumes
      .filter(r => !selectedMatiere || r.matiere === selectedMatiere)
      .map(r => r.chapitre)
      .filter(Boolean)
  )];

  // Résumés filtrés
  const filteredResumes = resumes.filter(r => {
    const matchSearch = !searchQuery || 
      (r.titre && r.titre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.chapitre && r.chapitre.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchMatiere = !selectedMatiere || r.matiere === selectedMatiere;
    const matchChapitre = !selectedChapitre || r.chapitre === selectedChapitre;
    return matchSearch && matchMatiere && matchChapitre;
  });

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:8081/${url.startsWith('/') ? url.substring(1) : url}`;
  };

  const handleOpenReader = (resume) => {
    setActiveResume(resume);
    setCurrentPage(1);
    setZoomLevel(100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseReader = () => {
    setActiveResume(null);
  };

  // Obtenir la liste des URLs de pages
  const getPages = (resume) => {
    if (resume?.pageImages && Array.isArray(resume.pageImages) && resume.pageImages.length > 0) {
      return resume.pageImages.map(getFullUrl);
    }
    return [];
  };

  // ======================== DESIGN SYSTEM & PALETTE ========================
  const COLORS = {
    primary: '#1e40af',
    primaryDark: '#0f172a',
    primaryLight: '#3b82f6',
    accent: '#2563eb',
    bgLight: '#f8fafc',
    bgCard: '#ffffff',
    border: '#e2e8f0',
    textMain: '#0f172a',
    textMuted: '#64748b',
    mathBadge: '#dbeafe',
    physBadge: '#fef3c7',
    svtBadge: '#dcfce7',
  };

  const getMatiereBadgeStyle = (matiere) => {
    const mat = (matiere || '').toUpperCase();
    if (mat.includes('MATH')) {
      return { background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' };
    } else if (mat.includes('PHYS') || mat.includes('CHIM')) {
      return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
    } else if (mat.includes('SVT') || mat.includes('BIO')) {
      return { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
    }
    return { background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      
      {/* ==================== HEADER PRINCIPAL ==================== */}
      <header style={{
        background: 'linear-gradient(135deg, #0b1437 0%, #172554 100%)',
        color: '#ffffff',
        padding: '20px 32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => navigate('/client-dashboard')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ← Tableau de Bord
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px', color: '#ffffff' }}>
                📖 Fiches & Résumés de Cours
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Consultation haute fidélité des résumés officiels (textes, formules, tableaux, schémas)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              color: '#93c5fd',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 700
            }}>
              {resumes.length} Résumé{resumes.length > 1 ? 's' : ''} disponible{resumes.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      {/* ==================== VUE 1 : LECTEUR DU RÉSUMÉ (MODE PLEIN ÉCRAN / DOCUMENT) ==================== */}
      {activeResume ? (
        <div style={{ maxWidth: '1400px', margin: '24px auto', padding: '0 20px' }}>
          
          {/* Barre supérieure du lecteur */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={handleCloseReader}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#1e293b',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ← Fermer la lecture
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ ...getMatiereBadgeStyle(activeResume.matiere), padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    {activeResume.matiere || 'Matière'}
                  </span>
                  {activeResume.chapitre && (
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                      📌 {activeResume.chapitre}
                    </span>
                  )}
                  <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    {getPages(activeResume).length || activeResume.totalPages || 1} Page{(getPages(activeResume).length || activeResume.totalPages || 1) > 1 ? 's' : ''}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {activeResume.titre}
                </h2>
              </div>
            </div>

            {/* Actions rapides */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Le client consulte uniquement les pages images sans accès au fichier PDF brut */}
            </div>
          </div>

          {/* Barre d'outils du lecteur (Zoom, Mode de vue, Navigation) */}
          <div style={{
            background: '#0f172a',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {/* Mode de visualisation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Affichage :</span>
              <button
                onClick={() => setViewMode('scroll')}
                style={{
                  background: viewMode === 'scroll' ? '#2563eb' : 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📜 Défilement continu
              </button>
              <button
                onClick={() => setViewMode('single')}
                style={{
                  background: viewMode === 'single' ? '#2563eb' : 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📄 Page par page
              </button>

              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                style={{
                  background: showThumbnails ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.08)',
                  color: showThumbnails ? '#60a5fa' : '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: '6px'
                }}
              >
                🔲 Miniatures {showThumbnails ? 'visibles' : 'masquées'}
              </button>
            </div>

            {/* Navigation page par page si activée */}
            {viewMode === 'single' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage <= 1 ? 0.4 : 1,
                    fontWeight: 700,
                    fontSize: '12px'
                  }}
                >
                  ◀ Précédente
                </button>

                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                  Page {currentPage} / {getPages(activeResume).length || 1}
                </span>

                <button
                  disabled={currentPage >= (getPages(activeResume).length || 1)}
                  onClick={() => setCurrentPage(prev => Math.min(getPages(activeResume).length || 1, prev + 1))}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: currentPage >= (getPages(activeResume).length || 1) ? 'not-allowed' : 'pointer',
                    opacity: currentPage >= (getPages(activeResume).length || 1) ? 0.4 : 1,
                    fontWeight: 700,
                    fontSize: '12px'
                  }}
                >
                  Suivante ▶
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Zoom :</span>
              <button
                onClick={() => setZoomLevel(prev => Math.max(60, prev - 20))}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: 'none',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 800
                }}
              >
                −
              </button>
              <span style={{ fontSize: '12px', fontWeight: 700, width: '42px', textAlign: 'center' }}>
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(200, prev + 20))}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: 'none',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 800
                }}
              >
                +
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#cbd5e1',
                  border: 'none',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                100%
              </button>
            </div>
          </div>

          {/* Zone Principale de lecture avec Miniatures et Pages */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            
            {/* Sidebar Miniatures */}
            {showThumbnails && getPages(activeResume).length > 1 && (
              <div style={{
                width: '160px',
                minWidth: '160px',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'sticky',
                top: '90px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
                  Pages ({getPages(activeResume).length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {getPages(activeResume).map((pageUrl, idx) => {
                    const pageNum = idx + 1;
                    const isSelected = viewMode === 'single' ? currentPage === pageNum : false;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          if (viewMode === 'scroll') {
                            const el = document.getElementById(`resume-page-${pageNum}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          borderRadius: '8px',
                          padding: '4px',
                          border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : '#f8fafc',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img
                          src={pageUrl}
                          alt={`Miniature page ${pageNum}`}
                          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
                          loading="lazy"
                        />
                        <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, marginTop: '4px', color: isSelected ? '#1e40af' : '#64748b' }}>
                          Page {pageNum}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pages du Document en haute résolution */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', minHeight: '60vh' }}>
              {getPages(activeResume).length === 0 ? (
                <div style={{
                  background: '#ffffff',
                  padding: '40px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  width: '100%',
                  border: '1px dashed #cbd5e1'
                }}>
                  <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
                    ⏳ Les pages de ce résumé sont en cours de chargement...
                  </p>
                </div>
              ) : viewMode === 'scroll' ? (
                // Mode Défilement Continu
                getPages(activeResume).map((pageUrl, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <div
                      key={idx}
                      id={`resume-page-${pageNum}`}
                      style={{
                        width: `${zoomLevel}%`,
                        maxWidth: zoomLevel <= 100 ? '950px' : `${950 * (zoomLevel / 100)}px`,
                        background: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.05)',
                        border: '1px solid #cbd5e1',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'width 0.2s ease, max-width 0.2s ease'
                      }}
                    >
                      {/* Numéro de page en filigrane discret */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '16px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '14px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)',
                        zIndex: 10
                      }}>
                        Page {pageNum} / {getPages(activeResume).length}
                      </div>

                      <img
                        src={pageUrl}
                        alt={`Page ${pageNum} - ${activeResume.titre}`}
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                      />
                    </div>
                  );
                })
              ) : (
                // Mode Page par Page
                <div
                  style={{
                    width: `${zoomLevel}%`,
                    maxWidth: zoomLevel <= 100 ? '950px' : `${950 * (zoomLevel / 100)}px`,
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.05)',
                    border: '1px solid #cbd5e1',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'width 0.2s ease, max-width 0.2s ease'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '16px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backdropFilter: 'blur(4px)',
                    zIndex: 10
                  }}>
                    Page {currentPage} / {getPages(activeResume).length}
                  </div>

                  <img
                    src={getPages(activeResume)[currentPage - 1]}
                    alt={`Page ${currentPage} - ${activeResume.titre}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* ==================== VUE 2 : CATALOGUE / LISTE DES RÉSUMÉS ==================== */
        <div style={{ maxWidth: '1250px', margin: '30px auto', padding: '0 20px' }}>
          
          {/* Barre de Recherche & Filtres */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  🔍 Rechercher par titre / mot-clé
                </label>
                <input
                  type="text"
                  placeholder="Ex: Limites, Suites, Électrostatique..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  📚 Matière
                </label>
                <select
                  value={selectedMatiere}
                  onChange={(e) => { setSelectedMatiere(e.target.value); setSelectedChapitre(''); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Toutes les matières</option>
                  {matieresList.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  📌 Chapitre
                </label>
                <select
                  value={selectedChapitre}
                  onChange={(e) => setSelectedChapitre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Tous les chapitres</option>
                  {chapitresList.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
                </select>
              </div>

              {(searchQuery || selectedMatiere || selectedChapitre) && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedMatiere(''); setSelectedChapitre(''); }}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1.5px solid #cbd5e1',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    height: '42px'
                  }}
                >
                  ✕ Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Messages de chargement et erreurs */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>⏳</div>
              <p style={{ fontWeight: 600, fontSize: '16px' }}>Chargement des fiches et résumés...</p>
            </div>
          )}

          {error && (
            <div style={{ padding: '16px 20px', background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', borderRadius: '8px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          {/* Grille des résumés */}
          {!loading && filteredResumes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📂</div>
              <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>Aucun résumé trouvé</h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Modifiez vos critères de recherche ou réinitialisez les filtres.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
              {filteredResumes.map((resume, idx) => {
                const pages = getPages(resume);
                const pageCount = pages.length || resume.totalPages || 1;
                const firstPageThumbnail = pages.length > 0 ? pages[0] : null;

                return (
                  <div
                    key={resume.id || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.09)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                    }}
                  >
                    {/* En-tête de carte avec aperçu ou icône */}
                    <div style={{
                      height: '180px',
                      background: '#f8fafc',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleOpenReader(resume)}
                    >
                      {firstPageThumbnail ? (
                        <img
                          src={firstPageThumbnail}
                          alt={resume.titre}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'top center',
                            opacity: 0.95
                          }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                          <span style={{ fontSize: '42px' }}>📖</span>
                          <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '6px' }}>Fiche Résumé</div>
                        </div>
                      )}

                      {/* Badge flottant page count */}
                      <span style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)'
                      }}>
                        📄 {pageCount} Page{pageCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Corps de la carte */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span style={{ ...getMatiereBadgeStyle(resume.matiere), padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                          {resume.matiere || 'Matière'}
                        </span>
                        {resume.chapitre && (
                          <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                            📌 {resume.chapitre}
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => handleOpenReader(resume)}
                        style={{
                          margin: '0 0 16px',
                          fontSize: '17px',
                          fontWeight: 700,
                          color: '#0f172a',
                          lineHeight: '1.4',
                          cursor: 'pointer'
                        }}
                      >
                        {resume.titre}
                      </h3>

                      {/* Bouton d'action */}
                      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => handleOpenReader(resume)}
                          style={{
                            width: '100%',
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '11px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                            transition: 'background 0.2s'
                          }}
                        >
                          📖 Consulter le résumé
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}