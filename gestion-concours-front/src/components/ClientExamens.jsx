import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  if (c.includes('svt')) return v.includes('svt') || v.includes('vie') || v.includes('terre');
  if (c.includes('philo')) return v.includes('philo');
  if (c.includes('ang') || c.includes('eng')) return v.includes('ang') || v.includes('eng');
  return v.includes(c) || c.includes(v);
};

const EXAM_MATIERES = [
  {
    id: 'Mathématiques',
    nom: 'Mathématiques',
    color: '#2563eb',
    squareBg: '#2563eb',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
    desc: 'Analyse, Limites, Suites, Fonctions exponentielles & logarithmes, Nombres complexes, Intégrales…',
    emoji: '📐',
    renderSquareIcon: () => (
      <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold', fontFamily: 'system-ui, serif' }}>
        π
      </span>
    )
  },
  {
    id: 'Physique',
    nom: 'Physique - Chimie',
    color: '#7c3aed',
    squareBg: '#818cf8',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
    badgeBg: '#f5f3ff',
    badgeColor: '#6d28d9',
    desc: 'Ondes mécaniques & lumineuses, Nucléaire, Électricité RC/RL/RLC, Lois de Newton, Chimie…',
    emoji: '⚡',
    renderSquareIcon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.31L4.19 19a2 2 0 0 0 1.7 3h12.22a2 2 0 0 0 1.7-3L14 9.31V2" />
        <line x1="8.5" y1="2" x2="15.5" y2="2" />
        <path d="M7 16h10" opacity="0.6" />
      </svg>
    )
  },
  {
    id: 'SVT',
    nom: 'SVT (Sciences de la Vie et de la Terre)',
    color: '#059669',
    squareBg: '#10b981',
    gradient: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    desc: 'Information Génétique, Immunologie, Énergie cellulaire & Muscle, Géologie de la Terre…',
    emoji: '🧬',
    renderSquareIcon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    )
  },
  {
    id: 'Philosophie',
    nom: 'Philosophie',
    color: '#d97706',
    squareBg: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
    badgeBg: '#fffbeb',
    badgeColor: '#b45309',
    desc: 'La Condition Humaine, La Connaissance & Vérité, La Politique, La Justice, Dissertation philosophique…',
    emoji: '🏛️',
    renderSquareIcon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16" />
        <path d="M4 18h16" />
        <path d="M2 18l10-7 10 7" />
        <line x1="6" y1="18" x2="6" y2="11" />
        <line x1="10" y1="18" x2="10" y2="11" />
        <line x1="14" y1="18" x2="14" y2="11" />
        <line x1="18" y1="18" x2="18" y2="11" />
        <path d="M2 11h20" />
      </svg>
    )
  },
  {
    id: 'Anglais',
    nom: 'Anglais (English)',
    color: '#0284c7',
    squareBg: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
    badgeBg: '#f0f9ff',
    badgeColor: '#0369a1',
    desc: 'Reading Comprehension, Writing, Gifts of Youth, Science & Culture, Sustainable Development…',
    emoji: '🌍',
    renderSquareIcon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    )
  }
];

export default function ClientExamens() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filiereParam = searchParams.get('filiere') || '';

  const [selectedFiliere, setSelectedFiliere] = useState(filiereParam);
  const [selectedFiliereAnnee, setSelectedFiliereAnnee] = useState('');
  const [selectedMatiereCard, setSelectedMatiereCard] = useState(null);

  const [examens, setExamens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronisation avec les changements d'URL
  useEffect(() => {
    const f = searchParams.get('filiere') || '';
    setSelectedFiliere(f);
    setSelectedFiliereAnnee('');
    setSelectedMatiereCard(null);
    setActiveExam(null);
  }, [searchParams]);

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

  // Examens filtrés par la filière sélectionnée depuis la sidebar
  const filiereExams = selectedFiliere
    ? examens.filter(e => matchOption(e.optionBac, selectedFiliere))
    : examens;
  const filiereAnneesList = [...new Set(
    filiereExams
      .map(e => e.annee)
      .filter(annee => annee !== null && annee !== undefined && annee !== '')
  )].sort((a, b) => Number(b) - Number(a));
  const filiereExamsForSelectedYear = filiereExams.filter(e =>
    !selectedFiliereAnnee || String(e.annee) === String(selectedFiliereAnnee)
  );

  // Calcul du nombre d'examens disponibles par matière pour cette filière
  const examMatieresWithCount = EXAM_MATIERES.map(m => {
    const list = filiereExamsForSelectedYear.filter(e => matchMatiere(e.matiere, m.id));
    return {
      ...m,
      count: list.length
    };
  });

  return (
    <div style={{
      position: selectedFiliere ? 'fixed' : 'relative',
      top: selectedFiliere ? 0 : 'auto',
      left: selectedFiliere ? 0 : 'auto',
      right: selectedFiliere ? 0 : 'auto',
      bottom: selectedFiliere ? 0 : 'auto',
      width: selectedFiliere ? '100vw' : '100%',
      height: selectedFiliere ? '100vh' : 'auto',
      zIndex: selectedFiliere ? 9999 : 'auto',
      backgroundColor: '#f8fafc',
      overflowY: 'auto',
      padding: selectedFiliere ? '24px 24px 40px' : '0',
      boxSizing: 'border-box',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
    }}>
      

      {/* ==================== VUE 1 : VISIONNEUSE DU DOCUMENT (PLEINE PAGE) ==================== */}
      {activeExam ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: 0,
          padding: 0
        }}>
          {/* Fil d'Ariane cliquable : Matières / Matière / Épreuve */}
          <div style={{
            height: '48px',
            minHeight: '48px',
            maxHeight: '48px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            fontSize: '13.5px',
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
            userSelect: 'none',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  setActiveExam(null);
                  setSelectedMatiereCard(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontWeight: 650,
                  fontSize: '13.5px',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  transition: 'background 0.15s, color 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Matières
              </button>

              <span style={{ color: '#94a3b8', fontSize: '13px' }}>/</span>

              <button
                onClick={() => {
                  setActiveExam(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontWeight: 650,
                  fontSize: '13.5px',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  transition: 'background 0.15s, color 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {activeExam.matiere || selectedMatiereCard || 'Physique - Chimie'}
              </button>

              <span style={{ color: '#94a3b8', fontSize: '13px' }}>/</span>

              <span style={{
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '13.5px',
                padding: '4px 6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {activeExam.titre || `Examen National ${activeExam.annee || ''}`}
              </span>
            </div>

            {/* Sélecteur Sujet / Corrigé discret à droite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setActiveDocType('sujet')}
                style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  border: activeDocType === 'sujet' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: activeDocType === 'sujet' ? '#eff6ff' : '#ffffff',
                  color: activeDocType === 'sujet' ? '#2563eb' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>📄</span> Sujet
              </button>
              <button
                onClick={() => {
                  if (activeExam.pdfCorrectionUrl || (activeExam.correctionPageImages && activeExam.correctionPageImages.length > 0)) {
                    setActiveDocType('correction');
                  }
                }}
                disabled={!activeExam.pdfCorrectionUrl && (!activeExam.correctionPageImages || activeExam.correctionPageImages.length === 0)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  border: activeDocType === 'correction' ? '1.5px solid #059669' : '1px solid #cbd5e1',
                  backgroundColor: activeDocType === 'correction' ? '#ecfdf5' : '#ffffff',
                  color: activeDocType === 'correction' ? '#059669' : ((activeExam.pdfCorrectionUrl || (activeExam.correctionPageImages && activeExam.correctionPageImages.length > 0)) ? '#475569' : '#94a3b8'),
                  cursor: (activeExam.pdfCorrectionUrl || (activeExam.correctionPageImages && activeExam.correctionPageImages.length > 0)) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                  opacity: (activeExam.pdfCorrectionUrl || (activeExam.correctionPageImages && activeExam.correctionPageImages.length > 0)) ? 1 : 0.6
                }}
              >
                <span>✅</span> Corrigé
              </button>
            </div>
          </div>

          {/* Iframe occupant tout le reste de l'écran */}
          {(() => {
            const docUrl = activeDocType === 'correction'
              ? (activeExam.pdfCorrectionUrl || activeExam.htmlUrl)
              : (activeExam.pdfSujetUrl || activeExam.htmlUrl);

            const pages = getActivePages(activeExam, activeDocType);

            if (docUrl) {
              return (
                <iframe
                  src={getFullUrl(docUrl)}
                  title={activeExam.titre || 'Examen National'}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  style={{
                    width: '100%',
                    height: 'calc(100vh - 48px)',
                    border: 'none',
                    display: 'block',
                    backgroundColor: '#ffffff',
                    overflow: 'auto'
                  }}
                />
              );
            }

            if (pages.length > 0) {
              return (
                <div style={{
                  width: '100%',
                  height: 'calc(100vh - 48px)',
                  overflowY: 'auto',
                  backgroundColor: '#525659',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px 0',
                  gap: '20px'
                }}>
                  {pages.map((imgUrl, pIdx) => (
                    <div key={pIdx} style={{ maxWidth: '900px', width: '92%', boxShadow: '0 4px 18px rgba(0,0,0,0.3)', backgroundColor: '#fff' }}>
                      <img src={imgUrl} alt={`Page ${pIdx + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  ))}
                </div>
              );
            }

            return (
              <div style={{
                flex: 1,
                height: 'calc(100vh - 48px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                padding: '40px 20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>📄</div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Document {activeDocType === 'correction' ? 'de correction' : 'de sujet'} non disponible
                </h2>
                <p style={{ color: '#64748b', fontSize: '14.5px', maxWidth: '480px', marginBottom: '24px' }}>
                  L'administrateur n'a pas encore ajouté le fichier pour cette épreuve.
                </p>
                <button
                  onClick={() => setActiveExam(null)}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ← Revenir à la liste
                </button>
              </div>
            );
          })()}
        </div>
      ) : selectedFiliere ? (
        !selectedMatiereCard ? (
          /* ═════════════════════════════════════════
             STEP 1 : CARTES DES MATIÈRES DE LA FILIÈRE
             ═════════════════════════════════════════ */
          <div style={{ width: '100%', maxWidth: 'none', margin: '30px auto', padding: 0 }}>
            <div style={{ marginBottom: '28px' }}>
              <button
                type="button"
                onClick={() => navigate('/client-dashboard', { replace: true, state: { openSidebarMenu: 'examens' } })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#2563eb',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <span aria-hidden="true">←</span>
                Retour aux filières
              </button>
            </div>

            <div style={{
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                  Matières d'Examens Nationaux
                </h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14.5px' }}>
                  Sélectionnez une matière pour afficher les épreuves et corrections officielles ajoutées par l'administration.
                </p>
              </div>
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 700
              }}>
                Année
                <select
                  value={selectedFiliereAnnee}
                  onChange={(e) => setSelectedFiliereAnnee(e.target.value)}
                  disabled={loading || filiereAnneesList.length === 0}
                  style={{
                    minWidth: '190px',
                    padding: '10px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loading || filiereAnneesList.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">Toutes les années</option>
                  {filiereAnneesList.map((annee) => (
                    <option key={annee} value={annee}>{annee}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Grille des cartes de matières */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {examMatieresWithCount.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => setSelectedMatiereCard(mat.id)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    border: '1px solid #e4ecf8',
                    boxShadow: '0 3px 14px rgba(15, 23, 42, 0.035)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    minHeight: '94px',
                    padding: '14px 20px',
                    flexWrap: 'wrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 22px rgba(37, 99, 235, 0.08)';
                    e.currentTarget.style.borderColor = '#bfdbfe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 3px 14px rgba(15, 23, 42, 0.035)';
                    e.currentTarget.style.borderColor = '#e4ecf8';
                  }}
                >
                  <div style={{
                    width: '54px',
                    height: '54px',
                    minWidth: '54px',
                    borderRadius: '14px',
                    background: mat.squareBg || mat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {mat.renderSquareIcon ? mat.renderSquareIcon() : (
                      <span style={{ color: '#fff', fontSize: '23px', fontWeight: 800 }}>
                        {mat.nom.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                    <h2 style={{ margin: '0 0 5px', fontSize: '17px', fontWeight: 800, color: '#12366d', letterSpacing: '-0.2px' }}>
                      {mat.nom}
                    </h2>
                    <p style={{
                      margin: 0,
                      color: '#7186a8',
                      fontSize: '13px',
                      fontWeight: 500,
                      lineHeight: 1.45,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {mat.desc}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: '#f3f7ff', color: '#2563eb',
                      padding: '7px 12px', borderRadius: '18px',
                      fontSize: '12px', fontWeight: 700, border: '1px solid #e4edff',
                      whiteSpace: 'nowrap'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="14" y2="17" />
                      </svg>
                      {mat.count} examen{mat.count > 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      aria-label={`Voir les épreuves de ${mat.nom}`}
                      onClick={(e) => { e.stopPropagation(); setSelectedMatiereCard(mat.id); }}
                      style={{
                        background: '#ffffff', color: '#2563eb', border: '1px solid #3b82f6',
                        padding: '10px 18px', borderRadius: '13px',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '9px',
                        whiteSpace: 'nowrap', transition: 'background 0.15s ease, box-shadow 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f7ff';
                        e.currentTarget.style.boxShadow = '0 3px 10px rgba(37, 99, 235, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span>Voir les épreuves</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ═════════════════════════════════════════
             STEP 2 : CARTES DES ÉPREUVES DE LA MATIÈRE
             ═════════════════════════════════════════ */
          <div style={{ width: '100%', maxWidth: 'none', margin: '30px auto', padding: 0 }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px', fontSize: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedMatiereCard(null)}
                style={{
                  background: 'none', border: 'none', color: '#2563eb',
                  cursor: 'pointer', fontWeight: 700, padding: 0, display: 'flex', alignItems: 'center', gap: '5px'
                }}
              >
                <span>📚 Matières</span>
              </button>
              <span style={{ color: '#94a3b8' }}>/</span>
              <span style={{ color: '#475569', fontWeight: 600 }}>{selectedFiliere || 'Toutes options'}</span>
              <span style={{ color: '#94a3b8' }}>/</span>
              <span style={{ color: '#0f172a', fontWeight: 800 }}>{selectedMatiereCard}</span>
            </div>

            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '26px', flexWrap: 'wrap', gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px' }}>📝</span>
                  <h1 style={{ margin: 0, fontSize: '27px', fontWeight: 900, color: '#0f172a' }}>
                    Épreuves — {selectedMatiereCard}
                  </h1>
                </div>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14.5px' }}>
                  Filière : <strong style={{ color: '#1e293b' }}>{selectedFiliere || 'Toutes options'}</strong> • Sujets d'examens nationaux et corrections officielles
                </p>
              </div>

              <button
                onClick={() => setSelectedMatiereCard(null)}
                style={{
                  background: '#fff', border: '1.5px solid #cbd5e1',
                  padding: '9px 18px', borderRadius: '12px',
                  cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: '#334155',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >
                ← Changer de matière
              </button>
            </div>

            {/* Cartes des examens correspondants */}
            {(() => {
              const list = filiereExamsForSelectedYear.filter(e => matchMatiere(e.matiere, selectedMatiereCard));

              if (list.length === 0) {
                return (
                  <div style={{
                    background: '#ffffff', borderRadius: '24px', border: '1.5px dashed #cbd5e1',
                    padding: '60px 30px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '46px', marginBottom: '12px' }}>📂</div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                      Aucun examen national trouvé pour cette matière
                    </h3>
                    <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14.5px' }}>
                      L’administrateur n’a pas encore déposé d’épreuves pour la matière {selectedMatiereCard} dans cette filière.
                    </p>
                    <button
                      onClick={() => setSelectedMatiereCard(null)}
                      style={{
                        background: '#2563eb', color: '#fff', border: 'none',
                        padding: '11px 22px', borderRadius: '14px', fontSize: '13.5px', fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ← Retourner aux matières
                    </button>
                  </div>
                );
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px' }}>
                  {list.map((exam, idx) => {
                    const sujetPages = getActivePages(exam, 'sujet');
                    const corrPages = getActivePages(exam, 'correction');
                    const firstThumbnail = sujetPages.length > 0 ? sujetPages[0] : (corrPages.length > 0 ? corrPages[0] : null);

                    return (
                      <div
                        key={exam.id || idx}
                        style={{
                          background: '#ffffff',
                          borderRadius: '20px',
                          border: '1.5px solid #e2e8f0',
                          boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.25s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 16px 32px rgba(37,99,235,0.12)';
                          e.currentTarget.style.borderColor = '#93c5fd';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.04)';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        {/* En-tête de la carte */}
                        <div style={{ padding: '20px 22px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ ...getMatiereBadgeStyle(exam.matiere), padding: '4px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800 }}>
                              {exam.matiere || selectedMatiereCard}
                            </span>
                            <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800 }}>
                              📅 {exam.annee}
                            </span>
                          </div>

                          <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                            {exam.titre}
                          </h3>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
                            <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                              Session : {exam.session || 'Normale'}
                            </span>
                            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                              {exam.optionBac || selectedFiliere}
                            </span>
                          </div>
                        </div>

                        {/* Aperçu miniature si disponible */}
                        {firstThumbnail && (
                          <div
                            onClick={() => handleOpenReader(exam, 'sujet')}
                            style={{
                              height: '140px',
                              background: '#f8fafc',
                              borderTop: '1px solid #f1f5f9',
                              borderBottom: '1px solid #f1f5f9',
                              overflow: 'hidden',
                              position: 'relative',
                              cursor: 'pointer'
                            }}
                          >
                            <img
                              src={firstThumbnail}
                              alt="Aperçu"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                            />
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.6) 100%)',
                              display: 'flex', alignItems: 'flex-end', padding: '12px',
                              color: '#fff', fontSize: '12px', fontWeight: 700
                            }}>
                              🔍 Cliquer pour feuilleter le document
                            </div>
                          </div>
                        )}

                        {/* Boutons d'action : Sujet & Corrigé */}
                        <div style={{ padding: '16px 20px', marginTop: 'auto', display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleOpenReader(exam, 'sujet')}
                            style={{
                              flex: 1,
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              padding: '10px 14px',
                              borderRadius: '12px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}
                          >
                            📄 Sujet ({exam.sujetTotalPages || exam.sujetPageImages?.length || 1} p.)
                          </button>

                          <button
                            onClick={() => handleOpenReader(exam, 'correction')}
                            style={{
                              flex: 1,
                              background: (exam.correctionPageImages?.length > 0 || exam.pdfCorrectionUrl) ? '#059669' : '#f1f5f9',
                              color: (exam.correctionPageImages?.length > 0 || exam.pdfCorrectionUrl) ? '#ffffff' : '#94a3b8',
                              border: 'none',
                              padding: '10px 14px',
                              borderRadius: '12px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: (exam.correctionPageImages?.length > 0 || exam.pdfCorrectionUrl) ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: (exam.correctionPageImages?.length > 0 || exam.pdfCorrectionUrl) ? '0 2px 8px rgba(5,150,105,0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (exam.correctionPageImages?.length > 0 || exam.pdfCorrectionUrl) e.currentTarget.style.background = '#047857';
                            }}
                            onMouseLeave={(e) => {
                              if (exam.correctionPageImages?.length > 0 || exam.pdfCorrectionUrl) e.currentTarget.style.background = '#059669';
                            }}
                          >
                            ✅ Corrigé
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )
      ) : (
        /* ==================== VUE 2 : CATALOGUE ET GRILLE DES EXAMENS NATIONAUX ==================== */
        <div style={{ width: '100%', maxWidth: 'none', margin: '30px auto', padding: 0 }}>
          
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
