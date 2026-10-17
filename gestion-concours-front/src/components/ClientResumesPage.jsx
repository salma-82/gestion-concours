import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { recordStudentActivity } from '../studentProgress';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API = 'http://localhost:8081';

/* ─────────────────────────────────────────────
   CONFIGURATION DES 3 MATIÈRES
   ───────────────────────────────────────────── */
const MATIERES = [
  {
    id: 'Mathématiques',
    nom: 'Mathématiques',
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    btnGradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
    lightBg: '#dbeafe',
    desc: 'Analyse, Algèbre, Limites, Intégrales, Probabilités, Géométrie…',
    emoji: '📐',
    renderIcon: () => (
      <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
        <path d="M18 78L18 24C18 20.69 20.69 18 24 18L78 78H24C20.69 78 18 75.31 18 78Z" fill="#93c5fd" opacity=".6"/>
        <path d="M22 28V74H68L22 28Z" fill="#3b82f6" opacity=".2"/>
        <path d="M30 46L30 70H54L30 46Z" fill="#eff6ff"/>
        <text x="38" y="32" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="sans-serif">π</text>
        <text x="56" y="44" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="sans-serif">√x</text>
        <g transform="translate(42,42)">
          <rect width="36" height="46" rx="8" fill="#1e40af" stroke="#fff" strokeWidth="2.5"/>
          <rect x="5" y="6" width="26" height="10" rx="3" fill="#93c5fd"/>
          <circle cx="10" cy="23" r="2.5" fill="#fff"/><circle cx="18" cy="23" r="2.5" fill="#fff"/><circle cx="26" cy="23" r="2.5" fill="#fff"/>
          <circle cx="10" cy="31" r="2.5" fill="#fff"/><circle cx="18" cy="31" r="2.5" fill="#fff"/><circle cx="26" cy="31" r="2.5" fill="#fff"/>
          <circle cx="10" cy="39" r="2.5" fill="#fff"/><circle cx="18" cy="39" r="2.5" fill="#fff"/><circle cx="26" cy="39" r="2.5" fill="#38bdf8"/>
        </g>
      </svg>
    )
  },
  {
    id: 'Physique-Chimie',
    nom: 'Physique - Chimie',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    btnGradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    badgeBg: '#f5f3ff',
    badgeColor: '#6d28d9',
    lightBg: '#ede9fe',
    desc: 'Ondes, Électricité, Mécanique de Newton, Transformations chimiques…',
    emoji: '⚗️',
    renderIcon: () => (
      <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
        <path d="M42 22H58V34L74 68C76 72 73 78 68 78H32C27 78 24 72 26 68L42 34V22Z" fill="#c4b5fd" opacity=".5"/>
        <path d="M30 64L38 48H62L70 64C72 68 69 74 64 74H36C31 74 28 68 30 64Z" fill="#a78bfa"/>
        <path d="M32 68C42 62 58 72 68 68V74H32V68Z" fill="#7c3aed"/>
        <circle cx="44" cy="56" r="3" fill="#fff" opacity=".8"/>
        <circle cx="54" cy="62" r="2" fill="#fff" opacity=".8"/>
        <circle cx="48" cy="66" r="4" fill="#fff" opacity=".8"/>
        <g transform="translate(56,32)">
          <ellipse cx="16" cy="16" rx="18" ry="7" transform="rotate(30 16 16)" stroke="#fff" strokeWidth="2" strokeDasharray="3 1" fill="none"/>
          <ellipse cx="16" cy="16" rx="18" ry="7" transform="rotate(-30 16 16)" stroke="#fff" strokeWidth="2" fill="none"/>
          <circle cx="16" cy="16" r="5" fill="#facc15"/>
          <circle cx="30" cy="12" r="2.5" fill="#fff"/>
          <circle cx="6" cy="24" r="2.5" fill="#fff"/>
        </g>
      </svg>
    )
  },
  {
    id: 'SVT',
    nom: 'SVT (Sciences de la Vie et de la Terre)',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
    btnGradient: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    lightBg: '#d1fae5',
    desc: 'Génétique humaine & moléculaire, Immunologie, Écologie, Géologie…',
    emoji: '🧬',
    renderIcon: () => (
      <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
        <path d="M52 48C52 48 64 36 76 40C88 44 88 60 76 66C64 72 56 64 52 48Z" fill="#34d399"/>
        <path d="M54 50C62 60 70 66 78 68" stroke="#065f46" strokeWidth="1.5"/>
        <path d="M46 56C46 56 50 68 44 76C38 84 26 80 26 68C26 56 38 52 46 56Z" fill="#10b981" opacity=".9"/>
        <g transform="translate(18,20)">
          <path d="M12 10C24 20 24 35 12 45C0 55 0 70 12 80" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
          <path d="M26 10C14 20 14 35 26 45C38 55 38 70 26 80" stroke="#f43f5e" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
          <line x1="16" y1="18" x2="22" y2="18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="14" y1="38" x2="24" y2="38" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="14" y1="52" x2="24" y2="52" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="16" y1="72" x2="22" y2="72" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
        </g>
      </svg>
    )
  }
];

/* ─────────────────────────────────────────────
   HELPER : matière matching flexible
   ───────────────────────────────────────────── */
const matchMatiere = (value, configId) => {
  if (!value || !configId) return false;
  const v = value.toLowerCase().trim();
  const c = configId.toLowerCase().trim();
  if (c.includes('math')) return v.includes('math');
  if (c.includes('phys')) return v.includes('phys') || v.includes('chimie') || v === 'pc';
  if (c.includes('svt')) return v.includes('svt') || v.includes('vie') || v.includes('terre');
  return v.includes(c) || c.includes(v);
};

/* ─────────────────────────────────────────────
   COMPOSANT PRINCIPAL
   ───────────────────────────────────────────── */
export default function ClientResumesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedMatiere = searchParams.get('matiere') || '';
  const initialMatiere = MATIERES.find(m =>
    m.id.toLowerCase() === requestedMatiere.toLowerCase()
    || m.nom.toLowerCase() === requestedMatiere.toLowerCase()
  ) || null;

  // Steps: 'matieres' → 'chapitres' → 'reader'
  const [step, setStep] = useState(initialMatiere ? 'chapitres' : 'matieres');
  const [selectedMatiere, setSelectedMatiere] = useState(initialMatiere);
  const [selectedChapitre, setSelectedChapitre] = useState(null);
  const [activeResume, setActiveResume] = useState(null);

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const iframeRef = useRef(null);

  useEffect(() => {
    const matiereParam = searchParams.get('matiere') || '';
    const matiere = MATIERES.find(m =>
      m.id.toLowerCase() === matiereParam.toLowerCase()
      || m.nom.toLowerCase() === matiereParam.toLowerCase()
    );

    if (!matiere) {
      navigate('/client-dashboard', { replace: true });
      return;
    }

    setSelectedMatiere(matiere);
    setSelectedChapitre(null);
    setActiveResume(null);
    setStep('chapitres');
  }, [searchParams, navigate]);

  /* ─── Fetch uniquement la table "resumes" ─── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/api/resumes`);
        const list = Array.isArray(data) ? data : (data?.value || data?.resumes || (data ? [data] : []));
        setResumes(list);
      } catch (err) {
        console.error('Erreur chargement résumés:', err);
        setError("Impossible de récupérer les résumés.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ─── Helpers ─── */
  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('localhost:8080') && API.includes('8081'))
        return url.replace('localhost:8080', 'localhost:8081');
      return url;
    }
    return `${API}/${url.startsWith('/') ? url.substring(1) : url}`;
  };

  const resumesForMatiere = (mat) => resumes.filter(r => matchMatiere(r.matiere, mat.id));

  const chapitresForMatiere = (mat) => {
    const matched = resumesForMatiere(mat);
    const map = new Map();
    matched.forEach(r => {
      const ch = (r.chapitre || '').trim();
      if (ch) {
        const key = ch.toLowerCase();
        if (!map.has(key)) map.set(key, ch);
      }
    });
    const chapList = Array.from(map.values());

    // Résumés sans chapitre
    if (matched.some(r => !(r.chapitre || '').trim())) {
      chapList.push('Général');
    }

    return chapList.map(name => {
      const count = matched.filter(r => {
        const c = (r.chapitre || '').trim();
        if (name === 'Général') return !c;
        return c.toLowerCase() === name.toLowerCase();
      }).length;
      return { nom: name, count };
    });
  };

  const resumesForChapitre = (mat, chapNom) => {
    return resumes.filter(r => {
      if (!matchMatiere(r.matiere, mat.id)) return false;
      const c = (r.chapitre || '').trim();
      if (chapNom === 'Général') return !c;
      return c.toLowerCase() === chapNom.toLowerCase();
    });
  };

  /* ─── Navigation ─── */
  const goMatieres = () => navigate('/client-dashboard', { state: { openSidebarMenu: 'resumes' } });
  const goChapitres = (mat) => { setSelectedMatiere(mat); setSelectedChapitre(null); setActiveResume(null); setStep('chapitres'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const goReader = (chapNom) => {
    setSelectedChapitre(chapNom);
    const list = resumesForChapitre(selectedMatiere, chapNom);
    if (list.length > 0) {
      setActiveResume(list[0]);
      setStep('reader');
      recordStudentActivity({
        type: 'Résumé',
        resourceId: list[0].id,
        title: list[0].titre || `Résumé — ${chapNom}`,
        subject: list[0].matiere || selectedMatiere?.nom,
        chapter: list[0].chapitre || chapNom
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openResume = (resume) => {
    setActiveResume(resume);
    setStep('reader');
    recordStudentActivity({
      type: 'Résumé',
      resourceId: resume.id,
      title: resume.titre || resume.nom || 'Résumé',
      subject: resume.matiere || selectedMatiere?.nom,
      chapter: resume.chapitre || selectedChapitre || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ─── Matières avec compteurs ─── */
  const matieresWithCount = MATIERES.map(m => ({ ...m, count: resumesForMatiere(m).length }));

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: requestedMatiere ? '20px 16px' : '32px 36px', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* ─────────────────────────────────────
          STEP 1 : CHOIX DE LA MATIÈRE
      ───────────────────────────────────── */}
      {step === 'matieres' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>📚</span>
              <span>Résumés de Cours</span>
            </h1>
            <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '15px', maxWidth: '700px', lineHeight: 1.6 }}>
              Sélectionnez une matière pour parcourir les chapitres et consulter les résumés interactifs ajoutés par l'administrateur.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{
                width: '56px', height: '56px', border: '4px solid #e2e8f0', borderTopColor: '#2563eb',
                borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
              }} />
              <p style={{ fontWeight: 600, color: '#64748b', fontSize: '15px' }}>Chargement des résumés…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '20px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ color: '#dc2626', fontWeight: 700 }}>{error}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {matieresWithCount.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => goChapitres(mat)}
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
                  {/* Illustration */}
                  <div style={{
                    width: '180px', minWidth: '180px', height: '100%', minHeight: '125px',
                    background: mat.color === '#2563eb'
                      ? 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)'
                      : mat.color === '#8b5cf6'
                      ? 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)'
                      : 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                    borderRadius: '24px 70px 70px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25)',
                    padding: '10px'
                  }}>
                    {mat.renderIcon()}
                  </div>

                  {/* Contenu central */}
                  <div style={{ flex: 1, padding: '0 32px' }}>
                    <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                      {mat.nom}
                    </h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 500, lineHeight: 1.4 }}>
                      {mat.desc}
                    </p>
                  </div>

                  {/* Badge + Bouton */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', paddingRight: '36px' }}>
                    <span style={{
                      background: mat.badgeBg, color: mat.badgeColor,
                      padding: '5px 16px', borderRadius: '20px',
                      fontSize: '13px', fontWeight: 800, letterSpacing: '0.2px'
                    }}>
                      {mat.count} Résumé{mat.count > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); goChapitres(mat); }}
                      style={{
                        background: mat.btnGradient, color: '#fff', border: 'none',
                        padding: '11px 24px', borderRadius: '22px',
                        fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>Voir les chapitres</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────
          STEP 2 : CHAPITRES DE LA MATIÈRE
      ───────────────────────────────────── */}
      {step === 'chapitres' && selectedMatiere && (
        <div style={{ width: '100%', maxWidth: 'none', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={goMatieres}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#ffffff', border: '1px solid #cbd5e1',
                padding: '10px 16px', borderRadius: '12px',
                cursor: 'pointer', fontWeight: 700, fontSize: '14px', color: '#2563eb',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            >
              <span aria-hidden="true">←</span>
              Retour aux matières
            </button>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>
              📖 Chapitres — {selectedMatiere.nom}
            </h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
              Cliquez sur un chapitre pour consulter le résumé HTML interactif
            </p>
          </div>

          {/* Liste des chapitres */}
          {chapitresForMatiere(selectedMatiere).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '24px', border: '1.5px dashed #cbd5e1' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📂</div>
              <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: 800, fontSize: '18px' }}>Aucun chapitre disponible</h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>L'administrateur n'a pas encore ajouté de résumé pour cette matière.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {chapitresForMatiere(selectedMatiere).map((chap, idx) => (
                <div
                  key={idx}
                  onClick={() => goReader(chap.nom)}
                  style={{
                    background: '#fff', borderRadius: '26px', border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden',
                    cursor: 'pointer', transition: 'all 0.25s ease',
                    display: 'flex', alignItems: 'center', minHeight: '125px'
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
                  {/* Illustration chapitre */}
                  <div style={{
                    width: '180px', minWidth: '180px', height: '100%', minHeight: '125px',
                    background: selectedMatiere.color === '#2563eb'
                      ? 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)'
                      : selectedMatiere.color === '#8b5cf6'
                      ? 'linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)'
                      : 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                    borderRadius: '24px 70px 70px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25)',
                    padding: '10px'
                  }}>
                    <svg width="74" height="74" viewBox="0 0 100 100" fill="none">
                      <path d="M50 32C42 26 28 26 18 30V74C28 70 42 70 50 76C58 70 72 70 82 74V30C72 26 58 26 50 32Z" fill="#fff" opacity=".95"/>
                      <path d="M50 32V76" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round"/>
                      <line x1="26" y1="42" x2="42" y2="42" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity=".7"/>
                      <line x1="26" y1="50" x2="40" y2="50" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity=".7"/>
                      <line x1="26" y1="58" x2="36" y2="58" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity=".7"/>
                      <line x1="58" y1="42" x2="74" y2="42" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity=".7"/>
                      <line x1="58" y1="50" x2="72" y2="50" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity=".7"/>
                      <line x1="58" y1="58" x2="68" y2="58" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity=".7"/>
                      <path d="M47 22H53V38L50 35L47 38V22Z" fill="#facc15"/>
                    </svg>
                  </div>

                  {/* Contenu du chapitre */}
                  <div style={{ flex: 1, padding: '0 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        background: selectedMatiere.badgeBg, color: selectedMatiere.badgeColor,
                        padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800
                      }}>
                        {selectedMatiere.nom}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>•</span>
                      <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Chapitre {idx + 1}</span>
                    </div>
                    <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                      {chap.nom}
                    </h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 500, lineHeight: 1.4 }}>
                      Résumé interactif avec formules et cours complet
                    </p>
                  </div>

                  {/* Badge + Bouton */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', paddingRight: '36px' }}>
                    <span style={{
                      background: selectedMatiere.badgeBg, color: selectedMatiere.badgeColor,
                      padding: '5px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.2px'
                    }}>
                      {chap.count} Résumé{chap.count > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); goReader(chap.nom); }}
                      style={{
                        background: selectedMatiere.btnGradient, color: '#fff', border: 'none',
                        padding: '11px 24px', borderRadius: '22px',
                        fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>Ouvrir le résumé</span>
                      <span>🌐</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────
          STEP 3 : LECTEUR HTML DU RÉSUMÉ
      ───────────────────────────────────── */}
      {step === 'reader' && activeResume && selectedMatiere && (
        <div style={{ width: '100%', maxWidth: 'none', margin: '0 auto' }}>
          {/* Top bar */}
          <div style={{
            background: '#fff', borderRadius: '18px',
            padding: '16px 24px', marginBottom: '18px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={() => { setStep('chapitres'); setActiveResume(null); }}
                style={{
                  background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#1e293b',
                  padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              >
                ← Retour aux chapitres
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: selectedMatiere.badgeBg, color: selectedMatiere.badgeColor,
                    padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800
                  }}>
                    {selectedMatiere.nom}
                  </span>
                  {activeResume.chapitre && (
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                      📌 {activeResume.chapitre}
                    </span>
                  )}
                  {(activeResume.htmlUrl || activeResume.fileType === 'HTML') && (
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                      🌐 Fiche Web (MathJax)
                    </span>
                  )}
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {activeResume.titre}
                </h2>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Switcher si plusieurs résumés dans le chapitre */}
              {selectedChapitre && resumesForChapitre(selectedMatiere, selectedChapitre).length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '5px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Fiches :</span>
                  {resumesForChapitre(selectedMatiere, selectedChapitre).map((r, i) => {
                    const isCurrent = activeResume.id === r.id;
                    return (
                      <button
                        key={r.id || i}
                        onClick={() => openResume(r)}
                        style={{
                          background: isCurrent ? selectedMatiere.color : '#fff',
                          color: isCurrent ? '#fff' : '#334155',
                          border: isCurrent ? 'none' : '1px solid #cbd5e1',
                          borderRadius: '6px', padding: '4px 10px',
                          fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {r.titre ? (r.titre.length > 22 ? r.titre.substring(0, 20) + '…' : r.titre) : `Fiche ${i + 1}`}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Plein écran */}
              {activeResume.htmlUrl && (
                <a
                  href={getFullUrl(activeResume.htmlUrl)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: selectedMatiere.gradient, color: '#fff',
                    padding: '9px 18px', borderRadius: '10px',
                    textDecoration: 'none', fontSize: '13px', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  ↗ Plein écran
                </a>
              )}
            </div>
          </div>

          {/* Contenu du résumé */}
          {activeResume.htmlUrl || activeResume.fileType === 'HTML' ? (
            <div style={{
              background: '#fff', borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}>
              {/* Sub-header */}
              <div style={{
                padding: '12px 20px', background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '13px', color: '#475569', fontWeight: 600
              }}>
                <span>📐 Résumé Interactif (Formules & Cours complet)</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>MathJax activé</span>
              </div>
              {/* Iframe */}
              <iframe
                ref={iframeRef}
                src={getFullUrl(activeResume.htmlUrl)}
                title={activeResume.titre}
                sandbox="allow-scripts allow-same-origin allow-forms"
                style={{
                  width: '100%', height: '84vh',
                  border: 'none', display: 'block',
                  background: '#fff'
                }}
              />
            </div>
          ) : activeResume.pdfUrl ? (
            <div style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <iframe
                src={getFullUrl(activeResume.pdfUrl)}
                title={activeResume.titre}
                style={{ width: '100%', height: '84vh', border: 'none' }}
              />
            </div>
          ) : activeResume.pageImages && activeResume.pageImages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              {activeResume.pageImages.map((url, idx) => (
                <div key={idx} style={{
                  width: '100%', maxWidth: '950px', background: '#fff',
                  borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  border: '1px solid #cbd5e1', overflow: 'hidden'
                }}>
                  <img src={getFullUrl(url)} alt={`Page ${idx + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px', background: '#fff', borderRadius: '18px', border: '1.5px dashed #cbd5e1' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📄</div>
              <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: 800 }}>Aucun document rattaché</h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>L'administrateur n'a pas encore ajouté de fichier HTML ou PDF pour ce résumé.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
