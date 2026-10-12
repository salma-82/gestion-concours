import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logoImg from '../assets/logo.png';
import heroStudentsImg from '../assets/hero_students.jpg';
import './LandingPage.css';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ onNavigateToAuth }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const handleNav = (mode) => {
    if (onNavigateToAuth) {
      onNavigateToAuth(mode);
    } else {
      navigate(mode === 'login' ? '/login' : '/register');
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // INITIAL STATES
      gsap.set('#nav', { opacity: 0, y: -20 });
      gsap.set('.lp-small-team .lp-word > span', { y: '105%' });
      gsap.set('.lp-big-results .lp-letter', { y: 80, opacity: 0 });
      gsap.set('#subline', { opacity: 0, y: 20 });
      gsap.set('.lp-f-card', { opacity: 0 });
      gsap.set('.lp-stats-inner', { opacity: 0 });

      // Apply initial rotation and offscreen setup for cards
      const cards = document.querySelectorAll('.lp-card');
      cards.forEach((card) => {
        const rot = parseFloat(card.dataset.rot) || 0;
        card.dataset.restRot = rot;
        gsap.set(card, { y: -800, rotation: rot + 25, opacity: 0, scale: 0.7 });
      });

      // INTRO TIMELINE
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro
        .to('#nav', { opacity: 1, y: 0, duration: 0.8 }, 0.1)
        .to(
          '.lp-small-team .lp-word > span',
          {
            y: '0%',
            duration: 0.9,
            stagger: 0.08,
            ease: 'power3.out'
          },
          0.3
        )
        .to(
          '.lp-big-results .lp-letter',
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.05,
            ease: 'back.out(1.6)'
          },
          0.55
        )
        .to(
          '.lp-card',
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: (i, el) => parseFloat(el.dataset.restRot) || 0,
            duration: 1.1,
            stagger: { each: 0.08, from: 'center' },
            ease: 'back.out(1.4)'
          },
          0.8
        )
        .to('#subline', { opacity: 1, y: 0, duration: 0.8 }, 1.6);

      // CONTINUOUS FLOAT ON CARDS
      cards.forEach((card, i) => {
        const rot = parseFloat(card.dataset.restRot) || 0;
        gsap.to(card, {
          y: `+=${8 + (i % 3) * 5}`,
          rotation: rot + (i % 2 === 0 ? 1.5 : -1.5),
          duration: 3 + (i % 4) * 0.5,
          delay: 1.8 + i * 0.1,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1
        });
      });

      // MOUSE PARALLAX
      const hero = document.querySelector('.lp-hero');
      if (hero) {
        let mx = 0, my = 0, tx = 0, ty = 0;
        const onMouseMove = (e) => {
          const r = hero.getBoundingClientRect();
          mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          my = ((e.clientY - r.top) / r.height - 0.5) * 2;
        };
        const onMouseLeave = () => {
          mx = 0;
          my = 0;
        };

        hero.addEventListener('mousemove', onMouseMove);
        hero.addEventListener('mouseleave', onMouseLeave);

        let animFrame;
        const parallax = () => {
          tx += (mx - tx) * 0.05;
          ty += (my - ty) * 0.05;
          cards.forEach((card) => {
            const d = parseFloat(card.dataset.depth) || 8;
            card.style.transform = `translate3d(${tx * d}px, ${ty * d * 0.5}px, 0px) rotate(${card.dataset.restRot || 0}deg)`;
          });
          animFrame = requestAnimationFrame(parallax);
        };
        parallax();
      }

      // CARD HOVER 3D LIFT
      cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, {
            rotateX: -py * 16,
            rotateY: px * 16,
            scale: 1.12,
            zIndex: 20,
            duration: 0.4,
            ease: 'power2.out',
            transformPerspective: 700,
            overwrite: 'auto'
          });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            zIndex: card.style.zIndex || '',
            duration: 0.8,
            ease: 'elastic.out(1, 0.6)',
            overwrite: 'auto'
          });
        });
      });

      // SCROLL TRIGGER: CARDS FAN OUT
      ScrollTrigger.create({
        trigger: '.lp-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8,
        onUpdate: (self) => {
          const p = self.progress;
          gsap.set('.lp-big-results', { scale: 1 + 0.15 * p, opacity: 1 - 0.4 * p });
          gsap.set('.lp-small-team', { y: -60 * p, opacity: 1 - p * 1.5 });
          const moves = [
            { x: -260, y: -40, rot: -25 },
            { x: -200, y: 20, rot: -18 },
            { x: -120, y: 80, rot: -10 },
            { x: -40, y: 120, rot: -4 },
            { x: 40, y: 120, rot: 4 },
            { x: 120, y: 80, rot: 12 },
            { x: 200, y: 20, rot: 22 },
            { x: 260, y: -40, rot: 28 }
          ];
          cards.forEach((card, i) => {
            const m = moves[i] || { x: 0, y: 0, rot: 0 };
            const rest = parseFloat(card.dataset.restRot) || 0;
            gsap.set(card, {
              x: m.x * p,
              y: m.y * p,
              rotation: rest + m.rot * p
            });
          });
          gsap.set('#subline', { opacity: 1 - p * 2 });
        }
      });

      // FEATURES REVEAL
      gsap.from('.lp-eyebrow, .lp-features-head h2, .lp-features-head p', {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.lp-features-head', start: 'top 80%' }
      });

      gsap.to('.lp-f-card', {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.lp-features-grid', start: 'top 80%' }
      });

      // STATS REVEAL
      gsap.to('.lp-stats-inner', {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.lp-stats', start: 'top 80%' }
      });

      ScrollTrigger.create({
        trigger: '.lp-stats',
        start: 'top 75%',
        onEnter: () => {
          document.querySelectorAll('.lp-stat-block .lp-num').forEach((el) => {
            const target = parseFloat(el.dataset.count);
            const span = el.querySelector('span');
            if (span && !isNaN(target)) {
              gsap.to(
                { v: 0 },
                {
                  v: target,
                  duration: 2,
                  ease: 'power2.out',
                  onUpdate: function () {
                    span.textContent = Math.floor(this.targets()[0].v).toLocaleString();
                  }
                }
              );
            }
          });
        },
        once: true
      });

      // BIG RESULTS LETTER RISE ON HOVER
      const bigWrap = document.querySelector('.lp-big-results-wrap');
      if (bigWrap) {
        bigWrap.addEventListener('mouseenter', () => {
          gsap.to('.lp-big-results .lp-letter', {
            y: -8,
            duration: 0.5,
            stagger: 0.03,
            ease: 'back.out(1.6)'
          });
        });
        bigWrap.addEventListener('mouseleave', () => {
          gsap.to('.lp-big-results .lp-letter', {
            y: 0,
            duration: 0.6,
            stagger: 0.03,
            ease: 'elastic.out(1, 0.6)'
          });
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing-root" ref={rootRef}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..900;1,9..40,400..900&display=swap"
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </button>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="lp-hero">
        <h1 className="lp-small-team" id="smallTeam">
          <span className="lp-word"><span>Préparez</span></span>&nbsp;
          <span className="lp-word"><span>vos</span></span>&nbsp;
          <span className="lp-word"><span>concours,</span></span>
        </h1>

        <div className="lp-big-results-wrap">
          <div className="lp-big-results" id="bigResults">
            <span className="lp-letter">r</span>
            <span className="lp-letter">é</span>
            <span className="lp-letter">u</span>
            <span className="lp-letter">s</span>
            <span className="lp-letter">s</span>
            <span className="lp-letter">i</span>
            <span className="lp-letter">s</span>
            <span className="lp-letter">s</span>
            <span className="lp-letter">e</span>
            <span className="lp-letter">z</span>
          </div>
        </div>

        {/* Floating Cards Row */}
        <div className="lp-cards-row" id="cardsRow">
          <div className="lp-card lp-card-1" data-rot="-9" data-depth="14" onClick={() => handleNav('register')}>
            <img src={heroStudentsImg} style={{ objectPosition: '0% 0%' }} alt="Étudiant" />
          </div>
          <div className="lp-card lp-card-2" data-rot="-5" data-depth="10" onClick={() => handleNav('register')}>
            <img src={heroStudentsImg} style={{ objectPosition: '100% 0%' }} alt="Concours" />
          </div>
          <div className="lp-card lp-card-3" data-rot="-2" data-depth="8" onClick={() => handleNav('register')}>
            <img src={heroStudentsImg} style={{ objectPosition: '0% 100%' }} alt="Études" />
          </div>
          <div className="lp-card lp-card-4" data-rot="3" data-depth="12" onClick={() => handleNav('register')}>
            <img src={heroStudentsImg} style={{ objectPosition: '100% 100%' }} alt="Réussite" />
          </div>
          <div className="lp-card lp-card-5" data-rot="0" data-depth="6" onClick={() => handleNav('register')}>
            <img src={heroStudentsImg} style={{ objectPosition: '50% 50%' }} alt="Econcour" />
          </div>
          <div className="lp-card lp-card-6" data-rot="4" data-depth="11" onClick={() => handleNav('register')}>
            <img src={heroStudentsImg} style={{ objectPosition: '100% 0%' }} alt="Excellence" />
          </div>
          <div className="lp-card lp-card-7" data-rot="7" data-depth="9" onClick={() => handleNav('register')}>
            <img src={heroStudentsImg} style={{ objectPosition: '0% 0%' }} alt="Préparation" />
          </div>
          <div className="lp-card lp-card-8" data-rot="-4" data-depth="13" onClick={() => handleNav('register')}>
            <img src={heroStudentsImg} style={{ objectPosition: '100% 100%' }} alt="Lauréat" />
          </div>
        </div>

        <div className="lp-subline" id="subline">
          <button className="lp-arrow-pill" onClick={() => handleNav('register')}>
            Commencer maintenant
            <span className="lp-ar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </span>
          </button>
          <div className="lp-subline-text">ENSA · ENSAM · MÉDECINE · CNC · EXAMENS NATIONAUX</div>
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
