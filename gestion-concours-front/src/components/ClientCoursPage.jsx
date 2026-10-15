import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:8081';

/* ─────────────────────────────────────────────
   PROGRAMMES OFFICIELS & CONFIGURATION DES 5 MATIÈRES
   Mathématiques, Physique, SVT, Philosophie et Anglais
   ───────────────────────────────────────────── */
const BAC_MATIERES_CONFIG = {
  'Mathématiques': [
    'Limites et Continuité',
    'Dérivation et Étude de Fonctions',
    'Suites Numériques',
    'Fonctions Logarithmes (ln)',
    'Fonctions Exponentielles (exp)',
    'Nombres Complexes',
    'Calcul Intégral & Primitives',
    'Équations Différentielles',
    'Probabilités & Dénombrement',
    'Géométrie dans l\'Espace',
    'Arithmétique (SM)'
  ],
  'Physique': [
    'Ondes Mécaniques Progressives',
    'Ondes Lumineuses',
    'Transformations Nucléaires',
    'Circuit RC (Condensateur)',
    'Circuit RL (Bobine)',
    'Oscillations Libres RLC',
    'Modulation d\'Amplitude',
    'Lois de Newton',
    'Mouvement des Satellites & Projectiles',
    'Rotations & Oscillateurs Mécaniques',
    'Aspect Énergétique',
    'Réactions Acido-Basiques & Dosage',
    'Évolution Spontanée / Pile & Électrolyse',
    'Chimie Organique / Estérification'
  ],
  'SVT': [
    'Consommation de la Matière Organique & Flux d\'Énergie',
    'Rôle du Muscle Squelettique dans la Conversion d\'Énergie',
    'Information Génétique & Mécanisme de Transmission',
    'Génétique Humaine & Génétique des Populations',
    'Immunologie (Soi, Non-Soi, Réponse Immunitaire)',
    'Dysfonctionnements du Système Immunitaire',
    'Phénomènes Géologiques & Chaînes de Montagnes'
  ],
  'Philosophie': [
    'La Condition Humaine (Le Sujet / La Conscience)',
    'La Personne & L\'Identité',
    'La Connaissance (Théorie & Expérience)',
    'La Vérité & Démonstration',
    'La Politique (L\'État & Pouvoir)',
    'La Justice et le Droit',
    'Le Devoir & La Liberté',
    'Méthodologie & Dissertation'
  ],
  'Anglais': [
    'Gifts of Youth',
    'Cultural Issues and Values',
    'Women and Power',
    'Advances in Science and Technology',
    'Brain Drain',
    'Educational Systems',
    'Cultural Diversity',
    'Humour',
    'Sustainable Development',
    'International Organisations',
    'Reading Comprehension & Writing Skills'
  ]
};

const MATIERES = [
  {
    id: 'Mathématiques',
    nom: 'Mathématiques',
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
    lightBg: '#dbeafe',
    desc: 'Analyse, Limites, Suites, Fonctions exponentielles & logarithmes, Nombres complexes, Intégrales…',
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
    id: 'Physique',
    nom: 'Physique - Chimie',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
    badgeBg: '#f5f3ff',
    badgeColor: '#6d28d9',
    lightBg: '#ede9fe',
    desc: 'Ondes mécaniques & lumineuses, Nucléaire, Électricité RC/RL/RLC, Lois de Newton, Chimie…',
    emoji: '⚡',
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
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    lightBg: '#d1fae5',
    desc: 'Information Génétique, Immunologie, Énergie cellulaire & Muscle, Géologie de la Terre…',
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
  },
  {
    id: 'Philosophie',
    nom: 'Philosophie',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
    badgeBg: '#fffbeb',
    badgeColor: '#b45309',
    lightBg: '#fef3c7',
    desc: 'La Condition Humaine, La Connaissance & Vérité, La Politique, La Justice, Dissertation philosophique…',
    emoji: '🏛️',
    renderIcon: () => (
      <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
        {/* Colonnes antiques grecques */}
        <rect x="22" y="78" width="56" height="6" rx="2" fill="#fff" opacity=".95"/>
        <rect x="26" y="74" width="48" height="4" rx="1.5" fill="#fde68a"/>
        <path d="M22 28L50 16L78 28V32H22V28Z" fill="#fff" opacity=".95"/>
        <rect x="25" y="32" width="50" height="4" rx="1" fill="#fde68a"/>
        {/* 3 colonnes */}
        <rect x="29" y="36" width="8" height="38" rx="2" fill="#fff" opacity=".9"/>
        <line x1="33" y1="39" x2="33" y2="71" stroke="#d97706" strokeWidth="1.5"/>
        <rect x="46" y="36" width="8" height="38" rx="2" fill="#fff" opacity=".9"/>
        <line x1="50" y1="39" x2="50" y2="71" stroke="#d97706" strokeWidth="1.5"/>
        <rect x="63" y="36" width="8" height="38" rx="2" fill="#fff" opacity=".9"/>
        <line x1="67" y1="39" x2="67" y2="71" stroke="#d97706" strokeWidth="1.5"/>
        {/* Petite flamme / sagesse au fronton */}
        <circle cx="50" cy="24" r="3.5" fill="#f59e0b"/>
      </svg>
    )
  },
  {
    id: 'Anglais',
    nom: 'Anglais (English)',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
    badgeBg: '#f0f9ff',
    badgeColor: '#0369a1',
    lightBg: '#e0f2fe',
    desc: 'Reading Comprehension, Writing, Gifts of Youth, Science & Culture, Sustainable Development…',
    emoji: '🌍',
    renderIcon: () => (
      <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
        {/* Globe terrestre */}
        <circle cx="50" cy="50" r="28" fill="#bae6fd" opacity=".6"/>
        <circle cx="50" cy="50" r="28" stroke="#fff" strokeWidth="3"/>
        <ellipse cx="50" cy="50" rx="14" ry="28" stroke="#fff" strokeWidth="2.5" fill="none"/>
        <line x1="22" y1="50" x2="78" y2="50" stroke="#fff" strokeWidth="2.5"/>
        <line x1="26" y1="36" x2="74" y2="36" stroke="#fff" strokeWidth="1.8" opacity=".8"/>
        <line x1="26" y1="64" x2="74" y2="64" stroke="#fff" strokeWidth="1.8" opacity=".8"/>
        {/* Badge bulle de parole "EN" */}
        <g transform="translate(52,22)">
          <rect width="30" height="22" rx="7" fill="#0284c7" stroke="#fff" strokeWidth="2"/>
          <path d="M6 22L12 28V22H6Z" fill="#0284c7"/>
          <text x="15" y="16" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">EN</text>
        </g>
      </svg>
    )
  }
];

/* ─────────────────────────────────────────────
   HELPER : matching souple de la matière
   ───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   COMPOSANT PRINCIPAL : CLIENT COURS BAC
   ───────────────────────────────────────────── */
export default function ClientCoursPage() {
  // Navigation: 'matieres' → 'chapitres' → 'reader'
  const [step, setStep] = useState('matieres');
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [selectedChapitre, setSelectedChapitre] = useState(null);
  const [activeCours, setActiveCours] = useState(null);

  // Données de la table cours_bac
  const [coursBacList, setCoursBacList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recherche rapide
  const [searchQuery, setSearchQuery] = useState('');

  // Reader settings
  const [zoomLevel, setZoomLevel] = useState(100);
  const [readerTheme, setReaderTheme] = useState('light'); // 'light', 'sepia', 'night'
  const [iframeLoading, setIframeLoading] = useState(true);

  const iframeRef = useRef(null);

  /* ─── Fetch des cours uniquement depuis la table 'cours_bac' ─── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/api/cours-bac`);
        const list = Array.isArray(data) ? data : (data?.value || data?.cours || (data ? [data] : []));
        setCoursBacList(list);
      } catch (err) {
        console.error('Erreur chargement cours_bac:', err);
        setError("Impossible de charger les cours du bac.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ─── Helpers d'URL ─── */
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

  /* ─── Filtrer les cours de la table cours_bac par matière ─── */
  const coursForMatiere = (mat) => coursBacList.filter(c => matchMatiere(c.matiere, mat.id));

  /* ─── Construire la liste des chapitres d'une matière ─── */
  const chapitresForMatiere = (mat) => {
    const dbCours = coursForMatiere(mat);
    const standardChapitres = BAC_MATIERES_CONFIG[mat.id] || [];

    // Map pour dédoublonner
    const map = new Map();

    // 1. D'abord ajouter les chapitres standard dans l'ordre pédagogique
    standardChapitres.forEach(ch => {
      const key = ch.toLowerCase().trim();
      map.set(key, ch);
    });

    // 2. Ajouter les chapitres personnalisés trouvés en base dans cours_bac
    dbCours.forEach(c => {
      const ch = (c.chapitre || '').trim();
      if (ch) {
        const key = ch.toLowerCase();
        if (!map.has(key)) {
          map.set(key, ch);
        }
      }
    });

    // 3. Cas des cours sans chapitre spécifié
    if (dbCours.some(c => !(c.chapitre || '').trim())) {
      map.set('général', 'Général');
    }

    // Convertir en tableau avec le comptage des cours HTML en base
    const allChapitres = Array.from(map.values()).map(nom => {
      const attached = dbCours.filter(c => {
        const chap = (c.chapitre || '').trim();
        if (nom === 'Général') return !chap;
        return chap.toLowerCase() === nom.toLowerCase();
      });
      return {
        nom,
        count: attached.length,
        cours: attached
      };
    });

    // Trier pour mettre en premier les chapitres qui ont des cours disponibles, puis l'ordre initial
    return allChapitres;
  };

  /* ─── Cours pour un chapitre sélectionné ─── */
  const coursForChapitre = (mat, chapNom) => {
    return coursBacList.filter(c => {
      if (!matchMatiere(c.matiere, mat.id)) return false;
      const ch = (c.chapitre || '').trim();
      if (chapNom === 'Général') return !ch;
      return ch.toLowerCase() === chapNom.toLowerCase();
    });
  };

  /* ─── Navigation ─── */
  const goMatieres = () => {
    setStep('matieres');
    setSelectedMatiere(null);
    setSelectedChapitre(null);
    setActiveCours(null);
    setSearchQuery('');
  };

  const goChapitres = (mat) => {
    setSelectedMatiere(mat);
    setSelectedChapitre(null);
    setActiveCours(null);
    setSearchQuery('');
    setStep('chapitres');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openReader = (chapNom, specificCours = null) => {
    setSelectedChapitre(chapNom);
    const list = coursForChapitre(selectedMatiere, chapNom);
    if (specificCours) {
      setActiveCours(specificCours);
      setStep('reader');
    } else if (list.length > 0) {
      setActiveCours(list[0]);
      setStep('reader');
    } else {
      // Aucun cours en base pour ce chapitre
      setActiveCours({
        id: 'placeholder',
        titre: `Cours — ${chapNom}`,
        matiere: selectedMatiere.nom,
        chapitre: chapNom,
        htmlUrl: null
      });
      setStep('reader');
    }
    setIframeLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ─── Calcul des stats pour les 5 matières ─── */
  const matieresWithCount = MATIERES.map(m => {
    const list = coursForMatiere(m);
    return {
      ...m,
      count: list.length
    };
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '32px 36px',
      fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#0f172a'
    }}>

      {/* ═════════════════════════════════════════
          STEP 1 : LES 5 MATIÈRES DU COURS DU BAC
          (Mathématiques, Physique, SVT, Philosophie, Anglais)
          ═════════════════════════════════════════ */}
      {step === 'matieres' && (
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          


          {/* État de chargement / Erreur */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{
                width: '56px', height: '56px', border: '4px solid #e2e8f0', borderTopColor: '#2563eb',
                borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
              }} />
              <p style={{ fontWeight: 700, color: '#64748b', fontSize: '16px' }}>Chargement des cours du BAC…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '20px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
              <p style={{ color: '#dc2626', fontWeight: 700 }}>{error}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {matieresWithCount.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => goChapitres(mat)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '24px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '135px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 16px 40px ${mat.color}1c`;
                    e.currentTarget.style.borderColor = mat.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  {/* Illustration à gauche */}
                  <div style={{
                    width: '180px', minWidth: '180px', height: '100%', minHeight: '135px',
                    background: mat.gradient,
                    borderRadius: '22px 60px 60px 22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)'
                  }}>
                    {mat.renderIcon()}
                  </div>

                  {/* Contenu textuel */}
                  <div style={{ flex: 1, padding: '16px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '22px' }}>{mat.emoji}</span>
                      <h2 style={{ margin: 0, fontSize: '23px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                        {mat.nom}
                      </h2>
                    </div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14.5px', fontWeight: 500, lineHeight: 1.5, maxWidth: '680px' }}>
                      {mat.desc}
                    </p>
                  </div>

                  {/* Bouton et compteur */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', paddingRight: '32px' }}>
                    <span style={{
                      background: mat.badgeBg, color: mat.badgeColor,
                      padding: '6px 16px', borderRadius: '20px',
                      fontSize: '13px', fontWeight: 800, border: `1px solid ${mat.badgeColor}25`
                    }}>
                      {mat.count} Cours HTML{mat.count > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); goChapitres(mat); }}
                      style={{
                        background: mat.gradient, color: '#fff', border: 'none',
                        padding: '11px 22px', borderRadius: '20px',
                        fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                        transition: 'opacity 0.2s, transform 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'scale(1.03)'; }}
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

      {/* ═════════════════════════════════════════
          STEP 2 : CHAPITRES DE LA MATIÈRE
          ═════════════════════════════════════════ */}
      {step === 'chapitres' && selectedMatiere && (
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px', fontSize: '14px' }}>
            <button
              onClick={goMatieres}
              style={{
                background: 'none', border: 'none', color: '#2563eb',
                cursor: 'pointer', fontWeight: 700, padding: 0, display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              <span>📚 Matières</span>
            </button>
            <span style={{ color: '#94a3b8' }}>/</span>
            <span style={{ color: '#0f172a', fontWeight: 800 }}>{selectedMatiere.nom}</span>
          </div>

          {/* Header section chapitres */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '26px', flexWrap: 'wrap', gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px' }}>{selectedMatiere.emoji}</span>
                <h1 style={{ margin: 0, fontSize: '27px', fontWeight: 900, color: '#0f172a' }}>
                  Chapitres — {selectedMatiere.nom}
                </h1>
              </div>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14.5px' }}>
                Cliquez sur un chapitre pour ouvrir son cours HTML complet avec affichage adapté à la lecture.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Barre de recherche dans les chapitres */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Rechercher un chapitre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '9px 16px 9px 36px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13.5px',
                    background: '#fff',
                    outline: 'none',
                    width: '230px'
                  }}
                />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}>
                  🔍
                </span>
              </div>

              <button
                onClick={goMatieres}
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
          </div>

          {/* Bannière récapitulative */}
          <div style={{
            background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0',
            padding: '14px 22px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>💡</span>
              <span style={{ fontSize: '13.5px', color: '#475569', fontWeight: 600 }}>
                Sélectionnez un chapitre ci-dessous pour charger immédiatement la fiche de cours ajoutée par l'admin.
              </span>
            </div>
            <span style={{
              background: selectedMatiere.badgeBg, color: selectedMatiere.badgeColor,
              padding: '5px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800
            }}>
              {coursForMatiere(selectedMatiere).length} Cours HTML au total
            </span>
          </div>

          {/* Liste des chapitres */}
          {(() => {
            const rawChapitres = chapitresForMatiere(selectedMatiere);
            const filteredChapitres = searchQuery.trim()
              ? rawChapitres.filter(ch => ch.nom.toLowerCase().includes(searchQuery.toLowerCase().trim()))
              : rawChapitres;

            if (filteredChapitres.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '24px', border: '1.5px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '46px', marginBottom: '12px' }}>📂</div>
                  <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: 800, fontSize: '18px' }}>Aucun chapitre trouvé</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Aucun chapitre ne correspond à votre recherche "{searchQuery}".</p>
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredChapitres.map((chap, idx) => {
                  const hasCours = chap.count > 0;
                  return (
                    <div
                      key={idx}
                      onClick={() => openReader(chap.nom)}
                      style={{
                        background: '#fff',
                        borderRadius: '22px',
                        border: hasCours ? `1.5px solid ${selectedMatiere.color}40` : '1.5px solid #e2e8f0',
                        boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: '115px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = `0 14px 32px ${selectedMatiere.color}18`;
                        e.currentTarget.style.borderColor = selectedMatiere.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.03)';
                        e.currentTarget.style.borderColor = hasCours ? `${selectedMatiere.color}40` : '#e2e8f0';
                      }}
                    >
                      {/* Vignette chapitre */}
                      <div style={{
                        width: '150px', minWidth: '150px', height: '100%', minHeight: '115px',
                        background: selectedMatiere.gradient,
                        borderRadius: '20px 50px 50px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)'
                      }}>
                        <svg width="56" height="56" viewBox="0 0 100 100" fill="none">
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

                      {/* Détails du chapitre */}
                      <div style={{ flex: 1, padding: '14px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                          <span style={{
                            background: selectedMatiere.badgeBg, color: selectedMatiere.badgeColor,
                            padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800
                          }}>
                            {selectedMatiere.nom}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>•</span>
                          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Chapitre {idx + 1}</span>
                        </div>
                        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                          {chap.nom}
                        </h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px', fontWeight: 500 }}>
                          {hasCours
                            ? `${chap.count} cours interactif${chap.count > 1 ? 's' : ''} disponible${chap.count > 1 ? 's' : ''} (HTML)`
                            : 'Fiche pédagogique en cours de préparation par l’administrateur'}
                        </p>
                      </div>

                      {/* Badge et bouton d'action */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', paddingRight: '28px' }}>
                        {hasCours ? (
                          <span style={{
                            background: '#dcfce7', color: '#15803d',
                            padding: '4px 14px', borderRadius: '18px', fontSize: '12.5px', fontWeight: 800,
                            display: 'inline-flex', alignItems: 'center', gap: '5px'
                          }}>
                            <span>●</span> {chap.count} Cours HTML
                          </span>
                        ) : (
                          <span style={{
                            background: '#f1f5f9', color: '#64748b',
                            padding: '4px 12px', borderRadius: '18px', fontSize: '12px', fontWeight: 700
                          }}>
                            Bientôt disponible
                          </span>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); openReader(chap.nom); }}
                          style={{
                            background: hasCours ? selectedMatiere.gradient : '#e2e8f0',
                            color: hasCours ? '#fff' : '#64748b',
                            border: 'none',
                            padding: '10px 20px', borderRadius: '18px',
                            fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: hasCours ? '0 4px 14px rgba(0,0,0,0.1)' : 'none',
                            transition: 'opacity 0.2s, transform 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (hasCours) {
                              e.currentTarget.style.opacity = '0.9';
                              e.currentTarget.style.transform = 'scale(1.03)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (hasCours) {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          <span>{hasCours ? 'Ouvrir le cours' : 'Consulter'}</span>
                          <span>🌐</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ═════════════════════════════════════════
          STEP 3 : LECTEUR HTML DU COURS BAC
          (Moderne, responsive, adapté à la lecture)
          ═════════════════════════════════════════ */}
      {step === 'reader' && activeCours && selectedMatiere && (
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          
          {/* Barre d'outils supérieure */}
          <div style={{
            background: '#fff', borderRadius: '20px',
            padding: '16px 24px', marginBottom: '18px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '16px'
          }}>
            {/* Gauche: Retour & Titres */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setStep('chapitres'); setActiveCours(null); }}
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
                  {activeCours.chapitre && (
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                      📌 {activeCours.chapitre}
                    </span>
                  )}
                  {activeCours.htmlUrl && (
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                      🌐 Fiche HTML (cours_bac)
                    </span>
                  )}
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {activeCours.titre || `Cours : ${activeCours.chapitre}`}
                </h2>
              </div>
            </div>

            {/* Droite: Outils de confort de lecture & plein écran */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              
              {/* Sélecteur de fiche si plusieurs cours dans le chapitre */}
              {selectedChapitre && coursForChapitre(selectedMatiere, selectedChapitre).length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '5px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Fiches :</span>
                  {coursForChapitre(selectedMatiere, selectedChapitre).map((c, i) => {
                    const isCurrent = activeCours.id === c.id;
                    return (
                      <button
                        key={c.id || i}
                        onClick={() => { setActiveCours(c); setIframeLoading(true); }}
                        style={{
                          background: isCurrent ? selectedMatiere.color : '#fff',
                          color: isCurrent ? '#fff' : '#334155',
                          border: isCurrent ? 'none' : '1px solid #cbd5e1',
                          borderRadius: '6px', padding: '4px 10px',
                          fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {c.titre ? (c.titre.length > 20 ? c.titre.substring(0, 18) + '…' : c.titre) : `Cours ${i + 1}`}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Contrôle de zoom */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '10px', padding: '2px', border: '1px solid #e2e8f0' }}>
                <button
                  title="Réduire la taille"
                  onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                  style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', color: '#475569' }}
                >
                  A-
                </button>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e293b', padding: '0 4px' }}>
                  {zoomLevel}%
                </span>
                <button
                  title="Agrandir la taille"
                  onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                  style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', color: '#475569' }}
                >
                  A+
                </button>
              </div>

              {/* Mode de lecture (Jour / Sépia / Nuit) */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '10px', padding: '3px', border: '1px solid #e2e8f0', gap: '3px' }}>
                <button
                  title="Thème Clair"
                  onClick={() => setReaderTheme('light')}
                  style={{
                    background: readerTheme === 'light' ? '#fff' : 'transparent',
                    border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '13px',
                    boxShadow: readerTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  ☀️
                </button>
                <button
                  title="Thème Sépia (repos des yeux)"
                  onClick={() => setReaderTheme('sepia')}
                  style={{
                    background: readerTheme === 'sepia' ? '#fbf0d9' : 'transparent',
                    border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '13px',
                    boxShadow: readerTheme === 'sepia' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  📖
                </button>
                <button
                  title="Thème Sombre"
                  onClick={() => setReaderTheme('night')}
                  style={{
                    background: readerTheme === 'night' ? '#1e293b' : 'transparent',
                    color: readerTheme === 'night' ? '#fff' : 'inherit',
                    border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '13px',
                    boxShadow: readerTheme === 'night' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  🌙
                </button>
              </div>

              {/* Bouton Plein Écran */}
              {activeCours.htmlUrl && (
                <a
                  href={getFullUrl(activeCours.htmlUrl)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: selectedMatiere.gradient, color: '#fff',
                    padding: '9px 18px', borderRadius: '10px',
                    textDecoration: 'none', fontSize: '13px', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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

          {/* Conteneur principal du lecteur */}
          {activeCours.htmlUrl ? (
            <div style={{
              background: readerTheme === 'sepia' ? '#fefae0' : (readerTheme === 'night' ? '#0f172a' : '#ffffff'),
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: '1.5px solid #e2e8f0',
              position: 'relative',
              transition: 'background 0.3s'
            }}>
              {/* Header interne du lecteur */}
              <div style={{
                padding: '12px 24px',
                background: readerTheme === 'night' ? '#1e293b' : '#f8fafc',
                borderBottom: `1px solid ${readerTheme === 'night' ? '#334155' : '#e2e8f0'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '13px',
                color: readerTheme === 'night' ? '#94a3b8' : '#475569',
                fontWeight: 600
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📖</span>
                  <span>Cours interactif BAC — Tableau <strong>cours_bac</strong></span>
                  <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    HTML + MathJax
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                  <span>Zoom : {zoomLevel}%</span>
                  <span>•</span>
                  <span>Adapté tablette & mobile</span>
                </div>
              </div>

              {/* Loader pendant le chargement de l'iframe */}
              {iframeLoading && (
                <div style={{
                  position: 'absolute', top: '50px', left: 0, right: 0, bottom: 0,
                  background: 'rgba(255,255,255,0.85)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10
                }}>
                  <div style={{
                    width: '46px', height: '46px', border: '3px solid #e2e8f0',
                    borderTopColor: selectedMatiere.color, borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', marginBottom: '12px'
                  }} />
                  <p style={{ fontWeight: 700, color: '#475569', fontSize: '14px', margin: 0 }}>
                    Chargement du cours HTML…
                  </p>
                </div>
              )}

              {/* Iframe du cours HTML */}
              <div style={{
                width: '100%',
                height: '84vh',
                overflow: 'auto',
                filter: readerTheme === 'sepia' ? 'sepia(0.25)' : (readerTheme === 'night' ? 'invert(0.9) hue-rotate(180deg)' : 'none'),
                transition: 'filter 0.3s'
              }}>
                <iframe
                  ref={iframeRef}
                  src={getFullUrl(activeCours.htmlUrl)}
                  title={activeCours.titre || activeCours.chapitre}
                  onLoad={() => setIframeLoading(false)}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  style={{
                    width: `${100 * (100 / zoomLevel)}%`,
                    height: `${84 * (100 / zoomLevel)}vh`,
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top left',
                    border: 'none',
                    display: 'block',
                    background: '#ffffff'
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '80px 30px', background: '#fff',
              borderRadius: '20px', border: '1.5px dashed #cbd5e1',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>📄</div>
              <h3 style={{ margin: '0 0 10px', color: '#0f172a', fontWeight: 800, fontSize: '20px' }}>
                Aucun cours HTML rattaché pour le moment
              </h3>
              <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '560px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                L'administrateur n'a pas encore ajouté de fichier HTML dans le tableau <strong>cours_bac</strong> pour le chapitre « {activeCours.chapitre} ».
              </p>
              <button
                onClick={() => setStep('chapitres')}
                style={{
                  background: selectedMatiere.gradient, color: '#fff', border: 'none',
                  padding: '11px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                }}
              >
                ← Explorer les autres chapitres
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
