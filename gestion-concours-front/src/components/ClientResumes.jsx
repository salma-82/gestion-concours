import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const API = 'http://localhost:8081';

const MATIERES_CONFIG = [
  { 
    id: 'Mathématiques', 
    nom: 'Mathématiques', 
    color: '#2563eb',
    btnGradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    badgeBg: '#eff6ff',
    badgeColor: '#2563eb',
    desc: 'Analyse, Algèbre, Limites, Intégrales, Probabilités, Géométrie...',
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
    nom: 'Physique - Chimie', 
    color: '#8b5cf6',
    btnGradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    badgeBg: '#f5f3ff',
    badgeColor: '#7c3aed',
    desc: 'Ondes, Électricité (RC/RL/RLC), Mécanique de Newton, Transformations chimiques...',
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
    nom: 'SVT (Sciences de la Vie et de la Terre)', 
    color: '#059669',
    btnGradient: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
    badgeBg: '#ecfdf5',
    badgeColor: '#059669',
    desc: 'Génétique humaine & moléculaire, Immunologie, Écologie, Géologie...',
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
  },
  { 
    id: 'Philosophie', 
    nom: 'Philosophie', 
    color: '#d97706',
    btnGradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    badgeBg: '#fffbeb',
    badgeColor: '#b45309',
    desc: 'La Condition Humaine, La Connaissance, La Politique, La Morale, Méthodologie...',
    renderIcon: () => (
      <svg width="74" height="74" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Colonne / Pilier grec classique 3D */}
        <rect x="22" y="24" width="22" height="6" rx="2" fill="#fef3c7" opacity="0.9" />
        <rect x="25" y="30" width="16" height="42" rx="2" fill="#fde68a" />
        <line x1="29" y1="32" x2="29" y2="70" stroke="#d97706" strokeWidth="1.5" opacity="0.5" />
        <line x1="33" y1="32" x2="33" y2="70" stroke="#d97706" strokeWidth="1.5" opacity="0.5" />
        <line x1="37" y1="32" x2="37" y2="70" stroke="#d97706" strokeWidth="1.5" opacity="0.5" />
        <rect x="20" y="72" width="26" height="6" rx="2" fill="#fef3c7" />
        {/* Parchemin doré & plume */}
        <g transform="translate(44, 28)">
          <path d="M6 10C6 6 10 4 16 4H36C40 4 44 8 44 14V50C44 56 40 58 34 58H14C8 58 6 54 6 48V10Z" fill="#ffffff" opacity="0.95" />
          <line x1="12" y1="16" x2="36" y2="16" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <line x1="12" y1="26" x2="38" y2="26" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="12" y1="36" x2="32" y2="36" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="12" y1="46" x2="26" y2="46" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <path d="M34 2C34 2 46 14 38 32L34 28L30 36L28 32L34 2Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
          <circle cx="28" cy="38" r="2.5" fill="#b45309" />
        </g>
        {/* Symbole Phi grec Φ */}
        <circle cx="70" cy="22" r="11" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
        <line x1="70" y1="8" x2="70" y2="36" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  { 
    id: 'Anglais', 
    nom: 'Anglais (English)', 
    color: '#0284c7',
    btnGradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
    badgeBg: '#f0f9ff',
    badgeColor: '#0284c7',
    desc: 'Vocabulary, Grammar, Reading Comprehension, Writing, Youth & Culture...',
    renderIcon: () => (
      <svg width="74" height="74" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Globe Terrestre 3D */}
        <circle cx="42" cy="54" r="28" fill="#bae6fd" opacity="0.6"/>
        <circle cx="42" cy="54" r="28" stroke="#0284c7" strokeWidth="2.5"/>
        <ellipse cx="42" cy="54" rx="28" ry="12" stroke="#0284c7" strokeWidth="2" fill="none"/>
        <ellipse cx="42" cy="54" rx="14" ry="28" stroke="#0284c7" strokeWidth="2" fill="none"/>
        <line x1="14" y1="54" x2="70" y2="54" stroke="#0284c7" strokeWidth="2"/>
        {/* Bulle de discussion / Chat Speech Bubble avec text "EN" */}
        <g transform="translate(46, 16)">
          <rect width="42" height="30" rx="10" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
          <path d="M12 30L8 38L20 30H12Z" fill="#0284c7" />
          <text x="21" y="21" fill="#ffffff" fontSize="14" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">EN</text>
          <circle cx="34" cy="8" r="3" fill="#facc15" />
        </g>
        {/* Drapeau badge */}
        <g transform="translate(18, 22)">
          <rect width="20" height="15" rx="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="0" y1="7.5" x2="20" y2="7.5" stroke="#ffffff" strokeWidth="2" />
          <line x1="10" y1="0" x2="10" y2="15" stroke="#ffffff" strokeWidth="2" />
        </g>
      </svg>
    )
  }
];

// Helper: Match flexible des matières
const isMatiereMatch = (itemMatiere, configId) => {
  if (!itemMatiere || !configId) return false;
  const im = itemMatiere.toLowerCase().trim();
  const cid = configId.toLowerCase().trim();

  if (cid.includes('math')) {
    return im.includes('math');
  }
  if (cid.includes('phys')) {
    return im.includes('phys') || im.includes('chimie') || im === 'pc';
  }
  if (cid.includes('svt')) {
    return im.includes('svt') || im.includes('vie') || im.includes('terre');
  }
  if (cid.includes('philo')) {
    return im.includes('philo');
  }
  if (cid.includes('ang') || cid.includes('eng')) {
    return im.includes('ang') || im.includes('eng');
  }
  return im.includes(cid) || cid.includes(im);
};

// Helper: Dégradé du conteneur d'illustration selon la couleur de la matière
const getCardGradient = (color) => {
  if (color === '#2563eb') return 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)';
  if (color === '#8b5cf6') return 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)';
  if (color === '#059669') return 'linear-gradient(135deg, #047857 0%, #10b981 100%)';
  if (color === '#d97706') return 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)';
  if (color === '#0284c7') return 'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)';
  return 'linear-gradient(135deg, #1e293b 0%, #475569 100%)';
};

export default function ClientResumes({ clientId: propsClientId, mode: propsMode }) {
  const { id, clientId: paramClientId } = useParams();
  const clientId = propsClientId || id || paramClientId || 1;
  const navigate = useNavigate();
  const location = useLocation();

  const isAstucesMode = propsMode === 'astuces' || (location.pathname && location.pathname.includes('astuces'));

  // Navigation steps: 'matieres' -> 'chapitres' -> 'resumes' -> 'reader'
  const [currentStep, setCurrentStep] = useState('matieres');
  const [previousStep, setPreviousStep] = useState('chapitres');
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

      // Récupérer en parallèle les données des 2 tables : 'resumes' ET 'cours_bac'
      const [resResumes, resCoursBac] = await Promise.allSettled([
        axios.get(`${API}/api/resumes`),
        axios.get(`${API}/api/cours-bac`)
      ]);

      const dataToSet = [];

      // 1. Ajouter toutes les fiches de la table 'resumes' (base de données)
      if (resResumes.status === 'fulfilled') {
        const raw = resResumes.value?.data;
        const list = Array.isArray(raw) ? raw : (raw?.value || raw?.resumes || (raw ? [raw] : []));
        list.forEach(item => {
          dataToSet.push({
            ...item,
            fileType: item.fileType || (item.htmlUrl ? 'HTML' : 'PDF'),
            sourceTable: 'resumes',
            uniqueId: `resumes_${item.id}`
          });
        });
      }

      // 2. Ajouter tous les cours de la table 'cours_bac' (base de données)
      if (resCoursBac.status === 'fulfilled') {
        const raw = resCoursBac.value?.data;
        const list = Array.isArray(raw) ? raw : (raw?.value || raw?.cours || (raw ? [raw] : []));
        list.forEach(item => {
          // Éviter doublon si même htmlUrl
          const exists = dataToSet.some(existing => 
            (existing.htmlUrl && item.htmlUrl && existing.htmlUrl === item.htmlUrl) ||
            (existing.titre && item.titre && existing.titre.trim().toLowerCase() === item.titre.trim().toLowerCase() && existing.chapitre === item.chapitre)
          );
          if (!exists) {
            dataToSet.push({
              ...item,
              fileType: 'HTML',
              sourceTable: 'cours_bac',
              uniqueId: `cours_bac_${item.id}`
            });
          }
        });
      }

      setResumes(dataToSet);
    } catch (err) {
      console.error("Erreur chargement résumés & cours BAC:", err);
      setError("Erreur lors de la récupération des fiches.");
    } finally {
      setLoading(false);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('localhost:8080') && API.includes('8081')) {
        return url.replace('localhost:8080', 'localhost:8081');
      }
      return url;
    }
    return `${API}/${url.startsWith('/') ? url.substring(1) : url}`;
  };

  const getPages = (resume) => {
    if (resume?.pageImages && Array.isArray(resume.pageImages) && resume.pageImages.length > 0) {
      return resume.pageImages.map(getFullUrl);
    }
    return [];
  };

  // Liste des matières avec compteurs basés sur la table resumes & cours_bac
  const availableMatieres = MATIERES_CONFIG.map(cfg => {
    const count = resumes.filter(r => isMatiereMatch(r.matiere, cfg.id)).length;
    return { ...cfg, count };
  });

  // Récupérer toutes les fiches d'une matière donnée
  const getResumesForMatiere = (mat) => {
    if (!mat) return [];
    return resumes.filter(r => isMatiereMatch(r.matiere, mat.id));
  };

  // Chapitres pour la matière sélectionnée (exactement ceux enregistrés en base de données)
  const getChapitresForMatiere = (mat) => {
    if (!mat) return [];
    const matchedResumes = resumes.filter(r => isMatiereMatch(r.matiere, mat.id));

    // Récupérer la liste des chapitres uniques entrés par l'admin
    const adminChapitres = matchedResumes
      .map(r => r.chapitre ? r.chapitre.trim() : '')
      .filter(ch => ch.length > 0);

    const uniqueMap = new Map();
    adminChapitres.forEach(chap => {
      const lower = chap.toLowerCase();
      if (!uniqueMap.has(lower)) {
        uniqueMap.set(lower, chap);
      }
    });

    const uniqueChapitres = Array.from(uniqueMap.values());

    // Fiches générales s'il y a des résumés sans chapitre spécifié
    const hasSansChapitre = matchedResumes.some(r => !r.chapitre || !r.chapitre.trim());
    if (hasSansChapitre) {
      uniqueChapitres.push('Général / Fiches Complètes');
    }

    return uniqueChapitres.map(chapName => {
      const count = matchedResumes.filter(r => {
        const c = r.chapitre ? r.chapitre.trim() : '';
        if (chapName === 'Général / Fiches Complètes') {
          return !c;
        }
        return c.toLowerCase() === chapName.toLowerCase();
      }).length;
      return { nom: chapName, count };
    });
  };

  // Résumés / Fiches pour le chapitre sélectionné
  const getResumesForChapitre = (mat, chapNom) => {
    if (!mat || !chapNom) return [];
    return resumes.filter(r => {
      if (!isMatiereMatch(r.matiere, mat.id)) return false;
      const c = r.chapitre ? r.chapitre.trim() : '';
      if (chapNom === 'Général / Fiches Complètes') {
        return !c;
      }
      return c.toLowerCase() === chapNom.toLowerCase();
    });
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
    const chapterResumes = getResumesForChapitre(selectedMatiere, chapNom);
    if (chapterResumes.length > 0) {
      // Ouvre DIRECTEMENT le fichier HTML sans étape intermédiaire ("nichan") !
      setPreviousStep('chapitres');
      handleOpenResume(chapterResumes[0], 'chapitres');
    } else {
      setPreviousStep('chapitres');
      setCurrentStep('resumes');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenResume = (resume, fromStep = 'resumes') => {
    setActiveResume(resume);
    setPreviousStep(fromStep);
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
    if (previousStep === 'chapitres') {
      setCurrentStep('chapitres');
    } else {
      setCurrentStep('resumes');
    }
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
                {previousStep === 'chapitres' ? '← Retour aux chapitres' : '← Retour aux résumés'}
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

            {/* Quick Actions & Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {selectedChapitre && getResumesForChapitre(selectedMatiere, selectedChapitre).length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '5px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Fiches du chapitre :</span>
                  {getResumesForChapitre(selectedMatiere, selectedChapitre).map((r, i) => {
                    const isCurrent = (activeResume.id && r.id === activeResume.id) || (activeResume.uniqueId && r.uniqueId === activeResume.uniqueId);
                    return (
                      <button
                        key={r.uniqueId || r.id || i}
                        onClick={() => handleOpenResume(r, 'chapitres')}
                        style={{
                          background: isCurrent ? (selectedMatiere?.color || '#2563eb') : '#ffffff',
                          color: isCurrent ? '#ffffff' : '#334155',
                          border: isCurrent ? 'none' : '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {r.titre ? (r.titre.length > 25 ? r.titre.substring(0, 22) + '...' : r.titre) : `Fiche ${i + 1}`}
                      </button>
                    );
                  })}
                </div>
              )}

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
                <span>{isAstucesMode ? '💡 Astuce Concours Interactive (Méthodes & Formules)' : '📐 Fiche Résumé Interactive (Formules & Cours complet)'}</span>
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
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{isAstucesMode ? '💡' : '📚'}</span>
              <span>{isAstucesMode ? 'Astuces Concours & Formules Clés' : 'Résumés de Cours'}</span>
            </h1>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '15px' }}>
              {isAstucesMode
                ? 'Sélectionnez une matière (Mathématiques, Physique - Chimie, SVT) pour accéder aux astuces par chapitre et ouvrir directement le fichier HTML interactif.'
                : 'Sélectionnez une matière (Mathématiques, Physique - Chimie, SVT) pour accéder à ses chapitres et consulter directement les fiches HTML interactives.'}
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
                    background: getCardGradient(mat.color),
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
                {isAstucesMode ? '💡 Astuces par Chapitre — ' : '📖 Chapitres — '}{selectedMatiere.nom}
              </h1>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
                {isAstucesMode
                  ? "Choisissez un chapitre pour ouvrir directement l'astuce HTML correspondante enregistrée par l'administrateur"
                  : "Choisissez un chapitre pour ouvrir directement le fichier HTML correspondant"}
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

          {/* Banner d'information */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>💡</span>
              <span style={{ fontSize: '13.5px', color: '#475569', fontWeight: 600 }}>
                {isAstucesMode
                  ? "Cliquez sur n'importe quel chapitre pour ouvrir directement son astuce ou fiche méthode HTML (formules MathJax incluses)."
                  : "Cliquez sur n'importe quel chapitre pour ouvrir directement son cours ou résumé HTML interactif (formules MathJax incluses)."}
              </span>
            </div>
            <span style={{
              background: selectedMatiere.badgeBg,
              color: selectedMatiere.badgeColor,
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800
            }}>
              {getChapitresForMatiere(selectedMatiere).length} Chapitre{getChapitresForMatiere(selectedMatiere).length > 1 ? 's' : ''}
            </span>
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
                    background: getCardGradient(selectedMatiere.color),
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
                      <span>{isAstucesMode ? "Ouvrir l'astuce HTML" : "Ouvrir le fichier HTML"}</span>
                      <span style={{ fontSize: '15px' }}>🌐</span>
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
                    background: getCardGradient(selectedMatiere.color),
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