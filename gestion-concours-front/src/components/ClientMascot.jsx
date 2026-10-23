import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './ClientMascot.css';

const TIPS = {
  dashboard: [
    ['Ton espace de révision', 'Choisis une matière pour reprendre là où tu en es. Une petite séance régulière vaut mieux qu’une longue révision de dernière minute.'],
    ['Un conseil pour avancer', 'Alterne cours, exercices et sujets d’examen : tu retiendras mieux en appliquant ce que tu viens de revoir.']
  ],
  cours: {
    matieres: ['Choisis ta filière', 'Sélectionne ta filière pour afficher les cours adaptés à ton programme.'],
    chapitres: ['À toi de choisir un chapitre', 'Parcours les chapitres et repère ceux qui te semblent moins familiers pour commencer.'],
    cours: ['Place à la pratique', 'Lis le cours à ton rythme. Note les formules et idées clés, puis essaie de les reformuler sans regarder.'],
    default: ['Révise à ton rythme', 'Commence par les notions essentielles, puis vérifie ta compréhension avec des exercices.']
  },
  resumes: {
    matieres: ['Choisis une matière', 'Les résumés t’aident à revoir l’essentiel. Essaie de restituer les points clés de mémoire après lecture.'],
    chapitres: ['Un chapitre à la fois', 'Repère les notions importantes, puis ferme le résumé et explique-les avec tes propres mots.'],
    reader: ['Garde le cap', 'Fais une courte pause après chaque partie et note les notions à revoir plus tard.'],
    default: ['Révise l’essentiel', 'Un résumé est un bon point de départ : complète-le avec des exercices pour ancrer les notions.']
  },
  examens: [
    ['Entraîne-toi en conditions réelles', 'Choisis une filière et une matière, puis tente le sujet avant d’ouvrir sa correction.'],
    ['Astuce de méthode', 'Chronomètre-toi et garde quelques minutes à la fin pour relire tes réponses.']
  ],
  examensSujet: ['Commence par le sujet', 'Essaie de résoudre les questions sans aide. Note celles qui te prennent du temps, puis compare ta méthode à la correction.'],
  examensCorrection: ['Apprends de la correction', 'Repère l’étape qui t’a manqué et reformule le raisonnement avec tes propres mots.'],
  concours: [
    ['Prépare ton concours', 'Choisis une école, puis explore les matières et les années disponibles pour repérer les thèmes récurrents.'],
    ['Après chaque sujet', 'Compare ta démarche à la correction et note une leçon concrète à retenir pour le prochain entraînement.']
  ],
  concoursEcoles: ['Choisis une école', 'Tu peux comparer les épreuves proposées et choisir un concours qui correspond à ton objectif.'],
  concoursMatieres: ['Repère les matières', 'Choisis une matière pour parcourir les sujets et les années disponibles.'],
  concoursAnnees: ['Observe les sujets des années précédentes', 'Repère les thèmes qui reviennent, puis entraîne-toi sur une épreuve complète.'],
  concoursSujet: ['À toi de jouer', 'Tente le sujet avant d’ouvrir le corrigé. Garde une trace des questions à reprendre.'],
  concoursCorrection: ['Fais le point', 'Compare chaque étape de ta réponse au corrigé et note une méthode à réutiliser.'],
  blanc: {
    matieres: ['Prêt·e pour un entraînement ?', 'Choisis une matière pour trouver les concours blancs disponibles. Installe-toi au calme avant de démarrer.'],
    chapitres: ['Choisis ton chapitre', 'Sélectionne un chapitre pour voir les QCM associés et cibler tes révisions.'],
    qcms: ['Choisis un QCM', 'Essaie de répondre sans consulter tes notes. Chaque erreur est une piste utile pour progresser.'],
    player: ['Concentre-toi sur le sujet', 'Lis bien chaque question et avance à ton rythme. Tu peux revenir sur les notions à revoir ensuite.'],
    default: ['Un entraînement à la fois', 'Prends le temps de comprendre tes réponses : c’est ainsi que tu transformes un entraînement en progrès.']
  },
  erreurs: [
    ['Tes erreurs sont des repères', 'Reprends chaque erreur et écris la règle ou le raisonnement qui t’aidera à l’éviter la prochaine fois.'],
    ['Tu progresses déjà', 'Revoir une erreur après quelques jours aide à vérifier que la méthode est bien acquise.']
  ],
  calendrier: [
    ['Organise tes révisions', 'Note les dates importantes et prévois plusieurs séances courtes avant chaque concours.'],
    ['Garde une marge', 'Prévois un peu de temps libre dans ton planning pour les imprévus et les révisions à reprendre.']
  ],
  profil: [
    ['Ton profil', 'Vérifie tes informations pour garder ton espace à jour. Bonne préparation !']
  ],
  default: [
    ['Je t’accompagne', 'Besoin d’un repère ? Je suis là pour t’aider à avancer étape par étape.']
  ]
};

function getGuide(location, stage, context) {
  const params = new URLSearchParams(location.search);
  const selected = params.get('matiere') || params.get('filiere') || params.get('ecole');
  const names = {
    '/client-dashboard': 'Mon espace',
    '/client-cours': 'Cours Bac',
    '/client-resumes': 'Résumés',
    '/client-examens': 'Examens nationaux',
    '/client-concours': 'Concours',
    '/client-concours-blanc': 'Concours blanc',
    '/client-erreurs': 'Révision des erreurs',
    '/client-calendrier': 'Calendrier des concours',
    '/client-profile': 'Mon profil'
  };
  const path = location.pathname;
  let group = TIPS.default;
  let page = names[path] || 'Mon espace';

  if (path === '/client-cours') {
    const currentStage = stage || 'matieres';
    group = TIPS.cours[currentStage] ? [TIPS.cours[currentStage]] : [TIPS.cours.default];
  } else if (path === '/client-resumes') {
    const currentStage = stage || (params.get('matiere') ? 'chapitres' : 'matieres');
    group = TIPS.resumes[currentStage] ? [TIPS.resumes[currentStage]] : [TIPS.resumes.default];
  } else if (path === '/client-concours-blanc') {
    const currentStage = stage || (params.get('matiere') ? 'player' : 'matieres');
    group = TIPS.blanc[currentStage] ? [TIPS.blanc[currentStage]] : [TIPS.blanc.default];
  } else if (path === '/client-examens') {
    group = stage === 'correction' ? [TIPS.examensCorrection] : (stage === 'sujet' ? [TIPS.examensSujet] : TIPS.examens);
  } else if (path === '/client-concours') {
    const concoursTips = {
      ecoles: TIPS.concoursEcoles,
      matieres: TIPS.concoursMatieres,
      annees: TIPS.concoursAnnees,
      sujet: TIPS.concoursSujet,
      correction: TIPS.concoursCorrection
    };
    group = concoursTips[stage] ? [concoursTips[stage]] : TIPS.concours;
  } else if (path === '/client-erreurs') {
    group = TIPS.erreurs;
  } else if (path === '/client-calendrier') {
    group = TIPS.calendrier;
  } else if (path === '/client-profile') {
    group = TIPS.profil;
  } else if (path === '/client-dashboard') {
    group = TIPS.dashboard;
  }

  if (context || selected) page = `${page} · ${context || selected}`;
  return { page, tips: group };
}

function MascotIllustration() {
  return (
    <svg className="client-mascot__art" viewBox="0 0 96 96" role="img" aria-label="Nora, ta mascotte de révision">
      <ellipse cx="48" cy="85" rx="27" ry="5" fill="#dce9fb" />
      <path d="M22 42c0-18 11-29 27-29 15 0 26 11 26 29v15c0 16-11 26-27 26S22 73 22 57V42Z" fill="#f6c98f" />
      <path d="M22 44c-3-20 8-34 27-34 17 0 29 12 28 32-6-3-11-9-13-17-8 8-22 13-42 12Z" fill="#334e7e" />
      <path d="M27 37c2-15 10-22 22-22 13 0 21 8 23 20-7-4-12-9-14-15-8 9-19 14-31 17Z" fill="#456395" />
      <path d="M32 52c0-2 2-4 4-4s4 2 4 4-2 3-4 3-4-1-4-3Zm24 0c0-2 2-4 4-4s4 2 4 4-2 3-4 3-4-1-4-3Z" fill="#263750" />
      <path d="M43 63c3 3 8 3 11 0" fill="none" stroke="#bd755f" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="29" cy="62" r="5" fill="#ee9f94" opacity=".72" />
      <circle cx="68" cy="62" r="5" fill="#ee9f94" opacity=".72" />
      <path d="M29 78c5-6 11-9 19-9s15 3 20 9l-3 9H32l-3-9Z" fill="#3974d8" />
      <path d="m44 71 4 6 5-6" fill="#fff" />
      <path d="m70 22 2.2 4.7 5.1.7-3.7 3.6.9 5.1-4.5-2.4-4.6 2.4.9-5.1-3.7-3.6 5.1-.7L70 22Z" fill="#f6c85f" />
    </svg>
  );
}

export default function ClientMascot() {
  const location = useLocation();
  const [guideState, setGuideState] = useState({ stage: '', context: '' });
  const [isOpen, setIsOpen] = useState(() => sessionStorage.getItem('client-mascot-hidden') !== 'true');
  const [tipIndex, setTipIndex] = useState(0);
  const { page, tips } = useMemo(() => getGuide(location, guideState.stage, guideState.context), [location, guideState]);
  const tip = tips[tipIndex % tips.length];

  useEffect(() => {
    const onStageChange = (event) => {
      setGuideState({ stage: event.detail?.stage || '', context: event.detail?.context || '' });
      setTipIndex(0);
    };
    window.addEventListener('client-mascot-stage', onStageChange);
    return () => window.removeEventListener('client-mascot-stage', onStageChange);
  }, []);

  useEffect(() => {
    setTipIndex(0);
    setGuideState({ stage: '', context: '' });
  }, [location.pathname, location.search]);

  const toggle = () => {
    setIsOpen((open) => {
      sessionStorage.setItem('client-mascot-hidden', String(open));
      return !open;
    });
  };

  return (
    <aside className={`client-mascot ${isOpen ? 'is-open' : 'is-closed'}`} aria-label="Guide de révision">
      {isOpen ? (
        <div className="client-mascot__card">
          <div className="client-mascot__speech" aria-live="polite" key={`${page}-${tip[0]}`}>
            <div className="client-mascot__eyebrow">Nora · {page}</div>
            <strong>{tip[0]}</strong>
            <p>{tip[1]}</p>
            <div className="client-mascot__actions">
              {tips.length > 1 && <button type="button" onClick={() => setTipIndex((index) => (index + 1) % tips.length)}>Une autre astuce <span aria-hidden="true">↗</span></button>}
              <button className="client-mascot__minimize" type="button" onClick={toggle} aria-label="Réduire la mascotte">Réduire</button>
            </div>
          </div>
          <div className="client-mascot__character"><MascotIllustration /></div>
        </div>
      ) : (
        <button className="client-mascot__launcher" type="button" onClick={toggle} aria-label="Afficher les conseils de Nora">
          <MascotIllustration />
          <span>Nora</span>
        </button>
      )}
    </aside>
  );
}
