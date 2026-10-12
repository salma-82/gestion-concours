import React, { useEffect, useRef } from 'react';
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

// ─── Configuration du Carrousel (ajusté : cartes encore plus compactes) ─────
const CONFIG = {
  cardCount: 9,              // Nombre de cartes dans le carrousel
  cycleDurationSec: 24,       // Vitesse : durée d'un cycle complet en secondes
  maxScale: 1.05,             // Facteur de grossissement minimal pour laisser le mot bien lisible
  minScale: 0.65,             // Échelle des cartes les plus éloignées
  maxRotationDeg: 8,          // Angle max d'inclinaison des cartes latérales
  verticalArchPx: 24,         // Hauteur de courbure en arche
};

const CONCOURS_CARDS_DATA = [
  [
    { slot: 'ENSA', name: 'ENSA', url: ensaImg, desc: 'ENSA' },
    { slot: 'ENSAM', name: 'ENSAM', url: ensamImg, desc: 'ENSAM' },
    { slot: 'MED', name: 'Médecine', url: medcineImg, desc: 'Faculté de Médecine' },
    { slot: 'ENCG', name: 'ENCG', url: encgImg, desc: 'ENCG' },
  ],
  [
    { slot: 'MED', name: 'Médecine', url: medcineImg, desc: 'Faculté de Médecine' },
    { slot: 'ENSA', name: 'ENSA', url: ensaMarocImg, desc: 'ENSA' },
    { slot: 'ENCG', name: 'ENCG', url: encgImg, desc: 'ENCG' },
    { slot: 'ENSAM', name: 'ENSAM', url: ensamImg, desc: 'ENSAM' },
  ],
  [
    { slot: 'ENSAM', name: 'ENSAM', url: ensamImg, desc: 'ENSAM' },
    { slot: 'ENCG', name: 'ENCG', url: encgImg, desc: 'ENCG' },
    { slot: 'ENSA', name: 'ENSA', url: ensaImg, desc: 'ENSA' },
    { slot: 'MED', name: 'Médecine', url: medcineImg, desc: 'Faculté de Médecine' },
  ],
  [
    { slot: 'ENCG', name: 'ENCG', url: encgImg, desc: 'ENCG' },
    { slot: 'MED', name: 'Médecine', url: medcineImg, desc: 'Faculté de Médecine' },
    { slot: 'ENSAM', name: 'ENSAM', url: ensamImg, desc: 'ENSAM' },
    { slot: 'ENSA', name: 'ENSA', url: ensaMarocImg, desc: 'ENSA' },
  ],
  [
    { slot: 'ENSA', name: 'ENSA', url: ensaMarocImg, desc: 'ENSA' },
    { slot: 'ENSAM', name: 'ENSAM', url: ensamImg, desc: 'ENSAM' },
    { slot: 'MED', name: 'Médecine', url: medcineImg, desc: 'Faculté de Médecine' },
    { slot: 'ENCG', name: 'ENCG', url: encgImg, desc: 'ENCG' },
  ],
  [
    { slot: 'MED', name: 'Médecine', url: medcineImg, desc: 'Faculté de Médecine' },
    { slot: 'ENCG', name: 'ENCG', url: encgImg, desc: 'ENCG' },
    { slot: 'ENSA', name: 'ENSA', url: ensaImg, desc: 'ENSA' },
    { slot: 'ENSAM', name: 'ENSAM', url: ensamImg, desc: 'ENSAM' },
  ],
  [
    { slot: 'ENSAM', name: 'ENSAM', url: ensamImg, desc: 'ENSAM' },
    { slot: 'ENSA', name: 'ENSA', url: ensaMarocImg, desc: 'ENSA' },
    { slot: 'ENCG', name: 'ENCG', url: encgImg, desc: 'ENCG' },
    { slot: 'MED', name: 'Médecine', url: medcineImg, desc: 'Faculté de Médecine' },
  ],
  [
    { slot: 'ENCG', name: 'ENCG', url: encgImg, desc: 'ENCG' },
    { slot: 'ENSA', name: 'ENSA', url: ensaImg, desc: 'ENSA' },
    { slot: 'ENSAM', name: 'ENSAM', url: ensamImg, desc: 'ENSAM' },
    { slot: 'MED', name: 'Médecine', url: medcineImg, desc: 'Faculté de Médecine' },
  ],
  [
    { slot: 'ENSA', name: 'ENSA', url: ensaImg, desc: 'ENSA' },
    { slot: 'MED', name: 'Médecine', url: medcineImg, desc: 'Faculté de Médecine' },
    { slot: 'ENCG', name: 'ENCG', url: encgImg, desc: 'ENCG' },
    { slot: 'ENSAM', name: 'ENSAM', url: ensamImg, desc: 'ENSAM' },
  ],
];

export default function LandingPage({ onNavigateToAuth }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);

  const handleNav = (mode) => {
    if (onNavigateToAuth) {
      onNavigateToAuth(mode);
    } else {
      navigate(mode === 'login' ? '/login' : '/register');
    }
  };

  useEffect(() => {
    // ─── Animations d'intro & scroll GSAP ─────────────────────────────────────
    const ctx = gsap.context(() => {
      gsap.set('#nav', { opacity: 0, y: -20 });
      gsap.set('.hero-eyebrow', { opacity: 0, y: -20 });
      gsap.set('.hero-watermark', { opacity: 0, scale: 0.95 });
      gsap.set('.carousel-stage', { opacity: 0, y: 30 });
      gsap.set('.hero-actions', { opacity: 0, y: 20 });
      gsap.set('.lp-f-card', { opacity: 0 });
      gsap.set('.lp-stats-inner', { opacity: 0 });

      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro
        .to('#nav', { opacity: 1, y: 0, duration: 0.8 }, 0.1)
        .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.8 }, 0.25)
        .to('.hero-watermark', { opacity: 0.95, scale: 1, duration: 1 }, 0.4)
        .to('.carousel-stage', { opacity: 1, y: 0, duration: 0.9 }, 0.5)
        .to('.hero-actions', { opacity: 1, y: 0, duration: 0.8 }, 0.7);

      gsap.from('.lp-eyebrow, .lp-features-head h2, .lp-features-head p', {
        opacity: 0, y: 30, duration: 0.9, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.lp-features-head', start: 'top 80%' }
      });
      gsap.to('.lp-f-card', {
        opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: '.lp-features-grid', start: 'top 80%' }
      });
      gsap.to('.lp-stats-inner', {
        opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: '.lp-stats', start: 'top 80%' }
      });
      ScrollTrigger.create({
        trigger: '.lp-stats', start: 'top 75%',
        onEnter: () => {
          document.querySelectorAll('.lp-stat-block .lp-num').forEach((el) => {
            const target = parseFloat(el.dataset.count);
            const span = el.querySelector('span');
            if (span && !isNaN(target)) {
              gsap.to({ v: 0 }, {
                v: target, duration: 2, ease: 'power2.out',
                onUpdate: function () { span.textContent = Math.floor(this.targets()[0].v).toLocaleString(); }
              });
            }
          });
        },
        once: true
      });
    }, rootRef);

    // ─── Carrousel infini continu en arche 3D (identique à hero.html) ─────────
    const stage = stageRef.current;
    if (!stage) return;

    let isPaused = false;
    let currentOffset = 0;
    let lastTimestamp = 0;
    let animId = null;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const getCardSpacing = () => (window.innerWidth <= 768 ? 120 : 160);
    let cardSpacing = getCardSpacing();
    let totalTrackWidth = CONFIG.cardCount * cardSpacing;

    const updateCardPositions = () => {
      const halfTrack = totalTrackWidth / 2;

      cardRefs.current.forEach((cardEl, index) => {
        if (!cardEl) return;
        let rawX = (index * cardSpacing) - currentOffset;

        let normalizedX = ((rawX % totalTrackWidth) + totalTrackWidth) % totalTrackWidth;
        if (normalizedX > halfTrack) {
          normalizedX -= totalTrackWidth;
        }

        const maxDistRange = halfTrack * 0.95;
        const normalizedDist = Math.max(-1.5, Math.min(1.5, normalizedX / maxDistRange));
        const absDist = Math.abs(normalizedDist);

        const scaleProgress = Math.max(0, 1 - Math.pow(absDist, 1.2));
        const scale = CONFIG.minScale + (CONFIG.maxScale - CONFIG.minScale) * scaleProgress;

        const rotSign = normalizedX >= 0 ? 1 : -1;
        const rotation = (rotSign * Math.min(absDist, 1) * CONFIG.maxRotationDeg);

        const translateY = Math.pow(absDist, 1.6) * CONFIG.verticalArchPx;
        const zIndex = Math.round((1 - absDist) * 100) + 10;

        let opacity = 1;
        if (absDist > 1.1) {
          opacity = Math.max(0, 1 - (absDist - 1.1) * 3);
        }

        cardEl.style.transform = `translate3d(${normalizedX.toFixed(1)}px, ${translateY.toFixed(1)}px, 0px) scale(${scale.toFixed(3)}) rotate(${rotation.toFixed(2)}deg)`;
        cardEl.style.zIndex = zIndex;
        cardEl.style.opacity = opacity.toFixed(3);
      });
    };

    updateCardPositions();

    if (prefersReducedMotion) {
      return () => { ctx.revert(); };
    }

    const animate = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (!isPaused && deltaTime > 0) {
        const speedPxPerMs = totalTrackWidth / (CONFIG.cycleDurationSec * 1000);
        currentOffset = (currentOffset + speedPxPerMs * deltaTime) % totalTrackWidth;
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

    const onResize = () => {
      cardSpacing = getCardSpacing();
      totalTrackWidth = CONFIG.cardCount * cardSpacing;
      updateCardPositions();
    };
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
  }, []);

  return (
    <div className="landing-root" ref={rootRef}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..900;1,14..32,400..900&family=Poppins:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800;1,900&display=swap"
        rel="stylesheet"
      />

      <div className="lp-grain"></div>

      {/* ============ NAVIGATION ============ */}
      <nav className="lp-nav" id="nav">
        <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={logoImg} alt="Econcour" />
        </div>
        <ul className="lp-nav-links">
          <li><a href="#fonctionnalites">Fonctionnalités</a></li>
          <li><a href="#apropos">Comment ça marche</a></li>
          <li><a href="#tarifs">Tarifs</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <button className="lp-nav-cta" onClick={() => handleNav('login')}>
          Se connecter
        </button>
      </nav>

      {/* ============ HERO SECTION (Exactement comme hero.html) ============ */}
      <section className="hero-container" id="heroContainer">
        {/* 1. Grand titre */}
        <h1 className="hero-eyebrow">
          Préparez vos concours,
        </h1>

        {/* 2. Texte géant en filigrane */}
        <div className="hero-watermark" aria-hidden="true">
          réussissez
        </div>

        {/* 3. Scène du carrousel avec les cartes collage 2x2 */}
        <div
          className="carousel-stage"
          ref={stageRef}
          aria-label="Carrousel d'étudiants préparant leurs concours"
        >
          {Array.from({ length: CONFIG.cardCount }).map((_, cardIndex) => {
            const cardSlots = CONCOURS_CARDS_DATA[cardIndex % CONCOURS_CARDS_DATA.length];
            return (
              <div
                key={cardIndex}
                className="student-card"
                ref={(el) => (cardRefs.current[cardIndex] = el)}
                onClick={() => handleNav('register')}
              >
                <div className="collage-grid">
                  {cardSlots.map((item, slotIndex) => (
                    <div key={slotIndex} className="photo-slot">
                      <span className="badge-letter">{item.slot}</span>
                      <img src={item.url} alt={item.desc} loading="lazy" />
                      <span className="label-student">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Bouton CTA et sous-ligne */}
        <div className="hero-actions">
          <button className="btn-pill-cta" type="button" onClick={() => handleNav('register')}>
            <span>Commencer maintenant</span>
            <span className="arrow-circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </span>
          </button>
          <div className="hero-subline">
            ENSA · ENSAM · MÉDECINE · CNC · EXAMENS NATIONAUX
          </div>
        </div>
      </section>


      {/* ============ SECTION 2: FEATURES GRID ============ */}
      <section className="lp-features-section" id="fonctionnalites">
        <div className="lp-features-head">
          <div>
            <div className="lp-eyebrow">MÉTHODOLOGIE D'APPRENTISSAGE</div>
            <h2>Une préparation ciblée<br />vers <em>l'Excellence</em> académique.</h2>
          </div>
          <p>Profitez d'un écosystème conçu sur mesure pour maîtriser chaque matière et maximiser vos chances aux concours les plus sélectifs.</p>
        </div>

        <div className="lp-features-grid">
          <div className="lp-f-card">
            <div className="lp-f-icon">📐</div>
            <h3>Résumés de Cours Interactifs</h3>
            <p>Formules mathématiques et scientifiques nettes (LaTeX & MathJax), synthèses complètes chapitre par chapitre sans distraction.</p>
          </div>

          <div className="lp-f-card">
            <div className="lp-f-icon">⏱️</div>
            <h3>Concours Blancs Chronométrés</h3>
            <p>Mettez-vous en conditions réelles avec nos QCM officiels corrigés : ENSA, ENSAM, Médecine, Pharmacie et ENCG.</p>
          </div>

          <div className="lp-f-card">
            <div className="lp-f-icon">📊</div>
            <h3>Analyse & Suivi des Performances</h3>
            <p>Mesurez vos scores, repérez instantanément vos lacunes et suivez votre progression quotidienne jusqu'au jour J.</p>
          </div>
        </div>
      </section>

      {/* ============ SECTION 3: STATS ============ */}
      <section className="lp-stats" id="apropos">
        <div className="lp-stats-inner">
          <h3>Résultats &<br /> <em>Impact</em>.</h3>
          <div className="lp-stat-block">
            <div className="lp-num" data-count="98"><span>0</span><small>%</small></div>
            <div className="lp-lbl">Taux de satisfaction</div>
          </div>
          <div className="lp-stat-block">
            <div className="lp-num" data-count="15000"><span>0</span><small>+</small></div>
            <div className="lp-lbl">Questions QCM traitées</div>
          </div>
          <div className="lp-stat-block">
            <div className="lp-num" data-count="120"><span>0</span><small>+</small></div>
            <div className="lp-lbl">Concours blancs complets</div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 4: TARIFS ============ */}
      <section className="lp-pricing" id="tarifs">
        <div className="lp-pricing-head">
          <div className="lp-eyebrow" style={{ justifyContent: 'center' }}>FORMULES D'ACCÈS</div>
          <h2>Investissez dans votre <em>Avenir</em></h2>
          <p>Des formules transparentes et adaptées à votre rythme de révision.</p>
        </div>

        <div className="lp-pricing-grid">
          {/* PACK GRATUIT */}
          <div className="lp-price-card">
            <h3>Pack Découverte</h3>
            <p className="lp-price-sub">Pour démarrer vos révisions</p>
            <div className="lp-price-amount">0 <small>DH</small></div>
            <ul className="lp-price-features">
              <li><span className="lp-check">✓</span> Accès aux examens nationaux</li>
              <li><span className="lp-check">✓</span> Résumés de cours de base</li>
              <li className="lp-disabled"><span className="lp-check">✕</span> Concours blancs interactifs</li>
              <li className="lp-disabled"><span className="lp-check">✕</span> Corrigés détaillés</li>
            </ul>
            <button className="lp-price-btn" onClick={() => handleNav('register')}>S'inscrire</button>
          </div>

          {/* PACK PREMIUM (FEATURED) */}
          <div className="lp-price-card lp-featured">
            <div className="lp-price-badge">Recommandé</div>
            <h3>Pack Concours Pro</h3>
            <p className="lp-price-sub">La préparation complète pour intégrer</p>
            <div className="lp-price-amount">199 <small>DH / an</small></div>
            <ul className="lp-price-features">
              <li><span className="lp-check">✓</span> Tous les résumés interactifs complets</li>
              <li><span className="lp-check">✓</span> Concours ENSA, ENSAM, Médecine</li>
              <li><span className="lp-check">✓</span> Corrigés détaillés pas à pas</li>
              <li><span className="lp-check">✓</span> Mode examen chronométré</li>
            </ul>
            <button className="lp-price-btn" onClick={() => handleNav('register')}>Commencer maintenant</button>
          </div>

          {/* PACK VIP */}
          <div className="lp-price-card">
            <h3>Pack Accompagnement</h3>
            <p className="lp-price-sub">Accompagnement et coaching</p>
            <div className="lp-price-amount">499 <small>DH / an</small></div>
            <ul className="lp-price-features">
              <li><span className="lp-check">✓</span> Tout le contenu du Pack Pro</li>
              <li><span className="lp-check">✓</span> Sessions live de questions/réponses</li>
              <li><span className="lp-check">✓</span> Conseils d'orientation post-bac</li>
              <li><span className="lp-check">✓</span> Support prioritaire 7j/7</li>
            </ul>
            <button className="lp-price-btn" onClick={() => handleNav('register')}>Nous rejoindre</button>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="lp-footer" id="faq">
        <div className="lp-footer-inner">
          <div>
            <div className="lp-footer-logo">
              <img src={logoImg} alt="Econcour" />
            </div>
            <p className="lp-footer-desc">
              Votre plateforme d'entraînement référence pour réussir les concours des grandes écoles et examens nationaux au Maroc.
            </p>
          </div>
          <div>
            <h4>Navigation</h4>
            <ul>
              <li><a href="#fonctionnalites">Fonctionnalités</a></li>
              <li><a href="#apropos">Comment ça marche</a></li>
              <li><a href="#tarifs">Tarifs</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleNav('login'); }}>Espace Membre</a></li>
            </ul>
          </div>
          <div>
            <h4>Informations</h4>
            <ul>
              <li><a href="#">Conditions générales</a></li>
              <li><a href="#">Politique de confidentialité</a></li>
              <li><a href="#">Contact & Support</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          &copy; {new Date().getFullYear()} Econcour. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
