import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
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
import './LandingPage.css';

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

export function LandingMascot({ className = '', showCap = true, wave = false, holdingNotebook = false }) {
  const mascotId = useId().replace(/:/g, '');
  const mascotClassName = `${className}${wave ? ' lp-mascot--wave' : ''}${holdingNotebook ? ' lp-mascot--holding-notebook' : ''}`.trim();
  return (
    <svg className={mascotClassName} viewBox="0 0 240 260" role="img" aria-label="Mascotte hibou diplômé ECONCOURS">
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
          <circle cx="96" cy="95" r="12" fill="#140b04" />
          <circle cx="100" cy="90" r="4.5" fill="#fff" />
          <circle cx="92" cy="98" r="2" fill="#fff" />
        </g>
        <g className="lp-mascot-eye">
          <circle cx="146" cy="95" r="22" fill={`url(#${mascotId}-owlEye)`} stroke="#e68a00" />
          <circle cx="144" cy="95" r="12" fill="#140b04" />
          <circle cx="148" cy="90" r="4.5" fill="#fff" />
          <circle cx="140" cy="98" r="2" fill="#fff" />
        </g>
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

export default function LandingPage({ onNavigateToAuth }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);

  // States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Mini-Quiz interactive demo state
  const [mascotClickCount, setMascotClickCount] = useState(0);
  const [mascotNavigation, setMascotNavigation] = useState({ zone: 'start', side: 'right', speech: 'Marhaba! 👋', top: '22vh', scale: 1, rotate: '0deg' });
  const mascotRef = useRef(null);
  const mascotProgressRef = useRef(0);
  const mascotMouseXRef = useRef(window.innerWidth / 2);

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

  // Keep Bibi alongside the current landing-page section and give each section its own pose.
  useEffect(() => {
    let activeZone = '';

    const setZone = (zoneId, pose) => {
      if (activeZone === zoneId) return;
      activeZone = zoneId;
      setMascotNavigation({ ...pose, zone: zoneId });
    };

    const updateOwlMotion = () => {
      const progress = mascotProgressRef.current;
      const element = mascotRef.current;
      if (!element) return;

      const wingAngle = Math.sin(progress * 0.12) * 12;
      const headTilt = ((mascotMouseXRef.current / window.innerWidth) - 0.5) * 8 + Math.sin(progress * 0.1) * 8;
      element.style.setProperty('--owl-wing-left', `${wingAngle}deg`);
      element.style.setProperty('--owl-wing-right', `${-wingAngle}deg`);
      element.style.setProperty('--owl-head-tilt', `${headTilt}deg`);
    };

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100)) : 0;
      mascotProgressRef.current = progress;

      const anchorY = window.innerHeight * 0.42;
      const heroSection = document.querySelector('#hero');
      const heroRect = heroSection?.getBoundingClientRect();
      const insideHero = heroRect && heroRect.top <= anchorY && heroRect.bottom >= anchorY;
      const featuresSection = document.querySelector('.lp-features-section');
      const featuresRect = featuresSection?.getBoundingClientRect();
      const insideFeatures = featuresRect && featuresRect.top <= anchorY && featuresRect.bottom >= anchorY;
      const methodSection = document.querySelector('.lp-methodology-section');
      const methodRows = Array.from(document.querySelectorAll('.lp-method-row'));
      const activeRow = methodRows.find((row) => {
        const rect = row.getBoundingClientRect();
        return rect.top <= anchorY && rect.bottom >= anchorY;
      });
      const methodRect = methodSection?.getBoundingClientRect();
      const insideMethod = methodRect && methodRect.top <= anchorY && methodRect.bottom >= anchorY;

      if (window.scrollY <= 1) {
        setZone('start', { side: 'right', speech: 'Marhaba! 👋', top: '22vh', scale: 1, rotate: '0deg' });
      } else if (insideFeatures) {
        setZone('features', { side: 'left', speech: 'Chouf les fonctionnalités! ✨', top: '24vh', scale: 1.05, rotate: '0deg' });
      } else if (activeRow || (insideMethod && methodRows.length)) {
        const row = activeRow || methodRows.reduce((closest, candidate) => {
          const candidateRect = candidate.getBoundingClientRect();
          const closestRect = closest.getBoundingClientRect();
          return Math.abs(candidateRect.top + candidateRect.height / 2 - anchorY) < Math.abs(closestRect.top + closestRect.height / 2 - anchorY) ? candidate : closest;
        }, methodRows[0]);
        const stepIndex = methodRows.indexOf(row);
        setZone(`step-${stepIndex}`, {
          side: stepIndex % 2 === 0 ? 'left' : 'right',
          speech: row.dataset.mascotSpeech || 'Yallah nkemlo!',
          top: `${24 + (stepIndex % 3) * 3}vh`,
          scale: 1.15,
          rotate: stepIndex % 2 === 0 ? '-6deg' : '6deg'
        });
      } else if (insideHero) {
        setZone('hero', { side: 'right', speech: 'Marhaba! 👋', top: '22vh', scale: 1, rotate: '0deg' });
      } else if (methodSection && anchorY < methodSection.getBoundingClientRect().top) {
        const passedFeatures = featuresRect && featuresRect.bottom < anchorY;
        setZone(passedFeatures ? 'after-features' : 'approach', { side: 'right', speech: 'Nbdaw b planning! 📅', top: '25vh', scale: 1.08, rotate: '-4deg' });
      } else {
        const nextSection = [
          { selector: '#apropos', pose: { side: 'right', speech: 'Chouf l-progress dyalk! 📊', top: '28vh', scale: 1.1, rotate: '4deg' } },
          { selector: '#tarifs', pose: { side: 'right', speech: 'Khtar l-formule li tnasbek! ⭐', top: '28vh', scale: 1.2, rotate: '5deg' } },
          { selector: '#faq', pose: { side: 'left', speech: '3endek chi sou2al? 💡', top: '32vh', scale: 1.08, rotate: '-5deg' } },
          { selector: '.lp-bottom-cta-section', pose: { side: 'center', speech: 'Yallah, bda l-mouchwar! 🚀', top: '24vh', scale: 1.18, rotate: '0deg' } },
          { selector: '.lp-footer', pose: { side: 'center', speech: 'B tawfiq! 🎓', top: '30vh', scale: 1, rotate: '0deg' } }
        ].find(({ selector }) => {
          const section = document.querySelector(selector);
          if (!section) return false;
          const rect = section.getBoundingClientRect();
          return rect.top <= anchorY && rect.bottom >= anchorY;
        });

        if (nextSection) {
          setZone(nextSection.selector, nextSection.pose);
        } else if (methodSection && anchorY >= methodSection.getBoundingClientRect().bottom) {
          setZone('last-step', { side: 'left', speech: methodRows[methodRows.length - 1]?.dataset.mascotSpeech || 'Bravo! 🎓', top: '28vh', scale: 1.15, rotate: '-5deg' });
        } else {
          setZone('approach', { side: 'right', speech: 'Nbdaw b planning! 📅', top: '25vh', scale: 1.08, rotate: '-4deg' });
        }
      }
      updateOwlMotion();
    };

    const handleMouseMove = (event) => {
      mascotMouseXRef.current = event.clientX;
      updateOwlMotion();
    };

    let scrollFrame = 0;
    const scheduleScrollUpdate = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        handleScroll();
      });
    };

    handleScroll();
    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleScrollUpdate);
      window.removeEventListener('resize', scheduleScrollUpdate);
      window.removeEventListener('mousemove', handleMouseMove);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
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

        revealGroup('.lp-features-section', '.lp-section-header > *, .lp-feature-story-card, .lp-features-cta');
        revealGroup('.lp-methodology-section', '.lp-section-header > *, .lp-method-copy, .lp-method-preview');
        revealGroup('.lp-stats-section', '.lp-stats-intro > *, .lp-stat-card', { stagger: 0.14 });
        revealGroup('.lp-pricing-section', '.lp-section-header > *, .lp-pricing-toggle-wrap, .lp-discount-badge, .lp-plan-card, .lp-plan-btn');
        revealGroup('.lp-faq-section', '.lp-section-header > *, .lp-faq-item');
        revealGroup('.lp-bottom-cta-section', '.lp-bottom-cta-content > *');
        revealGroup('.lp-footer', '.lp-footer-brand > *, .lp-footer-col, .lp-footer-bottom > *', { start: 'top 80%', stagger: 0.08 });

        // Scroll reveals for sections
        gsap.to('.lp-method-track-fill', {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.lp-method-timeline',
            start: 'top 65%',
            end: 'bottom 70%',
            scrub: 0.5
          }
        });
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

const partnerLogos = [
  { src: logoEnsaMarocImg, alt: 'ENSA Maroc' },
  { src: logoEnsamiImg, alt: 'ENSAM' },
  { src: logoFmpcImg, alt: 'Faculté de médecine et de pharmacie' },
  { src: logoEncgImg, alt: 'ENCG' }
];

  return (
    <div className="landing-root" ref={rootRef}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <div className="lp-grain" aria-hidden="true" />

      {/* ====================================================================
          1. NAVIGATION HEADER
      ==================================================================== */}
      <button
        ref={mascotRef}
        className={`lp-scroll-mascot is-${mascotNavigation.side}${mascotNavigation.zone === 'features' ? ' is-features' : ''}${mascotNavigation.zone === 'approach' ? ' is-hidden' : ''}${['start', 'hero', 'approach'].includes(mascotNavigation.zone) ? ' is-hero' : ''}`}
        style={{ '--mascot-top': mascotNavigation.top, '--mascot-scale': mascotNavigation.scale, '--mascot-rotate': mascotNavigation.rotate }}
        type="button"
        aria-label="Faire bouger la mascotte"
        onClick={() => setMascotClickCount((count) => count + 1)}
      >
        <span key={mascotNavigation.speech} className="lp-mascot-speech" aria-live="polite">{mascotNavigation.speech}</span>
        <span className={`lp-scroll-mascot-action ${mascotClickCount ? 'is-clicked' : ''}`} key={mascotClickCount}>
          <LandingMascot className="lp-scroll-mascot-art" />
        </span>
      </button>

      <nav className={`lp-nav${hasScrolled ? ' has-scrolled' : ''}`} id="nav">
        <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="lp-nav-mascot lp-brand-cap" aria-hidden="true">
            <svg viewBox="0 0 48 42" fill="none">
              <path d="M4 15 24 5l20 10-20 10L4 15Z" fill="#0b2d63" />
              <path d="M11 19v9c7 6 19 6 26 0v-9" fill="#0b2d63" />
              <path d="M42 16v16" stroke="#e2ae4f" strokeWidth="2" strokeLinecap="round" />
              <circle cx="42" cy="34" r="2.5" fill="#e2ae4f" />
            </svg>
          </span>
          <span className="lp-wordmark"><span className="lp-wordmark-prefix">E-</span><span className="lp-wordmark-main">CONCOURS</span></span>
        </div>

        <ul className="lp-nav-links">
          <li>
            <a href="#methodologie" onClick={(e) => { e.preventDefault(); handleScrollTo('methodologie'); }}>
              Comment ça marche
            </a>
          </li>
          <li>
            <a href="#fonctionnalites" onClick={(e) => { e.preventDefault(); handleScrollTo('fonctionnalites'); }}>
              Fonctionnalités
            </a>
          </li>
          <li>
            <a href="#tarifs" onClick={(e) => { e.preventDefault(); handleScrollTo('tarifs'); }}>
              Tarifs
            </a>
          </li>
          <li>
            <a href="#faq" onClick={(e) => { e.preventDefault(); handleScrollTo('faq'); }}>
              FAQ
            </a>
          </li>
        </ul>

        <div className="lp-nav-actions">
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
            <text x="4" y="12" fill="#3478c8" fontSize="11" fontFamily="Georgia,serif" fontStyle="italic">N₂</text>
            <path d="M22 25h27M22 29h27" stroke="#4d8de0" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="17" cy="27" r="6" fill="#fff" stroke="#3478c8" strokeWidth="1.5" />
            <circle cx="54" cy="27" r="6" fill="#fff" stroke="#3478c8" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="lp-hero-water-molecule" aria-hidden="true">
          <svg viewBox="0 0 100 66" fill="none">
            <path d="M50 30 26 49M50 30l24 19" stroke="#3b82f6" strokeWidth="1.8" />
            <circle cx="50" cy="27" r="8" fill="#fff" stroke="#f59e0b" strokeWidth="1.8" />
            <circle cx="22" cy="52" r="7" fill="#fff" stroke="#3b82f6" strokeWidth="1.8" />
            <circle cx="78" cy="52" r="7" fill="#fff" stroke="#3b82f6" strokeWidth="1.8" />
            <text x="3" y="14" fill="#2563eb" fontSize="11" fontFamily="'Fira Code', monospace">H₂O</text>
          </svg>
        </div>
        <div className="lp-hero-ruler" aria-hidden="true">
          <span>01</span><i /><span>f(x)=y</span><i /><span>∞</span>
        </div>
        <div className="lp-hero-science-decor lp-hero-science-decor--atom" aria-hidden="true">
          <svg viewBox="0 0 90 90" fill="none">
            <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(-35 45 45)" stroke="#3b82f6" strokeWidth="1.7" />
            <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(35 45 45)" stroke="#60a5fa" strokeWidth="1.7" />
            <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(90 45 45)" stroke="#93c5fd" strokeWidth="1.7" />
            <circle cx="45" cy="45" r="5" fill="#f59e0b" />
            <circle cx="71" cy="29" r="3.5" fill="#2563eb" />
            <circle cx="27" cy="61" r="3.5" fill="#2563eb" />
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
            <path d="M20 10 Q50 30 20 50 Q-10 70 20 90 Q50 110 20 130" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M60 10 Q30 30 60 50 Q90 70 60 90 Q30 110 60 130" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" />
            <line x1="28" y1="20" x2="52" y2="20" stroke="#93c5fd" strokeWidth="1.8" />
            <line x1="18" y1="35" x2="62" y2="35" stroke="#bfdbfe" strokeWidth="1.5" />
            <line x1="20" y1="50" x2="60" y2="50" stroke="#93c5fd" strokeWidth="1.8" />
            <line x1="18" y1="65" x2="62" y2="65" stroke="#bfdbfe" strokeWidth="1.5" />
            <line x1="28" y1="80" x2="52" y2="80" stroke="#93c5fd" strokeWidth="1.8" />
            <line x1="18" y1="95" x2="62" y2="95" stroke="#bfdbfe" strokeWidth="1.5" />
            <line x1="20" y1="110" x2="60" y2="110" stroke="#93c5fd" strokeWidth="1.8" />
            <line x1="28" y1="125" x2="52" y2="125" stroke="#bfdbfe" strokeWidth="1.5" />
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
          <svg viewBox="0 0 140 90" fill="none"><path d="M10 80h120M20 85V10" stroke="currentColor" strokeDasharray="3 3" /><path d="M20 70Q50 10 80 50T130 15" stroke="#2563eb" strokeWidth="2" /><circle cx="80" cy="50" r="3" fill="#2563eb" /><text x="90" y="45">f(x)</text></svg>
        </div>
        <div className="lp-math-graph lp-math-graph--right" aria-hidden="true">
          <svg viewBox="0 0 130 80" fill="none"><path d="M10 70h110M20 75V10" stroke="currentColor" /><path d="M20 65Q60 65 110 15" stroke="#1e40af" strokeWidth="2" /><text x="64" y="30">∫ eˣ dx</text></svg>
        </div>
        <div className="lp-math-graph lp-math-graph--exponential" aria-hidden="true">
          <svg viewBox="0 0 130 90" fill="none"><path d="M10 75h110M20 82V10" stroke="currentColor" /><path d="M22 70C43 68 51 63 65 51S88 28 112 14" stroke="#2563eb" strokeWidth="2" /><text x="8" y="12">y</text><text x="119" y="84">x</text><text x="69" y="36">eˣ</text></svg>
        </div>
        <div className="lp-math-graph lp-math-graph--area" aria-hidden="true">
          <svg viewBox="0 0 150 100" fill="none"><path d="M12 84h126M24 91V12" stroke="currentColor" /><path d="M26 28C48 32 51 58 72 68S111 78 132 82L132 84H26Z" fill="rgba(245,158,11,.16)" /><path d="M26 28C48 32 51 58 72 68S111 78 132 82" stroke="#2563eb" strokeWidth="2" /><path d="m31 40 35 38M43 36l40 44M57 45l39 35M73 60l30 23" stroke="#f59e0b" strokeWidth="1" opacity=".55" /><text x="8" y="12">z</text><text x="139" y="92">x</text></svg>
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
            <path d="M159 19v7m-3.5-3.5h7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="lp-hero-title">
          Pr&eacute;parez vos <span className="lp-title-underlined">concours</span>,<br />
          assurez votre <span className="lp-hero-gradient-text">avenir.</span>
        </h1>
        <p className="lp-hero-desc">La plateforme tout-en-un pour bien pr&eacute;parer vos concours au Maroc.</p>

        <div className="lp-hero-actions">
          <div className="lp-hero-cta">
            <div
              className="lp-hero-mascot-companion"
              onClick={() => handleNav('register')}
              role="button"
              tabIndex={0}
              title="Jarab fabor avec la mascotte ECONCOURS"
              aria-label="Mascotte tenant son carnet de notes"
            >
              <LandingMascot className="lp-mascot-hero-note" holdingNotebook={true} />
            </div>
            <button className="lp-btn-hero-primary" type="button" onClick={() => handleScrollTo('methodologie')}>
              <span>Jarab fabor</span>
            </button>
          </div>
        </div>

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
      <section className="lp-methodology-section" id="methodologie">
        <div className="lp-section-header lp-methodology-header">
          <h2 className="lp-methodology-title">
            Votre <span>parcours</span>
          </h2>
          <p className="lp-methodology-subtitle">
            De la révision à l'admission · 7 étapes clés
          </p>
        </div>

        <div className="lp-method-timeline">
          <div className="lp-method-track" aria-hidden="true">
            <span className="lp-method-track-fill" style={{ display: 'none' }} />
          </div>
          {[
            {
              number: '01',
              side: 'left-card',
              isOrangeNode: false,
              kicker: 'PLANIFIER',
              kickerIcon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ),
              title: 'Calendrier & agenda',
              pills: ['Dates des concours', 'Inscriptions', 'Planning personnel'],
              subtitle: 'ENSA · ENSAM · Médecine · ENCG',
              cardBadge: 'Agenda',
              urlPath: 'e-concours.ma/client-calendrier',
              screenshotUrl: '/screenshots/step-01-calendrier.png',
              route: '/client-calendrier',
              speech: 'Nbdaw b planning! 📅'
            },
            {
              number: '02',
              side: 'right-card',
              isOrangeNode: false,
              kicker: 'COMPRENDRE',
              kickerIcon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              ),
              title: 'Cours & examens nationaux',
              pills: ['Cours du Bac', 'Annales', 'Corrigés détaillés'],
              subtitle: 'Mathématiques · Physique · SVT',
              cardBadge: 'Examens',
              urlPath: 'e-concours.ma/client-examens',
              screenshotUrl: '/screenshots/step-02-examens.png',
              route: '/client-examens',
              speech: 'Fhem dars mzyan! 📚'
            },
            {
              number: '03',
              side: 'left-card',
              isOrangeNode: false,
              kicker: 'SYNTHÉTISER',
              kickerIcon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              ),
              title: 'Fiches de révision',
              pills: ['Formules clés', 'Résumés', 'Notions essentielles'],
              subtitle: 'Révision rapide par chapitre',
              cardBadge: 'Fiches',
              urlPath: 'e-concours.ma/client-resumes',
              screenshotUrl: '/screenshots/step-03-resumes.png',
              route: '/client-resumes',
              speech: 'Wjjed résumé dyalk! 📝'
            },
            {
              number: '04',
              side: 'right-card',
              isOrangeNode: false,
              kicker: "S'ENTRAÎNER",
              kickerIcon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2.5 1.5" />
                  <path d="M12 2v3" />
                  <path d="M9 2h6" />
                </svg>
              ),
              title: 'Concours blancs',
              pills: ['QCM chronométrés', 'Matières', 'Chapitres'],
              subtitle: 'Score · Temps · Progression',
              cardBadge: 'QCM Blanc',
              urlPath: 'e-concours.ma/client-concours-blanc',
              screenshotUrl: '/screenshots/step-04-concours-blanc.png',
              route: '/client-concours-blanc',
              speech: 'Dreb QCM b chrono! ⏱️'
            },
            {
              number: '05',
              side: 'left-card',
              isOrangeNode: false,
              kicker: 'SE PRÉPARER',
              kickerIcon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              ),
              title: 'Annales des concours',
              pills: ['Sujets officiels', 'QCM interactifs', 'Barèmes'],
              subtitle: 'Préparation par école',
              cardBadge: 'Annales',
              urlPath: 'e-concours.ma/client-concours',
              screenshotUrl: '/screenshots/step-05-concours.png',
              route: '/client-concours',
              speech: 'Jarrab annales l’école! 🏛️'
            },
            {
              number: '06',
              side: 'right-card',
              isOrangeNode: false,
              kicker: 'PROGRESSER',
              kickerIcon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21.5 2v6h-6" />
                  <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              ),
              title: 'Révision des erreurs',
              pills: ['Erreurs sauvegardées', 'Explications', 'Ciblage'],
              subtitle: 'Révision ciblée · Amélioration continue',
              cardBadge: 'Erreurs',
              urlPath: 'e-concours.ma/client-erreurs',
              screenshotUrl: '/screenshots/step-06-erreurs.png',
              route: '/client-erreurs',
              speech: 'Raja3 les erreurs dyalk! 🔄'
            },
            {
              number: '07',
              side: 'left-card',
              isOrangeNode: true,
              kicker: 'ATTEINDRE SON OBJECTIF',
              kickerIcon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              ),
              title: 'Dashboard & progression',
              pills: ['Statistiques', 'Précision', 'Chapitres maîtrisés'],
              subtitle: 'Objectif : admissibilité',
              cardBadge: 'Dashboard',
              urlPath: 'e-concours.ma/client-dashboard',
              screenshotUrl: '/screenshots/step-07-dashboard.png',
              route: '/client-dashboard',
              speech: 'Qrebti l’admissibilité! 🚀'
            }
          ].map((step) => {
            const isLeftCard = step.side === 'left-card';

            const cardElement = (
              <div className="lp-method-preview lp-method-col-card">
                <div
                  className="lp-skeuo-window"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleFeatureClick(step)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFeatureClick(step);
                    }
                  }}
                  aria-label={`Essai gratuit : ${step.title}`}
                  title={`Cliquer pour essayer gratuitement : ${step.title}`}
                >
                  <div className="lp-skeuo-titlebar">
                    <div className="lp-skeuo-controls" aria-hidden="true">
                      <span className="lp-skeuo-dot dot-close" />
                      <span className="lp-skeuo-dot dot-min" />
                      <span className="lp-skeuo-dot dot-expand" />
                    </div>
                    <div className="lp-skeuo-address-bar" aria-hidden="true">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lp-skeuo-lock-icon">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span className="lp-skeuo-url">{step.urlPath}</span>
                    </div>
                    <div className="lp-skeuo-badge">
                      <span className="lp-skeuo-pill">{step.cardBadge}</span>
                    </div>
                  </div>

                  <div className="lp-skeuo-viewport">
                    <img
                      src={step.screenshotUrl}
                      alt={`Capture d'écran E-CONCOURS : ${step.title}`}
                      className="lp-skeuo-img"
                      loading="lazy"
                    />
                    <div className="lp-skeuo-glare" aria-hidden="true" />
                    <div className="lp-skeuo-hover-cta">
                      <span className="lp-skeuo-cta-btn">
                        <span>Essai gratuit</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );

            const infoElement = (
              <div className="lp-method-copy lp-method-col-info">
                <div className="lp-method-info">
                  <div className="lp-method-info-kicker">
                    {step.kickerIcon}
                    <span>{step.kicker}</span>
                  </div>
                  <h3 className="lp-method-info-title">{step.title}</h3>
                  <div className="lp-method-info-pills">
                    {step.pills.map((pill) => (
                      <span key={pill} className="lp-method-info-pill">{pill}</span>
                    ))}
                  </div>
                  <p className="lp-method-info-subtitle">{step.subtitle}</p>
                </div>
              </div>
            );

            return (
              <article
                className={`lp-method-row ${isLeftCard ? 'is-left' : 'is-right'}`}
                data-mascot-speech={step.speech}
                key={step.number}
              >
                {/* Left side */}
                {isLeftCard ? cardElement : infoElement}

                {/* Center node */}
                <div className="lp-method-node-wrap">
                  <div className={`lp-method-node-circle ${step.isOrangeNode ? 'is-orange' : ''}`}>
                    {step.number}
                  </div>
                </div>

                {/* Right side */}
                {isLeftCard ? infoElement : cardElement}
              </article>
            );
          })}

          {/* Bottom Admission Goal Node */}
          <div className="lp-methodology-goal">
            <div className="lp-methodology-goal-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
              </svg>
            </div>
            <span className="lp-methodology-goal-title">Admission</span>
          </div>
        </div>
      </section><section className="lp-features-section fk" id="fonctionnalites">
        <div className="fk-content-wrap">
        <span className="fk-badge">Fonctionnalités clés</span>
        <h2>Une préparation adaptée à tes <b>objectifs</b></h2>
        <p className="fk-sub">Suis ta progression, organise tes révisions et corrige tes erreurs, au même endroit.</p>

        <div className="fk-grid">
          <article className="fk-card fk-green">
            <div className="fk-vis" aria-hidden="true">
              <div className="fk-ring"><i>85%</i></div>
              <div className="fk-bars"><span style={{ height: '30%' }} /><span style={{ height: '50%' }} /><span style={{ height: '42%' }} /><span style={{ height: '80%' }} /><span style={{ height: '100%' }} /></div>
            </div>
            <h3>Dashboard de progression</h3>
            <p>Analyse tes résultats et suis ton évolution au fil des révisions.</p>
          </article>

          <article className="fk-card">
            <div className="fk-vis" aria-hidden="true">
              <div className="fk-cal">
                <span className="on" /><span /><span className="on" /><span /><span className="on" /><span /><span />
                <span /><span className="on" /><span /><span className="on" /><span /><span className="on" /><span />
                <span className="on" /><span /><span /><span className="on" /><span /><span /><span className="on" />
              </div>
            </div>
            <h3>Calendrier personnalisé</h3>
            <p>Organise tes séances et tes objectifs de révision sur mesure.</p>
          </article>

          <article className="fk-card fk-violet fk-dark">
            <div className="fk-vis" aria-hidden="true">
              <div className="fk-qcm">
                <b />
                <div><u>A</u><em /></div>
                <div className="ok"><u>B</u><em /><s>✓</s></div>
                <div><u>C</u><em /></div>
              </div>
            </div>
            <h3>Entraînement personnalisé</h3>
            <p>Entraîne-toi par matière, chapitre ou concours d’école ciblé.</p>
          </article>

          <article className="fk-card fk-orange">
            <div className="fk-vis" aria-hidden="true">
              <div className="fk-err">
                <div><b>×</b><em /><strong>✓</strong></div>
                <div><b>×</b><em /><strong>✓</strong></div>
                <div><b>×</b><em /><strong>✓</strong></div>
              </div>
            </div>
            <h3>Sauvegarde des erreurs</h3>
            <p>Retrouve automatiquement les questions incorrectes et leurs corrections.</p>
          </article>
        </div>

        <button className="fk-cta" type="button" onClick={() => handleNav('register')}>
          Accéder à toutes les fonctionnalités <span aria-hidden="true">→</span>
        </button>
        </div>
      </section>
      {/* ====================================================================
          8. STATS & IMPACT SECTION (DARK THEME)
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
              price: '500',
              features: ['Médecine', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
            {
              name: 'ENSAM',
              pack: 'ENSAM',
              description: 'Accès complet au concours ENSAM',
              price: '400',
              features: ['ENSAM', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
            {
              name: 'ENSA',
              pack: 'ENSA',
              description: 'Accès complet ENSA',
              price: '300',
              features: ['ENSA', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
            {
              name: 'Médecine + ENSA',
              pack: 'MEDECINE_ENSA',
              description: 'Les deux concours, un seul paiement',
              price: '700',
              saving: 'Économisez 100 DH vs les packs séparés',
              features: ['ENSA', 'Médecine', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
            {
              name: 'ENCG',
              pack: 'ENCG',
              description: 'Accès complet au concours ENCG',
              price: '400',
              features: ['ENCG', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
            {
              name: 'Médecine + ENSA + ENSAM',
              pack: 'PACK_COMPLET',
              description: 'Les trois concours — ENCG offert',
              price: '1000',
              featured: true,
              features: ['Médecine', 'ENSA', 'ENSAM', 'ENCG', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
            },
          ].map((plan) => (
            <div className={`lp-plan-card${plan.featured ? ' is-featured' : ''}`} key={plan.name}>
              {plan.featured && <div className="lp-featured-ribbon">⭐ LE PLUS CHOISI</div>}
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
          11. BOTTOM CTA BANNER
      ==================================================================== */}
      <section className="lp-bottom-cta-section">
        <div className="lp-bottom-cta-card">
          <div className="lp-bottom-cta-content">
            <span className="lp-bottom-cta-kicker"><i aria-hidden="true">✦</i> TON PROCHAIN CHAPITRE COMMENCE ICI</span>
            <h2>Prêt à intégrer la <span>Grande École</span> de tes rêves ?</h2>
          </div>
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
            <div className="lp-footer-made-in">
              Conçu avec passion pour la jeunesse marocaine.
            </div>
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
            <h4>Plateforme</h4>
            <ul>
              <li><a href="#fonctionnalites" onClick={(e) => { e.preventDefault(); handleScrollTo('fonctionnalites'); }}>Fonctionnalités</a></li>
              <li><a href="#methodologie" onClick={(e) => { e.preventDefault(); handleScrollTo('methodologie'); }}>Comment ça marche</a></li>
              <li><a href="#tarifs" onClick={(e) => { e.preventDefault(); handleScrollTo('tarifs'); }}>Tarifs & Packs</a></li>
            </ul>
          </div>

          <div className="lp-footer-col">
            <h4>Concours</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('register'); }}>Concours ENSA</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('register'); }}>Concours ENSAM</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('register'); }}>Concours Médecine (FMP)</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('register'); }}>Concours ENCG</a></li>
            </ul>
          </div>

          <div className="lp-footer-col">
            <h4>Espace Membre</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('login'); }}>Se connecter</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('register'); }}>Créer un compte</a></li>
              <li><a href="#faq" onClick={(e) => { e.preventDefault(); handleScrollTo('faq'); }}>Aide & FAQ</a></li>
              <li><a href="mailto:support@econcours.ma">Support & Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© 2027 E-CONCOURS. Tous droits réservés.</span>
          <span>Préparation aux Concours d’Accès aux Grandes Écoles du Maroc.</span>
        </div>
      </footer>
    </div>
  );
}
