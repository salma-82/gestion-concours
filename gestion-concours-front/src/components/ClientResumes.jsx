import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API = 'http://localhost:8081';

const MATIERES_CONFIG = [
  { 
    id: 'Mathématiques', 
    nom: 'Mathématiques', 
    color: '#2563eb',
    btnGradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    badgeBg: '#eff6ff',
    badgeColor: '#2563eb',
    desc: 'Analyse, Algèbre, Probabilités, Géométrie, Fonctions...',
    renderIcon: () => (
      <svg width="74" height="74" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Triangle / Règle d'équerre */}
        <path d="M18 78L18 24C18 20.6863 20.6863 18 24 18L78 78H24C20.6863 78 18 75.3137 18 78Z" fill="#93c5fd" opacity="0.6"/>
        <path d="M22 28V74H68L22 28Z" fill="#3b82f6" opacity="0.2"/>
        <path d="M30 46L30 70H54L30 46Z" fill="#eff6ff"/>
        {/* Symboles Math Pi, X */}
        <text x="38" y="32" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="sans-serif">π</text>
        <text x="56" y="44" fill="#ffffff" fontSize="14" fontWeight="bold" fontFamily="sans-serif">√x</text>
        {/* Calculatrice 3D flottante */}
        <g transform="translate(42, 42)">
          <rect width="36" height="46" rx="8" fill="#1e40af" stroke="#ffffff" strokeWidth="2.5" />
          <rect x="5" y="6" width="26" height="10" rx="3" fill="#93c5fd" />
          <circle cx="10" cy="23" r="2.5" fill="#ffffff" />
          <circle cx="18" cy="23" r="2.5" fill="#ffffff" />
          <circle cx="26" cy="23" r="2.5" fill="#ffffff" />
          <circle cx="10" cy="31" r="2.5" fill="#ffffff" />
          <circle cx="18" cy="31" r="2.5" fill="#ffffff" />
          <circle cx="26" cy="31" r="2.5" fill="#ffffff" />
          <circle cx="10" cy="39" r="2.5" fill="#ffffff" />
          <circle cx="18" cy="39" r="2.5" fill="#ffffff" />
          <circle cx="26" cy="39" r="2.5" fill="#38bdf8" />
        </g>
      </svg>
    )
  },
  { 
    id: 'Physique-Chimie', 
    nom: 'Physique-Chimie', 
    color: '#8b5cf6',
    btnGradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    badgeBg: '#f5f3ff',
    badgeColor: '#7c3aed',
    desc: 'Mécanique, Électricité, Ondes, Transformations chimiques...',
    renderIcon: () => (
      <svg width="74" height="74" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Erlenmeyer / Fiole Chimique */}
        <path d="M42 22H58V34L74 68C76 72 73 78 68 78H32C27 78 24 72 26 68L42 34V22Z" fill="#c4b5fd" opacity="0.5" />
        <path d="M30 64L38 48H62L70 64C72 68 69 74 64 74H36C31 74 28 68 30 64Z" fill="#a78bfa" />
        <path d="M32 68C42 62 58 72 68 68V74H32V68Z" fill="#7c3aed" />
        <circle cx="44" cy="56" r="3" fill="#ffffff" opacity="0.8" />
        <circle cx="54" cy="62" r="2" fill="#ffffff" opacity="0.8" />
        <circle cx="48" cy="66" r="4" fill="#ffffff" opacity="0.8" />
        {/* Atome & Orbites */}
        <g transform="translate(56, 32)">
          <ellipse cx="16" cy="16" rx="18" ry="7" transform="rotate(30 16 16)" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 1" fill="none" />
          <ellipse cx="16" cy="16" rx="18" ry="7" transform="rotate(-30 16 16)" stroke="#ffffff" strokeWidth="2" fill="none" />
          <circle cx="16" cy="16" r="5" fill="#facc15" />
          <circle cx="30" cy="12" r="2.5" fill="#ffffff" />
          <circle cx="6" cy="24" r="2.5" fill="#ffffff" />
        </g>
      </svg>
    )
  },
  { 
    id: 'SVT', 
    nom: 'SVT', 
    color: '#059669',
    btnGradient: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
    badgeBg: '#ecfdf5',
    badgeColor: '#059669',
    desc: 'Génétique, Immunologie, Écologie, Géologie...',
    renderIcon: () => (
      <svg width="74" height="74" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Feuille de plante */}
        <path d="M52 48C52 48 64 36 76 40C88 44 88 60 76 66C64 72 56 64 52 48Z" fill="#34d399" />
        <path d="M54 50C62 60 70 66 78 68" stroke="#065f46" strokeWidth="1.5" />
        <path d="M46 56C46 56 50 68 44 76C38 84 26 80 26 68C26 56 38 52 46 56Z" fill="#10b981" opacity="0.9" />
        {/* Hélice d'ADN 3D stylisée */}
        <g transform="translate(18, 20)">
          <path d="M12 10C24 20 24 35 12 45C0 55 0 70 12 80" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M26 10C14 20 14 35 26 45C38 55 38 70 26 80" stroke="#f43f5e" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <line x1="16" y1="18" x2="22" y2="18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="19" y1="28" x2="19" y2="28" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="14" y1="38" x2="24" y2="38" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="14" y1="52" x2="24" y2="52" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="19" y1="62" x2="19" y2="62" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="16" y1="72" x2="22" y2="72" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    )
  }
];

export default function ClientResumes({ clientId: propsClientId }) {
  const { id, clientId: paramClientId } = useParams();
  const clientId = propsClientId || id || paramClientId || 1;
  const navigate = useNavigate();

  // Navigation steps: 'matieres' -> 'chapitres' -> 'resumes' -> 'reader'
  const [currentStep, setCurrentStep] = useState('matieres');
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [selectedChapitre, setSelectedChapitre] = useState(null);
  const [activeResume, setActiveResume] = useState(null);

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Visionneuse PDF (au cas où un résumé est en PDF / images)
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('scroll');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showThumbnails, setShowThumbnails] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, [clientId]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      try {
        response = await axios.get(`${API}/api/clients/${clientId}/resumes`);
      } catch (clientErr) {
        response = await axios.get(`${API}/api/resumes`);
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
      console.error("Erreur chargement résumés:", err);
      setError("Erreur lors de la récupération des résumés.");
    } finally {
      setLoading(false);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API}/${url.startsWith('/') ? url.substring(1) : url}`;
  };

  const getPages = (resume) => {
    if (resume?.pageImages && Array.isArray(resume.pageImages) && resume.pageImages.length > 0) {
      return resume.pageImages.map(getFullUrl);
    }
    return [];
  };

  // Liste des matières avec compteurs
  const availableMatieres = MATIERES_CONFIG.map(cfg => {
    const count = resumes.filter(r => (r.matiere || '').toLowerCase().includes(cfg.nom.toLowerCase().substring(0, 4))).length;
    return { ...cfg, count };
  });

  // Chapitres pour la matière sélectionnée (ceux entrés par l'admin)
  const getChapitresForMatiere = (mat) => {
    if (!mat) return [];
    const matchedResumes = resumes.filter(r => 
      (r.matiere || '').toLowerCase().includes(mat.nom.toLowerCase().substring(0, 4))
    );
    const uniqueChapitres = [...new Set(matchedResumes.map(r => r.chapitre || 'Général / Sans Chapitre'))];
    return uniqueChapitres.map(chapName => {
      const count = matchedResumes.filter(r => (r.chapitre || 'Général / Sans Chapitre') === chapName).length;
      return { nom: chapName, count };
    });
  };

  // Résumés pour le chapitre sélectionné
  const getResumesForChapitre = (mat, chapNom) => {
    if (!mat || !chapNom) return [];
    return resumes.filter(r => 
      (r.matiere || '').toLowerCase().includes(mat.nom.toLowerCase().substring(0, 4)) &&
      (r.chapitre || 'Général / Sans Chapitre') === chapNom
    );
  };

  // Handlers de navigation
  const handleSelectMatiere = (cfg) => {
    setSelectedMatiere(cfg);
    setSelectedChapitre(null);
    setCurrentStep('chapitres');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectChapitre = (chapNom) => {
    setSelectedChapitre(chapNom);
    setCurrentStep('resumes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenResume = (resume) => {
    setActiveResume(resume);
    setCurrentPage(1);
    setZoomLevel(100);
    setCurrentStep('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToMatieres = () => {
    setCurrentStep('matieres');
    setSelectedMatiere(null);
    setSelectedChapitre(null);
    setActiveResume(null);
  };

  const handleBackToChapitres = () => {
    setCurrentStep('chapitres');
    setSelectedChapitre(null);
    setActiveResume(null);
  };

  const handleBackToResumes = () => {
    setCurrentStep('resumes');
    setActiveResume(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 36px', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* ========================================================
          ÉTAPE 4 : LECTEUR DU RÉSUMÉ (HTML WEB OU PDF)
      ======================================================== */}
      {currentStep === 'reader' && activeResume && (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Top Bar Reader */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '18px 24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={handleBackToResumes}
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
                ← Retour à la liste
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    background: selectedMatiere?.badgeBg || '#eff6ff',
                    color: selectedMatiere?.badgeColor || '#2563eb',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 800
                  }}>
                    {selectedMatiere?.nom || activeResume.matiere}
                  </span>
                  {activeResume.chapitre && (
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                      📌 {activeResume.chapitre}
                    </span>
                  )}
                  {activeResume.htmlUrl || activeResume.fileType === 'HTML' ? (
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                      🌐 Fiche Web (MathJax)
                    </span>
                  ) : null}
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {activeResume.titre}
                </h2>
              </div>
            </div>

            {/* Quick Actions */}
            {activeResume.htmlUrl && (
              <a
                href={getFullUrl(activeResume.htmlUrl)}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: selectedMatiere?.color || '#2563eb',
                  color: '#ffffff',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ↗ Plein écran
              </a>
            )}
          </div>

          {/* Document Content View */}
          {activeResume.htmlUrl || activeResume.fileType === 'HTML' ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                padding: '12px 20px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px',
                color: '#475569',
                fontWeight: 600
              }}>
                <span>📐 Fiche Résumé Interactive (Formules & Cours complet)</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>MathJax activé</span>
              </div>
              <iframe
                src={getFullUrl(activeResume.htmlUrl)}
                title={activeResume.titre}
                sandbox="allow-scripts allow-same-origin allow-forms"
                style={{
                  width: '100%',
                  height: '84vh',
                  border: 'none',
                  display: 'block',
                  background: '#ffffff'
                }}
              />
            </div>
          ) : getPages(activeResume).length > 0 ? (
            /* Multi-page image reader fallback */
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
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
                    {getPages(activeResume).map((pageUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const el = document.getElementById(`resume-page-${idx + 1}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        style={{ cursor: 'pointer', borderRadius: '8px', padding: '4px', border: '1px solid #e2e8f0' }}
                      >
                        <img src={pageUrl} alt={`Page ${idx + 1}`} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }} loading="lazy" />
                        <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, marginTop: '4px', color: '#64748b' }}>Page {idx + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                {getPages(activeResume).map((pageUrl, idx) => (
                  <div key={idx} id={`resume-page-${idx + 1}`} style={{ width: '100%', maxWidth: '950px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                    <img src={pageUrl} alt={`Page ${idx + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : activeResume.pdfUrl ? (
            <div style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <iframe src={getFullUrl(activeResume.pdfUrl)} title={activeResume.titre} style={{ width: '100%', height: '84vh', border: 'none' }} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <p>Aucun document n'est rattaché à ce résumé.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          ÉTAPE 1 : CHOIX DE LA MATIÈRE (MATH / PHYSIQUE / SVT)
      ======================================================== */}
      {currentStep === 'matieres' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>
              📚 Fiches & Résumés de Cours
            </h1>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '15px' }}>
              Choisissez une matière pour accéder aux chapitres et fiches de révision disponibles
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
              <p style={{ fontWeight: 600 }}>Chargement des résumés...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {availableMatieres.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => handleSelectMatiere(mat)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '26px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '125px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = mat.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  {/* Left rounded gradient container with custom 3D illustration */}
                  <div style={{
                    width: '180px',
                    minWidth: '180px',
                    height: '100%',
                    minHeight: '125px',
                    background: mat.color === '#2563eb' 
                      ? 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' 
                      : mat.color === '#8b5cf6'
                      ? 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)'
                      : 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                    borderRadius: '24px 70px 70px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25)',
                    padding: '10px'
                  }}>
                    {mat.renderIcon ? mat.renderIcon() : <span style={{ fontSize: '48px' }}>📚</span>}
                  </div>

                  {/* Middle content: Title & Description */}
                  <div style={{ flex: 1, padding: '0 32px' }}>
                    <h2 style={{
                      margin: '0 0 6px',
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#0f172a',
                      letterSpacing: '-0.3px'
                    }}>
                      {mat.nom}
                    </h2>
                    <p style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: 1.4
                    }}>
                      {mat.desc}
                    </p>
                  </div>

                  {/* Right side: Badge & Button */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '12px',
                    paddingRight: '36px'
                  }}>
                    <span style={{
                      background: mat.badgeBg,
                      color: mat.badgeColor,
                      padding: '5px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 800,
                      letterSpacing: '0.2px'
                    }}>
                      {mat.count} Fiche{mat.count > 1 ? 's' : ''}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMatiere(mat);
                      }}
                      style={{
                        background: mat.btnGradient,
                        color: '#ffffff',
                        border: 'none',
                        padding: '11px 24px',
                        borderRadius: '22px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>Accéder aux chapitres</span>
                      <span style={{ fontSize: '15px' }}>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          ÉTAPE 2 : CHOIX DU CHAPITRE (DÉJÀ ENTRÉ PAR L'ADMIN)
      ======================================================== */}
      {currentStep === 'chapitres' && selectedMatiere && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Breadcrumb Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <button
              onClick={handleBackToMatieres}
              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700, fontSize: '14px', padding: 0 }}
            >
              📚 Matières
            </button>
            <span style={{ color: '#94a3b8' }}>/</span>
            <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '14px' }}>
              {selectedMatiere.nom}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>
                📖 Chapitres — {selectedMatiere.nom}
              </h1>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
                Choisissez un chapitre pour découvrir les fiches et résumés de cours correspondants
              </p>
            </div>
            <button
              onClick={handleBackToMatieres}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                color: '#334155'
              }}
            >
              ← Changer de matière
            </button>
          </div>

          {/* Horizontal Pill Cards des Chapitres - EXACT MÊME STYLE QUE LES MATIÈRES */}
          {getChapitresForMatiere(selectedMatiere).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '24px', border: '1.5px dashed #cbd5e1' }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>📂</div>
              <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: 800 }}>Aucun chapitre disponible</h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>L'administrateur n'a pas encore ajouté de résumé pour cette matière.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {getChapitresForMatiere(selectedMatiere).map((chap, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectChapitre(chap.nom)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '26px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '125px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = selectedMatiere.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  {/* Left rounded gradient container with Book / Chapter illustration */}
                  <div style={{
                    width: '180px',
                    minWidth: '180px',
                    height: '100%',
                    minHeight: '125px',
                    background: selectedMatiere.color === '#2563eb' 
                      ? 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' 
                      : selectedMatiere.color === '#8b5cf6'
                      ? 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)'
                      : 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                    borderRadius: '24px 70px 70px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25)',
                    padding: '10px'
                  }}>
                    <svg width="74" height="74" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Livre ouvert 3D stylisé */}
                      <path d="M50 32C42 26 28 26 18 30V74C28 70 42 70 50 76C58 70 72 70 82 74V30C72 26 58 26 50 32Z" fill="#ffffff" opacity="0.95"/>
                      <path d="M50 32V76" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round"/>
                      {/* Lignes de texte du livre */}
                      <line x1="26" y1="42" x2="42" y2="42" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
                      <line x1="26" y1="50" x2="40" y2="50" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
                      <line x1="26" y1="58" x2="36" y2="58" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
                      <line x1="58" y1="42" x2="74" y2="42" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
                      <line x1="58" y1="50" x2="72" y2="50" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
                      <line x1="58" y1="58" x2="68" y2="58" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
                      {/* Marque-page dore */}
                      <path d="M47 22H53V38L50 35L47 38V22Z" fill="#facc15"/>
                    </svg>
                  </div>

                  {/* Middle content: Chapter Title & Info */}
                  <div style={{ flex: 1, padding: '0 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        background: selectedMatiere.badgeBg,
                        color: selectedMatiere.badgeColor,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800
                      }}>
                        {selectedMatiere.nom}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>•</span>
                      <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                        Chapitre {idx + 1}
                      </span>
                    </div>

                    <h2 style={{
                      margin: '0 0 6px',
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#0f172a',
                      letterSpacing: '-0.3px'
                    }}>
                      {chap.nom}
                    </h2>
                    <p style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: 1.4
                    }}>
                      Fiches de révision, synthèses de cours et formules clés
                    </p>
                  </div>

                  {/* Right side: Badge & Button */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '12px',
                    paddingRight: '36px'
                  }}>
                    <span style={{
                      background: selectedMatiere.badgeBg,
                      color: selectedMatiere.badgeColor,
                      padding: '5px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 800,
                      letterSpacing: '0.2px'
                    }}>
                      {chap.count} Fiche{chap.count > 1 ? 's' : ''}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectChapitre(chap.nom);
                      }}
                      style={{
                        background: selectedMatiere.btnGradient,
                        color: '#ffffff',
                        border: 'none',
                        padding: '11px 24px',
                        borderRadius: '22px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>Accéder aux résumés</span>
                      <span style={{ fontSize: '15px' }}>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          ÉTAPE 3 : LISTE DES RÉSUMÉS POUR LE CHAPITRE CHOISI
      ======================================================== */}
      {currentStep === 'resumes' && selectedMatiere && selectedChapitre && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Breadcrumb Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <button
              onClick={handleBackToMatieres}
              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700, fontSize: '14px', padding: 0 }}
            >
              📚 Matières
            </button>
            <span style={{ color: '#94a3b8' }}>/</span>
            <button
              onClick={handleBackToChapitres}
              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700, fontSize: '14px', padding: 0 }}
            >
              {selectedMatiere.nom}
            </button>
            <span style={{ color: '#94a3b8' }}>/</span>
            <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '14px' }}>
              📌 {selectedChapitre}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>
                📄 Fiches de Cours — {selectedChapitre}
              </h1>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
                Cliquez sur une fiche pour consulter le résumé complet et les formules clés
              </p>
            </div>
            <button
              onClick={handleBackToChapitres}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                color: '#334155'
              }}
            >
              ← Retour aux chapitres
            </button>
          </div>

          {/* Horizontal Pill Cards des Résumés */}
          {getResumesForChapitre(selectedMatiere, selectedChapitre).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
              <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>Aucun résumé disponible</h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Aucune fiche n'a été rattachée à ce chapitre pour l'instant.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {getResumesForChapitre(selectedMatiere, selectedChapitre).map((res, idx) => (
                <div
                  key={res.id || idx}
                  onClick={() => handleOpenResume(res)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '26px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '115px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = selectedMatiere.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  {/* Left rounded gradient container with Document/Book illustration */}
                  <div style={{
                    width: '160px',
                    minWidth: '160px',
                    height: '100%',
                    minHeight: '115px',
                    background: selectedMatiere.color === '#2563eb' 
                      ? 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' 
                      : selectedMatiere.color === '#8b5cf6'
                      ? 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)'
                      : 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                    borderRadius: '24px 60px 60px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25)',
                    padding: '10px'
                  }}>
                    <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Document fiche résumé */}
                      <rect x="25" y="20" width="50" height="64" rx="8" fill="#ffffff" opacity="0.95"/>
                      <path d="M55 20V36H75" stroke="#93c5fd" strokeWidth="2.5" fill="#e0f2fe" />
                      {/* Lignes de texte */}
                      <line x1="34" y1="42" x2="66" y2="42" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="34" y1="52" x2="66" y2="52" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="34" y1="62" x2="56" y2="62" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
                      <circle cx="34" cy="72" r="3" fill="#10b981"/>
                      <line x1="42" y1="72" x2="64" y2="72" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Middle content: Resume Title & Badges */}
                  <div style={{ flex: 1, padding: '0 32px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ background: selectedMatiere.badgeBg, color: selectedMatiere.badgeColor, padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                        {selectedMatiere.nom}
                      </span>
                      {res.htmlUrl || res.fileType === 'HTML' ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                          🌐 Web (MathJax)
                        </span>
                      ) : (
                        <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                          📄 Document
                        </span>
                      )}
                    </div>

                    <h2 style={{
                      margin: '0 0 4px',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: '#0f172a',
                      letterSpacing: '-0.3px'
                    }}>
                      {res.titre}
                    </h2>
                    {res.description ? (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.4 }}>
                        {res.description}
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                        Fiche de révision complète avec démonstrations et synthèses
                      </p>
                    )}
                  </div>

                  {/* Right side: Button */}
                  <div style={{ paddingRight: '36px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenResume(res);
                      }}
                      style={{
                        background: selectedMatiere.btnGradient,
                        color: '#ffffff',
                        border: 'none',
                        padding: '11px 24px',
                        borderRadius: '22px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>Consulter le résumé</span>
                      <span style={{ fontSize: '15px' }}>📖</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}