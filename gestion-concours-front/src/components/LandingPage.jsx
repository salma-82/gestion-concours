import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import medcineImg from '../assets/MEDCINE.jpg';
import ensaImg from '../assets/ENSA.jpg';
import ensaMarocImg from '../assets/ENSA Maroc.png';
import ensamImg from '../assets/ENSAM.jpg';
import encgImg from '../assets/ENCG.jpeg';
import logoEncgImg from '../assets/logo-encg.png';
import logoEnsaMarocImg from '../assets/logo-ensa-maroc.jpg';
import logoEnsamiImg from '../assets/logo-ensam-umi-transparent.png';
import logoFmpcImg from '../assets/logo-fmpc.png';
import navLogoImg from '../assets/logo-navbar-transparent.png';
import navMascotImg from '../assets/logo-mascot.png';
import './LandingPage.css';
import ThemeToggle from './ThemeToggle';

gsap.registerPlugin(ScrollTrigger);

// ─── 3D Orbit Carousel Configuration ─────────────────────────────────────────
const ORBIT_CONFIG = {
  cardCount: 10,
  cycleDurationSec: 32,
  maxScale: 1.18,
  minScale: 0.62,
  maxBlurPx: 5,
  minOpacity: 0.4,
  verticalOffsetPx: -30,
};

const bottomCtaLogos = [
  { src: logoEnsaMarocImg, name: 'ENSA', alt: 'Logo ENSA Maroc' },
  { src: logoEnsamiImg, name: 'ENSAM', alt: 'Logo ENSAM' },
  { src: logoEncgImg, name: 'ENCG', alt: 'Logo ENCG' },
  { src: logoFmpcImg, name: 'Médecine', alt: 'Logo de la Faculté de médecine et de pharmacie' },
];

const CARDS_DATA = [
  { name: 'ENSA', url: ensaImg, desc: 'Écoles Nationales des Sciences Appliquées' },
  { name: 'Médecine', url: medcineImg, desc: 'Facultés de Médecine et de Pharmacie' },
  { name: 'ENSAM', url: ensamImg, desc: 'Arts et Métiers' },
  { name: 'ENCG', url: encgImg, desc: 'Commerce et Gestion' },
  { name: 'ENSA Maroc', url: ensaMarocImg, desc: 'Réseau ENSA Maroc' },
  { name: 'Médecine', url: medcineImg, desc: 'Facultés de Médecine et de Pharmacie' },
  { name: 'ENSAM', url: ensamImg, desc: 'Arts et Métiers' },
  { name: 'ENSA', url: ensaImg, desc: 'Sciences Appliquées' },
  { name: 'ENCG', url: encgImg, desc: 'Commerce et Gestion' },
  { name: 'ENSA Maroc', url: ensaMarocImg, desc: 'Réseau ENSA Maroc' },
];

const partnerLogos = [
  { src: logoEnsaMarocImg, alt: 'ENSA Maroc' },
  { src: logoEnsamiImg, alt: 'ENSAM' },
  { src: logoFmpcImg, alt: 'Faculté de médecine et de pharmacie' },
  { src: logoEncgImg, alt: 'ENCG' },
];

const FEATURE_SHOWCASE_ITEMS = [
  {
    id: 'dashboard',
    icon: '📊',
    title: 'Dashboard de progression',
    description: 'Analyse tes résultats et suis ton évolution au fil des révisions.',
  },
  {
    id: 'calendar',
    icon: '📅',
    title: 'Calendrier personnalisé',
    description: 'Organise tes séances et tes objectifs de révision sur mesure.',
  },
  {
    id: 'training',
    icon: '🎯',
    title: 'Entraînement personnalisé',
    description: 'Entraîne-toi par matière, chapitre ou concours d’école ciblé.',
  },
  {
    id: 'errors',
    icon: '🔖',
    title: 'Sauvegarde des erreurs',
    description: 'Retrouve automatiquement les questions incorrectes et leurs corrections.',
  },
];

const FEATURE_ICONS = {
  profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-3.3 3.1-5.5 7-5.5s6.5 2.2 7 5.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" /></>,
  dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="4" rx="1.5" /><rect x="13.5" y="10.5" width="7" height="10" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  course: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 5.5v15M8 7h8M8 11h8" /></>,
  summary: <><path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20z" /><path d="M14 3.5V8h4M9 12h6M9 16h6" /></>,
  papers: <><path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20z" /><path d="M14 3.5V8h4m-9 5 2 2 4-4" /></>,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 1.5M9 2.5h6M12 2.5v2M18 6l1.5-1.5" /></>,
  quiz: <><path d="M5 5.5h14M5 12h14M5 18.5h14" /><path d="m2.5 5.5 1 1 2-2m-3 7.5 1 1 2-2m-3 7.5 1 1 2-2" /></>,
  save: <><path d="M5 3.5h12l2 2V20a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 20V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M8 3.5v5h7v-5M8 21v-7h8v7" /></>,
  correction: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5m-12-10 1.5 1.5 3-3" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.5" /><circle cx="12" cy="12" r="1.8" /><path d="m15.5 8.5 5-5m-4 0h4v4" /></>,
};

function FeatureIcon({ name }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{FEATURE_ICONS[name]}</svg>;
}

const HERO_DECORATION_POSITIONS = {
  nitrogen: { top: '44%', right: '4%', bottom: 'auto', left: 'auto' },
  water: { top: '73%', left: '4%', right: 'auto', bottom: 'auto' },
  flask: { top: '52%', left: '4%', right: 'auto', bottom: 'auto' },
  parabola: { top: '67%', right: '14%', bottom: 'auto', left: 'auto' },
  atom: { top: '35%', right: '14%', bottom: 'auto', left: 'auto' },
  hexagon: { top: '53%', left: '14%', right: 'auto', bottom: 'auto' },
  graphLeft: { top: '17%', left: '14%', right: 'auto', bottom: 'auto' },
  graphRight: { top: '73%', right: '14%', bottom: 'auto', left: 'auto' },
  books: { top: '8%', left: '14%', right: 'auto', bottom: 'auto' },
  mitochondrionCool: { top: '85%', right: '14%', bottom: 'auto', left: 'auto' },
  pi: { top: '33%', left: '14%', right: 'auto', bottom: 'auto' },
  cell: { top: '26%', left: '4%', right: 'auto', bottom: 'auto' },
};

function createHeroDecorationPositions() {
  const randomizePercent = (value, min, max) => {
    if (typeof value !== 'string' || !value.endsWith('%')) return value;
    const offset = (Math.random() - 0.5) * 7;
    const nextValue = Math.max(min, Math.min(max, parseFloat(value) + offset));
    return `${nextValue.toFixed(1)}%`;
  };

  return Object.fromEntries(
    Object.entries(HERO_DECORATION_POSITIONS).map(([name, position]) => [
      name,
      {
        ...position,
        top: randomizePercent(position.top, 5, 91),
        bottom: randomizePercent(position.bottom, 5, 91),
        left: randomizePercent(position.left, 3, 18),
        right: randomizePercent(position.right, 3, 18),
      },
    ]),
  );
}

export function LandingMascot({ className = '', showCap = true, wave = false, holdingNotebook = false, gaze = 'center', brandCap = false, glasses = false }) {
  const mascotId = useId().replace(/:/g, '');
  const mascotClassName = `${className}${wave ? ' lp-mascot--wave' : ''}${holdingNotebook ? ' lp-mascot--holding-notebook' : ''}`.trim();
  const pupilGazeTransform = gaze === 'left' ? 'translate(-5 -2)' : 'translate(0 0)';
  return (
    <svg
      className={mascotClassName}
      viewBox={brandCap ? '0 0 240 185' : '0 0 240 260'}
      preserveAspectRatio={brandCap ? 'xMidYMin meet' : undefined}
      role="img"
      aria-label="Mascotte hibou diplômé ECONCOURS"
    >
      <defs>
        <linearGradient id={`${mascotId}-owlBrown`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8c4b28" />
          <stop offset="60%" stopColor="#733b1e" />
          <stop offset="100%" stopColor="#572b13" />
        </linearGradient>
        <linearGradient id={`${mascotId}-owlBelly`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff8eb" />
          <stop offset="100%" stopColor="#f5e4c8" />
        </linearGradient>
        <radialGradient id={`${mascotId}-owlEye`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe033" />
          <stop offset="70%" stopColor="#ffb000" />
          <stop offset="100%" stopColor="#e68a00" />
        </radialGradient>
        <linearGradient id={`${mascotId}-bookCover`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id={`${mascotId}-softShadow`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity=".2" />
        </filter>
      </defs>
      <ellipse cx="120" cy="235" rx="55" ry="10" fill="#000" opacity=".12" />
      <g stroke="#ff7700" strokeWidth="6" strokeLinecap="round">
        <path d="m90 220-12 16m12-16v18m0-18 10 15m50-15-10 15m10-15v18m0-18 12 16" />
      </g>
      <ellipse cx="120" cy="155" rx="68" ry="72" fill={`url(#${mascotId}-owlBrown)`} />
      <ellipse cx="120" cy="165" rx="46" ry="50" fill={`url(#${mascotId}-owlBelly)`} />
      <path d="M102 150q8 6 16 0m4 0q8 6 16 0M98 168q12 7 24 0m-2 0q10 7 22 0" stroke="#d1b894" strokeWidth="3" fill="none" strokeLinecap="round" />
      {brandCap && (
        <g fill="#87502e" stroke="#4a2817" strokeWidth="3.5" strokeLinejoin="round">
          <ellipse cx="54" cy="164" rx="22" ry="14" />
          <ellipse cx="186" cy="164" rx="22" ry="14" />
          <path d="M45 156v15m9-13v17m9-16v14m123-17v15m9-13v17m9-16v14" fill="none" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}
      
      {!holdingNotebook && (
        <>
          <g className="lp-mascot-wing lp-mascot-wing-left">
            <path d="M58 135q-30 15-20 50 22 0 26-37Z" fill="#6b3519" />
          </g>
          <g className={`lp-mascot-wing lp-mascot-wing-right${wave ? ' lp-mascot-wing-right--raised' : ''}`}>
            {wave ? (
              <>
                <path d="M174 143C190 128 199 103 207 77C211 64 219 59 225 64C231 69 226 82 223 92C230 81 237 82 239 89C241 96 234 105 230 111C223 130 212 153 190 169Z" fill="#5e2e15" />
                <path d="M189 145C203 125 211 102 219 76" stroke="#87502e" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".7" />
              </>
            ) : (
              <path d="M182 135q30 15 20 50-22 0-26-37Z" fill="#5e2e15" />
            )}
          </g>
        </>
      )}

      {/* NOTEBOOK HOLDING GROUP ("ktab dyal note") */}
      {holdingNotebook && (
        <g className="lp-mascot-notebook-layer" filter={`url(#${mascotId}-softShadow)`}>
          {/* Notebook Main Group */}
          <g transform="rotate(-5 120 185)">
            {/* Blue back cover */}
            <rect x="76" y="138" width="86" height="92" rx="8" fill={`url(#${mascotId}-bookCover)`} stroke="#1e3a8a" strokeWidth="2" />
            
            {/* White paper sheet */}
            <rect x="83" y="142" width="75" height="84" rx="5" fill="#ffffff" />
            
            {/* Orange header tab */}
            <rect x="83" y="142" width="75" height="18" rx="5" fill="#ea580c" />
            <rect x="83" y="152" width="75" height="8" fill="#ea580c" />
            <text x="120" y="155" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.2">
              NOTES
            </text>

            {/* Ruled lines */}
            <g stroke="#bfdbfe" strokeWidth="1.6" strokeLinecap="round">
              <line x1="91" y1="168" x2="149" y2="168" />
              <line x1="91" y1="178" x2="149" y2="178" />
              <line x1="91" y1="188" x2="149" y2="188" />
              <line x1="91" y1="198" x2="149" y2="198" />
              <line x1="91" y1="208" x2="149" y2="208" />
              <line x1="91" y1="218" x2="140" y2="218" />
            </g>

            {/* Handwritten style notes & checkmarks */}
            <g fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800">
              <text x="93" y="176" fill="#1e3a8a" fontSize="7.5">✓ ENSA · ENSAM</text>
              <text x="93" y="186" fill="#ea580c" fontSize="7">✓ QCM + Résumés</text>
              <text x="93" y="196" fill="#059669" fontSize="7">lim f(x) = 20/20</text>
              <text x="93" y="206" fill="#4338ca" fontSize="6.5">Objectif Admis ★</text>
            </g>

            {/* Spiral binding rings along left edge */}
            <g fill="#f1f5f9" stroke="#64748b" strokeWidth="1.2">
              <rect x="73" y="146" width="9" height="3.5" rx="1.5" />
              <rect x="73" y="156" width="9" height="3.5" rx="1.5" />
              <rect x="73" y="166" width="9" height="3.5" rx="1.5" />
              <rect x="73" y="176" width="9" height="3.5" rx="1.5" />
              <rect x="73" y="186" width="9" height="3.5" rx="1.5" />
              <rect x="73" y="196" width="9" height="3.5" rx="1.5" />
              <rect x="73" y="206" width="9" height="3.5" rx="1.5" />
              <rect x="73" y="216" width="9" height="3.5" rx="1.5" />
            </g>
          </g>

          {/* Left Wing holding the notebook */}
          <path d="M52 142 C65 150 78 168 85 186 C74 195 62 188 50 166 Z" fill="#6b3519" stroke="#572b13" strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx="80" cy="182" rx="7" ry="9" fill="#733b1e" transform="rotate(-15 80 182)" />

          {/* Right Wing & Pencil */}
          <g transform="translate(162, 175) rotate(-22)">
            {/* Pencil body */}
            <rect x="-4" y="-22" width="8" height="30" rx="1" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            {/* Pencil wood tip */}
            <polygon points="-4,-22 4,-22 0,-32" fill="#fed7aa" stroke="#b45309" strokeWidth="1" />
            {/* Pencil graphite point */}
            <polygon points="-1.5,-28 1.5,-28 0,-32" fill="#1e293b" />
            {/* Pencil metal ferrule */}
            <rect x="-4" y="4" width="8" height="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
            {/* Pencil eraser */}
            <rect x="-4" y="8" width="8" height="6" rx="2" fill="#f43f5e" />
            
            {/* Right Wing clutching the pencil */}
            <ellipse cx="-2" cy="0" rx="12" ry="14" fill="#5e2e15" stroke="#451e0c" strokeWidth="1.5" />
            <circle cx="2" cy="-4" r="5" fill="#733b1e" />
          </g>
        </g>
      )}

      {/* Head and eyes */}
      <g className="lp-mascot-head">
        <ellipse cx="120" cy="95" rx="60" ry="52" fill={`url(#${mascotId}-owlBrown)`} />
        <path d="M70 55Q55 20 85 42ZM170 55q15-35-15-13Z" fill="#572b13" />
        <circle cx="94" cy="95" r="28" fill="#fff8eb" />
        <circle cx="146" cy="95" r="28" fill="#fff8eb" />
        <g className="lp-mascot-eye">
          <circle cx="94" cy="95" r="22" fill={`url(#${mascotId}-owlEye)`} stroke="#e68a00" />
          <g transform={pupilGazeTransform}>
            <circle cx="96" cy="95" r="12" fill="#140b04" />
            <circle cx="100" cy="90" r="4.5" fill="#fff" />
            <circle cx="92" cy="98" r="2" fill="#fff" />
          </g>
        </g>
        <g className="lp-mascot-eye">
          <circle cx="146" cy="95" r="22" fill={`url(#${mascotId}-owlEye)`} stroke="#e68a00" />
          <g transform={pupilGazeTransform}>
            <circle cx="144" cy="95" r="12" fill="#140b04" />
            <circle cx="148" cy="90" r="4.5" fill="#fff" />
            <circle cx="140" cy="98" r="2" fill="#fff" />
          </g>
        </g>
        {glasses && (
          <g className="lp-mascot-glasses" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="94" cy="95" r="26" stroke="#172d4f" strokeWidth="4.5" />
            <circle cx="146" cy="95" r="26" stroke="#172d4f" strokeWidth="4.5" />
            <circle cx="94" cy="95" r="22.5" stroke="#f4be57" strokeWidth="1.8" />
            <circle cx="146" cy="95" r="22.5" stroke="#f4be57" strokeWidth="1.8" />
            <path d="M120 91q-2-3-5-1m10 0q-3-2-5 1" stroke="#172d4f" strokeWidth="4" />
            <path d="m68 90-7-2m111 2 7-2" stroke="#172d4f" strokeWidth="3.2" />
          </g>
        )}
        <path d="m114 102 12 0-6 18Z" fill="#ff7700" />
        {showCap && (
          <g transform="translate(0 -18)" filter={`url(#${mascotId}-softShadow)`}>
            <rect x="94" y="42" width="52" height="18" rx="3" fill="#1e2b37" />
            <polygon points="120,20 182,38 120,56 58,38" fill="#243342" />
            <polygon points="120,20 182,38 120,41 58,38" fill="#324558" />
            <circle cx="120" cy="38" r="4" fill="#ffaa00" />
            <path d="M120 38q40 4 45 27" stroke="#ffb700" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="m161 65 8 0-2 13h-4Z" fill="#ffb700" />
          </g>
        )}
      </g>
    </svg>
  );
}

function RoadmapPreview({ step, onClick }) {
  const previewContent = {
    calendar: (
      <>
        <div className="lp-mock-calendar-head"><strong>Juin 2025</strong><span>‹　›</span></div>
        <div className="lp-mock-calendar-grid lp-mock-weekdays">{'Lu Ma Me Je Ve Sa Di'.split(' ').map((day) => <span key={day}>{day}</span>)}</div>
        <div className="lp-mock-calendar-grid">{Array.from({ length: 33 }, (_, index) => <span className={[7, 12, 18, 24, 29].includes(index) ? 'is-marked' : ''} key={index}>{index < 2 ? '' : index - 1}</span>)}</div>
        <div className="lp-mock-legend"><span>ENSA</span><span>ENSAM</span><span>Médecine</span><span>ENCG</span></div>
      </>
    ),
    course: (
      <>
        <div className="lp-mock-graph">
          <svg viewBox="0 0 320 120" aria-hidden="true"><path className="lp-mock-axis" d="M18 8v96h288" /><path className="lp-mock-curve" d="M28 20 C72 95 127 115 174 66 S254 20 300 26" /><path className="lp-mock-tangent" d="M125 88 L270 42" /><circle cx="174" cy="66" r="5" /></svg>
        </div>
        <div className="lp-mock-definition"><b>À retenir</b><span>La dérivée en un point donne le coefficient directeur de la tangente à la courbe.</span></div>
      </>
    ),
    revision: (
      <div className="lp-mock-formulas"><span>Δ = b² − 4ac</span><span>e<sup>iπ</sup> + 1 = 0</span><span>U = R × I</span></div>
    ),
    blanc: (
      <>
        <div className="lp-mock-quiz-head"><span>Question 12 / 40</span><b>⏱ 01:24</b></div>
        <div className="lp-mock-progress"><i /></div>
        <p className="lp-mock-question">Quelle est la valeur de x ?</p>
        <div className="lp-mock-options"><span>A　 2</span><span className="is-correct">B　 4 <b>✓</b></span><span>C　 6</span><span>D　 8</span></div>
      </>
    ),
    annales: (
      <div className="lp-mock-papers"><div><b>🏫　ENSA · 2024</b><strong>18/20</strong></div><div><b>🏫　ENSAM · 2023</b><strong>12/20</strong></div><div><b>🏫　Médecine · 2024</b><strong>À faire</strong></div></div>
    ),
    errors: (
      <div className="lp-mock-errors"><div className="is-wrong"><b>×</b><span>La réponse donnée est incorrecte.</span></div><div className="is-right"><b>✓</b><span>La bonne réponse est : 12.</span></div><strong className="lp-mock-retry">Refaire</strong></div>
    ),
    dashboard: (
      <>
        <div className="lp-mock-dashboard-head"><span>📊　Mon progrès</span><b>+12%</b></div>
        <div className="lp-mock-dashboard-main"><div className="lp-mock-ring"><b>78<small>%</small></b></div><div className="lp-mock-bars">{[38, 55, 43, 74, 61, 92, 80].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div>
        <div className="lp-mock-stats"><span><b>24</b>Statistiques</span><span><b>↗</b>Prévision</span><span><b>18</b>Maîtrisés</span></div>
      </>
    ),
  }[step.preview];

  return (
    <div
      className={`lp-roadmap-preview lp-preview-${step.preview}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      aria-label={`Découvrir ${step.title}`}
    >
      <div className="lp-roadmap-browserbar" aria-hidden="true">
        <span className="lp-roadmap-browser-dots"><i /><i /><i /></span>
        <span>{step.cardBadge}</span>
        <em>{step.preview === 'calendar' ? 'Juin' : step.preview === 'blanc' ? 'QCM' : 'ECONCOURS'}</em>
      </div>
      <div className={`lp-roadmap-image lp-mock-${step.preview}`} aria-hidden="true">{previewContent}</div>
    </div>
  );
}

export default function LandingPage({ onNavigateToAuth }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const heroMascotRef = useRef(null);
  const motivationMascotRef = useRef(null);
  const travelingMascotRef = useRef(null);
  const [heroDecorationPositions] = useState(createHeroDecorationPositions);

  // States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeNavSection, setActiveNavSection] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [featureShowcasePaused, setFeatureShowcasePaused] = useState(false);
  const [selectedArchiveSchool, setSelectedArchiveSchool] = useState('ENSA');
  const [selectedArchiveYear, setSelectedArchiveYear] = useState(2026);
  const archiveSchools = [
    { id: 'ENSA', title: 'Écoles nationales des sciences appliquées' },
    { id: 'ENSAM', title: 'École nationale supérieure d’arts et métiers' },
    { id: 'ENCG', title: 'Écoles nationales de commerce et de gestion' },
    { id: 'Médecine', title: 'Facultés de médecine et de pharmacie' },
  ];
  const archiveYears = Array.from({ length: 19 }, (_, index) => 2008 + index);
  const featureShowcaseHoveredRef = useRef(false);
  const featureShowcaseFocusedRef = useRef(false);
  const featureProgressGradientId = `feature-progress-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || featureShowcasePaused) return undefined;

    const timer = window.setTimeout(() => {
      setActiveFeatureIndex((currentIndex) => (currentIndex + 1) % FEATURE_SHOWCASE_ITEMS.length);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [activeFeatureIndex, featureShowcasePaused]);

  useLayoutEffect(() => {
    const traveler = travelingMascotRef.current;
    const source = heroMascotRef.current;
    const destinationContainer = motivationMascotRef.current;
    const destination = destinationContainer?.querySelector('.lp-motivation-banner-owl');
    if (!traveler || !source || !destination) return undefined;

    let frame = 0;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const updatePosition = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const sourceRect = source.getBoundingClientRect();
        const destinationRect = destination.getBoundingClientRect();
        if (!sourceRect.width || !sourceRect.height || !destinationRect.width || !destinationRect.height) return;

        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const startLeft = sourceRect.left + scrollX;
        const startTop = sourceRect.top + scrollY;
        const endLeft = destinationRect.left + scrollX;
        const endTop = destinationRect.top + scrollY;
        const endScroll = Math.max(1, endTop);
        const progress = clamp(scrollY / endScroll, 0, 1);
        const eased = progress * progress * (3 - 2 * progress);
        const width = sourceRect.width + (destinationRect.width - sourceRect.width) * eased;
        const height = sourceRect.height + (destinationRect.height - sourceRect.height) * eased;

        traveler.style.left = `${startLeft + (endLeft - startLeft) * eased - scrollX}px`;
        traveler.style.top = `${startTop + (endTop - startTop) * eased - Math.sin(progress * Math.PI) * 64 - scrollY}px`;
        traveler.style.width = `${width}px`;
        traveler.style.height = `${height}px`;
        traveler.style.visibility = 'visible';
        destination.style.opacity = '0';
        traveler.querySelectorAll('.lp-traveling-mascot-art').forEach((mascot) => {
          mascot.style.width = `${75 + 25 * eased}%`;
          mascot.style.height = `${84 + 16 * eased}%`;
        });
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updatePosition) : null;
    resizeObserver?.observe(source);
    resizeObserver?.observe(destinationContainer);
    document.fonts?.ready?.then(updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      resizeObserver?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      destination.style.opacity = '';
    };
  }, []);

  useLayoutEffect(() => {
    const formulaShapes = rootRef.current?.querySelectorAll('.lp-home-doodles .lp-home-doodle');
    if (!formulaShapes?.length) return undefined;

    const tweens = Array.from(formulaShapes, (shape, index) => gsap.to(shape, {
      y: -7,
      duration: 2.8 + (index % 3) * 0.25,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: index * 0.14,
    }));

    return () => tweens.forEach((tween) => tween.kill());
  }, []);

  // Mini-Quiz interactive demo state

  const handleFeatureClick = (step) => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && (user.id || user.email)) {
          navigate(step.route);
          return;
        }
      }
    } catch (_) {}

    if (onNavigateToAuth) {
      onNavigateToAuth('register', 'GRATUIT');
    } else {
      navigate('/register?pack=GRATUIT&feature=' + encodeURIComponent(step.title));
    }
  };

  const handleNav = (mode, pack) => {
    if (onNavigateToAuth) {
      onNavigateToAuth(mode, pack);
    } else {
      navigate(mode === 'login' ? '/login' : `/register${pack ? `?pack=${encodeURIComponent(pack)}` : ''}`);
    }
  };

  const handleScrollTo = (id) => {
    setMobileMenuOpen(false);
    setActiveNavSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Snap between the home screen and its next section on one scroll gesture.
  useEffect(() => {
    let isSnapping = false;
    let touchStartY = null;
    let touchStartedOnHome = false;
    let touchStartedOnMotivation = false;
    let unlockTimer;

    const beginSnap = (scrollAction) => {
      if (isSnapping) return true;
      isSnapping = true;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      scrollAction(reduceMotion ? 'auto' : 'smooth');
      unlockTimer = window.setTimeout(() => { isSnapping = false; }, 750);
      return true;
    };

    const goToMotivation = () => {
      const motivationSection = document.querySelector('.lp-motivation-banner');
      if (!motivationSection) return false;
      return beginSnap((behavior) => motivationSection.scrollIntoView({ behavior, block: 'start' }));
    };

    const goToHome = () => beginSnap((behavior) => window.scrollTo({ top: 0, behavior }));

    const handleWheel = (event) => {
      if (event.ctrlKey || event.deltaY === 0) return;
      if (isSnapping) {
        event.preventDefault();
        return;
      }

      if (event.deltaY > 0 && window.scrollY <= 80) {
        if (goToMotivation()) event.preventDefault();
        return;
      }

      if (event.deltaY < 0 && window.scrollY > 80) {
        const motivationSection = document.querySelector('.lp-motivation-banner');
        const rect = motivationSection?.getBoundingClientRect();
        if (rect && rect.top < window.innerHeight && rect.bottom > 0 && goToHome()) {
          event.preventDefault();
        }
      }
    };

    const handleTouchStart = (event) => {
      touchStartY = event.changedTouches[0]?.clientY ?? null;
      touchStartedOnHome = window.scrollY <= 80;
      const motivationSection = document.querySelector('.lp-motivation-banner');
      const rect = motivationSection?.getBoundingClientRect();
      touchStartedOnMotivation = window.scrollY > 80 && Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    };

    const handleTouchEnd = (event) => {
      if (touchStartY === null) return;
      const touchEndY = event.changedTouches[0]?.clientY;
      if (typeof touchEndY === 'number') {
        const scrollDelta = touchStartY - touchEndY;
        if (scrollDelta > 0 && touchStartedOnHome) goToMotivation();
        if (scrollDelta < 0 && touchStartedOnMotivation) goToHome();
      }
      touchStartY = null;
      touchStartedOnHome = false;
      touchStartedOnMotivation = false;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (unlockTimer) window.clearTimeout(unlockTimer);
    };
  }, []);

  // GSAP Animations and 3D Orbit Carousel
  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        // Entrance animations
        const heroBadge = rootRef.current?.querySelector('.lp-hero-badge');
        if (heroBadge) gsap.from(heroBadge, { opacity: 0, y: -20, duration: 0.7, ease: 'power3.out', delay: 0.1 });
        gsap.fromTo('.lp-hero-title', { autoAlpha: 0, y: 42, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: 'power3.out', delay: 0.25, clearProps: 'opacity,visibility,transform' });
        gsap.from('.lp-hero-desc', { opacity: 0, y: 25, duration: 0.8, ease: 'power3.out', delay: 0.4 });
        gsap.fromTo('.lp-hero-actions', { autoAlpha: 0, y: 30, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', delay: 0.55, clearProps: 'opacity,visibility,transform' });
        gsap.from('.lp-social-proof', { opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.7 });
        // Reveal each item as it becomes about 20% visible. One-shot triggers
        // keep the motion stable when scrolling back through the page.
        const revealGroup = (sectionSelector, itemSelector, { stagger = 0.11, start = 'top 80%' } = {}) => {
          gsap.utils.toArray(sectionSelector).forEach((section) => {
            const elements = gsap.utils.toArray(itemSelector, section);
            elements.forEach((element, index) => {
              let hasRevealed = false;
              const revealTween = gsap.fromTo(element,
                { autoAlpha: 0, y: 42, scale: 0.96 },
                {
                  autoAlpha: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.95,
                  delay: Math.min(index * stagger, 0.44),
                  ease: 'power3.out',
                  paused: true,
                  clearProps: 'opacity,visibility,transform',
                }
              );
              const revealOnce = () => {
                if (hasRevealed) return;
                hasRevealed = true;
                revealTween.play();
              };
              ScrollTrigger.create({
                trigger: element,
                start: () => {
                  const visibleThreshold = Math.min(element.getBoundingClientRect().height * 0.2, window.innerHeight * 0.2);
                  return `top bottom-=${visibleThreshold}px`;
                },
                onEnter: revealOnce,
                onEnterBack: revealOnce,
                invalidateOnRefresh: true
              });
            });
          });
        };

        gsap.utils.toArray('.lp-hero-section').forEach((section) => {
          gsap.utils.toArray('.lp-partner-heading, .lp-partner-logo-item, .lp-hero-decor', section).forEach((element, index) => {
            gsap.fromTo(element,
              { autoAlpha: 0, y: 32, scale: 0.96 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, delay: Math.min(index * 0.08, 0.4), ease: 'power3.out', clearProps: 'opacity,visibility,transform' }
            );
          });
        });

        revealGroup('.lp-features-section', '.fk-head > *, .fk-item, .fk-stage, .fk-cta', { stagger: 0.08 });
        revealGroup('.lp-archive-section', '.lp-archive-intro > *, .lp-archive-tabs, .lp-archive-years-card, .lp-bac-card, .lp-archive-cta, .lp-archive-owl', { stagger: 0.08 });
        revealGroup('.lp-roadmap-section', '.lp-roadmap-header > *, .lp-roadmap-step', { stagger: 0.08 });
        revealGroup('.lp-motivation-banner', '.lp-motivation-banner-copy > *, .lp-motivation-banner-visual', { stagger: 0.12 });
        revealGroup('.lp-stats-section', '.lp-stats-intro > *, .lp-stat-card', { stagger: 0.14 });
        revealGroup('.lp-pricing-section', '.lp-section-header > *, .lp-pricing-toggle-wrap, .lp-discount-badge, .lp-plan-card, .lp-plan-btn');
        revealGroup('.lp-faq-section', '.lp-section-header > *, .lp-faq-item');
        revealGroup('.lp-bottom-cta-section', '.lp-bottom-cta-content > *');
        revealGroup('.lp-footer', '.lp-footer-brand > *, .lp-footer-col, .lp-footer-bottom > *', { start: 'top 80%', stagger: 0.08 });

        // Scroll reveals for sections
        // Stats counter animation
        ScrollTrigger.create({
          trigger: '.lp-stats-section',
          start: 'top 75%',
          onEnter: () => {
            document.querySelectorAll('.lp-stat-card strong[data-count]').forEach((el) => {
              const target = parseFloat(el.dataset.count);
              const suffix = el.dataset.suffix || '';
              if (!isNaN(target)) {
                gsap.to({ v: 0 }, {
                  v: target,
                  duration: 2,
                  ease: 'power2.out',
                  onUpdate: function () {
                    const val = Math.floor(this.targets()[0].v);
                    el.innerHTML = `${val.toLocaleString()}<span class="stat-accent">${suffix}</span>`;
                  }
                });
              }
            });
          },
          once: true
        });
      }
    }, rootRef);

    // ─── 3D Orbit Carousel Animation Loop ───
    const stage = stageRef.current;
    if (!stage) return () => ctx.revert();

    let isPaused = false;
    let currentAngle = 0;
    let lastTimestamp = 0;
    let animId = null;

    const updateCardPositions = () => {
      const stageWidth = stage.clientWidth || window.innerWidth;
      const radiusX = Math.min(stageWidth * 0.44, 460);
      const radiusY = 40;

      cardRefs.current.forEach((cardEl, index) => {
        if (!cardEl) return;

        const phaseOffset = (index / ORBIT_CONFIG.cardCount) * Math.PI * 2;
        const theta = currentAngle + phaseOffset;

        const x = Math.cos(theta) * radiusX;
        const y = Math.sin(theta) * radiusY + ORBIT_CONFIG.verticalOffsetPx;

        const sinVal = Math.sin(theta);
        const depthFactor = (sinVal + 1) / 2;

        const scale = ORBIT_CONFIG.minScale + (ORBIT_CONFIG.maxScale - ORBIT_CONFIG.minScale) * depthFactor;
        const opacity = ORBIT_CONFIG.minOpacity + (1 - ORBIT_CONFIG.minOpacity) * depthFactor;
        const blur = (1 - depthFactor) * ORBIT_CONFIG.maxBlurPx;
        const rotation = Math.cos(theta) * 3;
        const zIndex = Math.round(depthFactor * 100) + 5;

        cardEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0px) scale(${scale.toFixed(3)}) rotate(${rotation.toFixed(2)}deg)`;
        cardEl.style.zIndex = zIndex;
        cardEl.style.opacity = opacity.toFixed(3);
        cardEl.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : 'none';
      });
    };

    updateCardPositions();

    if (!prefersReducedMotion) {
      const animate = (timestamp) => {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        if (!isPaused && deltaTime > 0) {
          const radPerMs = (Math.PI * 2) / (ORBIT_CONFIG.cycleDurationSec * 1000);
          currentAngle -= radPerMs * deltaTime;
          updateCardPositions();
        }

        animId = requestAnimationFrame(animate);
      };

      animId = requestAnimationFrame(animate);

      const onMouseEnter = () => { isPaused = true; };
      const onMouseLeave = () => { isPaused = false; };
      const onTouchStart = () => { isPaused = true; };
      const onTouchEnd = () => {
        setTimeout(() => { isPaused = false; }, 600);
      };

      stage.addEventListener('mouseenter', onMouseEnter);
      stage.addEventListener('mouseleave', onMouseLeave);
      stage.addEventListener('touchstart', onTouchStart, { passive: true });
      stage.addEventListener('touchend', onTouchEnd);

      const onResize = () => { updateCardPositions(); };
      window.addEventListener('resize', onResize);

      return () => {
        ctx.revert();
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('resize', onResize);
        stage.removeEventListener('mouseenter', onMouseEnter);
        stage.removeEventListener('mouseleave', onMouseLeave);
        stage.removeEventListener('touchstart', onTouchStart);
        stage.removeEventListener('touchend', onTouchEnd);
      };
    }

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing-root" ref={rootRef}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap"
        rel="stylesheet"
      />


      <div className="lp-grain" aria-hidden="true" />

      {typeof document !== 'undefined' && createPortal(
        <div className="lp-traveling-mascot" ref={travelingMascotRef} aria-hidden="true">
          <span className="lp-travel-mascot-layer">
            <img className="lp-traveling-mascot-art" src={navMascotImg} alt="" />
          </span>
        </div>,
        document.body
      )}

      {/* ====================================================================
          1. NAVIGATION HEADER
      ==================================================================== */}

      <nav className={`lp-nav lp-nav--reference${hasScrolled ? ' has-scrolled' : ''}`} id="nav">
        <div className="lp-logo" aria-label="E-Concours, accueil" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img className="lp-logo-image" src={navLogoImg} alt="E-Concours" />
        </div>

        <ul className="lp-nav-links">
          <li>
            <a
              href="#methodologie"
              className={activeNavSection === 'methodologie' ? 'is-active' : undefined}
              aria-current={activeNavSection === 'methodologie' ? 'location' : undefined}
              onClick={(e) => { e.preventDefault(); handleScrollTo('methodologie'); }}
            >
              Comment ça marche
            </a>
          </li>
          <li>
            <a
              href="#fonctionnalites"
              className={activeNavSection === 'fonctionnalites' ? 'is-active' : undefined}
              aria-current={activeNavSection === 'fonctionnalites' ? 'location' : undefined}
              onClick={(e) => { e.preventDefault(); handleScrollTo('fonctionnalites'); }}
            >
              Fonctionnalités
            </a>
          </li>
          <li>
            <a
              href="#tarifs"
              className={activeNavSection === 'tarifs' ? 'is-active' : undefined}
              aria-current={activeNavSection === 'tarifs' ? 'location' : undefined}
              onClick={(e) => { e.preventDefault(); handleScrollTo('tarifs'); }}
            >
              Tarifs
            </a>
          </li>
          <li>
            <a
              href="#faq"
              className={activeNavSection === 'faq' ? 'is-active' : undefined}
              aria-current={activeNavSection === 'faq' ? 'location' : undefined}
              onClick={(e) => { e.preventDefault(); handleScrollTo('faq'); }}
            >
              FAQ
            </a>
          </li>
        </ul>

        <div className="lp-nav-actions">
          <ThemeToggle className="lp-home-theme-toggle" />
          <button className="lp-btn-ghost" type="button" onClick={() => handleNav('login')}>
            Se connecter
          </button>
          <button className="lp-btn-primary" type="button" onClick={() => handleNav('register')}>
            <span>Créer un compte</span>
          </button>
          <button className="lp-btn-try" type="button" onClick={() => handleNav('login')}>
            Se connecter
          </button>
          <button
            className="lp-menu-toggle"
            type="button"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lp-mobile-menu">
          <a href="#methodologie" onClick={(e) => { e.preventDefault(); handleScrollTo('methodologie'); }}>
            Comment ça marche
          </a>
          <a href="#fonctionnalites" onClick={(e) => { e.preventDefault(); handleScrollTo('fonctionnalites'); }}>
            Fonctionnalités
          </a>
          <a href="#tarifs" onClick={(e) => { e.preventDefault(); handleScrollTo('tarifs'); }}>
            Tarifs
          </a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); handleScrollTo('faq'); }}>
            FAQ
          </a>
          <a href="/login" onClick={(e) => { e.preventDefault(); handleNav('login'); }}>
            Se connecter
          </a>
          <div className="lp-mobile-menu-actions">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '4px 0 8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Thème</span>
              <ThemeToggle />
            </div>
            <button className="lp-btn-ghost" type="button" onClick={() => handleNav('login')} style={{ width: '100%' }}>
              Se connecter
            </button>
            <button className="lp-btn-primary" type="button" onClick={() => handleNav('register')} style={{ width: '100%', justifyContent: 'center' }}>
              Créer un compte
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          2. HERO SECTION
      ==================================================================== */}
      <section className="lp-hero-section" id="hero">
        <div className="lp-hero-ambient" aria-hidden="true" />
        <span className="lp-hero-sparkle lp-hero-sparkle--left" aria-hidden="true">✦</span>
        <span className="lp-hero-sparkle lp-hero-sparkle--right" aria-hidden="true">✦</span>
        <span className="lp-hero-sparkle lp-hero-sparkle--lower" aria-hidden="true">✧</span>
        <div className="lp-hero-nitrogen-molecule" aria-hidden="true">
          <svg viewBox="0 0 72 44" fill="none">
            <text x="4" y="12" fill="var(--illustration-stroke, #3478c8)" fontSize="11" fontFamily="Georgia,serif" fontStyle="italic">N₂</text>
            <path d="M22 25h27M22 29h27" stroke="var(--illustration-stroke, #4d8de0)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="17" cy="27" r="6" fill="#fff" stroke="var(--illustration-stroke, #3478c8)" strokeWidth="1.5" />
            <circle cx="54" cy="27" r="6" fill="#fff" stroke="var(--illustration-stroke, #3478c8)" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="lp-hero-water-molecule" aria-hidden="true">
          <svg viewBox="0 0 100 66" fill="none">
            <path d="M50 30 26 49M50 30l24 19" stroke="var(--illustration-stroke, #3b82f6)" strokeWidth="1.8" />
            <circle cx="50" cy="27" r="8" fill="#fff" stroke="var(--illustration-accent, #f59e0b)" strokeWidth="1.8" />
            <circle cx="22" cy="52" r="7" fill="#fff" stroke="var(--illustration-stroke, #3b82f6)" strokeWidth="1.8" />
            <circle cx="78" cy="52" r="7" fill="#fff" stroke="var(--illustration-stroke, #3b82f6)" strokeWidth="1.8" />
            <text x="3" y="14" fill="var(--illustration-stroke, #2563eb)" fontSize="11" fontFamily="'Fira Code', monospace">H₂O</text>
          </svg>
        </div>
        <div className="lp-hero-ruler" aria-hidden="true">
          <span>01</span><i /><span>f(x)=y</span><i /><span>∞</span>
        </div>
        <div className="lp-hero-science-decor lp-hero-science-decor--atom" aria-hidden="true">
          <svg viewBox="0 0 90 90" fill="none">
            <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(-35 45 45)" stroke="var(--illustration-stroke, #3b82f6)" strokeWidth="1.7" />
            <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(35 45 45)" stroke="var(--illustration-stroke, #60a5fa)" strokeWidth="1.7" />
            <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(90 45 45)" stroke="var(--illustration-muted, #93c5fd)" strokeWidth="1.7" />
            <circle cx="45" cy="45" r="5" fill="var(--illustration-accent, #f59e0b)" />
            <circle cx="71" cy="29" r="3.5" fill="var(--illustration-stroke, #2563eb)" />
            <circle cx="27" cy="61" r="3.5" fill="var(--illustration-stroke, #2563eb)" />
          </svg>
        </div>
        <div className="lp-hero-science-decor lp-hero-science-decor--hexagon" aria-hidden="true">
          <svg viewBox="0 0 70 70" fill="none">
            <polygon points="35,5 62,20 62,50 35,65 8,50 8,20" stroke="#94a3b8" strokeWidth="1.8" />
            <circle cx="35" cy="5" r="3.5" fill="#cbd5e1" />
            <circle cx="62" cy="20" r="3.5" fill="#93c5fd" />
            <circle cx="62" cy="50" r="3.5" fill="#cbd5e1" />
            <circle cx="35" cy="65" r="3.5" fill="#93c5fd" />
            <circle cx="8" cy="50" r="3.5" fill="#cbd5e1" />
            <circle cx="8" cy="20" r="3.5" fill="#93c5fd" />
          </svg>
        </div>
        <div className="lp-hero-science-decor lp-hero-science-decor--dna" aria-hidden="true">
          <svg viewBox="0 0 80 140" fill="none">
            <path d="M20 10 Q50 30 20 50 Q-10 70 20 90 Q50 110 20 130" stroke="var(--illustration-stroke, #3b82f6)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M60 10 Q30 30 60 50 Q90 70 60 90 Q30 110 60 130" stroke="var(--illustration-stroke, #60a5fa)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <line x1="28" y1="20" x2="52" y2="20" stroke="var(--illustration-muted, #93c5fd)" strokeWidth="1.8" />
            <line x1="18" y1="35" x2="62" y2="35" stroke="var(--illustration-muted, #bfdbfe)" strokeWidth="1.5" />
            <line x1="20" y1="50" x2="60" y2="50" stroke="var(--illustration-muted, #93c5fd)" strokeWidth="1.8" />
            <line x1="18" y1="65" x2="62" y2="65" stroke="var(--illustration-muted, #bfdbfe)" strokeWidth="1.5" />
            <line x1="28" y1="80" x2="52" y2="80" stroke="var(--illustration-muted, #93c5fd)" strokeWidth="1.8" />
            <line x1="18" y1="95" x2="62" y2="95" stroke="var(--illustration-muted, #bfdbfe)" strokeWidth="1.5" />
            <line x1="20" y1="110" x2="60" y2="110" stroke="var(--illustration-muted, #93c5fd)" strokeWidth="1.8" />
            <line x1="28" y1="125" x2="52" y2="125" stroke="var(--illustration-muted, #bfdbfe)" strokeWidth="1.5" />
            <text x="65" y="42" fill="#64748b" fontSize="9" fontWeight="600">BAS</text>
            <text x="65" y="72" fill="#3b82f6" fontSize="9" fontWeight="600">DNA</text>
            <text x="65" y="102" fill="#f97316" fontSize="9" fontWeight="600">DNA</text>
          </svg>
        </div>
        <div className="lp-math-note lp-math-note--left" aria-hidden="true">lim<sub>x→+∞</sub> <span>ln(x)/x</span> = 0</div>
        <div className="lp-math-note lp-math-note--right" aria-hidden="true">∫ e<sup>ax</sup> dx = e<sup>ax</sup></div>
        <div className="lp-math-note lp-math-note--lower" aria-hidden="true">Δ &gt; 0</div>
        <div className="lp-math-note lp-math-note--euler" aria-hidden="true">e<sup>iπ</sup> + 1 = 0</div>
        <div className="lp-math-note lp-math-note--quadratic" aria-hidden="true">x = (-b ± √Δ) / 2a</div>
        <div className="lp-math-note lp-math-note--probability" aria-hidden="true">P(A ∩ B) = P(A) · P<sub>A</sub>(B)</div>
        <div className="lp-math-note lp-math-note--determinant" aria-hidden="true">det(A) = ad - bc</div>
        <div className="lp-math-note lp-math-note--physics" aria-hidden="true">E = mc²</div>
        <div className="lp-math-note lp-math-note--derivative" aria-hidden="true">(uv)&prime; = u&prime;v + uv&prime;</div>
        <div className="lp-math-note lp-math-note--trigonometry" aria-hidden="true">cos²(x) + sin²(x) = 1</div>
        <div className="lp-math-note lp-math-note--biology" aria-hidden="true">ATP → ADP + P<sub>i</sub><br />2n = 46 chromosomes</div>
        <div className="lp-math-note lp-math-note--newton" aria-hidden="true">U = R · I</div>
        <div className="lp-math-graph lp-math-graph--left" aria-hidden="true">
          <svg viewBox="0 0 140 90" fill="none"><path d="M10 80h120M20 85V10" stroke="currentColor" strokeDasharray="3 3" /><path d="M20 70Q50 10 80 50T130 15" stroke="var(--illustration-stroke, #2563eb)" strokeWidth="2" /><circle cx="80" cy="50" r="3" fill="var(--illustration-stroke, #2563eb)" /><text x="90" y="45">f(x)</text></svg>
        </div>
        <div className="lp-math-graph lp-math-graph--right" aria-hidden="true">
          <svg viewBox="0 0 130 80" fill="none"><path d="M10 70h110M20 75V10" stroke="currentColor" /><path d="M20 65Q60 65 110 15" stroke="#1e40af" strokeWidth="2" /><text x="64" y="30">∫ eˣ dx</text></svg>
        </div>
        <div className="lp-math-graph lp-math-graph--exponential" aria-hidden="true">
          <svg viewBox="0 0 130 90" fill="none"><path d="M10 75h110M20 82V10" stroke="currentColor" /><path d="M22 70C43 68 51 63 65 51S88 28 112 14" stroke="var(--illustration-stroke, #2563eb)" strokeWidth="2" /><text x="8" y="12">y</text><text x="119" y="84">x</text><text x="69" y="36">eˣ</text></svg>
        </div>
        <div className="lp-math-graph lp-math-graph--area" aria-hidden="true">
          <svg viewBox="0 0 150 100" fill="none"><path d="M12 84h126M24 91V12" stroke="currentColor" /><path d="M26 28C48 32 51 58 72 68S111 78 132 82L132 84H26Z" fill="rgba(245,158,11,.16)" /><path d="M26 28C48 32 51 58 72 68S111 78 132 82" stroke="var(--illustration-stroke, #2563eb)" strokeWidth="2" /><path d="m31 40 35 38M43 36l40 44M57 45l39 35M73 60l30 23" stroke="var(--illustration-accent, #f59e0b)" strokeWidth="1" opacity=".55" /><text x="8" y="12">z</text><text x="139" y="92">x</text></svg>
        </div>
        <div className="lp-hero-decor lp-hero-decor--books" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M8 12h31l-4 7H12l-4-7Z" fill="#fff" stroke="#d5aa7c" strokeWidth="1.5" />
            <path d="M12 22h27l-4 7H16l-4-7Z" fill="#edf3ff" stroke="#7994bd" strokeWidth="1.5" />
            <path d="M9 32h29l-4 7H13l-4-7Z" fill="#fff" stroke="#d5aa7c" strokeWidth="1.5" />
            <circle cx="42" cy="9" r="2.5" fill="#9bb2d3" />
          </svg>
        </div>
        <div className="lp-hero-decor lp-hero-decor--cap-center" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="m4 19 20-9 20 9-20 10-20-10Z" fill="#e5efff" stroke="#8eaad2" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M13 24v8c6 5 16 5 22 0v-8" fill="#f7ead8" stroke="#c7a47b" strokeWidth="1.5" />
            <path d="M42 20v13" stroke="#dda85d" strokeWidth="1.5" />
            <circle cx="42" cy="35" r="2" fill="#dda85d" />
          </svg>
        </div>
        <div className="lp-hero-decor lp-hero-decor--cap-right" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="m4 19 20-9 20 9-20 10-20-10Z" fill="#6f9ff1" stroke="#5685d5" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M13 24v8c6 5 16 5 22 0v-8" fill="#bcd2fb" stroke="#85a6d8" strokeWidth="1.5" />
            <path d="M42 20v13" stroke="#e0a340" strokeWidth="1.5" />
            <circle cx="42" cy="35" r="2" fill="#e0a340" />
          </svg>
        </div>
        <div className="lp-hero-decor lp-hero-decor--cap-left" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="m4 19 20-9 20 9-20 10-20-10Z" fill="#6f9ff1" stroke="#5685d5" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M13 24v8c6 5 16 5 22 0v-8" fill="#bcd2fb" stroke="#85a6d8" strokeWidth="1.5" />
            <path d="M42 20v13" stroke="#e0a340" strokeWidth="1.5" />
            <circle cx="42" cy="35" r="2" fill="#e0a340" />
          </svg>
        </div>
        <div className="lp-hero-decor lp-hero-decor--cap-left-low" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="m4 19 20-9 20 9-20 10-20-10Z" fill="#142b54" />
            <path d="M13 24v8c6 5 16 5 22 0v-8" fill="#243f71" />
            <path d="M42 20v13" stroke="#d9a14c" strokeWidth="1.7" />
          </svg>
        </div>
        <div className="lp-hero-decor lp-hero-decor--cap-right-low" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="m4 19 20-9 20 9-20 10-20-10Z" fill="#dfa04c" />
            <path d="M13 24v8c6 5 16 5 22 0v-8" fill="#e8b566" />
            <path d="M42 20v13" stroke="#b97a32" strokeWidth="1.7" />
          </svg>
        </div>
        <div className="lp-hero-decor lp-hero-decor--pencil-left" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="m12 33 20-20 5 5-20 20-7 2 2-7Z" fill="#fff2db" stroke="#c99253" strokeWidth="2" strokeLinejoin="round" />
            <path d="m29 16 5 5M12 33l7 5" stroke="#c99253" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="lp-hero-decor lp-hero-decor--pencil-right" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="m12 33 20-20 5 5-20 20-7 2 2-7Z" fill="#fff" stroke="#253e67" strokeWidth="2" strokeLinejoin="round" />
            <path d="m29 16 5 5M12 33l7 5" stroke="#253e67" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="lp-hero-pendulum" aria-hidden="true">
          <svg viewBox="0 0 180 180" fill="none">
            <path d="M24 22h132" stroke="#4b91ff" strokeWidth="3" strokeLinecap="round" />
            <path d="M90 22 59 126" stroke="#4b91ff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M90 22 111 125c18-2 34-13 43-29" stroke="#80b2ff" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" />
            <path d="M59 138c18 15 44 18 66 7" stroke="#80b2ff" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" />
            <circle cx="59" cy="137" r="12" fill="#5798f5" />
            <path d="M58 127a12 12 0 0 1 12 8" stroke="#a8ccff" strokeWidth="2" strokeLinecap="round" />
            <path d="M159 19v7m-3.5-3.5h7" stroke="var(--illustration-accent, #f59e0b)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="lp-reference-doodles" aria-hidden="true">
          <div className="lp-ref-item lp-ref-trig">
            <svg viewBox="0 0 140 125" fill="none">
              <circle cx="60" cy="48" r="34" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.5" />
              <path d="M60 48 84 25M60 48h34M94 43v10M89 48h10" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2.4" strokeLinecap="round" />
              <text x="60" y="108" textAnchor="middle">sin² θ + cos² θ = 1</text>
            </svg>
          </div>
          <div className="lp-ref-item lp-ref-triangle">
            <svg viewBox="0 0 140 125" fill="none">
              <path d="m20 94 77-52-3 55-74-3Z" fill="var(--illustration-soft, rgba(46,90,172,.06))" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4" strokeLinejoin="round" />
              <path d="m85 94 1-11 11 1" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2.2" strokeLinejoin="round" />
              <text x="61" y="119" textAnchor="middle">a² + b² = c²</text>
            </svg>
          </div>
          <div className="lp-ref-schools">
            <span>Médecine</span>
            <span>ENSAM</span>
            <span>ENSA</span>
          </div>
          <div className="lp-ref-item lp-ref-benzene">
            <svg viewBox="0 0 100 125" fill="none">
              <path d="m50 10 31 18v36L50 82 19 64V28L50 10Z" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.3" strokeLinejoin="round" />
              <circle cx="50" cy="46" r="15" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="1.8" />
              <text x="50" y="109" textAnchor="middle">C₆H₆</text>
            </svg>
          </div>
          <div className="lp-ref-item lp-ref-dna">
            <svg viewBox="0 0 112 142" fill="none">
              <path d="M18 8c72 26-5 38 74 62s-1 39-74 64M94 8c-72 26 5 38-74 62s1 39 74 64" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M33 17h47M28 34h55M34 51h44M32 69h48M28 87h55M34 105h44M36 123h40" stroke="var(--illustration-muted, #a9c6f4)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M18 8c18 6 28 11 34 17M92 70c-17 5-29 10-38 17" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2.2" strokeLinecap="round" />
              <text x="56" y="139" textAnchor="middle">A–T · C–G</text>
            </svg>
          </div>
          <div className="lp-ref-item lp-ref-integral">
            <svg viewBox="0 0 150 110" fill="none">
              <path d="M20 8v78h116M24 85h109" stroke="var(--illustration-muted, #b9c9e2)" strokeWidth="1.5" strokeDasharray="3 4" />
              <path d="M26 75c15-47 33-45 49-30s34 35 59 7" fill="var(--illustration-accent-soft, rgba(239,139,44,.22))" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M39 86V66M111 86V61" stroke="var(--illustration-muted, #a9c6f4)" strokeWidth="1.4" strokeDasharray="3 3" />
              <text x="76" y="106" textAnchor="middle">∫₀¹ f(x) dx</text>
            </svg>
          </div>
          <div className="lp-ref-item lp-ref-derivative">
            <svg viewBox="0 0 150 110" fill="none">
              <path d="M18 8v78h116M23 85h109" stroke="var(--illustration-muted, #b9c9e2)" strokeWidth="1.5" strokeDasharray="3 4" />
              <path d="M27 73Q68 2 119 72" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4" strokeLinecap="round" />
              <path d="m62 37 42-12" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2.1" strokeLinecap="round" />
              <circle cx="80" cy="32" r="3.5" fill="var(--illustration-accent, #ef8b2c)" />
              <text x="80" y="106" textAnchor="middle">f′(a)</text>
            </svg>
          </div>
          <div className="lp-ref-item lp-ref-complex">
            <svg viewBox="0 0 120 110" fill="none">
              <path d="M14 52h96M62 8v82" stroke="var(--illustration-muted, #b9c9e2)" strokeWidth="1.5" strokeDasharray="3 4" />
              <path d="m62 52 38-31" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="100" cy="21" r="3.5" fill="var(--illustration-accent, #ef8b2c)" />
              <text x="62" y="105" textAnchor="middle">z = a + ib</text>
            </svg>
          </div>
          <div className="lp-ref-item lp-ref-venn">
            <svg viewBox="0 0 130 100" fill="none">
              <circle cx="51" cy="43" r="31" fill="var(--illustration-soft, rgba(46,90,172,.08))" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.2" />
              <circle cx="79" cy="43" r="31" fill="var(--illustration-accent-soft, rgba(239,139,44,.12))" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2.2" />
              <text x="65" y="94" textAnchor="middle">P(A ∩ B)</text>
            </svg>
          </div>
          <div className="lp-ref-item lp-ref-circuit">
            <svg viewBox="0 0 150 80" fill="none">
              <path d="M10 38h19l8-14 10 28 10-28 10 28 10-28 10 14h43v22H10V38Z" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.1" strokeLinejoin="round" />
              <path d="M122 33v12M128 35v8" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2" strokeLinecap="round" />
              <text x="78" y="77" textAnchor="middle">U = R × I</text>
            </svg>
          </div>
          <div className="lp-ref-equation lp-ref-ph">π</div>
          <div className="lp-ref-equation lp-ref-delta">Δ &gt; 0</div>
          <div className="lp-ref-equation lp-ref-limit">lim <b>x→0</b> sin x / x = 1</div>
        </div>
        <div className="lp-home-doodles" aria-hidden="true">
          <div className="lp-home-doodle lp-home-doodle--co2"><svg viewBox="0 0 140 112" fill="none"><path d="M42 46h28M70 46h28" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4"/><circle cx="34" cy="46" r="14" fill="var(--surface, #fff)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4"/><circle cx="70" cy="46" r="14" fill="var(--surface, #fff)" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2.4"/><circle cx="106" cy="46" r="14" fill="var(--surface, #fff)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4"/><text x="70" y="91" textAnchor="middle">CO&#8322;</text></svg></div>
          <div className="lp-home-doodle lp-home-doodle--atom"><svg viewBox="0 0 120 112" fill="none"><circle cx="60" cy="47" r="39" fill="var(--illustration-soft, rgba(46,90,172,.04))" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4"/><circle cx="60" cy="47" r="13" fill="var(--surface, #fff)" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2.4"/><circle cx="60" cy="47" r="5" fill="var(--illustration-accent, #ef8b2c)"/><circle cx="86" cy="20" r="4.5" fill="var(--surface, #fff)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><circle cx="82" cy="73" r="4.5" fill="var(--surface, #fff)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><circle cx="38" cy="75" r="4.5" fill="var(--surface, #fff)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><text x="60" y="105" textAnchor="middle">Atome</text></svg></div>
          <div className="lp-home-schools"><span>M&#233;decine</span><span>ENSAM</span><span>ENSA</span></div>
          <div className="lp-home-doodle lp-home-doodle--methane"><svg viewBox="0 0 100 92" fill="none"><path d="M50 42 25 20M50 42 75 20M50 42 25 66M50 42 75 66" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><circle cx="50" cy="42" r="10" fill="var(--surface, #fff)" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2.4"/><circle cx="22" cy="18" r="7" fill="var(--surface, #fff)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><circle cx="78" cy="18" r="7" fill="var(--surface, #fff)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><circle cx="22" cy="68" r="7" fill="var(--surface, #fff)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><circle cx="78" cy="68" r="7" fill="var(--surface, #fff)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><text x="50" y="89" textAnchor="middle">CH&#8324;</text></svg></div>
          <div className="lp-home-doodle lp-home-doodle--flask"><svg viewBox="0 0 90 112" fill="none"><path d="M34 12h22M39 12v32L18 88q-4 9 7 9h40q11 0 7-9L51 44V12" fill="var(--illustration-accent-soft, rgba(245,138,19,.12))" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.5" strokeLinejoin="round"/><path d="M27 77h36" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2"/><circle cx="36" cy="84" r="2.5" fill="var(--illustration-accent, #ef8b2c)"/><circle cx="53" cy="86" r="2.5" fill="var(--illustration-accent, #ef8b2c)"/><text x="45" y="109" textAnchor="middle">n = cV</text></svg></div>
          <span className="lp-home-equation lp-home-equation--wave">c = &#955;f</span>
          <div className="lp-home-doodle lp-home-doodle--logistic"><svg viewBox="0 0 150 100" fill="none"><path d="M10 82h130M20 88V10" stroke="var(--illustration-muted, #b9c9e2)" strokeWidth="1.4" strokeDasharray="3 3"/><path d="M24 75C48 75 52 68 64 55S78 27 106 24 128 24 136 24" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.6" strokeLinecap="round"/><circle cx="65" cy="54" r="3.5" fill="var(--illustration-accent, #ef8b2c)"/><text x="76" y="98" textAnchor="middle">y = 1 / (1 + e&#8315;&#739;)</text></svg></div>
          <div className="lp-home-doodle lp-home-doodle--lens"><svg viewBox="0 0 140 100" fill="none"><path d="M12 28h38M12 72h38M90 28h38M90 72h38" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><path d="M62 18C48 30 48 70 62 82 76 70 76 30 62 18Z" fill="var(--illustration-soft, rgba(46,90,172,.08))" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4"/><path d="M14 50h112" stroke="var(--illustration-muted, #a9c6f4)" strokeWidth="1.4"/><circle cx="105" cy="50" r="4" fill="var(--illustration-accent, #ef8b2c)"/><text x="70" y="98" textAnchor="middle">1/f = 1/p + 1/q</text></svg></div>
          <div className="lp-home-doodle lp-home-doodle--radian"><svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="45" r="31" fill="var(--illustration-soft, rgba(46,90,172,.07))" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4"/><path d="M50 45 76 24M50 45h31" stroke="var(--illustration-accent, #ef8b2c)" strokeWidth="2.2" strokeLinecap="round"/><circle cx="76" cy="24" r="3.5" fill="var(--illustration-accent, #ef8b2c)"/><text x="50" y="95" textAnchor="middle">1 rad = 180&#176; / &#960;</text></svg></div>
          <div className="lp-home-doodle lp-home-doodle--probability"><svg viewBox="0 0 110 100" fill="none"><circle cx="54" cy="43" r="31" fill="var(--illustration-soft, #edf3ff)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.4"/><path d="M54 43V12a31 31 0 0 1 31 31H54Z" fill="var(--illustration-accent, #f59a22)" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><path d="M54 43 29 61" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2"/><text x="54" y="94" textAnchor="middle">P&#8321; + P&#8322; + P&#8323; = 1</text></svg></div>
          <div className="lp-home-doodle lp-home-doodle--circuit"><svg viewBox="0 0 150 70" fill="none"><path d="M8 42h12l8-26 11 46 11-43 11 43 11-43 11 23h48" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.3" strokeLinejoin="round"/><rect x="116" y="25" width="23" height="30" rx="4" fill="var(--illustration-accent, #f58a13)"/></svg></div>
          <div className="lp-home-doodle lp-home-doodle--sine"><svg viewBox="0 0 150 82" fill="none"><path d="M5 40c15 0 15-31 30-31s15 62 30 62 15-62 30-62 15 62 30 62 15-31 20-31" stroke="var(--illustration-stroke, #2e5aac)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="35" cy="10" r="3.5" fill="var(--illustration-accent, #ef8b2c)"/><text x="78" y="78" textAnchor="middle">y = A sin(&#969;t)</text></svg></div>
          <span className="lp-home-equation lp-home-equation--pressure">P = F / S</span>
        </div>
        <div className="lp-headline-composition">
          <h1 className="lp-hero-title" aria-label="Préparez vos concours, assurez votre avenir.">
            <span className="lp-headline-line lp-headline-line--first" aria-hidden="true">
              Préparez vos <span className="lp-title-framed-word">concours,</span>
            </span>
            <span className="lp-headline-line lp-headline-line--second">
              assurez votre <span className="lp-hero-avenir">avenir.</span>
            </span>
          </h1>

          <div className="lp-hero-actions">
            <div className="lp-hero-cta">
              <div
                className="lp-hero-mascot-companion"
                ref={heroMascotRef}
                aria-hidden="true"
              />
              <button className="lp-btn-hero-primary" type="button" onClick={() => handleScrollTo('methodologie')}>
                <span>Jarab fabor</span>
              </button>
            </div>
          </div>
          <div className="lp-editorial-doodle lp-editorial-doodle--book" aria-hidden="true">
            <svg viewBox="0 0 100 72" fill="none">
              <path d="M10 12c14-3 27 0 39 8v43c-12-8-25-11-39-8V12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M90 12c-14-3-27 0-41 8v43c13-8 26-11 41-8V12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M17 22c9-1 17 1 24 5M17 30c9-1 17 1 24 5M17 38c9 0 17 2 24 6M83 22c-9-1-17 1-26 5M83 30c-9-1-17 1-26 5M83 38c-9 0-17 2-26 6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
              <path d="M49 20v43" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </div>
          <div className="lp-editorial-doodle lp-editorial-doodle--plane" aria-hidden="true">
            <svg viewBox="0 0 100 116" fill="none">
              <path d="M8 13 89 40 27 56 8 13Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="m27 56 16 34 10-27 36-23M43 90l10-27" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M93 49c5 20 2 43-18 59" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="lp-editorial-doodle lp-editorial-doodle--globe" aria-hidden="true">
            <svg viewBox="0 0 100 130" fill="none">
              <circle cx="50" cy="49" r="36" stroke="currentColor" strokeWidth="1.6" />
              <ellipse cx="50" cy="49" rx="16" ry="36" stroke="currentColor" strokeWidth="1.35" />
              <ellipse cx="50" cy="49" rx="29" ry="36" stroke="currentColor" strokeWidth="1.1" />
              <path d="M15 41c21 7 49 7 70 0M16 56c21-7 47-7 68 0M50 13v72M50 85v18m-14 8 29-8m-32 14 39-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <span className="lp-editorial-dot" aria-hidden="true" />
        </div>
        <nav className="lp-hero-process" aria-label="Étapes de préparation aux concours">
          <ol>
            <li className="is-complete">
              <span className="lp-process-marker" aria-hidden="true" />
              <span className="lp-process-label">Inscription</span>
            </li>
            <li className="is-complete">
              <span className="lp-process-marker" aria-hidden="true" />
              <span className="lp-process-label">Cours</span>
            </li>
            <li className="is-upcoming">
              <span className="lp-process-marker" aria-hidden="true" />
              <span className="lp-process-label">Examens nationaux</span>
            </li>
            <li className="is-final">
              <span className="lp-process-marker" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="m3 8 9-4 9 4-9 4-9-4Z" fill="currentColor" />
                  <path d="M6.5 10v5c3.2 2.4 7.8 2.4 11 0v-5M21 8v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="21" cy="15.5" r="1.3" fill="currentColor" />
                </svg>
              </span>
              <span className="lp-process-label">Concours</span>
            </li>
          </ol>
        </nav>
        <p className="lp-hero-desc">La plateforme tout-en-un pour bien pr&eacute;parer vos concours au Maroc.</p>

        <div className="lp-partner-strip" aria-label="Écoles préparées">
          <div className="lp-partner-logos lp-marquee-mask">
            <div className="lp-partner-track">
              {[0, 1].map((copy) => (
                <div className="lp-partner-group" key={copy} aria-hidden={copy === 1 ? 'true' : undefined}>
                  {[partnerLogos[2], partnerLogos[0], partnerLogos[1], partnerLogos[3]].map((logo) => (
                    <div className={`lp-partner-logo-item${logo.src === logoFmpcImg ? ' lp-partner-logo-item--medicine' : ''}`} key={logo.alt}>
                      <img className={logo.src === logoFmpcImg ? 'lp-partner-logo-image--medicine' : undefined} src={logo.src} alt={copy === 0 ? logo.alt : ''} />
                      {logo.src === logoFmpcImg && <span className="lp-partner-medicine-caption">FACULTÉ DE MÉDECINE ET DE PHARMACIE<br />UNIVERSITÉ HASSAN II DE CASABLANCA</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lp-social-proof">
          <div className="lp-avatars-stack">
            <div className="lp-avatar" style={{ backgroundImage: `url(${ensaImg})` }} />
            <div className="lp-avatar" style={{ backgroundImage: `url(${medcineImg})` }} />
            <div className="lp-avatar" style={{ backgroundImage: `url(${ensamImg})` }} />
            <div className="lp-avatar" style={{ backgroundImage: `url(${encgImg})` }} />
          </div>
          <div className="lp-proof-text">
            <span className="lp-proof-stars">★★★★★</span>
            <strong>4.9/5</strong> par plus de <strong>15 000 élèves</strong> au Maroc
          </div>
        </div>

        {/* 3D Orbit Carousel Showcase */}
        <div className="lp-carousel-stage-wrapper">
          <div className="lp-hero-floater pos-left">
            <span>📐</span> Formules claires et lisibles
          </div>
          <div className="lp-hero-floater pos-right">
            <span>⏱️</span> Mode chronomètre officiel
          </div>
          <div className="lp-hero-floater pos-bottom">
            <span>🎯</span> +98% de taux d'admission
          </div>

          <div className="lp-carousel-stage" ref={stageRef} aria-label="Carrousel d'écoles prestigieuses en orbite">
            {CARDS_DATA.map((item, index) => (
              <div
                key={index}
                className="lp-orbit-card"
                ref={(el) => (cardRefs.current[index] = el)}
                onClick={() => handleNav('register')}
                title={`Préparation aux concours ${item.name}`}
              >
                <img src={item.url} alt={item.desc} loading="lazy" />
                <span className="lp-orbit-card-label">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. 3-STEP METHODOLOGY SECTION (STYLE KRESCO)
      ==================================================================== */}
      <section className="lp-motivation-banner" aria-labelledby="lp-motivation-title">
        <div className="lp-motivation-banner-inner">
          <div className="lp-motivation-banner-copy">
            <span className="lp-motivation-banner-eyebrow">Un avenir à construire</span>
            <h2 id="lp-motivation-title">Ton rêve mérite<br />une préparation<br />à la hauteur.</h2>
            <p>Chaque grande ambition commence par une décision : un moyen d’avancer, une étape après l’autre.</p>
            <button className="lp-motivation-banner-cta" type="button" onClick={() => handleScrollTo('methodologie')}>
              Découvrir les 7 étapes <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="lp-motivation-banner-visual" ref={motivationMascotRef} aria-hidden="true">
            <div className="lp-motivation-banner-ground" />
            <img className="lp-motivation-banner-owl" src={navMascotImg} alt="" />
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. 7-STEP EDITORIAL ROADMAP SECTION
      ==================================================================== */}
      <section className="lp-roadmap-section" id="methodologie" aria-labelledby="lp-roadmap-title">
        <header className="lp-roadmap-header">
          <h2 id="lp-roadmap-title">Ton chemin vers<br />le <span>concours.</span></h2>
          <p>Cours, fiches et entraînement s’enchaînent sur une seule plateforme. Chaque étape prépare la suivante.</p>
        </header>

        <div className="lp-roadmap-list">
          <svg className="lp-roadmap-route" viewBox="0 0 100 2240" preserveAspectRatio="none" aria-hidden="true">
            <path d="M70 160 C70 320 30 320 30 480 C30 640 70 640 70 800 C70 960 30 960 30 1120 C30 1280 70 1280 70 1440 C70 1600 30 1600 30 1760 C30 1920 70 1920 70 2080" />
          </svg>
          {[
            {
              number: '01',
              kicker: 'PLANIFIER',
              title: 'Calendrier & agenda',
              pills: ['Dates des concours', 'Inscriptions', 'Planning personnel'],
              subtitle: 'ENSA · ENSAM · Médecine · ENCG',
              cardBadge: 'Agenda',
              preview: 'calendar',
              route: '/client-calendrier',
            },
            {
              number: '02',
              kicker: 'COMPRENDRE',
              title: 'Cours & examens nationaux',
              pills: ['Cours du Bac', 'Annales', 'Corrigés détaillés'],
              subtitle: 'Mathématiques · Physique · SVT',
              cardBadge: 'Examens',
              preview: 'course',
              route: '/client-examens',
            },
            {
              number: '03',
              kicker: 'SYNTHÉTISER',
              title: 'Fiches de révision',
              pills: ['Formules clés', 'Résumés', 'Notions essentielles'],
              subtitle: 'Révision rapide par chapitre',
              cardBadge: 'Fiches',
              preview: 'revision',
              route: '/client-resumes',
            },
            {
              number: '04',
              kicker: 'S’ENTRAÎNER',
              title: 'Concours blancs',
              pills: ['QCM chronométrés', 'Matières', 'Chapitres'],
              subtitle: 'Score · Temps · Progression',
              cardBadge: 'QCM Blanc',
              preview: 'blanc',
              route: '/client-concours-blanc',
            },
            {
              number: '05',
              kicker: 'SE PRÉPARER',
              title: 'Annales des concours',
              pills: ['Sujets officiels', 'QCM interactifs', 'Barèmes'],
              subtitle: 'Préparation par école',
              cardBadge: 'Annales',
              preview: 'annales',
              route: '/client-concours',
            },
            {
              number: '06',
              kicker: 'PROGRESSER',
              title: 'Révision des erreurs',
              pills: ['Erreurs sauvegardées', 'Explications', 'Ciblage'],
              subtitle: 'Révision ciblée · Amélioration continue',
              cardBadge: 'Erreurs',
              preview: 'errors',
              route: '/client-erreurs',
            },
            {
              number: '07',
              kicker: 'ATTEINDRE SON OBJECTIF',
              title: 'Dashboard & progression',
              pills: ['Statistiques', 'Précision', 'Chapitres maîtrisés'],
              subtitle: 'Objectif : admissibilité',
              cardBadge: 'Dashboard',
              preview: 'dashboard',
              route: '/client-dashboard',
            },
          ].map((step, index) => (
            <article
              className={index % 2 === 0 ? 'lp-roadmap-step' : 'lp-roadmap-step is-reversed'}
              key={step.number}
            >
              <div className="lp-roadmap-copy">
                <span className="lp-roadmap-step-number">Étape {step.number}</span>
                <span className="lp-roadmap-step-kicker">{step.kicker}</span>
                <h3>{step.title}</h3>
                <div className="lp-roadmap-pills">
                  {step.pills.map((pill) => <span key={pill}>{pill}</span>)}
                </div>
                <p className="lp-roadmap-subtitle">{step.subtitle}</p>
              </div>

              <RoadmapPreview step={step} onClick={() => handleFeatureClick(step)} />
            </article>
          ))}
        </div>

      </section>
      <section className="lp-features-section fk" id="fonctionnalites" aria-labelledby="fk-title">
        <div className="fk-content-wrap">
          <header className="fk-head">
            <span className="fk-badge">Fonctionnalités clés</span>
            <h2 className="fk-heading" id="fk-title">Une préparation adaptée à tes <b>objectifs</b></h2>
            <p className="fk-sub">Suis ta progression, organise tes révisions et corrige tes erreurs, au même endroit.</p>
          </header>

          <div
            className="fk-show"
            id="fk-showcase"
            onMouseEnter={() => {
              featureShowcaseHoveredRef.current = true;
              setFeatureShowcasePaused(true);
            }}
            onMouseLeave={() => {
              featureShowcaseHoveredRef.current = false;
              setFeatureShowcasePaused(featureShowcaseFocusedRef.current);
            }}
            onFocusCapture={() => {
              featureShowcaseFocusedRef.current = true;
              setFeatureShowcasePaused(true);
            }}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                featureShowcaseFocusedRef.current = false;
                setFeatureShowcasePaused(featureShowcaseHoveredRef.current);
              }
            }}
          >
            <div className="fk-list" role="group" aria-label="Choisir une fonctionnalité">
              {FEATURE_SHOWCASE_ITEMS.map((item, index) => {
                const isActive = activeFeatureIndex === index;
                return (
                  <button
                    type="button"
                    className={isActive ? 'fk-item is-active' : 'fk-item'}
                    id={'fk-feature-' + item.id}
                    aria-pressed={isActive}
                    aria-controls={'fk-pane-' + item.id}
                    key={item.id}
                    onClick={() => setActiveFeatureIndex(index)}
                  >
                    <span className="fk-icon" aria-hidden="true">{item.icon}</span>
                    <span className="fk-item-copy">
                      <span className="fk-item-title">{item.title}</span>
                      <span className="fk-item-description">{item.description}</span>
                    </span>
                    <span className="fk-progress" aria-hidden="true"><i /></span>
                  </button>
                );
              })}
            </div>

            <div className="fk-stage" role="group" aria-label="Aperçu des fonctionnalités">
              <div className="fk-window">
                <div className="fk-bar" aria-hidden="true">
                  <i /><i /><i /><span>E-CONCOURS</span>
                </div>

                <div
                  className={activeFeatureIndex === 0 ? 'fk-pane is-active' : 'fk-pane'}
                  id="fk-pane-dashboard"
                  role="region"
                  aria-labelledby="fk-feature-dashboard"
                  aria-hidden={activeFeatureIndex !== 0}
                >
                  <p className="fk-hi">Bonjour Étudiant <span aria-hidden="true">👋</span></p>
                  <div className="fk-row2">
                    <svg className="fk-ring" viewBox="0 0 120 120" role="img" aria-label="Progression : 78 %">
                      <defs>
                        <linearGradient id={featureProgressGradientId} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0" stopColor="#4a80de" />
                          <stop offset="1" stopColor="#2fb67c" />
                        </linearGradient>
                      </defs>
                      <circle cx="60" cy="60" r="48" fill="none" stroke="var(--line)" strokeWidth="12" />
                      <circle cx="60" cy="60" r="48" fill="none" stroke={'url(#' + featureProgressGradientId + ')'} strokeWidth="12" strokeLinecap="round" strokeDasharray="235 302" transform="rotate(-90 60 60)" />
                      <text x="60" y="68" textAnchor="middle" fontSize="26" fontWeight="900" fill="currentColor" fontFamily="Nunito, sans-serif">78%</text>
                    </svg>
                    <div className="fk-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
                  </div>
                  <div className="fk-tiles">
                    <div><b>24</b>Séances</div>
                    <div><b>18</b>Chapitres</div>
                    <div><b>32/40</b>Dernier score</div>
                  </div>
                </div>

                <div
                  className={activeFeatureIndex === 1 ? 'fk-pane is-active' : 'fk-pane'}
                  id="fk-pane-calendar"
                  role="region"
                  aria-labelledby="fk-feature-calendar"
                  aria-hidden={activeFeatureIndex !== 1}
                >
                  <p className="fk-hi">Novembre</p>
                  <div className="fk-cw">
                    <div className="fk-cal" role="img" aria-label="Calendrier de novembre avec les dates importantes surlignées">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => <span className="fk-day-heading" key={'day-' + index}>{day}</span>)}
                      <span className="fk-date is-empty" />
                      {Array.from({ length: 27 }, (_, index) => {
                        const date = index + 1;
                        const markedDate = date === 4 ? 'is-orange' : date === 9 || date === 25 ? 'is-blue' : date === 17 ? 'is-violet' : date === 22 ? 'is-orange' : '';
                        return <span className={'fk-date ' + markedDate} key={date}>{date}</span>;
                      })}
                    </div>
                    <div className="fk-agenda">
                      <small>Agenda</small>
                      <div className="fk-event">Maths · Limites<em>18:00</em></div>
                      <div className="fk-event is-orange">Physique · Ondes<em>19:30</em></div>
                      <div className="fk-event is-violet">Concours blanc<em>Samedi</em></div>
                    </div>
                  </div>
                </div>

                <div
                  className={activeFeatureIndex === 2 ? 'fk-pane is-active' : 'fk-pane'}
                  id="fk-pane-training"
                  role="region"
                  aria-labelledby="fk-feature-training"
                  aria-hidden={activeFeatureIndex !== 2}
                >
                  <div className="fk-filters">
                    <span className="is-selected">Maths</span><span>Physique</span><span>SVT</span>
                    <span className="is-selected">ENSA</span><span>ENSAM</span><span>Médecine</span>
                  </div>
                  <p className="fk-question">Si f(x) = x², que vaut f’(3) ?</p>
                  <div className="fk-option"><b>A</b><span>3</span></div>
                  <div className="fk-option is-correct"><b>B</b><span>6</span></div>
                  <div className="fk-option"><b>C</b><span>9</span></div>
                </div>

                <div
                  className={activeFeatureIndex === 3 ? 'fk-pane is-active' : 'fk-pane'}
                  id="fk-pane-errors"
                  role="region"
                  aria-labelledby="fk-feature-errors"
                  aria-hidden={activeFeatureIndex !== 3}
                >
                  <p className="fk-hi">Mes erreurs</p>
                  <div className="fk-error-card">
                    <small>Limites · Question 12</small>
                    <div className="fk-error-wrong">✕ Ta réponse : 0</div>
                    <div className="fk-error-correct">✓ lim sin x / x = 1</div>
                  </div>
                  <div className="fk-error-card">
                    <small>Suites · Question 7</small>
                    <div className="fk-error-wrong">✕ Ta réponse : divergente</div>
                    <div className="fk-error-correct">✓ Convergente vers 0</div>
                  </div>
                  <span className="fk-retry">Refaire</span>
                </div>
              </div>
            </div>
          </div>

          <button className="fk-cta" type="button" onClick={() => handleNav('register')}>
            Accéder à toutes les fonctionnalités <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
      {/* Call to action placed directly after the features section. */}
      <section className="lp-bottom-cta-section">
        <div className="lp-bottom-cta-card">
          <div className="lp-bottom-cta-content">
            <span className="lp-bottom-cta-kicker">TON PROCHAIN CHAPITRE COMMENCE ICI</span>
            <h2>Prêt à intégrer la <span>Grande École</span> de tes rêves ?</h2>
          </div>
          <div className="lp-bottom-cta-logos" aria-label="Écoles préparées">
            <div className="lp-bottom-cta-logo-viewport">
              <div className="lp-bottom-cta-logo-track">
                {[0, 1].map((copy) => (
                  <div className="lp-bottom-cta-logo-group" key={copy} aria-hidden={copy === 1 ? 'true' : undefined}>
                    {bottomCtaLogos.map((logo) => (
                      <div className="lp-bottom-cta-logo-item" key={logo.name}>
                        <img src={logo.src} alt={copy === 0 ? logo.alt : ''} />
                        <span>{logo.name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="lp-archive-section" aria-labelledby="lp-archive-title">
        <div className="lp-archive-inner">
          <div className="lp-archive-copy">
            <header className="lp-archive-intro">
              <span className="lp-archive-eyebrow">Archives des concours</span>
              <h2 id="lp-archive-title">
                Chaque <span className="lp-archive-highlight">concours</span>
                <br />depuis 2008. Le Bac
                <br />en plus.
              </h2>
              <p>
                Travaille sur les vrais sujets des grandes écoles. Choisis une offre concours :
                la préparation du Bac est incluse, sans supplément.
              </p>
            </header>

            <div className="lp-archive-tabs" role="tablist" aria-label="Choisir un concours">
              {archiveSchools.map((school) => (
                <button
                  key={school.id}
                  id={`lp-archive-tab-${school.id}`}
                  className={`lp-archive-tab${selectedArchiveSchool === school.id ? ' is-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={selectedArchiveSchool === school.id}
                  aria-controls="lp-archive-years-panel"
                  onClick={() => setSelectedArchiveSchool(school.id)}
                >
                  {school.id}
                </button>
              ))}
            </div>

            <div
              className="lp-archive-years-card"
              id="lp-archive-years-panel"
              role="tabpanel"
              aria-labelledby={`lp-archive-tab-${selectedArchiveSchool}`}
            >
              <h3 id="lp-archive-school-title">
                {selectedArchiveSchool} · {archiveSchools.find((school) => school.id === selectedArchiveSchool)?.title}
              </h3>
              <div className="lp-archive-years" role="group" aria-label={`Choisir l’année du concours ${selectedArchiveSchool}`}>
                {archiveYears.map((year) => (
                  <button
                    key={year}
                    className={`lp-archive-year${selectedArchiveYear === year ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={selectedArchiveYear === year}
                    onClick={() => setSelectedArchiveYear(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
              <span className="lp-archive-selection" aria-live="polite">
                Sélection : {selectedArchiveSchool} · {selectedArchiveYear}
              </span>
            </div>
          </div>

          <div className="lp-archive-side">
            <div className="lp-bac-card">
              <span className="lp-bac-ribbon">Offert</span>
              <h3>Bonus Bac</h3>
              <p className="lp-bac-subtitle">Inclus avec toute offre concours</p>
              <ul className="lp-bac-list">
                <li><span aria-hidden="true">📄</span><div><b>Examens nationaux</b><small>Sujets des années précédentes</small></div></li>
                <li><span aria-hidden="true">🧬</span><div><b>Cours de SVT</b></div></li>
                <li><span aria-hidden="true">∑</span><div><b>Cours de Mathématiques</b></div></li>
                <li><span aria-hidden="true">⚙️</span><div><b>Cours de Physique-Chimie</b></div></li>
              </ul>
              <p className="lp-bac-price"><b>0 DH</b> pour le Bac dès que tu t’inscris à une offre concours.</p>
            </div>
            <div className="lp-archive-mascot-ground" aria-hidden="true" />
            <LandingMascot className="lp-archive-owl" holdingNotebook={true} />
            <button className="lp-archive-cta" type="button" onClick={() => handleNav('register')}>
              Le Bac est offert !
            </button>
          </div>
        </div>
      </section>
      {/* ====================================================================
          9. PRICING & PLANS SECTION
      ==================================================================== */}
      <section className="lp-pricing-section" id="tarifs">
        {/* Decorative formula: DNA helix 2 */}
        <div className="lp-bg-formula lp-bg-formula--dna-2" aria-hidden="true">
          <svg viewBox="0 0 70 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8 Q45 25 18 42 Q-9 59 18 76 Q45 93 18 110" stroke="#818cf8" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M52 8 Q25 25 52 42 Q79 59 52 76 Q25 93 52 110" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round" />
            <line x1="24" y1="17" x2="46" y2="17" stroke="#c4b5fd" strokeWidth="1.2" />
            <line x1="16" y1="30" x2="54" y2="30" stroke="#ddd6fe" strokeWidth="1" />
            <line x1="18" y1="42" x2="52" y2="42" stroke="#c4b5fd" strokeWidth="1.2" />
            <line x1="16" y1="59" x2="54" y2="59" stroke="#ddd6fe" strokeWidth="1" />
            <line x1="24" y1="68" x2="46" y2="68" stroke="#c4b5fd" strokeWidth="1.2" />
            <line x1="18" y1="76" x2="52" y2="76" stroke="#ddd6fe" strokeWidth="1" />
            <line x1="16" y1="93" x2="54" y2="93" stroke="#c4b5fd" strokeWidth="1.2" />
          </svg>
        </div>
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">FORMULES D'ACCÈS TRANSPARENTES</span>
          <h2 className="lp-section-title">
            Un pack. Votre filière. Toute l'année.
          </h2>
          <p className="lp-section-desc">
            Paiement unique par pack. Choisissez les concours que vous préparez.
          </p>
        </div>

        <div className="lp-pricing-grid">
          {[
            {
              name: 'Médecine',
              pack: 'MEDECINE',
              description: 'Accès complet au concours de médecine',
              price: '300',
              features: ['Médecine', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
            {
              name: 'ENSAM',
              pack: 'ENSAM',
              description: 'Accès complet au concours ENSAM',
              price: '300',
              features: ['ENSAM', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
            {
              name: 'ENSA',
              pack: 'ENSA',
              description: 'Accès complet au concours ENSA',
              price: '250',
              features: ['ENSA', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
            {
              name: 'Médecine + ENSA',
              pack: 'MEDECINE_ENSA',
              description: 'Les deux concours, un seul paiement',
              price: '500',
              saving: 'Économisez 50 DH vs les packs séparés',
              features: ['Médecine', 'ENSA', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
            {
              name: 'ENCG',
              pack: 'ENCG',
              description: 'Accès complet au concours ENCG',
              price: '300',
              features: ['ENCG', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
            {
              name: 'Médecine + ENSA + ENSAM',
              pack: 'PACK_COMPLET',
              description: 'Les trois concours — ENCG offert',
              price: '1000',
              saving: 'Économisez 150 DH vs les packs séparés',
              featured: true,
              features: ['Médecine', 'ENSA', 'ENSAM', 'ENCG', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
          ].map((plan) => (
            <div className={`lp-plan-card${plan.featured ? ' is-featured' : ''}`} key={plan.name}>
              {plan.featured && <div className="lp-featured-ribbon">Populaire</div>}
              <h3 className="lp-plan-name">{plan.name}</h3>
              <p className="lp-plan-sub">{plan.description}</p>
              <div className="lp-plan-price">
                {plan.price ? <>{plan.price} <small>DH · unique</small></> : 'Tarif à préciser'}
              </div>
              {plan.saving && <span className="lp-discount-badge">{plan.saving}</span>}
              <ul className="lp-plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="check-icon">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="lp-plan-btn" type="button" onClick={() => handleNav('register', plan.pack)}>
                Souscrire <span aria-hidden="true">→</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================================
          THREE-STEP PREPARATION SECTION
      ==================================================================== */}
      <section className="lp-three-steps-section" aria-labelledby="lp-three-steps-title">
        <div className="lp-three-steps-header">
          <span className="lp-three-steps-eyebrow">VOS ÉTAPES</span>
          <h2 id="lp-three-steps-title">Votre préparation, pas à pas</h2>
        </div>
        <div className="lp-three-steps-grid">
          <article className="lp-three-step-card">
            <div className="lp-three-step-top">
              <span className="lp-three-step-number">01</span>
            </div>
            <h3>Créez votre compte</h3>
            <p>Inscrivez-vous en quelques instants pour accéder à la plateforme.</p>
          </article>
          <article className="lp-three-step-card lp-three-step-card--accent">
            <div className="lp-three-step-top">
              <span className="lp-three-step-number">02</span>
            </div>
            <h3>Choisissez votre pack</h3>
            <p>Médecine, ENSA, ENSAM, ENCG ou un pack groupé, avec un paiement unique.</p>
          </article>
          <article className="lp-three-step-card">
            <div className="lp-three-step-top">
              <span className="lp-three-step-number">03</span>
            </div>
            <h3>Révisez et testez-vous</h3>
            <p>QCM, résumés, cours et examens chronométrés pour arriver prêt le jour J.</p>
          </article>
        </div>
      </section>

      {/* ====================================================================
          10. FAQ ACCORDION SECTION
      ==================================================================== */}
      <section className="lp-stats-section" id="apropos">
        <div className="lp-stats-inner">
          <div className="lp-stats-intro">
            <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              RÉSULTATS PROUVÉS
            </span>
            <h3>
              Des chiffres qui parlent d'eux-mêmes.
            </h3>
            <p>
              Chaque année, les candidats préparés sur ECONCOURS dominent les listes d'admission des plus grandes écoles du Royaume.
            </p>
          </div>

          <div className="lp-stat-card">
            <strong data-count="98" data-suffix="%">
              98<span className="stat-accent">%</span>
            </strong>
            <span>Taux de satisfaction et d'intégration</span>
          </div>

          <div className="lp-stat-card">
            <strong data-count="15000" data-suffix="+">
              15 000<span className="stat-accent">+</span>
            </strong>
            <span>Questions QCM traitées & corrigées</span>
          </div>

          <div className="lp-stat-card">
            <strong data-count="120" data-suffix="+">
              120<span className="stat-accent">+</span>
            </strong>
            <span>Concours blancs officiels complets</span>
          </div>
        </div>
      </section>

      <section className="lp-faq-section" id="faq">
        {/* Decorative formula: sine curve */}
        <div className="lp-bg-formula lp-bg-formula--sine-3" aria-hidden="true">
          <svg viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="10" y1="70" x2="170" y2="70" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="20" y1="75" x2="20" y2="10" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M20 50 Q45 10 70 50 Q95 90 120 50 Q145 10 165 50" stroke="#60a5fa" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <circle cx="70" cy="50" r="4" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
            <text x="130" y="30" fill="#94a3b8" fontSize="13" fontFamily="serif" fontStyle="italic">f = √A</text>
          </svg>
        </div>
        {/* Decorative formula: hexagon */}
        <div className="lp-bg-formula lp-bg-formula--hexagon-3" aria-hidden="true">
          <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="35,5 62,20 62,50 35,65 8,50 8,20" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
            <circle cx="35" cy="5" r="3" fill="#cbd5e1" />
            <circle cx="62" cy="20" r="3" fill="#bfdbfe" />
            <circle cx="62" cy="50" r="3" fill="#cbd5e1" />
            <circle cx="35" cy="65" r="3" fill="#bfdbfe" />
            <circle cx="8" cy="50" r="3" fill="#cbd5e1" />
            <circle cx="8" cy="20" r="3" fill="#bfdbfe" />
          </svg>
        </div>
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">QUESTIONS FRÉQUENTES</span>
          <h2 className="lp-section-title">
            Tout ce que vous devez savoir.
          </h2>
          <p className="lp-section-desc">
            Des réponses claires pour vous guider sereinement vers votre réussite.
          </p>
        </div>

        <div className="lp-faq-list">
          {[
            {
              q: "Comment ECONCOURS m'aide-t-il à réussir les concours des grandes écoles ?",
              a: "ECONCOURS réunit pour la première fois en un seul endroit tous les examens officiels des 15 dernières années (ENSA, ENSAM, Médecine, ENCG). Vous révisez avec des cours clairs et structurés, puis vous vous entraînez sur les vrais QCM avec un chronomètre et un barème de points conforme à la réalité du concours."
            },
            {
              q: "Les épreuves et les corrigés sont-ils conformes aux concours officiels au Maroc ?",
              a: "Oui, absolument. Toutes nos annales proviennent des épreuves officielles organisées par les écoles marocaines. Les corrigés sont rédigés et vérifiés par des professeurs et des majors de promotion pour vous apporter l'explication la plus claire et rapide."
            },
            {
              q: "Puis-je réviser sur mon téléphone ou ma tablette ?",
              a: "Tout à fait ! L'interface d'ECONCOURS est 100% responsive et fluide sur smartphone, tablette et ordinateur. Vous pouvez faire vos quiz n'importe où, dans les transports ou pendant vos pauses."
            },
            {
              q: "Comment fonctionne le suivi des erreurs et le chronomètre ?",
              a: "Dès que vous cochez une mauvaise réponse lors d'un test, la question est automatiquement enregistrée dans votre espace personnel. Vous pouvez ainsi la réviser plus tard en un clic. Le chronomètre vous habitue à résoudre chaque question en moins de 90 secondes."
            },
            {
              q: "Puis-je commencer gratuitement sans carte bancaire ?",
              a: "Oui, la création d'un compte est gratuite et sans engagement. Vous pouvez créer votre compte en 30 secondes pour découvrir la plateforme et choisir le pack adapté à vos concours."
            }
          ].map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className={`lp-faq-item ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="lp-faq-question"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span className="lp-faq-chevron">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="lp-faq-answer">
                    <p style={{ margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          12. FOOTER
      ==================================================================== */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-footer-wordmark" aria-label="E-CONCOURS">
              <svg className="lp-footer-cap" viewBox="0 0 48 42" fill="none" aria-hidden="true">
                <path d="M4 15 24 5l20 10-20 10L4 15Z" fill="#eaf2ff" />
                <path d="M11 19v9c7 6 19 6 26 0v-9" fill="#eaf2ff" />
                <path d="M42 16v16" stroke="#e2ae4f" strokeWidth="2" strokeLinecap="round" />
                <circle cx="42" cy="34" r="2.5" fill="#e2ae4f" />
              </svg>
              <span>E-</span>CONCOURS
            </div>
            <p>
              La plateforme de référence pour les cours du Bac, la préparation aux examens nationaux et aux concours des grandes écoles au Maroc.
            </p>
            <div className="lp-footer-social-block">
              <strong>Suivez-nous et contactez-nous</strong>
              <div className="lp-footer-socials">
                <span className="lp-footer-social-link" aria-label="Instagram ECONCOURS">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.8" r=".8" className="lp-social-dot" /></svg>
                  Instagram
                </span>
                <span className="lp-footer-social-link" aria-label="WhatsApp ECONCOURS">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 11.7a8.1 8.1 0 0 1-11.9 7.1L4 20l1.2-4.1a8.1 8.1 0 1 1 15-4.2Z" /><path d="M9 8.4c.2-.4.4-.4.7-.4h.5l1 2.2-.8 1c.8 1.5 1.8 2.3 3.2 2.9l.9-.9 2.1 1c.2.1.3.3.2.6-.2.8-1.1 1.5-2 1.6-1.1.1-2.8-.6-4.5-2.1-1.8-1.6-2.7-3.5-2.6-4.5.1-.6.6-1.2 1.3-1.4Z" /></svg>
                  WhatsApp
                </span>
              </div>
            </div>
          </div>

          <div className="lp-footer-col">
            <h4 style={{ color: '#ff7628' }}>Plateforme</h4>
            <ul>
              <li><a href="#fonctionnalites" onClick={(e) => { e.preventDefault(); handleScrollTo('fonctionnalites'); }}><span className="lp-footer-arrow">›</span> Fonctionnalités</a></li>
              <li><a href="#methodologie" onClick={(e) => { e.preventDefault(); handleScrollTo('methodologie'); }}><span className="lp-footer-arrow">›</span> Comment ça marche</a></li>
              <li><a href="#tarifs" onClick={(e) => { e.preventDefault(); handleScrollTo('tarifs'); }}><span className="lp-footer-arrow">›</span> Tarifs & Packs</a></li>
            </ul>
          </div>

          <div className="lp-footer-col">
            <h4 style={{ color: '#ff7628' }}>Concours</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('register'); }}><span className="lp-footer-arrow">›</span> Concours ENSA</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('register'); }}><span className="lp-footer-arrow">›</span> Concours ENSAM</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('register'); }}><span className="lp-footer-arrow">›</span> Concours Médecine (FMP)</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('register'); }}><span className="lp-footer-arrow">›</span> Concours ENCG</a></li>
            </ul>
          </div>

          <div className="lp-footer-col">
            <h4 style={{ color: '#ff7628' }}>Espace Membre</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('login'); }}><span className="lp-footer-arrow">›</span> Se connecter</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('register'); }}><span className="lp-footer-arrow">›</span> Créer un compte</a></li>
              <li><a href="#faq" onClick={(e) => { e.preventDefault(); handleScrollTo('faq'); }}><span className="lp-footer-arrow">›</span> Aide & FAQ</a></li>
              <li><a href="mailto:support@econcours.ma"><span className="lp-footer-arrow">›</span> Support & Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© 2027 E-CONCOURS. Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  );
}
