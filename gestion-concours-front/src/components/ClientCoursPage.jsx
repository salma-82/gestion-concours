import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  fetchStudentActivityCompletionMap,
  getStudentActivityStatusKey,
  recordStudentActivity,
  recordStudentActivityDuration,
  saveStudentMistakesManually,
  setStudentActivityCompleted
} from '../studentProgress';
import { toBackendResourceUrl } from '../backendResourceUrl';

const API = '';

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
        <path d="M18 78L18 24C18 20.69 20.69 18 24 18L78 78H24C20.69 78 18 75.31 18 78Z" fill="#93c5fd" opacity=".6" />
        <path d="M22 28V74H68L22 28Z" fill="#3b82f6" opacity=".2" />
        <path d="M30 46L30 70H54L30 46Z" fill="#eff6ff" />
        <text x="38" y="32" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="sans-serif">π</text>
        <text x="56" y="44" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="sans-serif">√x</text>
        <g transform="translate(42,42)">
          <rect width="36" height="46" rx="8" fill="#1e40af" stroke="#fff" strokeWidth="2.5" />
          <rect x="5" y="6" width="26" height="10" rx="3" fill="#93c5fd" />
          <circle cx="10" cy="23" r="2.5" fill="#fff" /><circle cx="18" cy="23" r="2.5" fill="#fff" /><circle cx="26" cy="23" r="2.5" fill="#fff" />
          <circle cx="10" cy="31" r="2.5" fill="#fff" /><circle cx="18" cy="31" r="2.5" fill="#fff" /><circle cx="26" cy="31" r="2.5" fill="#fff" />
          <circle cx="10" cy="39" r="2.5" fill="#fff" /><circle cx="18" cy="39" r="2.5" fill="#fff" /><circle cx="26" cy="39" r="2.5" fill="#38bdf8" />
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
        <path d="M42 22H58V34L74 68C76 72 73 78 68 78H32C27 78 24 72 26 68L42 34V22Z" fill="#c4b5fd" opacity=".5" />
        <path d="M30 64L38 48H62L70 64C72 68 69 74 64 74H36C31 74 28 68 30 64Z" fill="#a78bfa" />
        <path d="M32 68C42 62 58 72 68 68V74H32V68Z" fill="#7c3aed" />
        <circle cx="44" cy="56" r="3" fill="#fff" opacity=".8" />
        <circle cx="54" cy="62" r="2" fill="#fff" opacity=".8" />
        <circle cx="48" cy="66" r="4" fill="#fff" opacity=".8" />
        <g transform="translate(56,32)">
          <ellipse cx="16" cy="16" rx="18" ry="7" transform="rotate(30 16 16)" stroke="#fff" strokeWidth="2" strokeDasharray="3 1" fill="none" />
          <ellipse cx="16" cy="16" rx="18" ry="7" transform="rotate(-30 16 16)" stroke="#fff" strokeWidth="2" fill="none" />
          <circle cx="16" cy="16" r="5" fill="#facc15" />
          <circle cx="30" cy="12" r="2.5" fill="#fff" />
          <circle cx="6" cy="24" r="2.5" fill="#fff" />
        </g>
      </svg>
    )
  },
  {
    id: 'SVT',
    nom: 'Sciences de la Vie et de la Terre',
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
        <path d="M52 48C52 48 64 36 76 40C88 44 88 60 76 66C64 72 56 64 52 48Z" fill="#34d399" />
        <path d="M54 50C62 60 70 66 78 68" stroke="#065f46" strokeWidth="1.5" />
        <path d="M46 56C46 56 50 68 44 76C38 84 26 80 26 68C26 56 38 52 46 56Z" fill="#10b981" opacity=".9" />
        <g transform="translate(18,20)">
          <path d="M12 10C24 20 24 35 12 45C0 55 0 70 12 80" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M26 10C14 20 14 35 26 45C38 55 38 70 26 80" stroke="#f43f5e" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <line x1="16" y1="18" x2="22" y2="18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="14" y1="38" x2="24" y2="38" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="14" y1="52" x2="24" y2="52" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="72" x2="22" y2="72" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
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
        <rect x="22" y="78" width="56" height="6" rx="2" fill="#fff" opacity=".95" />
        <rect x="26" y="74" width="48" height="4" rx="1.5" fill="#fde68a" />
        <path d="M22 28L50 16L78 28V32H22V28Z" fill="#fff" opacity=".95" />
        <rect x="25" y="32" width="50" height="4" rx="1" fill="#fde68a" />
        <rect x="29" y="36" width="8" height="38" rx="2" fill="#fff" opacity=".9" />
        <line x1="33" y1="39" x2="33" y2="71" stroke="#d97706" strokeWidth="1.5" />
        <rect x="46" y="36" width="8" height="38" rx="2" fill="#fff" opacity=".9" />
        <line x1="50" y1="39" x2="50" y2="71" stroke="#d97706" strokeWidth="1.5" />
        <rect x="63" y="36" width="8" height="38" rx="2" fill="#fff" opacity=".9" />
        <line x1="67" y1="39" x2="67" y2="71" stroke="#d97706" strokeWidth="1.5" />
        <circle cx="50" cy="24" r="3.5" fill="#f59e0b" />
      </svg>
    )
  },
  {
    id: 'Anglais',
    nom: 'Anglais',
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
        <circle cx="50" cy="50" r="28" fill="#bae6fd" opacity=".6" />
        <circle cx="50" cy="50" r="28" stroke="#fff" strokeWidth="3" />
        <ellipse cx="50" cy="50" rx="14" ry="28" stroke="#fff" strokeWidth="2.5" fill="none" />
        <line x1="22" y1="50" x2="78" y2="50" stroke="#fff" strokeWidth="2.5" />
        <line x1="26" y1="36" x2="74" y2="36" stroke="#fff" strokeWidth="1.8" opacity=".8" />
        <line x1="26" y1="64" x2="74" y2="64" stroke="#fff" strokeWidth="1.8" opacity=".8" />
        <g transform="translate(52,22)">
          <rect width="30" height="22" rx="7" fill="#0284c7" stroke="#fff" strokeWidth="2" />
          <path d="M6 22L12 28V22H6Z" fill="#0284c7" />
          <text x="15" y="16" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">EN</text>
        </g>
      </svg>
    )
  }
];

export const AVAILABLE_FILIERES = [
  'Sciences Mathématiques A',
  'Sciences Mathématiques B',
  'Sciences Physiques (PC)',
  'Sciences de la Vie et de la Terre (SVT)',
  'Sciences Économiques & Gestion'
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
  const [selectedFiliere, setSelectedFiliere] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return filiereFromUrl || user.filiere || 'Sciences Mathématiques A';
    } catch {
      return filiereFromUrl || 'Sciences Mathématiques A';
    }
  });

  // Navigation: 'matieres' → 'chapitres' → 'cours' → 'reader'
  const [step, setStep] = useState('matieres');
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [selectedChapitre, setSelectedChapitre] = useState(null);
  const [activeCours, setActiveCours] = useState(null);
  const [isCoursMenuOpen, setIsCoursMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Données de la table cours_bac
  const [coursBacList, setCoursBacList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionStatuses, setCompletionStatuses] = useState({});
  const [completingActivityKey, setCompletingActivityKey] = useState('');
  const [completionErrorKey, setCompletionErrorKey] = useState('');

  const activeCourseStatusKey = activeCours?.id && activeCours.id !== 'placeholder'
    ? getStudentActivityStatusKey('Cours', activeCours.id)
    : '';
  const activeCourseCompleted = completionStatuses[activeCourseStatusKey] === true;

  const handleCompleteCourse = async (event, course) => {
    event?.stopPropagation();
    if (!course?.id) return;
    const statusKey = getStudentActivityStatusKey('Cours', course.id);
    if (completionStatuses[statusKey] === true || completingActivityKey === statusKey) return;

    setCompletingActivityKey(statusKey);
    setCompletionErrorKey('');
    try {
      const saved = await setStudentActivityCompleted(`Cours:${course.id}`, true);
      if (!saved) throw new Error('Impossible d’enregistrer la progression.');
      setCompletionStatuses((current) => ({ ...current, [statusKey]: true }));
    } catch (saveError) {
      console.error('Erreur lors de l’enregistrement de la progression du cours:', saveError);
      setCompletionErrorKey(statusKey);
    } finally {
      setCompletingActivityKey('');
    }
  };

  // Recherche rapide
  const [searchQuery, setSearchQuery] = useState('');

  // Reader settings
  const [zoomLevel, setZoomLevel] = useState(100);
  const [readerTheme, setReaderTheme] = useState('light'); // 'light', 'sepia', 'night'
  const [iframeLoading, setIframeLoading] = useState(true);

  const iframeRef = useRef(null);
  const [courseHtml, setCourseHtml] = useState('');
  const [courseFrameHeight, setCourseFrameHeight] = useState(800);

  useEffect(() => {
    if (!activeCours?.id || activeCours.id === 'placeholder' || !activeCours.htmlUrl || !['chapitres', 'reader'].includes(step)) return undefined;
    const activityId = `Cours:${activeCours.id}`;
    let visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
    const flushVisibleTime = () => {
      if (visibleSince === null) return;
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - visibleSince) / 1000);
      if (elapsedSeconds > 0) recordStudentActivityDuration(activityId, elapsedSeconds, new Date(now));
      visibleSince = now;
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushVisibleTime();
        visibleSince = null;
      } else if (visibleSince === null) {
        visibleSince = Date.now();
      }
    };
    const interval = window.setInterval(flushVisibleTime, 15000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      flushVisibleTime();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeCours?.id, activeCours?.htmlUrl, step]);

  useEffect(() => {
    if (!activeCours?.htmlUrl) {
      setCourseHtml('');
      setCourseFrameHeight(800);
      return undefined;
    }

    let cancelled = false;
    setIframeLoading(true);
    axios.get(getFullUrl(activeCours.htmlUrl), { responseType: 'text' })
      .then(({ data }) => {
        if (cancelled) return;
        const base = `<base href="${getFullUrl(activeCours.htmlUrl)}">`;
        const resizeScript = `<script>(function(){var send=function(){var d=document.documentElement,b=document.body;parent.postMessage({type:'course-html-height',height:Math.max(d?d.scrollHeight:0,b?b.scrollHeight:0,d?d.offsetHeight:0,b?b.offsetHeight:0)},'*')};window.addEventListener('load',send);window.addEventListener('resize',send);new ResizeObserver(send).observe(document.documentElement);if(document.body)new ResizeObserver(send).observe(document.body);setInterval(send,700);send()})()<\/script>`;
        const courseMistakeBridgeScript = `<script>(function(){
          var className='econcourse-save-course-mistake';var pending=new Map();
          var textOf=function(node){return String(node&&node.innerText||'').replace(/ +/g,' ').trim().slice(0,5000)};
          var scan=function(){document.querySelectorAll('.corr.ko').forEach(function(card){
            if(card.querySelector('.'+className))return;
            var button=document.createElement('button');button.type='button';button.className=className;button.textContent='Sauvegarder cette erreur';
            button.style.cssText='margin-top:10px;padding:6px 12px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff;color:#1d4ed8;font:700 12px inherit;cursor:pointer;';
            button.addEventListener('click',function(){
              var head=card.querySelector('.qhead');var qtext=card.querySelector('.qtext,.question-text,.statement,.enonce');
              var wrong=card.querySelector('.copt.bad,.copt.wrong,.wrong-answer');var good=card.querySelector('.copt.good,.copt.correct,.correct-answer');
              var note=card.querySelector('.note');var expl=card.querySelector('.expl,.explanation,.correction-explanation');
              var root=card.closest('[data-question-id],.question,.qblock,.exercise-question')||card.parentElement||card;
              var question=root.querySelector('.qtext,.question-text,.statement,.enonce')||qtext;
              var numberText=(textOf(head).match(/[0-9]+/)||[])[0];var requestId=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
              var sourceType=card.closest('[data-exercise],.exercise,.exercice')?'Exercice':'Cours';
              var selectedLabel=wrong&&(wrong.getAttribute('data-choice-label')||wrong.getAttribute('data-label')||textOf(wrong.querySelector('.k')))||'';
              var correctLabel=good&&(good.getAttribute('data-choice-label')||good.getAttribute('data-label')||textOf(good.querySelector('.k')))||'';
              button.disabled=true;button.textContent='Enregistrement…';pending.set(requestId,button);
              parent.postMessage({type:'econcourse-save-course-mistake',requestId:requestId,sourceType:sourceType,mistake:{questionId:(card.getAttribute('data-question-id')||numberText||textOf(question)),questionNumber:numberText?Number(numberText):null,questionText:textOf(question)||textOf(head),selectedChoiceLabel:selectedLabel,selectedChoiceText:textOf(wrong&&wrong.querySelector('.v'))||textOf(wrong)||textOf(note),correctChoiceLabel:correctLabel,correctChoiceText:textOf(good&&good.querySelector('.v'))||textOf(good),explanation:textOf(expl)}},'*');
            });card.appendChild(button);
          })};
          window.addEventListener('message',function(event){var data=event.data||{};if(data.type!=='econcourse-course-save-ack')return;var button=pending.get(data.requestId);if(!button)return;pending.delete(data.requestId);button.textContent=data.success?'Erreur sauvegardée':(data.message||'Réessayer la sauvegarde');button.disabled=!!data.success;});
          var start=function(){scan();if(document.body)new MutationObserver(scan).observe(document.body,{childList:true,subtree:true})};
          if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
        })()</script>`;
        let html = String(data || '');
        if (/<head[^>]*>/i.test(html)) html = html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
        else html = `${base}${html}`;
        if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${resizeScript}</body>`);
        else html += resizeScript;
        const bodyClose = html.toLowerCase().lastIndexOf('</body>');
        if (bodyClose >= 0) html = `${html.slice(0, bodyClose)}${courseMistakeBridgeScript}${html.slice(bodyClose)}`;
        else html += courseMistakeBridgeScript;
        setCourseHtml(html);
      })
      .catch(() => { if (!cancelled) setCourseHtml(''); })
      .finally(() => { if (!cancelled) setIframeLoading(false); });
    return () => { cancelled = true; };
  }, [activeCours?.htmlUrl]);

  useEffect(() => {
    const handleCourseFrameMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'course-html-height') {
        const height = Number(event.data.height);
        if (Number.isFinite(height) && height > 0) setCourseFrameHeight(Math.min(Math.max(height, 320), 100000));
        return;
      }
      if (event.data?.type !== 'econcourse-save-course-mistake' || !event.data?.mistake || !activeCours?.id) return;
      const sourceType = event.data.sourceType === 'Exercice' || /exercice/i.test(`${activeCours.titre || ''} ${activeCours.type || ''}`) ? 'Exercice' : 'Cours';
      saveStudentMistakesManually({
        sourceType,
        resourceId: String(activeCours.id),
        resourceTitle: activeCours.titre || selectedChapitre || 'Cours',
        subject: activeCours.matiere || selectedMatiere?.nom || '',
        chapter: activeCours.chapitre || selectedChapitre || '',
        year: activeCours.annee || activeCours.year || null,
        mistakes: [{ ...event.data.mistake, sourceType }]
      }).then(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'econcourse-course-save-ack', requestId: event.data.requestId, success: true }, '*');
      }).catch((saveError) => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'econcourse-course-save-ack', requestId: event.data.requestId, success: false, message: saveError.message || 'Sauvegarde impossible' }, '*');
      });
    };
    window.addEventListener('message', handleCourseFrameMessage);
    return () => window.removeEventListener('message', handleCourseFrameMessage);
  }, [activeCours, selectedChapitre, selectedMatiere]);

  useEffect(() => {
    const stage = activeCours ? 'cours' : (step === 'cours' ? 'chapitres' : (selectedMatiere ? 'chapitres' : 'matieres'));
    window.dispatchEvent(new CustomEvent('client-mascot-stage', { detail: { stage } }));
  }, [step, selectedMatiere, activeCours]);

  // Réaction au changement de filière dans l'URL
  useEffect(() => {
    const f = searchParams.get('filiere');
    if (f) {
      setSelectedFiliere(f);
      setSelectedChapitre(null);
      setActiveCours(null);
    }
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

  useEffect(() => {
    let isMounted = true;
    fetchStudentActivityCompletionMap()
      .then((statuses) => { if (isMounted) setCompletionStatuses(statuses); })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  /* ─── Helpers d'URL ─── */
  const getFullUrl = (url) => {
    if (!url) return '';
    const normalizedUrl = toBackendResourceUrl(url);
    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) return normalizedUrl;
    return `/${normalizedUrl.startsWith('/') ? normalizedUrl.substring(1) : normalizedUrl}`;
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
    setIsSidebarCollapsed(false);
    setStep('matieres');
    setSelectedMatiere(null);
    setSelectedChapitre(null);
    setActiveCours(null);
    setSearchQuery('');
  };

  const goChapitres = (mat) => {
    setIsSidebarCollapsed(false);
    setSelectedMatiere(mat);
    setSelectedChapitre(null);
    setActiveCours(null);
    setSearchQuery('');
    setStep('matieres');
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
    setIsCoursMenuOpen(false);
    setIsSidebarCollapsed(true);
    setSelectedChapitre(chapNom);
    const list = coursForChapitre(selectedMatiere, chapNom);
    if (specificCours) {
      setActiveCours(specificCours);
      setStep('chapitres');
      recordStudentActivity({
        type: 'Cours',
        resourceId: specificCours.id,
        title: specificCours.titre || `Cours — ${chapNom}`,
        subject: specificCours.matiere || selectedMatiere?.nom,
        chapter: specificCours.chapitre || chapNom
      });
    } else if (list.length > 0) {
      setActiveCours(list[0]);
      setStep('chapitres');
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
      setStep('chapitres');
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
    position: 'relative',
    width: '100%',
    minHeight: '100%',
    backgroundColor: 'var(--bg, #f3f6fb)',
    overflowY: 'visible',
    padding: activeCours ? '12px 20px 20px' : '28px 32px 48px',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    color: 'var(--text, #0f172a)'
  };

  return (
    <div style={pageStyle}>

      {step === 'matieres' && selectedFiliere && (
        <div style={{ width: '100%', maxWidth: 'none', margin: '0 auto', minHeight: 'calc(100vh - 140px)' }}>
          <style>{`
            .client-course-subject-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
            @media (max-width: 1450px) { .client-course-subject-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
            @media (max-width: 1100px) { .client-course-subject-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
            @media (max-width: 760px) { .client-course-subject-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (max-width: 480px) { .client-course-subject-grid { grid-template-columns: minmax(0, 1fr); } }
          `}</style>
          <aside style={{ width: 'calc(100% - min(6cm, 12vw))', marginInline: 'auto', background: 'transparent', border: 'none', borderRadius: 0, padding: 0, boxShadow: 'none', boxSizing: 'border-box' }}>
            <h2 style={{ margin: '2px 4px 10px', fontSize: '15px', color: '#1e3a8a' }}>Mati&egrave;res</h2>
            {loading ? <div style={{ padding: '16px 6px', color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>Chargement des mati&egrave;res...</div> : error ? <div style={{ padding: '16px 6px', color: '#dc2626', fontSize: '13px' }}>{error}</div> : <div className="client-course-subject-grid" style={{ display: 'grid', alignItems: 'start', gap: '10px' }}>
              {matieresWithCount.map((matiere) => {
                const active = selectedMatiere?.id === matiere.id;
                const expanded = active;
                const adminChapitres = chapitresForMatiere(matiere).filter(chapitre => chapitre.count > 0);
                const filteredChapitres = adminChapitres.filter(chapitre => chapitre.nom.toLowerCase().includes(searchQuery.trim().toLowerCase()));
                return <div key={matiere.id}>
                  <button type="button" onClick={() => expanded ? goMatieres() : goChapitres(matiere)} aria-expanded={expanded} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 11px', border: '1px solid', borderColor: expanded ? '#93c5fd' : active ? '#bfdbfe' : '#e2e8f0', borderRadius: '10px', background: expanded || active ? '#eff6ff' : '#ffffff', color: expanded || active ? '#1d4ed8' : '#334155', textAlign: 'left', fontWeight: 750, fontSize: '12px', cursor: 'pointer' }}>
                    <span>{matiere.nom}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #64748b)', fontWeight: 600 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }} aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                    </span>
                  </button>
                  {expanded && <div style={{ margin: '6px 0 5px', padding: '7px 0 8px 10px', borderLeft: `2px solid ${matiere.color || '#93c5fd'}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {filteredChapitres.map((chapitre) => <button key={chapitre.nom} type="button" onClick={() => openReader(chapitre.nom)} style={{ width: '100%', padding: '9px 10px', border: '1px solid', borderColor: selectedChapitre === chapitre.nom ? matiere.color : '#e2e8f0', borderRadius: '9px', background: selectedChapitre === chapitre.nom ? matiere.lightBg : '#ffffff', color: selectedChapitre === chapitre.nom ? matiere.badgeColor : '#334155', textAlign: 'left', fontWeight: 650, fontSize: '12px', cursor: 'pointer' }}><span>{chapitre.nom}</span><span style={{ display: 'block', marginTop: '4px', color: 'var(--text-secondary, #64748b)', fontSize: '10px', fontWeight: 500 }}>{chapitre.count} cours</span></button>)}
                    </div>
                  </div>}
                </div>;
              })}
            </div>}
          </aside>
        </div>
      )}
      {step === 'chapitres' && selectedMatiere && (
        <div style={{ width: '100%', maxWidth: 'none', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '12px', minHeight: 'calc(100vh - 140px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: 0, background: 'transparent', border: 0, borderRadius: 0, boxShadow: 'none', position: 'sticky', top: 0, zIndex: 40 }}>
            <button type="button" aria-label={isSidebarCollapsed ? 'Rouvrir le menu des matières et chapitres' : 'Réduire le menu des matières et chapitres'} title={isSidebarCollapsed ? 'Ouvrir le menu' : 'Réduire le menu'} onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)} style={{ width: '46px', height: '48px', display: 'grid', placeItems: 'center', flex: '0 0 auto', border: '1px solid #0B3675', borderRadius: '12px', background: '#0B3675', color: '#ffffff', cursor: 'pointer', boxShadow: '0 3px 10px rgba(15, 59, 104, 0.22)' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {activeCours && activeCours.id !== 'placeholder' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={activeCourseCompleted || completingActivityKey === activeCourseStatusKey}
                  onClick={(event) => handleCompleteCourse(event, activeCours)}
                  style={{ padding: '10px 14px', border: 0, borderRadius: '10px', background: activeCourseCompleted ? '#16a34a' : '#2563eb', color: '#fff', fontSize: '12px', fontWeight: 750, whiteSpace: 'nowrap', cursor: activeCourseCompleted ? 'default' : 'pointer', opacity: completingActivityKey === activeCourseStatusKey ? 0.7 : 1 }}
                >
                  {activeCourseCompleted ? '✓ Terminé' : completingActivityKey === activeCourseStatusKey ? 'Enregistrement…' : 'Terminer'}
                </button>
              </div>
            )}
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: '18px', minHeight: 'calc(100vh - 140px)' }}>
          {!isSidebarCollapsed && (
          <aside style={{ flex: '0 0 290px', maxWidth: '32vw', minWidth: '240px', maxHeight: 'calc(100vh - 164px)', overflowY: 'auto', background: 'var(--surface, #ffffff)', border: '1px solid var(--border, #dbeafe)', borderRadius: '16px', padding: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', position: 'sticky', top: '12px' }}>
            <h2 style={{ margin: '2px 4px 10px', fontSize: '15px', color: '#1e3a8a' }}>Mati&egrave;res</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
              {matieresWithCount.map((matiere) => {
                const active = selectedMatiere.id === matiere.id;
                return <button key={matiere.id} type="button" onClick={() => goChapitres(matiere)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '9px 10px', border: '1px solid', borderColor: active ? '#93c5fd' : '#e2e8f0', borderRadius: '9px', background: active ? '#eff6ff' : '#ffffff', color: active ? '#1d4ed8' : '#334155', textAlign: 'left', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}><span>{matiere.nom}</span><span style={{ color: 'var(--text-secondary, #64748b)', fontWeight: 600 }}>{matiere.count}</span></button>;
              })}
            </div>
            <h2 style={{ margin: '2px 4px 10px', fontSize: '15px', color: '#1e3a8a' }}>Chapitres</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {chapitresForMatiere(selectedMatiere).filter(chapitre => chapitre.count > 0).map((chapitre) => {
                const active = selectedChapitre === chapitre.nom;
                return <button key={chapitre.nom} type="button" onClick={() => openReader(chapitre.nom)} style={{ width: '100%', padding: '10px 11px', border: '1px solid', borderColor: active ? selectedMatiere.color : '#e2e8f0', borderRadius: '10px', background: active ? selectedMatiere.lightBg : '#ffffff', color: active ? selectedMatiere.badgeColor : '#334155', textAlign: 'left', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}><span>{chapitre.nom}</span><span style={{ display: 'block', marginTop: '4px', color: 'var(--text-secondary, #64748b)', fontSize: '11px', fontWeight: 500 }}>{chapitre.count} cours</span></button>;
              })}
            </div>
          </aside>
          )}
          <main style={{ flex: isSidebarCollapsed ? '1 1 auto' : '1 1 620px', width: isSidebarCollapsed ? '100%' : undefined, minWidth: isSidebarCollapsed ? 0 : 'min(100%, 320px)' }}>
            {activeCours ? (
              <div style={{ position: 'relative', width: '100%' }}>
                <div className="course-reader-header" style={{ position: 'absolute', zIndex: 20, top: '8px', left: '8px', right: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', padding: 0, borderRadius: 0, background: 'transparent', boxShadow: 'none' }}>
                  <div>
                    <div style={{ color: selectedMatiere.badgeColor, fontSize: '11px', fontWeight: 800 }}>{selectedMatiere.nom}{selectedFiliere ? ` · ${selectedFiliere}` : ''}</div>
                    <div style={{ color: 'var(--text, #1e293b)', fontSize: '16px', fontWeight: 750, marginTop: '3px' }}>{activeCours.titre || selectedChapitre}</div>
                  </div>
                  {coursForChapitre(selectedMatiere, selectedChapitre).length > 1 && <div style={{ position: 'relative' }}>
                    <button type="button" aria-label="Changer de cours" aria-haspopup="menu" aria-expanded={isCoursMenuOpen} onClick={() => setIsCoursMenuOpen(open => !open)} style={{ width: '34px', height: '34px', display: 'grid', placeItems: 'center', border: '1px solid var(--border, #cbd5e1)', borderRadius: '9px', background: 'var(--surface, #ffffff)', color: 'var(--text, #334155)', cursor: 'pointer' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
                    </button>
                    {isCoursMenuOpen && <div role="menu" style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 6px)', right: 0, minWidth: '220px', maxWidth: 'min(320px, 80vw)', padding: '6px', background: 'var(--surface, #ffffff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)' }}>
                      {coursForChapitre(selectedMatiere, selectedChapitre).map((cours, index) => <button key={cours.id || index} type="button" role="menuitem" onClick={() => openReader(selectedChapitre, cours)} style={{ width: '100%', display: 'block', padding: '9px 10px', border: 0, borderRadius: '7px', background: String(activeCours.id) === String(cours.id) ? '#eff6ff' : '#ffffff', color: String(activeCours.id) === String(cours.id) ? '#1d4ed8' : '#334155', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>{cours.titre || `Cours ${index + 1}`}</button>)}
                    </div>}
                  </div>}

                </div>
                {completionErrorKey && completionErrorKey === activeCourseStatusKey && <span role="alert" style={{ position: 'absolute', zIndex: 21, top: '52px', right: '8px', color: '#b91c1c', fontSize: '11px' }}>Enregistrement impossible. Réessayez.</span>}
                {activeCours.htmlUrl ? <iframe ref={iframeRef} key={activeCours.id || activeCours.htmlUrl} srcDoc={courseHtml} title={activeCours.titre || selectedChapitre} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" scrolling="no" style={{ width: '100%', height: `${courseFrameHeight}px`, border: 'none', display: 'block', background: 'var(--surface, #ffffff)', overflow: 'hidden' }} /> : <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '36px', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>L’administrateur n’a pas encore ajouté de cours HTML pour ce chapitre.</div>}
              </div>
            ) : (
              <div style={{ minHeight: '260px', background: 'var(--surface, #ffffff)', border: '1px dashed #cbd5e1', borderRadius: '16px', display: 'grid', placeItems: 'center', padding: '32px', color: 'var(--text-secondary, #64748b)', textAlign: 'center', fontSize: '14px' }}>Choisissez un chapitre dans le menu de gauche pour afficher son cours.</div>
            )}
          </main>
          </div>
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
            <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>/</span>
            <button
              onClick={() => goChapitres(selectedMatiere)}
              style={{
                background: 'none', border: 'none', color: '#2563eb',
                cursor: 'pointer', fontWeight: 700, padding: 0
              }}
            >
              {selectedMatiere.nom}
            </button>
            <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>/</span>
            <span style={{ color: 'var(--text, #0f172a)', fontWeight: 800 }}>{selectedChapitre}</span>
          </div>

          {/* Header section cours */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '26px', flexWrap: 'wrap', gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px' }}>📖</span>
                <h1 style={{ margin: 0, fontSize: '27px', fontWeight: 900, color: 'var(--text, #0f172a)' }}>
                  Cours — {selectedChapitre}
                </h1>
              </div>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: '14.5px' }}>
                Matière : <strong style={{ color: 'var(--text, #1e293b)' }}>{selectedMatiere.nom}</strong>
              </p>
            </div>

            <button
              onClick={() => goChapitres(selectedMatiere)}
              style={{
                background: 'var(--surface, #fff)', border: '1.5px solid #cbd5e1',
                padding: '9px 18px', borderRadius: '12px',
                cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: 'var(--text, #334155)',
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
                  background: 'var(--surface, #ffffff)', borderRadius: '24px', border: '1.5px dashed #cbd5e1',
                  padding: '60px 30px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '46px', marginBottom: '12px' }}>📂</div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                    Aucun cours spécifique en base pour ce chapitre
                  </h3>
                  <p style={{ margin: '0 0 20px', color: 'var(--text-secondary, #64748b)', fontSize: '14.5px' }}>
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
                      background: 'var(--surface, #ffffff)',
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
                            <span style={{ background: 'var(--surface-2, #eff6ff)', color: '#1d4ed8', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                              🎓 {coursItem.filiere}
                            </span>
                          )}
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            ● Cours HTML
                          </span>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                          {coursItem.titre || `Cours #${coursItem.id}`}
                        </h2>
                      </div>
                    </div>

                    {(() => {
                      const statusKey = getStudentActivityStatusKey('Cours', coursItem.id);
                      const isCompleted = completionStatuses[statusKey] === true;
                      return <>
                        <span style={{ padding: '5px 10px', borderRadius: '999px', background: isCompleted ? '#dcfce7' : '#fef3c7', color: isCompleted ? '#15803d' : '#92400e', fontSize: '11px', fontWeight: 750, whiteSpace: 'nowrap' }}>
                          {isCompleted ? 'Terminé' : 'En cours'}
                        </span>
                        <button
                          type="button"
                          disabled={isCompleted || completingActivityKey === statusKey || !coursItem.id}
                          onClick={(event) => handleCompleteCourse(event, coursItem)}
                          style={{ padding: '10px 14px', border: '1px solid', borderColor: isCompleted ? '#16a34a' : '#2563eb', borderRadius: '14px', background: isCompleted ? '#16a34a' : '#fff', color: isCompleted ? '#fff' : '#1d4ed8', fontSize: '12px', fontWeight: 750, cursor: isCompleted ? 'default' : 'pointer' }}
                        >
                          {isCompleted ? '✓ Terminé' : completingActivityKey === statusKey ? 'Enregistrement…' : 'Terminer'}
                        </button>
                        {completionErrorKey === statusKey && <span role="alert" style={{ color: '#b91c1c', fontSize: '11px' }}>Enregistrement impossible. Réessayez.</span>}
                      </>;
                    })()}
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
          position: 'relative',
          width: '100%',
          minHeight: 'calc(100vh - 76px)',
          backgroundColor: 'var(--bg, #f8fafc)',
          display: 'flex',
          overflow: 'visible',
          margin: 0,
          padding: '20px 16px',
          boxSizing: 'border-box'
        }}>
          <div style={{ width: '100%', minHeight: 'calc(100vh - 116px)', background: 'var(--surface-2, #f1f5f9)', display: 'flex', alignItems: 'flex-start', gap: '18px', padding: '0', boxSizing: 'border-box' }}>
            <aside style={{ flex: '0 1 280px', minWidth: '250px', maxHeight: 'calc(100vh - 118px)', overflowY: 'auto', background: 'var(--surface, #ffffff)', border: '1px solid var(--border, #dbeafe)', borderRadius: '16px', padding: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', position: 'sticky', top: '12px' }}>
              <h2 style={{ margin: '2px 4px 12px', fontSize: '15px', color: '#1e3a8a' }}>Chapitres et cours</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {chapitresForMatiere(selectedMatiere).filter(chapitre => chapitre.count > 0).map((chapitre) => {
                  const cours = coursForChapitre(selectedMatiere, chapitre.nom);
                  const isActive = selectedChapitre === chapitre.nom;
                  return <div key={chapitre.nom}>
                    <button type="button" onClick={() => openReader(chapitre.nom)} style={{ width: '100%', padding: '10px 11px', border: '1px solid', borderColor: isActive ? '#93c5fd' : '#e2e8f0', borderRadius: '10px', background: isActive ? '#eff6ff' : '#ffffff', color: isActive ? '#1d4ed8' : '#334155', textAlign: 'left', fontWeight: 750, fontSize: '12px', cursor: 'pointer' }}>{chapitre.nom}</button>
                    {isActive && cours.length > 1 && <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', margin: '6px 0 2px 10px', paddingLeft: '10px', borderLeft: '2px solid #bfdbfe' }}>
                      {cours.map((coursItem, index) => <button key={coursItem.id || index} type="button" onClick={() => openReader(chapitre.nom, coursItem)} style={{ padding: '8px 9px', border: 0, borderRadius: '8px', background: String(activeCours.id) === String(coursItem.id) ? '#2563eb' : 'transparent', color: String(activeCours.id) === String(coursItem.id) ? '#ffffff' : '#475569', textAlign: 'left', fontSize: '12px', fontWeight: 650, cursor: 'pointer' }}>{coursItem.titre || `Cours ${index + 1}`}</button>)}
                    </div>}
                  </div>;
                })}
              </div>
            </aside>
            <div style={{ flex: '1 1 620px', minWidth: 'min(100%, 320px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '14px' }}>
                <button type="button" onClick={() => { setStep('chapitres'); setActiveCours(null); setSelectedChapitre(null); }} style={{ background: 'var(--surface-2, #f1f5f9)', border: '1px solid var(--border, #cbd5e1)', color: 'var(--text, #1e293b)', padding: '8px 12px', borderRadius: '9px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>← Retour</button>
              </div>
              {activeCours.htmlUrl ? <div style={{ background: 'var(--surface, #ffffff)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid var(--border, #e2e8f0)' }}>
                <iframe ref={iframeRef} srcDoc={courseHtml} title={activeCours.titre || activeCours.chapitre} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" scrolling="no" style={{ width: '100%', height: `${courseFrameHeight}px`, border: 'none', display: 'block', backgroundColor: 'var(--surface, #ffffff)', overflow: 'hidden' }} />
              </div> : <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface, #ffffff)', borderRadius: '16px', border: '1px dashed #cbd5e1', padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>📄</div><h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text, #0f172a)', margin: '0 0 8px' }}>Aucun fichier HTML rattaché</h2><p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '14.5px', maxWidth: '480px', margin: 0 }}>L'administrateur n'a pas encore ajouté de fichier HTML pour ce cours.</p>
              </div>}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
