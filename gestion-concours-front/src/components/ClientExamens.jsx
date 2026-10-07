import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ClientExamens() {
  const navigate = useNavigate();

  const [examens, setExamens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedAnnee, setSelectedAnnee] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  // Mode Lecteur / Visionneuse
  const [activeExam, setActiveExam] = useState(null);
  const [activeDocType, setActiveDocType] = useState('sujet'); // 'sujet' ou 'correction'
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('scroll'); // 'scroll' ou 'single'
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showThumbnails, setShowThumbnails] = useState(true);

  useEffect(() => {
    fetchExamens();
  }, []);

  const fetchExamens = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('http://localhost:8081/api/examens-nationaux', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      setExamens(data);
    } catch (err) {
      console.error("Erreur fetch examens:", err);
      setError("Impossible de charger les examens nationaux. Vérifiez que le serveur est démarré.");
    } finally {
      setLoading(false);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:8081/${url.startsWith('/') ? url.substring(1) : url}`;
  };

  // Listes dynamiques pour les sélecteurs de filtres
  const matieresList = [...new Set(examens.map(e => e.matiere).filter(Boolean))];
  const anneesList = [...new Set(examens.map(e => e.annee).filter(Boolean))].sort((a, b) => b - a);
  const optionsList = [...new Set(examens.map(e => e.optionBac).filter(Boolean))];

  // Examens filtrés
  const filteredExamens = examens.filter(e => {
    const matchSearch = !searchQuery ||
      (e.titre && e.titre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.matiere && e.matiere.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.optionBac && e.optionBac.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchMatiere = !selectedMatiere || e.matiere === selectedMatiere;
    const matchAnnee = !selectedAnnee || String(e.annee) === String(selectedAnnee);
    const matchOption = !selectedOption || e.optionBac === selectedOption;
    const matchSession = !selectedSession || e.session === selectedSession;
    return matchSearch && matchMatiere && matchAnnee && matchOption && matchSession;
  });

  // Obtenir la liste des pages actives (Sujet ou Correction)
  const getActivePages = (exam, docType) => {
    if (!exam) return [];
    if (docType === 'sujet') {
      return (exam.sujetPageImages || []).map(getFullUrl);
    } else {
      return (exam.correctionPageImages || []).map(getFullUrl);
    }
  };

  const handleOpenReader = (exam, type = 'sujet') => {
    setActiveExam(exam);
    setActiveDocType(type);
    setCurrentPage(1);
    setZoomLevel(100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseReader = () => {
    setActiveExam(null);
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

  const activePages = getActivePages(activeExam, activeDocType);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      
      {/* ==================== HEADER PRINCIPAL ==================== */}
      <header style={{
        background: 'linear-gradient(135deg, #0b1437 0%, #1e1b4b 100%)',
        color: '#ffffff',
        padding: '22px 36px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ maxWidth: '1350px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
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
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', color: '#ffffff' }}>
                🎓 Examens Nationaux du Baccalauréat
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#cbd5e1' }}>
                Consultation haute fidélité des Sujets et Corrigés officiels (Maths, Physique, SVT)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: 'rgba(99, 102, 241, 0.25)',
              border: '1px solid rgba(129, 140, 248, 0.35)',
              color: '#c7d2fe',
              padding: '7px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 700
            }}>
              {examens.length} Examen{examens.length > 1 ? 's' : ''} National{examens.length > 1 ? 'ux' : ''} disponible{examens.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      {/* ==================== VUE 1 : VISIONNEUSE DU DOCUMENT (SUJET & CORRIGÉ) ==================== */}
      {activeExam ? (
        <div style={{ maxWidth: '1450px', margin: '24px auto', padding: '0 20px' }}>
          
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ ...getMatiereBadgeStyle(activeExam.matiere), padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    {activeExam.matiere || 'Matière'}
                  </span>
                  <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    📅 {activeExam.annee}
                  </span>
                  <span style={{
                    background: activeExam.session === 'Rattrapage' ? '#fee2e2' : '#f1f5f9',
                    color: activeExam.session === 'Rattrapage' ? '#991b1b' : '#475569',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    Session {activeExam.session || 'Normale'}
                  </span>
                  <span style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                    🏷️ {activeExam.optionBac || 'Toutes options'}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {activeExam.titre}
                </h2>
              </div>
            </div>

            {/* SWITCH RAPIDE ENTRE SUJET ET CORRIGÉ */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
              <button
                onClick={() => { setActiveDocType('sujet'); setCurrentPage(1); }}
                style={{
                  background: activeDocType === 'sujet' ? '#2563eb' : 'transparent',
                  color: activeDocType === 'sujet' ? '#ffffff' : '#475569',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeDocType === 'sujet' ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                📄 Sujet d'Examen ({activeExam.sujetTotalPages || activeExam.sujetPageImages?.length || 1} p.)
              </button>

              <button
                onClick={() => { setActiveDocType('correction'); setCurrentPage(1); }}
                style={{
                  background: activeDocType === 'correction' ? '#059669' : 'transparent',
                  color: activeDocType === 'correction' ? '#ffffff' : '#475569',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeDocType === 'correction' ? '0 2px 8px rgba(5,150,105,0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                ✅ Corrigé Officiel ({activeExam.correctionTotalPages || activeExam.correctionPageImages?.length || 1} p.)
              </button>
            </div>
          </div>

          {/* Barre d'outils du lecteur (Vue, Navigation, Zoom) */}
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
            {/* Mode Défilement vs Page par page */}
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

            {/* Navigation page par page */}
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
                  Page {currentPage} / {activePages.length || 1}
                </span>

                <button
                  disabled={currentPage >= (activePages.length || 1)}
                  onClick={() => setCurrentPage(prev => Math.min(activePages.length || 1, prev + 1))}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: currentPage >= (activePages.length || 1) ? 'not-allowed' : 'pointer',
                    opacity: currentPage >= (activePages.length || 1) ? 0.4 : 1,
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

          {/* Zone du document : Miniatures & Pages */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            
            {/* Sidebar Miniatures */}
            {showThumbnails && activePages.length > 1 && (
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
                  {activeDocType === 'sujet' ? 'Pages Sujet' : 'Pages Corrigé'} ({activePages.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activePages.map((pageUrl, idx) => {
                    const pageNum = idx + 1;
                    const isSelected = viewMode === 'single' ? currentPage === pageNum : false;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          if (viewMode === 'scroll') {
                            const el = document.getElementById(`exam-page-${pageNum}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          borderRadius: '8px',
                          padding: '4px',
                          border: isSelected ? (activeDocType === 'sujet' ? '2px solid #2563eb' : '2px solid #059669') : '1px solid #e2e8f0',
                          background: isSelected ? (activeDocType === 'sujet' ? '#eff6ff' : '#ecfdf5') : '#f8fafc',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img
                          src={pageUrl}
                          alt={`Miniature page ${pageNum}`}
                          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
                          loading="lazy"
                        />
                        <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, marginTop: '4px', color: '#475569' }}>
                          Page {pageNum}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pages du Document en haute définition */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', minHeight: '60vh' }}>
              {activePages.length === 0 ? (
                <div style={{
                  background: '#ffffff',
                  padding: '50px 30px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  width: '100%',
                  border: '1px dashed #cbd5e1'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>
                    {activeDocType === 'correction' ? '🔍' : '⏳'}
                  </div>
                  <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>
                    {activeDocType === 'correction' ? 'Corrigé non disponible' : 'Pages en cours de traitement'}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                    {activeDocType === 'correction'
                      ? "La correction officielle n'a pas encore été déposée pour cet examen."
                      : "Les pages haute résolution de cet examen sont en cours de chargement."}
                  </p>
                </div>
              ) : viewMode === 'scroll' ? (
                // Mode Défilement Continu
                activePages.map((pageUrl, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <div
                      key={idx}
                      id={`exam-page-${pageNum}`}
                      style={{
                        width: `${zoomLevel}%`,
                        maxWidth: zoomLevel <= 100 ? '960px' : `${960 * (zoomLevel / 100)}px`,
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
                        {activeDocType === 'sujet' ? 'Sujet' : 'Corrigé'} • Page {pageNum} / {activePages.length}
                      </div>

                      <img
                        src={pageUrl}
                        alt={`Page ${pageNum} - ${activeExam.titre}`}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                    </div>
                  );
                })
              ) : (
                // Mode Page par Page
                <div
                  style={{
                    width: `${zoomLevel}%`,
                    maxWidth: zoomLevel <= 100 ? '960px' : `${960 * (zoomLevel / 100)}px`,
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
                    {activeDocType === 'sujet' ? 'Sujet' : 'Corrigé'} • Page {currentPage} / {activePages.length}
                  </div>

                  <img
                    src={activePages[currentPage - 1]}
                    alt={`Page ${currentPage} - ${activeExam.titre}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* ==================== VUE 2 : CATALOGUE ET GRILLE DES EXAMENS NATIONAUX ==================== */
        <div style={{ maxWidth: '1350px', margin: '30px auto', padding: '0 20px' }}>
          
          {/* BARRE DE RECHERCHE ET FILTRES PRO (PAR ANNEE ET PAR MATIERE) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  🔍 Recherche mot-clé
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2024, Maths, Rattrapage..."
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
                  onChange={(e) => setSelectedMatiere(e.target.value)}
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
                  📅 Année
                </label>
                <select
                  value={selectedAnnee}
                  onChange={(e) => setSelectedAnnee(e.target.value)}
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
                  <option value="">Toutes les années</option>
                  {anneesList.map((an, idx) => <option key={idx} value={an}>{an}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  🏷️ Option / Filière
                </label>
                <select
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
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
                  <option value="">Toutes les options</option>
                  {optionsList.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  ⏳ Session
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
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
                  <option value="">Toutes les sessions</option>
                  <option value="Normale">Session Normale</option>
                  <option value="Rattrapage">Session Rattrapage</option>
                </select>
              </div>

              {(searchQuery || selectedMatiere || selectedAnnee || selectedOption || selectedSession) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMatiere('');
                    setSelectedAnnee('');
                    setSelectedOption('');
                    setSelectedSession('');
                  }}
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

          {/* État de chargement et erreurs */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <p style={{ fontWeight: 600, fontSize: '16px' }}>Chargement des examens nationaux...</p>
            </div>
          )}

          {error && (
            <div style={{ padding: '16px 20px', background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', borderRadius: '8px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          {/* GRILLE DES EXAMENS NATIONAUX */}
          {!loading && filteredExamens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '38px', marginBottom: '10px' }}>🎓</div>
              <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>Aucun examen national trouvé</h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Modifiez vos filtres ou réinitialisez la recherche.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
              {filteredExamens.map((exam, idx) => {
                const sujetPages = getActivePages(exam, 'sujet');
                const corrPages = getActivePages(exam, 'correction');
                const firstThumbnail = sujetPages.length > 0 ? sujetPages[0] : (corrPages.length > 0 ? corrPages[0] : null);

                return (
                  <div
                    key={exam.id || idx}
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
                    {/* Header Image Thumbnail */}
                    <div
                      style={{
                        height: '190px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenReader(exam, 'sujet')}
                    >
                      {firstThumbnail ? (
                        <img
                          src={firstThumbnail}
                          alt={exam.titre}
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
                          <span style={{ fontSize: '44px' }}>🎓</span>
                          <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '6px' }}>Examen National</div>
                        </div>
                      )}

                      {/* Badges Flottants Année & Session */}
                      <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                        <span style={{
                          background: 'rgba(15, 23, 42, 0.85)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)'
                        }}>
                          📅 {exam.annee}
                        </span>
                        <span style={{
                          background: exam.session === 'Rattrapage' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(37, 99, 235, 0.9)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)'
                        }}>
                          {exam.session || 'Normale'}
                        </span>
                      </div>

                      {/* Badge Pages */}
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
                        📄 {sujetPages.length || exam.sujetTotalPages || 1} Pages Sujet
                      </span>
                    </div>

                    {/* Contenu de la Carte */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span style={{ ...getMatiereBadgeStyle(exam.matiere), padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                          {exam.matiere || 'Matière'}
                        </span>
                        {exam.optionBac && (
                          <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                            🏷️ {exam.optionBac}
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => handleOpenReader(exam, 'sujet')}
                        style={{
                          margin: '0 0 16px',
                          fontSize: '17px',
                          fontWeight: 700,
                          color: '#0f172a',
                          lineHeight: '1.4',
                          cursor: 'pointer'
                        }}
                      >
                        {exam.titre}
                      </h3>

                      {/* BOUTONS D'ACTIONS (SUJET & CORRIGE) */}
                      <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => handleOpenReader(exam, 'sujet')}
                          style={{
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 8px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                          }}
                        >
                          📄 Voir Sujet
                        </button>

                        <button
                          onClick={() => handleOpenReader(exam, 'correction')}
                          style={{
                            background: (corrPages.length > 0 || exam.pdfCorrectionUrl) ? '#059669' : '#e2e8f0',
                            color: (corrPages.length > 0 || exam.pdfCorrectionUrl) ? '#ffffff' : '#94a3b8',
                            border: 'none',
                            padding: '10px 8px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: (corrPages.length > 0 || exam.pdfCorrectionUrl) ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            boxShadow: (corrPages.length > 0 || exam.pdfCorrectionUrl) ? '0 2px 6px rgba(5,150,105,0.25)' : 'none'
                          }}
                        >
                          ✅ Voir Corrigé
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
