import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logoImg from '../assets/logo.png';
import medcineImg from '../assets/MEDCINE.jpg';
import ensaImg from '../assets/ENSA.jpg';
import ensaMarocImg from '../assets/ENSA Maroc.png';
import ensamImg from '../assets/ENSAM.jpg';
import encgImg from '../assets/ENCG.jpeg';
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

// Marquee institutions list
const MARQUEE_SCHOOLS = [
  { name: 'ENSA Tanger', city: 'Tanger' },
  { name: 'FMP Casablanca', city: 'Casablanca' },
  { name: 'ENSAM Meknès', city: 'Meknès' },
  { name: 'ENCG Settat', city: 'Settat' },
  { name: 'ENSA Marrakech', city: 'Marrakech' },
  { name: 'FMP Rabat', city: 'Rabat' },
  { name: 'ENSAM Casablanca', city: 'Casablanca' },
  { name: 'ENCG Agadir', city: 'Agadir' },
  { name: 'ENSA Agadir', city: 'Agadir' },
  { name: 'FMP Fès', city: 'Fès' },
  { name: 'Concours National Commun (CNC)', city: 'National' },
  { name: 'Examens Nationaux du Bac', city: 'National' }
];

// Interactive Filières / Concours tabs
const FILIERES_DATA = {
  sm: {
    id: 'sm',
    label: 'Sciences Mathématiques',
    icon: '📐',
    title: 'Programme d’Élite Sciences Mathématiques (SM-A & SM-B)',
    desc: 'Un entraînement intensif axé sur la rigueur logique, les limites, les suites, l’arithmétique et la géométrie dans l’espace pour viser la mention Très Bien et les meilleures écoles d’ingénieurs.',
    badge: 'Filière d’Excellence',
    stats: { qcm: '5 400+', examens: '24 Années', coefficient: 'Coeff 9 & 7' },
    features: [
      'Formules d’analyse et dérivation pas-à-pas en LaTeX',
      'Corrigés complets des examens nationaux de 2008 à 2025',
      'Entraînement direct aux QCM ENSA & ENSAM',
      'Astuces de calcul rapide et élimination des pièges'
    ]
  },
  pc: {
    id: 'pc',
    label: 'Sciences Physiques (PC)',
    icon: '⚡',
    title: 'Programme Complet Sciences Physiques & Chimie',
    desc: 'Maîtrisez les lois de Newton, les circuits RLC, les ondes lumineuses et les réactions acido-basiques grâce à des synthèses visuelles et des QCM de concours ciblés.',
    badge: 'Filière Populaire',
    stats: { qcm: '4 800+', examens: '24 Années', coefficient: 'Coeff 7 & 7' },
    features: [
      'Schémas d’expériences clairs et fiches de synthèse',
      'Exercices types Bac et concours d’ingénieurs',
      'Explications détaillées de chaque réaction chimique',
      'Chronométrage adapté aux épreuves de 3 heures'
    ]
  },
  svt: {
    id: 'svt',
    label: 'Sciences de la Vie et de la Terre (SVT)',
    icon: '🧬',
    title: 'Programme Approfondi SVT & Biologie',
    desc: 'Idéal pour les élèves préparant les concours des Facultés de Médecine et de Pharmacie (FMP/FMD). Une assimilation parfaite de la génétique, de l’immunologie et de la géologie.',
    badge: 'Objectif Médecine',
    stats: { qcm: '3 600+', examens: '20 Années', coefficient: 'Coeff 7' },
    features: [
      'Hélices d’ADN, schémas de méiose et cycles cellulaires',
      'Analyse des questions de déduction des concours FMP',
      'Fiches mémo synthétiques pour mémoriser vite',
      'QCM chronométrés avec barème officiel'
    ]
  },
  ensa: {
    id: 'ensa',
    label: 'Concours ENSA & ENSAM',
    icon: '⚙️',
    title: 'Préparation Concours ENSA & ENSAM d’Ingénieurs',
    desc: 'Préparez les concours les plus sélectifs du Maroc avec les archives intégrales des épreuves officielles, corrigées et classées par chapitre.',
    badge: 'Grande École',
    stats: { qcm: '4 200+', examens: '18 Épreuves', coefficient: 'QCM Chrono' },
    features: [
      'Simulation en temps réel avec timer officiel (45 min par matière)',
      'Barème officiel de pénalité négative (+1 / -0.25)',
      'Détection automatique de vos erreurs pour cibler vos révisions',
      'Classement indicatif par rapport aux autres candidats'
    ]
  },
  medecine: {
    id: 'medecine',
    label: 'Concours Médecine & Pharmacie',
    icon: '🩺',
    title: 'Concours d’Accès Médecine, Pharmacie & Dentaire (FMP/FMD)',
    desc: 'Le concours commun de médecine nécessite une vitesse d’exécution hors pair sur 4 épreuves : Mathématiques, Physique, Chimie et SVT.',
    badge: 'Très Sélectif',
    stats: { qcm: '3 900+', examens: '16 Épreuves', coefficient: 'Score Seuil' },
    features: [
      'QCM des 4 composantes de l’épreuve commune',
      'Conseils pour gérer le stress et optimiser son temps',
      'Corrigés exhaustifs validés par des professeurs',
      'Rappels méthodologiques des questions récurrentes'
    ]
  }
};

export default function LandingPage({ onNavigateToAuth }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);

  // States
  const [activeFiliere, setActiveFiliere] = useState('sm');
  const [pricingPeriod, setPricingPeriod] = useState('annual');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Mini-Quiz interactive demo state
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleNav = (mode) => {
    if (onNavigateToAuth) {
      onNavigateToAuth(mode);
    } else {
      navigate(mode === 'login' ? '/login' : '/register');
    }
  };

  const handleScrollTo = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Sticky nav scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsNavScrolled(true);
      } else {
        setIsNavScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP Animations and 3D Orbit Carousel
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        // Entrance animations
        gsap.from('.lp-hero-badge', { opacity: 0, y: -20, duration: 0.7, ease: 'power3.out', delay: 0.1 });
        gsap.from('.lp-hero-title', { opacity: 0, y: 30, duration: 0.9, ease: 'power3.out', delay: 0.25 });
        gsap.from('.lp-hero-desc', { opacity: 0, y: 25, duration: 0.8, ease: 'power3.out', delay: 0.4 });
        gsap.from('.lp-hero-actions', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', delay: 0.55 });
        gsap.from('.lp-social-proof', { opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.7 });

        // Scroll reveals for sections
        gsap.from('.lp-method-card', {
          opacity: 0,
          y: 40,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.lp-methodology-section',
            start: 'top 80%'
          }
        });

        gsap.from('.lp-tab-card', {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.lp-filieres-section',
            start: 'top 75%'
          }
        });

        gsap.from('.lp-quiz-widget', {
          opacity: 0,
          scale: 0.96,
          y: 30,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.lp-quiz-demo-section',
            start: 'top 80%'
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

  const currentFiliereData = FILIERES_DATA[activeFiliere] || FILIERES_DATA.sm;

  return (
    <div className="landing-root" ref={rootRef}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <div className="lp-grain" aria-hidden="true" />

      {/* ====================================================================
          1. TOP TEASER STRIP (INSPIRED BY KRESCO.MA BANNER)
      ==================================================================== */}
      <div className="lp-teaser-strip">
        <div className="lp-teaser-content">
          <span className="lp-teaser-kicker">
            <span className="pulse-dot" /> Concours 2026
          </span>
          <span className="lp-teaser-text">
            Entraînez-vous dès maintenant aux épreuves ENSA, ENSAM, Médecine & Bac avec corrigés pas-à-pas.
          </span>
          <span
            className="lp-teaser-link"
            onClick={() => handleNav('register')}
            role="button"
            tabIndex={0}
          >
            Rejoindre l'élite →
          </span>
        </div>
      </div>

      {/* ====================================================================
          2. NAVIGATION HEADER
      ==================================================================== */}
      <nav className={`lp-nav ${isNavScrolled ? 'is-scrolled' : ''}`} id="nav">
        <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={logoImg} alt="ECONCOURS" />
        </div>

        <ul className="lp-nav-links">
          <li>
            <a href="#fonctionnalites" onClick={(e) => { e.preventDefault(); handleScrollTo('fonctionnalites'); }}>
              Fonctionnalités
            </a>
          </li>
          <li>
            <a href="#filieres" onClick={(e) => { e.preventDefault(); handleScrollTo('filieres'); }}>
              Filières & Écoles
            </a>
          </li>
          <li>
            <a href="#methodologie" onClick={(e) => { e.preventDefault(); handleScrollTo('methodologie'); }}>
              Méthodologie
            </a>
          </li>
          <li>
            <a href="#demo-qcm" onClick={(e) => { e.preventDefault(); handleScrollTo('demo-qcm'); }}>
              Démo Interactive
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
            <span>Commencer</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
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
          <a href="#filieres" onClick={(e) => { e.preventDefault(); handleScrollTo('filieres'); }}>
            Filières & Écoles
          </a>
          <a href="#methodologie" onClick={(e) => { e.preventDefault(); handleScrollTo('methodologie'); }}>
            Méthodologie
          </a>
          <a href="#demo-qcm" onClick={(e) => { e.preventDefault(); handleScrollTo('demo-qcm'); }}>
            Démo Interactive
          </a>
          <a href="#tarifs" onClick={(e) => { e.preventDefault(); handleScrollTo('tarifs'); }}>
            Tarifs
          </a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); handleScrollTo('faq'); }}>
            FAQ
          </a>
          <div className="lp-mobile-menu-actions">
            <button className="lp-btn-ghost" type="button" onClick={() => handleNav('login')} style={{ width: '100%' }}>
              Se connecter
            </button>
            <button className="lp-btn-primary" type="button" onClick={() => handleNav('register')} style={{ width: '100%', justifyContent: 'center' }}>
              Commencer maintenant
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          3. HERO SECTION (STYLE KRESCO)
      ==================================================================== */}
      <section className="lp-hero-section" id="hero">
        <div className="lp-hero-ambient" aria-hidden="true" />

        <div className="lp-hero-badge">
          <span className="badge-icon">🇲🇦</span>
          <span>N°1 de la Préparation aux Grandes Écoles & au Bac au Maroc</span>
        </div>

        <h1 className="lp-hero-title">
          Préparez vos Concours,<br />
          <span className="lp-hero-gradient-text">Réussissez votre Avenir.</span>
        </h1>

        <p className="lp-hero-desc">
          La plateforme d'excellence pour les bacheliers et préparationnaires marocains : résumés de cours en LaTeX, QCM chronométrés des 15 dernières années et suivi statistique en direct pour intégrer l'ENSA, l'ENSAM, la Médecine et l'ENCG.
        </p>

        <div className="lp-hero-actions">
          <button className="lp-btn-hero-primary" type="button" onClick={() => handleNav('register')}>
            <span>Commencer gratuitement</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button className="lp-btn-hero-secondary" type="button" onClick={() => handleScrollTo('demo-qcm')}>
            <span>✨ Tester un QCM en direct</span>
          </button>
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
            <span>📐</span> Formules LaTeX & MathJax nettes
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
          4. INFINITE MARQUEE OF PRESTIGIOUS SCHOOLS & CONCOURS
      ==================================================================== */}
      <section className="lp-marquee-section" aria-label="Grandes Écoles partenaires et concours préparés">
        <div className="lp-marquee-label">
          Les concours et grandes écoles préparés sur ECONCOURS
        </div>
        <div className="lp-marquee-track">
          {[...MARQUEE_SCHOOLS, ...MARQUEE_SCHOOLS].map((school, i) => (
            <div className="lp-school-pill" key={i}>
              <span className="pill-dot" />
              <span>{school.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================================
          5. INTERACTIVE FILIÈRES & ÉCOLES SELECTOR TABS (STYLE KRESCO)
      ==================================================================== */}
      <section className="lp-filieres-section" id="filieres">
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">PARCOURS SUR MESURE</span>
          <h2 className="lp-section-title">
            Choisissez votre filière,<br />maîtrisez chaque épreuve.
          </h2>
          <p className="lp-section-desc">
            Sélectionnez votre profil pour découvrir les ressources, annales corrigées et coefficients adaptés aux concours officiels.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="lp-tabs-nav">
          {Object.values(FILIERES_DATA).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`lp-tab-btn ${activeFiliere === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveFiliere(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active Tab Card */}
        <div className="lp-tab-card">
          <div className="lp-tab-card-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>{currentFiliereData.icon}</span>
              <span style={{ color: '#2563eb', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>
                {currentFiliereData.badge}
              </span>
            </div>
            <h3>{currentFiliereData.title}</h3>
            <p>{currentFiliereData.desc}</p>

            <div className="lp-tab-highlights">
              {currentFiliereData.features.map((feat, idx) => (
                <div className="lp-tab-highlight-item" key={idx}>
                  <span className="item-icon">✓</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <button className="lp-btn-primary" type="button" onClick={() => handleNav('register')}>
              <span>Accéder à ces cours & concours</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="lp-tab-card-right">
            <span className="lp-tab-badge-top">📊 Statistiques de la filière</span>
            <div className="lp-tab-stats-grid">
              <div className="lp-tab-stat-box">
                <strong>{currentFiliereData.stats.qcm}</strong>
                <span>Questions résolues</span>
              </div>
              <div className="lp-tab-stat-box">
                <strong>{currentFiliereData.stats.examens}</strong>
                <span>Annales disponibles</span>
              </div>
              <div className="lp-tab-stat-box" style={{ gridColumn: 'span 2' }}>
                <strong style={{ fontSize: '18px' }}>{currentFiliereData.stats.coefficient}</strong>
                <span>Format officiel des concours</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Mise à jour hebdomadaire selon le cadre de référence du Ministère.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. 3-STEP METHODOLOGY SECTION (STYLE KRESCO)
      ==================================================================== */}
      <section className="lp-methodology-section" id="methodologie">
        <div className="lp-section-header" id="fonctionnalites">
          <span className="lp-section-eyebrow">LA MÉTHODE DE L'EXCELLENCE</span>
          <h2 className="lp-section-title">
            3 étapes pour passer de la révision<br />à l'admission garantie.
          </h2>
          <p className="lp-section-desc">
            Inspirée des meilleures méthodes pédagogiques mondiales, adaptée aux exigences des concours marocains.
          </p>
        </div>

        <div className="lp-method-grid">
          {/* Step 1 */}
          <div className="lp-method-card">
            <span className="lp-method-step-number">01</span>
            <div className="lp-method-icon-box">📐</div>
            <h3>1. Visualiser & Assimiler</h3>
            <p>
              Des synthèses de cours épurées sans blabla superflu. Toutes les formules mathématiques et scientifiques sont rédigées avec une netteté absolue en LaTeX et MathJax.
            </p>
            <div className="lp-method-badge">
              <span>✦</span> Fiches mémo téléchargeables
            </div>
          </div>

          {/* Step 2 */}
          <div className="lp-method-card">
            <span className="lp-method-step-number">02</span>
            <div className="lp-method-icon-box">⏱️</div>
            <h3>2. Manipuler & S'entraîner</h3>
            <p>
              Plongez dans des concours blancs chronométrés des 15 dernières années. Gérez votre temps avec le barème officiel (+1 / -0.25) pour éviter les pièges le jour de l’examen.
            </p>
            <div className="lp-method-badge">
              <span>✦</span> Timer et conditions réelles
            </div>
          </div>

          {/* Step 3 */}
          <div className="lp-method-card">
            <span className="lp-method-step-number">03</span>
            <div className="lp-method-icon-box">📊</div>
            <h3>3. Corriger & Progresser</h3>
            <p>
              Chaque réponse est détaillée pas-à-pas. La plateforme enregistre automatiquement vos erreurs dans votre tableau de bord « Mes erreurs » pour ne plus jamais trébucher.
            </p>
            <div className="lp-method-badge">
              <span>✦</span> Analyse prédictive des lacunes
            </div>
          </div>
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
            Investissez dans votre réussite.
          </h2>
          <p className="lp-section-desc">
            Des tarifs adaptés pour démarrer à votre rythme, sans engagement caché.
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="lp-pricing-toggle-wrap">
          <span className={pricingPeriod === 'monthly' ? 'is-active' : ''}>Mensuel</span>
          <button
            type="button"
            className={`lp-pricing-toggle-btn ${pricingPeriod === 'annual' ? 'is-annual' : ''}`}
            onClick={() => setPricingPeriod(pricingPeriod === 'annual' ? 'monthly' : 'annual')}
            aria-label="Basculer période tarifaire"
          >
            <div className="toggle-knob" />
          </button>
          <span className={pricingPeriod === 'annual' ? 'is-active' : ''}>Annuel</span>
          <span className="lp-discount-badge">🎁 2 mois offerts</span>
        </div>

        {/* Pricing Cards */}
        <div className="lp-pricing-grid">
          {/* Card 1: Découverte */}
          <div className="lp-plan-card">
            <h3 className="lp-plan-name">Pack Découverte</h3>
            <p className="lp-plan-sub">Pour explorer la plateforme et tester vos bases</p>
            <div className="lp-plan-price">
              0 <small>DH</small>
            </div>
            <ul className="lp-plan-features">
              <li>
                <span className="check-icon">✓</span>
                <span>Accès aux examens nationaux du Bac</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Résumés de cours fondamentaux</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>3 QCM de démonstration</span>
              </li>
              <li>
                <span className="cross-icon">✕</span>
                <span style={{ color: '#94a3b8' }}>Concours blancs interactifs complets</span>
              </li>
              <li>
                <span className="cross-icon">✕</span>
                <span style={{ color: '#94a3b8' }}>Corrigés détaillés pas-à-pas</span>
              </li>
            </ul>
            <button className="lp-plan-btn" type="button" onClick={() => handleNav('register')}>
              Créer un compte gratuit
            </button>
          </div>

          {/* Card 2: Pro (Featured) */}
          <div className="lp-plan-card is-featured">
            <div className="lp-featured-ribbon">⭐ LE PLUS CHOISI</div>
            <h3 className="lp-plan-name">Pack Concours Pro</h3>
            <p className="lp-plan-sub">La préparation complète pour intégrer</p>
            <div className="lp-plan-price">
              {pricingPeriod === 'annual' ? '199' : '29'}
              <small>{pricingPeriod === 'annual' ? 'DH / an' : 'DH / mois'}</small>
            </div>
            <ul className="lp-plan-features">
              <li>
                <span className="check-icon">✓</span>
                <span>Tous les résumés interactifs complets (LaTeX)</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Concours ENSA, ENSAM, Médecine & ENCG</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Corrigés détaillés étape par étape</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Mode examen chronométré avec barème officiel</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Tableau de bord « Mes erreurs » automatisé</span>
              </li>
            </ul>
            <button className="lp-plan-btn" type="button" onClick={() => handleNav('register')}>
              Commencer maintenant
            </button>
          </div>

          {/* Card 3: VIP */}
          <div className="lp-plan-card">
            <h3 className="lp-plan-name">Accompagnement VIP</h3>
            <p className="lp-plan-sub">Coaching personnalisé et suivi continu</p>
            <div className="lp-plan-price">
              {pricingPeriod === 'annual' ? '499' : '59'}
              <small>{pricingPeriod === 'annual' ? 'DH / an' : 'DH / mois'}</small>
            </div>
            <ul className="lp-plan-features">
              <li>
                <span className="check-icon">✓</span>
                <span>Tout le contenu du Pack Concours Pro</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Sessions live mensuelles de Q&R avec enseignants</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Conseils d’orientation post-bac sur mesure</span>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <span>Support prioritaire 7j/7 sur WhatsApp</span>
              </li>
            </ul>
            <button className="lp-plan-btn" type="button" onClick={() => handleNav('register')}>
              Rejoindre le programme VIP
            </button>
          </div>
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
              a: "ECONCOURS réunit pour la première fois en un seul endroit tous les examens officiels des 15 dernières années (ENSA, ENSAM, Médecine, ENCG). Vous révisez avec des cours rédigés en LaTeX net, puis vous vous entraînez sur les vrais QCM avec un chronomètre et un barème de points conforme à la réalité du concours."
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
              a: "Oui, l'inscription au Pack Découverte est 100% gratuite et sans engagement. Vous pouvez créer votre compte en 30 secondes pour explorer les résumés et tester vos premiers QCM."
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
          <h2>Prêt à intégrer la Grande École de vos rêves ?</h2>
          <p>
            Rejoignez dès aujourd'hui la communauté des bacheliers et préparationnaires qui visent le sommet.
          </p>
          <button className="lp-bottom-cta-btn" type="button" onClick={() => handleNav('register')}>
            <span>Créer mon compte gratuit</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ====================================================================
          12. FOOTER
      ==================================================================== */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src={logoImg} alt="ECONCOURS" />
            <p>
              La plateforme de référence pour réussir les concours des grandes écoles et examens nationaux au Maroc.
            </p>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              🇲🇦 Conçu avec passion pour la jeunesse marocaine.
            </div>
          </div>

          <div className="lp-footer-col">
            <h4>Plateforme</h4>
            <ul>
              <li><a href="#fonctionnalites" onClick={(e) => { e.preventDefault(); handleScrollTo('fonctionnalites'); }}>Fonctionnalités</a></li>
              <li><a href="#filieres" onClick={(e) => { e.preventDefault(); handleScrollTo('filieres'); }}>Filières & Écoles</a></li>
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