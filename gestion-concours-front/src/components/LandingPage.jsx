import React, { useEffect, useId, useRef, useState } from 'react';
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

export function LandingMascot({ className = '', showCap = true, wave = false }) {
  const mascotId = useId().replace(/:/g, '');
  const mascotClassName = `${className}${wave ? ' lp-mascot--wave' : ''}`.trim();
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
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Mini-Quiz interactive demo state
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [mascotClickCount, setMascotClickCount] = useState(0);
  const [mascotNavigation, setMascotNavigation] = useState({ zone: 'start', side: 'right', speech: 'Marhaba! 👋', top: '22vh', scale: 1, rotate: '0deg' });
  const mascotRef = useRef(null);
  const mascotProgressRef = useRef(0);
  const mascotMouseXRef = useRef(window.innerWidth / 2);

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
          { selector: '#demo-qcm', pose: { side: 'left', speech: 'Yallah, jarrab QCM! ✏️', top: '25vh', scale: 1.18, rotate: '-5deg' } },
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
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        // Entrance animations
        gsap.from('.lp-hero-badge', { opacity: 0, y: -20, duration: 0.7, ease: 'power3.out', delay: 0.1 });
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
        revealGroup('.lp-quiz-demo-section', '.lp-section-header > *, .lp-quiz-widget');
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

  const handleSelectQuizOption = (opt) => {
    if (quizSubmitted) return;
    setQuizAnswer(opt);
    setQuizSubmitted(true);
  };

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
        className={`lp-scroll-mascot is-${mascotNavigation.side}${mascotNavigation.zone === 'features' ? ' is-features' : ''}${['start', 'hero', 'approach'].includes(mascotNavigation.zone) ? ' is-hero' : ''}`}
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

      <nav className="lp-nav" id="nav">
        <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="lp-nav-mascot lp-brand-cap" aria-hidden="true">
            <svg viewBox="0 0 48 42" fill="none">
              <path d="M4 15 24 5l20 10-20 10L4 15Z" fill="#174f9b" />
              <path d="M11 19v9c7 6 19 6 26 0v-9" fill="#245fa9" />
              <path d="M42 16v16" stroke="#e2ae4f" strokeWidth="2" strokeLinecap="round" />
              <circle cx="42" cy="34" r="2.5" fill="#e2ae4f" />
            </svg>
          </span>
          <span className="lp-wordmark">ÉCONCOURS</span>
        </div>

        <ul className="lp-nav-links">
          <li>
            <a href="#fonctionnalites" onClick={(e) => { e.preventDefault(); handleScrollTo('fonctionnalites'); }}>
              Fonctionnalités
            </a>
          </li>
          <li>
            <a href="#methodologie" onClick={(e) => { e.preventDefault(); handleScrollTo('methodologie'); }}>
              Méthodologie
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
          <li>
            <a href="/login" onClick={(e) => { e.preventDefault(); handleNav('login'); }}>
              Se connecter
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
          <button className="lp-btn-try" type="button" onClick={() => handleScrollTo('demo-qcm')}>
            Essayer gratuitement
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
          <a href="#fonctionnalites" onClick={(e) => { e.preventDefault(); handleScrollTo('fonctionnalites'); }}>
            Fonctionnalités
          </a>
          <a href="#methodologie" onClick={(e) => { e.preventDefault(); handleScrollTo('methodologie'); }}>
            Méthodologie
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
        <div className="lp-hero-ruler" aria-hidden="true">
          <span>01</span><i /><span>f(x)=y</span><i /><span>∞</span>
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
        <div className="lp-math-note lp-math-note--newton" aria-hidden="true">∑ F⃗ = m · a⃗</div>
        <div className="lp-math-graph lp-math-graph--left" aria-hidden="true">
          <svg viewBox="0 0 140 90" fill="none"><path d="M10 80h120M20 85V10" stroke="currentColor" strokeDasharray="3 3" /><path d="M20 70Q50 10 80 50T130 15" stroke="#2563eb" strokeWidth="2" /><circle cx="80" cy="50" r="3" fill="#2563eb" /><text x="90" y="45">f(x)</text></svg>
        </div>
        <div className="lp-math-graph lp-math-graph--right" aria-hidden="true">
          <svg viewBox="0 0 130 80" fill="none"><path d="M10 70h110M20 75V10" stroke="currentColor" /><path d="M20 65Q60 65 110 15" stroke="#1e40af" strokeWidth="2" /><text x="64" y="30">∫ eˣ dx</text></svg>
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
        <h1 className="lp-hero-title">
          Pr&eacute;parez vos <span className="lp-title-underlined">concours</span>,<br />
          assurez votre <span className="lp-hero-gradient-text">avenir.</span>
        </h1>
        <p className="lp-hero-desc">La plateforme tout-en-un pour bien pr&eacute;parer vos concours au Maroc.</p>

        <div className="lp-hero-actions">
          <button className="lp-btn-hero-primary" type="button" onClick={() => handleNav('register')}>
            <span className="lp-cta-mascot" aria-hidden="true"><LandingMascot className="lp-mascot-art" /></span>
            <span aria-hidden="true">🚀</span>
            <span>Essayer gratuitement</span>
          </button>
          <button className="lp-btn-hero-secondary" type="button" onClick={() => handleScrollTo('demo-qcm')}>
            <span>Essayer gratuitement</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <div className="lp-partner-strip" aria-label="Écoles préparées">
          <div className="lp-partner-logos lp-marquee-mask">
            <div className="lp-partner-track">
              {[0, 1].map((copy) => (
                <div className="lp-partner-group" key={copy} aria-hidden={copy === 1 ? 'true' : undefined}>
                  {partnerLogos.map((logo) => (
                    <div className="lp-partner-logo-item" key={logo.alt}>
                      <img src={logo.src} alt={copy === 0 ? logo.alt : ''} />
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
          5b. FONCTIONNALITÉS CLÉS DE LA PLATEFORME
      ==================================================================== */}
      <section className="lp-features-section" id="fonctionnalites">
        <div className="lp-features-layout">
          <div className="lp-features-mascot-space" aria-hidden="true" />
          <div className="lp-features-content">
            <div className="lp-section-header">
              <span className="lp-section-eyebrow">CE QU'ON OFFRE</span>
              <h2 className="lp-section-title">
                Fonctionnalités Clés<br /><span>de la Plateforme</span>
              </h2>
              <p className="lp-section-desc">
                Tout ce dont tu as besoin pour préparer ton Bac et réussir les concours des grandes écoles.
              </p>
            </div>

            <div className="lp-features-categories">
              <div className="lp-feat-category">
                <div className="lp-feat-cat-label lp-feat-cat-label--a">
                  <span className="lp-feat-cat-letter">A</span><span>Suivi Dynamique</span>
                </div>
                <div className="lp-feat-cards-row">
                  <div className="lp-feat-card">
                    <span className="lp-feat-card-icon"><FeatureIcon name="profile" /></span>
                    <div><strong>Profil Étudiant</strong><p>Espace personnalisé avec ta photo, ton nom et ton historique de progression complet.</p></div>
                  </div>
                  <div className="lp-feat-card">
                    <span className="lp-feat-card-icon"><FeatureIcon name="calendar" /></span>
                    <div><strong>Calendrier Interactif</strong><p>Événements officiels des concours et événements personnels de révision.</p></div>
                  </div>
                  <div className="lp-feat-card">
                    <span className="lp-feat-card-icon"><FeatureIcon name="dashboard" /></span>
                    <div><strong>Dashboard Global</strong><p>Vue d'ensemble interactive avec graphiques de progression en temps réel.</p></div>
                  </div>
                </div>
              </div>

              <div className="lp-feat-category">
                <div className="lp-feat-cat-label lp-feat-cat-label--b">
                  <span className="lp-feat-cat-letter">B</span><span>Contenus Pédagogiques</span>
                </div>
                <div className="lp-feat-cards-row">
                  <div className="lp-feat-card">
                    <span className="lp-feat-card-icon"><FeatureIcon name="course" /></span>
                    <div><strong>Cours Complets Bac</strong><p>Cours structurés et complets selon le programme officiel du Baccalauréat marocain.</p></div>
                  </div>
                  <div className="lp-feat-card">
                    <span className="lp-feat-card-icon"><FeatureIcon name="summary" /></span>
                    <div><strong>Résumés LaTeX</strong><p>Fiches de synthèse formatées en LaTeX avec formules essentielles et condensés.</p></div>
                  </div>
                  <div className="lp-feat-card">
                    <span className="lp-feat-card-icon"><FeatureIcon name="papers" /></span>
                    <div><strong>Annales Corrigées</strong><p>Annales des concours officiels corrigées étape par étape pour chaque école.</p></div>
                  </div>
                </div>
              </div>

              <div className="lp-feat-category">
                <div className="lp-feat-cat-label lp-feat-cat-label--c">
                  <span className="lp-feat-cat-letter">C</span><span>Moteur de Test</span>
                </div>
                <div className="lp-feat-cards-row">
                  <div className="lp-feat-card lp-feat-card--timer">
                    <span className="lp-feat-card-icon"><FeatureIcon name="timer" /></span>
                    <div><strong>Tests Chronométrés</strong><p>Compte à rebours officiel pour simuler les conditions réelles des concours.</p></div>
                    <div className="lp-feat-timer-badge">00 : 00 : 39</div>
                  </div>
                  <div className="lp-feat-card">
                    <span className="lp-feat-card-icon"><FeatureIcon name="quiz" /></span>
                    <div><strong>QCM par Chapitre &amp; École</strong><p>Questions organisées par matière, chapitre et institution (ENSA, Médecine…).</p></div>
                  </div>
                  <div className="lp-feat-card">
                    <span className="lp-feat-card-icon"><FeatureIcon name="save" /></span>
                    <div><strong>Sauvegarde Automatique des Erreurs</strong><p>Toutes tes fautes sont enregistrées automatiquement pour révision ciblée.</p></div>
                  </div>
                </div>
              </div>

              <div className="lp-feat-category">
                <div className="lp-feat-cat-label lp-feat-cat-label--d">
                  <span className="lp-feat-cat-letter">D</span><span>Ciblage des Erreurs</span>
                </div>
                <div className="lp-feat-cards-row lp-feat-cards-row--duo">
                  <div className="lp-feat-card lp-feat-card--duo">
                    <span className="lp-feat-card-icon"><FeatureIcon name="correction" /></span>
                    <div><strong>Correction Intelligente</strong><p>Smart correction — analyse automatique de tes erreurs avec retour détaillé et conseils.</p></div>
                  </div>
                  <div className="lp-feat-card lp-feat-card--duo lp-feat-card--accent">
                    <span className="lp-feat-card-icon"><FeatureIcon name="target" /></span>
                    <div><strong>Objectif Zéro Faute</strong><p>Goal tracking — suivi de ton objectif jusqu'à la maîtrise totale de chaque chapitre.</p></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-features-cta">
              <button className="lp-btn-primary lp-features-start-btn" type="button" onClick={() => handleNav('register')}>
                <span>Accéder à toutes les fonctionnalités</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. 3-STEP METHODOLOGY SECTION (STYLE KRESCO)
      ==================================================================== */}
      <section className="lp-methodology-section" id="methodologie">
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">LA MÉTHODE DE L'EXCELLENCE</span>
          <h2 className="lp-section-title">
            Le parcours ÉCONCOURS<br />de la révision à l'admission.
          </h2>
          <p className="lp-section-desc">
            Sept étapes pour organiser tes révisions, t'entraîner efficacement et suivre ta progression jusqu'aux concours.
          </p>
        </div>

        <div className="lp-method-timeline">
          <div className="lp-method-track" aria-hidden="true"><span className="lp-method-track-fill" /></div>
          {[
            { icon: '📅', label: 'PLANIFIER', title: 'Calendrier des concours & agenda personnel', text: "Suis les dates d'inscription et les épreuves officielles des concours ENSA, ENSAM, Médecine et ENCG. Organise aussi tes séances de révision avec ton agenda personnel.", preview: 'Agenda concours', tag: 'Concours 2027', speech: 'Nbdaw b planning! 📅', lines: ['ENSA · Inscription ouverte', 'ENSAM · Épreuve à venir', 'Révision personnelle · 18:00'] },
            { icon: '📚', label: 'COMPRENDRE', title: 'Cours Bac & examens nationaux', text: 'Retrouve des cours complets et structurés selon le programme du Baccalauréat marocain, avec les annales des examens nationaux et leurs corrigés.', preview: 'Cours du Baccalauréat', tag: 'Mathématiques', speech: 'Fhem dars mzyan! 📚', lines: ['Limites et continuité', 'Dérivation · cours complet', 'Examen national corrigé'] },
            { icon: '📝', label: 'SYNTHÉTISER', title: 'Résumés express', text: 'Révise rapidement avec des fiches condensées qui regroupent les formules et les notions clés de chaque chapitre.', preview: 'Fiche de révision', tag: 'Formules clés', speech: 'Wjjed résumé dyalk! 📝', lines: ['Limite remarquable', 'Dérivée · fonctions usuelles', 'Synthèse prête à réviser'] },
            { icon: '⏱️', label: 'S’ENTRAÎNER', title: 'Concours blancs par chapitre', text: 'Valide tes acquis au fil des révisions avec des QCM chronométrés par matière et par chapitre : Mathématiques, Physique, SVT et plus.', preview: 'Test par chapitre', tag: '12 questions', speech: 'Dreb QCM b chrono! ⏱️', lines: ['Mathématiques · Suites', 'Temps restant · 08:42', 'Progression · 4 / 12'] },
            { icon: '🏛️', label: 'SE PRÉPARER', title: 'Annales concours par école', text: 'Entraîne-toi sur les vrais sujets des grandes écoles sous forme de QCM interactifs pour maîtriser le format des épreuves officielles.', preview: 'Annales de concours', tag: 'ENSA · 2025', speech: 'Jarrab annales l’école! 🏛️', lines: ['Sujet officiel · Mathématiques', 'Format QCM interactif', 'Barème de l’épreuve'] },
            { icon: '🔄', label: 'PROGRESSER', title: 'Réviser mes erreurs', text: 'Les questions manquées dans tes QCM sont sauvegardées automatiquement. Reprends-les de façon ciblée pour renforcer tes points faibles jusqu’à maîtriser chaque notion.', preview: 'Révision ciblée', tag: 'Mes erreurs', speech: 'Raja3 les erreurs dyalk! 🔄', lines: ['Question à revoir · Suites', 'Correction détaillée disponible', 'Objectif · zéro faute'] },
            { icon: '🚀', label: 'ATTEINDRE SON OBJECTIF', title: 'Dashboard & objectif admissibilité', text: 'Visualise tes statistiques, ta précision et ta progression dans un tableau de bord dynamique qui t’accompagne jusqu’à la réussite aux concours.', preview: 'Mon tableau de bord', tag: 'Progression', speech: 'Qrebti l’admissibilité! 🚀', lines: ['Précision moyenne · 86 %', 'Chapitres maîtrisés · 18 / 24', 'Objectif · admissibilité'] }
          ].map((step, index) => (
            <article className={`lp-method-row ${index % 2 === 0 ? 'is-left' : 'is-right'}`} data-mascot-speech={step.speech} key={step.title}>
              <div className="lp-method-copy">
                <span className="lp-method-node" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div className="lp-method-kicker"><span>{String(index + 1).padStart(2, '0')}</span>{step.icon} {step.label}</div>
                <h3>Étape {String(index + 1).padStart(2, '0')} : {step.title}</h3>
                <p>{step.text}</p>
              </div>
              <div className="lp-method-preview" aria-label={`Aperçu : ${step.preview}`}>
                <div className="lp-preview-top"><span className="lp-preview-brand"><i>{String(index + 1).padStart(2, '0')}</i> ÉCONCOURS</span><span className="lp-preview-tag">{step.tag}</span></div>
                <div className="lp-preview-panel"><strong>{step.preview}</strong><ul>{step.lines.map((line, lineIndex) => <li key={line}><i className={`lp-preview-dot dot-${lineIndex}`} />{line}</li>)}</ul><div className="lp-preview-progress"><span style={{ width: `${32 + index * 9}%` }} /></div></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ====================================================================
          7. INTERACTIVE LIVE QUIZ DEMO WIDGET (SIMULATION KRESCO)
      ==================================================================== */}
      <section className="lp-quiz-demo-section" id="demo-qcm">
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">EXPÉRIENCE INTERACTIVE</span>
          <h2 className="lp-section-title">
            Testez la plateforme en direct.
          </h2>
          <p className="lp-section-desc">
            Voici un extrait réel d'une question posée au concours de l’ENSA. Cliquez sur votre réponse pour voir le feedback interactif.
          </p>
        </div>

        <div className="lp-quiz-widget">
          <div className="lp-quiz-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="lp-quiz-header-badge">Concours ENSA · Mathématiques</span>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Question n° 04</span>
            </div>
            <div className="lp-quiz-timer">
              <span>⏱️ Temps recommandé : 1 min 30 s</span>
            </div>
          </div>

          <div className="lp-quiz-body">
            <div className="lp-quiz-question-box">
              <div className="lp-quiz-subject-tag">Limites & Continuité</div>
              <p className="lp-quiz-question-text">
                Soit la fonction <em>f</em> définie sur ℝ* par <strong>f(x) = sin(3x) / x</strong>.<br />
                Quelle est la valeur de la limite : <strong>lim<sub>x → 0</sub> f(x)</strong> ?
              </p>
            </div>

            <div className="lp-quiz-options">
              {[
                { label: 'A', text: '0' },
                { label: 'B', text: '1' },
                { label: 'C', text: '3', correct: true },
                { label: 'D', text: '+∞' }
              ].map((opt) => {
                let btnClass = 'lp-quiz-option-btn';
                if (quizSubmitted) {
                  if (opt.correct) btnClass += ' is-correct';
                  else if (quizAnswer === opt.label) btnClass += ' is-wrong';
                }

                return (
                  <button
                    key={opt.label}
                    type="button"
                    className={btnClass}
                    onClick={() => handleSelectQuizOption(opt.label)}
                    disabled={quizSubmitted}
                  >
                    <span>
                      <strong style={{ marginRight: '8px' }}>{opt.label}.</strong> {opt.text}
                    </span>
                    {quizSubmitted && opt.correct && (
                      <span style={{ color: '#15803d', fontWeight: 800 }}>✓ Correct</span>
                    )}
                    {quizSubmitted && !opt.correct && quizAnswer === opt.label && (
                      <span style={{ color: '#b91c1c', fontWeight: 800 }}>✕ Incorrect</span>
                    )}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className="lp-quiz-explanation">
                <strong>💡 Explication du corrigé officiel :</strong>
                <p>
                  On utilise la limite usuelle de référence : <em>lim<sub>u → 0</sub> sin(u)/u = 1</em>.<br />
                  En posant <em>u = 3x</em>, on a : <em>sin(3x)/x = 3 × [sin(3x) / (3x)]</em>.<br />
                  Comme <em>x → 0 ⇒ 3x → 0</em>, on obtient : <strong>lim<sub>x → 0</sub> f(x) = 3 × 1 = 3</strong>.
                  La bonne réponse est donc <strong>C</strong>.
                </p>
              </div>
            )}

            <div className="lp-quiz-footer">
              <span style={{ fontSize: '13.5px', color: '#64748b' }}>
                {quizSubmitted
                  ? (quizAnswer === 'C' ? '🎉 Bravo, excellente intuition !' : '💡 Pas de panique : ECONCOURS vous aide à maîtriser chaque subtilité.')
                  : 'Choisissez une option pour afficher la correction pas-à-pas.'}
              </span>
              <button className="lp-btn-primary" type="button" onClick={() => handleNav('register')}>
                <span>S'entraîner sur +15 000 QCM</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. STATS & IMPACT SECTION (DARK THEME)
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

      {/* ====================================================================
          9. PRICING & PLANS SECTION
      ==================================================================== */}
      <section className="lp-pricing-section" id="tarifs">
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
              description: 'Accès complet ENSA — ENSCK inclus',
              price: '300',
              features: ['ENSA', 'ENSCK', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
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
              description: 'Les trois concours — ENSCK et ENCG offerts',
              price: '1000',
              featured: true,
              features: ['Médecine', 'ENSA', 'ENSAM', 'ENSCK', 'ENCG', 'QCM · Résumés · Cours', 'Examens chronométrés + mode révision'],
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
      <section className="lp-faq-section" id="faq">
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
            <p>Rejoins les bacheliers qui préparent leur réussite avec un parcours clair, des annales et des QCM ciblés.</p>
            <div className="lp-bottom-cta-benefits">
              <span><i aria-hidden="true">✓</i> Inscription gratuite</span>
              <span><i aria-hidden="true">✓</i> Tu commences tout de suite</span>
            </div>
            <button className="lp-bottom-cta-btn" type="button" onClick={() => handleNav('register')}>
              <span>Créer mon compte gratuit</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          12. FOOTER
      ==================================================================== */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <p>
              La plateforme de référence pour réussir les concours des grandes écoles et examens nationaux au Maroc.
            </p>
            <div className="lp-footer-made-in">
              <span aria-hidden="true">✦</span> Conçu avec passion pour la jeunesse marocaine.
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
              <li><a href="#methodologie" onClick={(e) => { e.preventDefault(); handleScrollTo('methodologie'); }}>Méthodologie</a></li>
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
          <span>&copy; {new Date().getFullYear()} ECONCOURS. Tous droits réservés.</span>
          <span>Préparation aux Concours d’Accès aux Grandes Écoles du Maroc.</span>
        </div>
      </footer>
    </div>
  );
}
