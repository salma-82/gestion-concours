import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { recordStudentActivity } from '../studentProgress';

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
    squareBg: '#2563eb',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
    lightBg: '#dbeafe',
    desc: 'Analyse, Limites, Suites, Fonctions exponentielles & logarithmes, Nombres complexes, Intégrales…',
    emoji: '📐',
    renderSquareIcon: () => (
      <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold', fontFamily: 'system-ui, serif' }}>
        π
      </span>
    ),
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
    squareBg: '#818cf8',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
    badgeBg: '#f5f3ff',
    badgeColor: '#6d28d9',
    lightBg: '#ede9fe',
    desc: 'Ondes mécaniques & lumineuses, Nucléaire, Électricité RC/RL/RLC, Lois de Newton, Chimie…',
    emoji: '⚡',
    renderSquareIcon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.31L4.19 19a2 2 0 0 0 1.7 3h12.22a2 2 0 0 0 1.7-3L14 9.31V2" />
        <line x1="8.5" y1="2" x2="15.5" y2="2" />
        <path d="M7 16h10" opacity="0.6" />
      </svg>
    ),
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
    squareBg: '#10b981',
    gradient: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    lightBg: '#d1fae5',
    desc: 'Information Génétique, Immunologie, Énergie cellulaire & Muscle, Géologie de la Terre…',
    emoji: '🧬',
    renderSquareIcon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
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
    squareBg: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
    badgeBg: '#fffbeb',
    badgeColor: '#b45309',
    lightBg: '#fef3c7',
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
    ),
    renderIcon: () => (
      <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
        <rect x="22" y="78" width="56" height="6" rx="2" fill="#fff" opacity=".95"/>
        <rect x="26" y="74" width="48" height="4" rx="1.5" fill="#fde68a"/>
        <path d="M22 28L50 16L78 28V32H22V28Z" fill="#fff" opacity=".95"/>
        <rect x="25" y="32" width="50" height="4" rx="1" fill="#fde68a"/>
        <rect x="29" y="36" width="8" height="38" rx="2" fill="#fff" opacity=".9"/>
        <line x1="33" y1="39" x2="33" y2="71" stroke="#d97706" strokeWidth="1.5"/>
        <rect x="46" y="36" width="8" height="38" rx="2" fill="#fff" opacity=".9"/>
        <line x1="50" y1="39" x2="50" y2="71" stroke="#d97706" strokeWidth="1.5"/>
        <rect x="63" y="36" width="8" height="38" rx="2" fill="#fff" opacity=".9"/>
        <line x1="67" y1="39" x2="67" y2="71" stroke="#d97706" strokeWidth="1.5"/>
        <circle cx="50" cy="24" r="3.5" fill="#f59e0b"/>
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
    lightBg: '#e0f2fe',
    desc: 'Reading Comprehension, Writing, Gifts of Youth, Science & Culture, Sustainable Development…',
    emoji: '🌍',
    renderSquareIcon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    renderIcon: () => (
      <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="28" fill="#bae6fd" opacity=".6"/>
        <circle cx="50" cy="50" r="28" stroke="#fff" strokeWidth="3"/>
        <ellipse cx="50" cy="50" rx="14" ry="28" stroke="#fff" strokeWidth="2.5" fill="none"/>
        <line x1="22" y1="50" x2="78" y2="50" stroke="#fff" strokeWidth="2.5"/>
        <line x1="26" y1="36" x2="74" y2="36" stroke="#fff" strokeWidth="1.8" opacity=".8"/>
        <line x1="26" y1="64" x2="74" y2="64" stroke="#fff" strokeWidth="1.8" opacity=".8"/>
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
   HELPERS : matching de filière et matière
   ───────────────────────────────────────────── */
const matchFiliere = (itemFiliere, targetFiliere) => {
  if (!targetFiliere) return true;
  if (!itemFiliere) return true;
  const item = itemFiliere.trim().toLowerCase();
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

/* ─────────────────────────────────────────────
   COMPOSANT PRINCIPAL : CLIENT COURS BAC
   ───────────────────────────────────────────── */
export default function ClientCoursPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filiereFromUrl = searchParams.get('filiere') || '';
  const [selectedFiliere, setSelectedFiliere] = useState(filiereFromUrl);

  // Navigation: 'matieres' → 'chapitres' → 'cours' → 'reader'
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

  // Réaction au changement de filière dans l'URL (via la Sidebar)
  useEffect(() => {
    const f = searchParams.get('filiere') || '';
    setSelectedFiliere(f);
    setStep('matieres');
    setSelectedMatiere(null);
    setSelectedChapitre(null);
    setActiveCours(null);
    setSearchQuery('');
  }, [searchParams]);

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

  /* ─── Cours filtrés par la filière sélectionnée ─── */
  const coursForCurrentFiliere = selectedFiliere
    ? coursBacList.filter(c => matchFiliere(c.filiere, selectedFiliere))
    : coursBacList;

  /* ─── Filtrer les cours par matière et filière ─── */
  const coursForMatiere = (mat) => coursForCurrentFiliere.filter(c => matchMatiere(c.matiere, mat.id));

  /* ─── Construire la liste des chapitres d'une matière pour cette filière ─── */
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
    return Array.from(map.values()).map(nom => {
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
  };

  /* ─── Cours pour un chapitre sélectionné ─── */
  const coursForChapitre = (mat, chapNom) => {
    return coursForCurrentFiliere.filter(c => {
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

  const goCours = (chapNom) => {
    setSelectedChapitre(chapNom);
    setActiveCours(null);
    setSearchQuery('');
    setStep('cours');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openReader = (chapNom, specificCours = null) => {
    setSelectedChapitre(chapNom);
    const list = coursForChapitre(selectedMatiere, chapNom);
    if (specificCours) {
      setActiveCours(specificCours);
      setStep('reader');
      recordStudentActivity({
        type: 'Cours',
        resourceId: specificCours.id,
        title: specificCours.titre || `Cours — ${chapNom}`,
        subject: specificCours.matiere || selectedMatiere?.nom,
        chapter: specificCours.chapitre || chapNom
      });
    } else if (list.length > 0) {
      setActiveCours(list[0]);
      setStep('reader');
      recordStudentActivity({
        type: 'Cours',
        resourceId: list[0].id,
        title: list[0].titre || `Cours — ${chapNom}`,
        subject: list[0].matiere || selectedMatiere?.nom,
        chapter: list[0].chapitre || chapNom
      });
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

  /* ─── Calcul des stats pour les matières ─── */
  const matieresWithCount = MATIERES.map(m => {
    const list = coursForMatiere(m);
    return {
      ...m,
      count: list.length
    };
  });

  const pageStyle = {
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
    padding: selectedFiliere ? '24px 24px 40px' : '32px 36px',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#0f172a'
  };

  return (
    <div style={pageStyle}>

            {step === 'matieres' && (
        <div style={{ width: '100%', maxWidth: 'none', margin: '0 auto' }}>
          {!selectedFiliere ? (
            <div style={{
              minHeight: '240px',
              padding: '40px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
            }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>🎓</div>
              <h1 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '24px', fontWeight: 800 }}>
                Choisissez une filière
              </h1>
              <p style={{ maxWidth: '520px', margin: 0, color: '#64748b', fontSize: '15px', lineHeight: 1.6 }}>
                Sélectionnez une filière dans le menu « Cours Bac » à gauche pour afficher ses matières et ses cours.
              </p>
            </div>
          ) : (
            <>
          {selectedFiliere && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '22px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => navigate('/client-dashboard')}
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
              <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                Filière : {selectedFiliere}
              </span>
            </div>
          )}


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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {matieresWithCount.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => goChapitres(mat)}
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
                  {/* Illustration à gauche */}
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

                  {/* Contenu textuel */}
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

                  {/* Bouton et compteur */}
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
                      {mat.count} cours
                    </span>
                    <button
                      type="button"
                      aria-label={`Voir les chapitres de ${mat.nom}`}
                      onClick={(e) => { e.stopPropagation(); goChapitres(mat); }}
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
                      <span>Voir les chapitres</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>
      )}

      {step === 'chapitres' && selectedMatiere && (
        <div style={{ width: '100%', maxWidth: 'none', margin: '0 auto' }}>
          
          {/* Fil d'Ariane harmonisé : 🏠 Cours Bac > {selectedFiliere} > {selectedMatiere.nom} */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            fontSize: '13.5px'
          }}>
            <div
              onClick={() => navigate('/client-dashboard')}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}
              title="Retour aux filières"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>

            <span
              onClick={() => navigate('/client-dashboard')}
              style={{
                color: '#2563eb',
                fontWeight: 650,
                cursor: 'pointer'
              }}
            >
              Cours Bac
            </span>

            {selectedFiliere && (
              <>
                <span style={{ color: '#94a3b8', fontSize: '13px', margin: '0 2px' }}>&gt;</span>
                <span
                  onClick={goMatieres}
                  style={{
                    color: '#2563eb',
                    fontWeight: 650,
                    cursor: 'pointer'
                  }}
                >
                  {selectedFiliere}
                </span>
              </>
            )}

            <span style={{ color: '#94a3b8', fontSize: '13px', margin: '0 2px' }}>&gt;</span>
            <span style={{ color: '#1e293b', fontWeight: 600 }}>
              {selectedMatiere.nom}
            </span>
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
                          <span>→</span>
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
          STEP 3 : LISTE DES COURS CORRESPONDANTS (CARTES)
          ═════════════════════════════════════════ */}
      {step === 'cours' && selectedMatiere && selectedChapitre && (
        <div style={{ width: '100%', maxWidth: 'none', margin: '0 auto' }}>
          
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px', fontSize: '14px', flexWrap: 'wrap' }}>
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
            <button
              onClick={() => goChapitres(selectedMatiere)}
              style={{
                background: 'none', border: 'none', color: '#2563eb',
                cursor: 'pointer', fontWeight: 700, padding: 0
              }}
            >
              {selectedMatiere.nom}
            </button>
            <span style={{ color: '#94a3b8' }}>/</span>
            <span style={{ color: '#0f172a', fontWeight: 800 }}>{selectedChapitre}</span>
          </div>

          {/* Header section cours */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '26px', flexWrap: 'wrap', gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px' }}>📖</span>
                <h1 style={{ margin: 0, fontSize: '27px', fontWeight: 900, color: '#0f172a' }}>
                  Cours — {selectedChapitre}
                </h1>
              </div>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14.5px' }}>
                {selectedFiliere && (
                  <>Filière : <strong style={{ color: '#1e293b' }}>{selectedFiliere}</strong> • </>
                )}
                Matière : <strong style={{ color: '#1e293b' }}>{selectedMatiere.nom}</strong>
              </p>
            </div>

            <button
              onClick={() => goChapitres(selectedMatiere)}
              style={{
                background: '#fff', border: '1.5px solid #cbd5e1',
                padding: '9px 18px', borderRadius: '12px',
                cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: '#334155',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            >
              ← Retour aux chapitres
            </button>
          </div>

          {/* Cartes des cours correspondants */}
          {(() => {
            const chapCours = coursForChapitre(selectedMatiere, selectedChapitre);

            if (chapCours.length === 0) {
              return (
                <div style={{
                  background: '#ffffff', borderRadius: '24px', border: '1.5px dashed #cbd5e1',
                  padding: '60px 30px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '46px', marginBottom: '12px' }}>📂</div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    Aucun cours spécifique en base pour ce chapitre
                  </h3>
                  <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14.5px' }}>
                    L’administrateur n’a pas encore déposé de fichier HTML pour ce chapitre dans cette filière.
                  </p>
                  <button
                    onClick={() => openReader(selectedChapitre)}
                    style={{
                      background: selectedMatiere.gradient, color: '#fff', border: 'none',
                      padding: '12px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: 700,
                      cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                    }}
                  >
                    Consulter la fiche générale
                  </button>
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {chapCours.map((coursItem, cIdx) => (
                  <div
                    key={coursItem.id || cIdx}
                    onClick={() => openReader(selectedChapitre, coursItem)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '22px',
                      border: `1.5px solid ${selectedMatiere.color}40`,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                      padding: '20px 26px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      transition: 'all 0.25s cubic-bezier(.4,0,.2,1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = `0 14px 32px ${selectedMatiere.color}20`;
                      e.currentTarget.style.borderColor = selectedMatiere.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                      e.currentTarget.style.borderColor = `${selectedMatiere.color}40`;
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      <div style={{
                        width: '54px', height: '54px', borderRadius: '16px',
                        background: selectedMatiere.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '24px', flexShrink: 0
                      }}>
                        📄
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                          <span style={{
                            background: selectedMatiere.badgeBg, color: selectedMatiere.badgeColor,
                            padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800
                          }}>
                            {selectedMatiere.nom}
                          </span>
                          {coursItem.filiere && (
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                              🎓 {coursItem.filiere}
                            </span>
                          )}
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            ● Cours HTML
                          </span>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
                          {coursItem.titre || `Cours #${coursItem.id}`}
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); openReader(selectedChapitre, coursItem); }}
                      style={{
                        background: selectedMatiere.gradient, color: '#fff', border: 'none',
                        padding: '11px 24px', borderRadius: '16px',
                        fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s, opacity 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>Ouvrir le cours</span>
                      <span>🌐</span>
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ═════════════════════════════════════════
          STEP 4 : LECTEUR HTML DU COURS BAC
          (Moderne, responsive, adapté à la lecture)
          ═════════════════════════════════════════ */}
      {step === 'reader' && activeCours && selectedMatiere && (
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
          {/* Fil d'Ariane cliquable : Matières / Matière / Cours */}
          <div style={{
            height: '48px',
            minHeight: '48px',
            maxHeight: '48px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: '8px',
            fontSize: '13.5px',
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
            userSelect: 'none',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <button
              onClick={() => {
                setStep('matieres');
                setActiveCours(null);
                setSelectedMatiere(null);
                setSelectedChapitre(null);
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
                setStep('chapitres');
                setActiveCours(null);
                setSelectedChapitre(null);
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
              {selectedMatiere?.nom || activeCours?.matiere || 'Matière'}
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
              {selectedChapitre || activeCours.chapitre || activeCours.titre}
            </span>
          </div>

          {/* Iframe occupant tout le reste de l'écran */}
          {activeCours.htmlUrl ? (
            <iframe
              ref={iframeRef}
              src={getFullUrl(activeCours.htmlUrl)}
              title={activeCours.titre || activeCours.chapitre}
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
          ) : (
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
                Aucun fichier HTML rattaché
              </h2>
              <p style={{ color: '#64748b', fontSize: '14.5px', maxWidth: '480px', marginBottom: '24px' }}>
                L'administrateur n'a pas encore ajouté de fichier HTML pour ce cours.
              </p>
              <button
                onClick={() => { setStep('chapitres'); setActiveCours(null); }}
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
                ← Revenir aux chapitres
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
