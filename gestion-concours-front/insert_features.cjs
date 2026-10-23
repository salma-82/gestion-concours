const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// 1) INSERT FEATURES SECTION INTO LandingPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
const jsxPath = path.join(__dirname, 'src/components/LandingPage.jsx');
let jsx = fs.readFileSync(jsxPath, 'utf8');

// Check if already inserted
if (jsx.includes('fonctionnalites-cles')) {
  console.log('Features section already exists in JSX — skipping.');
} else {
  // The new features section JSX
  const featuresJSX = [
    '',
    '      {/* ====================================================================',
    '          5b. FONCTIONNALITÉS CLÉS DE LA PLATEFORME',
    '      ==================================================================== */}',
    '      <section className="lp-features-section" id="fonctionnalites-cles">',
    '        <div className="lp-section-header">',
    '          <span className="lp-section-eyebrow">CE QU\'ON OFFRE</span>',
    '          <h2 className="lp-section-title">',
    '            Fonctionnalités Clés<br />de la Plateforme',
    '          </h2>',
    '          <p className="lp-section-desc">',
    '            Tout ce dont tu as besoin pour préparer ton Bac et réussir les concours des grandes écoles.',
    '          </p>',
    '        </div>',
    '',
    '        <div className="lp-features-categories">',
    '',
    '          {/* A — SUIVI DYNAMIQUE */}',
    '          <div className="lp-feat-category">',
    '            <div className="lp-feat-cat-label lp-feat-cat-label--a">',
    '              <span className="lp-feat-cat-letter">A</span>',
    '              <span>Suivi Dynamique</span>',
    '            </div>',
    '            <div className="lp-feat-cards-row">',
    '              <div className="lp-feat-card">',
    '                <span className="lp-feat-card-icon">👤</span>',
    '                <div>',
    '                  <strong>Profil Étudiant</strong>',
    '                  <p>Espace personnalisé avec ta photo, ton nom et ton historique de progression complet.</p>',
    '                </div>',
    '              </div>',
    '              <div className="lp-feat-card">',
    '                <span className="lp-feat-card-icon">📅</span>',
    '                <div>',
    '                  <strong>Calendrier Interactif</strong>',
    '                  <p>Événements officiels des concours et événements personnels de révision.</p>',
    '                </div>',
    '              </div>',
    '              <div className="lp-feat-card">',
    '                <span className="lp-feat-card-icon">📊</span>',
    '                <div>',
    '                  <strong>Dashboard Global</strong>',
    '                  <p>Vue d\'ensemble interactive avec graphiques de progression en temps réel.</p>',
    '                </div>',
    '              </div>',
    '            </div>',
    '          </div>',
    '',
    '          {/* B — CONTENUS PÉDAGOGIQUES */}',
    '          <div className="lp-feat-category">',
    '            <div className="lp-feat-cat-label lp-feat-cat-label--b">',
    '              <span className="lp-feat-cat-letter">B</span>',
    '              <span>Contenus Pédagogiques</span>',
    '            </div>',
    '            <div className="lp-feat-cards-row">',
    '              <div className="lp-feat-card">',
    '                <span className="lp-feat-card-icon">📚</span>',
    '                <div>',
    '                  <strong>Cours Complets Bac</strong>',
    '                  <p>Cours structurés et complets selon le programme officiel du Baccalauréat marocain.</p>',
    '                </div>',
    '              </div>',
    '              <div className="lp-feat-card">',
    '                <span className="lp-feat-card-icon">🔢</span>',
    '                <div>',
    '                  <strong>Résumés LaTeX</strong>',
    '                  <p>Fiches de synthèse formatées en LaTeX avec formules essentielles et condensés.</p>',
    '                </div>',
    '              </div>',
    '              <div className="lp-feat-card">',
    '                <span className="lp-feat-card-icon">📝</span>',
    '                <div>',
    '                  <strong>Annales Corrigées</strong>',
    '                  <p>Annales des concours officiels corrigées étape par étape pour chaque école.</p>',
    '                </div>',
    '              </div>',
    '            </div>',
    '          </div>',
    '',
    '          {/* C — MOTEUR DE TEST */}',
    '          <div className="lp-feat-category">',
    '            <div className="lp-feat-cat-label lp-feat-cat-label--c">',
    '              <span className="lp-feat-cat-letter">C</span>',
    '              <span>Moteur de Test</span>',
    '            </div>',
    '            <div className="lp-feat-cards-row">',
    '              <div className="lp-feat-card lp-feat-card--timer">',
    '                <span className="lp-feat-card-icon">⏱️</span>',
    '                <div>',
    '                  <strong>Tests Chronométrés</strong>',
    '                  <p>Compte à rebours officiel pour simuler les conditions réelles des concours.</p>',
    '                </div>',
    '                <div className="lp-feat-timer-badge">00 : 00 : 39</div>',
    '              </div>',
    '              <div className="lp-feat-card">',
    '                <span className="lp-feat-card-icon">🧮</span>',
    '                <div>',
    '                  <strong>QCM par Chapitre &amp; École</strong>',
    '                  <p>Questions organisées par matière, chapitre et institution (ENSA, Médecine…).</p>',
    '                </div>',
    '              </div>',
    '              <div className="lp-feat-card">',
    '                <span className="lp-feat-card-icon">💾</span>',
    '                <div>',
    '                  <strong>Sauvegarde Automatique des Erreurs</strong>',
    '                  <p>Toutes tes fautes sont enregistrées automatiquement pour révision ciblée.</p>',
    '                </div>',
    '              </div>',
    '            </div>',
    '          </div>',
    '',
    '          {/* D — CIBLAGE DES ERREURS */}',
    '          <div className="lp-feat-category">',
    '            <div className="lp-feat-cat-label lp-feat-cat-label--d">',
    '              <span className="lp-feat-cat-letter">D</span>',
    '              <span>Ciblage des Erreurs</span>',
    '            </div>',
    '            <div className="lp-feat-cards-row lp-feat-cards-row--duo">',
    '              <div className="lp-feat-card lp-feat-card--duo">',
    '                <span className="lp-feat-card-icon">🔍</span>',
    '                <div>',
    '                  <strong>Correction Intelligente</strong>',
    '                  <p>Smart correction — analyse automatique de tes erreurs avec retour détaillé et conseils.</p>',
    '                </div>',
    '              </div>',
    '              <div className="lp-feat-card lp-feat-card--duo lp-feat-card--accent">',
    '                <span className="lp-feat-card-icon">🎯</span>',
    '                <div>',
    '                  <strong>Objectif Zéro Faute</strong>',
    '                  <p>Goal tracking — suivi de ton objectif jusqu\'à la maîtrise totale de chaque chapitre.</p>',
    '                </div>',
    '              </div>',
    '            </div>',
    '          </div>',
    '',
    '        </div>',
    '',
    '        <div className="lp-features-cta">',
    '          <button className="lp-btn-primary" type="button" onClick={() => handleNav(\'register\')}>',
    '            <span>Accéder à toutes les fonctionnalités</span>',
    '            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">',
    '              <path d="M5 12h14M12 5l7 7-7 7" />',
    '            </svg>',
    '          </button>',
    '        </div>',
    '      </section>',
    '',
  ].join('\n');

  // Find the marker: "6. 3-STEP METHODOLOGY SECTION"
  const marker = '6. 3-STEP METHODOLOGY SECTION (STYLE KRESCO)';
  const markerIdx = jsx.indexOf(marker);

  if (markerIdx === -1) {
    console.error('ERROR: Could not find methodology section marker!');
    process.exit(1);
  }

  // Find the start of the comment block containing this marker
  const commentStart = jsx.lastIndexOf('{/*', markerIdx);
  // Find the line start before the comment
  const lineStart = jsx.lastIndexOf('\n', commentStart) + 1;

  console.log('Inserting features section at char position:', lineStart);

  const newJsx = jsx.slice(0, lineStart) + featuresJSX + '\n' + jsx.slice(lineStart);
  fs.writeFileSync(jsxPath, newJsx, 'utf8');
  console.log('JSX updated. Old length:', jsx.length, '-> New length:', newJsx.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) APPEND CSS FOR FEATURES SECTION TO LandingPage.css
// ─────────────────────────────────────────────────────────────────────────────
const cssPath = path.join(__dirname, 'src/components/LandingPage.css');
let css = fs.readFileSync(cssPath, 'utf8');

if (css.includes('.lp-features-section')) {
  console.log('CSS already has features styles — skipping.');
} else {
  const featuresCSS = `

/* =========================================================
   FONCTIONNALITÉS CLÉS DE LA PLATEFORME — Section
   ========================================================= */

.lp-features-section {
  padding: 100px 24px 80px;
  background: linear-gradient(180deg, #f6f8fc 0%, #fff 100%);
  position: relative;
  overflow: hidden;
}

.lp-features-section::before {
  content: '';
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(36, 87, 230, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.lp-features-categories {
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 56px;
}

.lp-feat-category {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lp-feat-cat-label {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 8px 20px 8px 8px;
  border-radius: 40px;
  width: fit-content;
}

.lp-feat-cat-letter {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 900;
  color: #fff;
  flex-shrink: 0;
}

.lp-feat-cat-label--a { background: rgba(36, 87, 230, 0.09); color: #1a3db5; }
.lp-feat-cat-label--a .lp-feat-cat-letter { background: #2457e6; }

.lp-feat-cat-label--b { background: rgba(5, 150, 105, 0.09); color: #065f46; }
.lp-feat-cat-label--b .lp-feat-cat-letter { background: #059669; }

.lp-feat-cat-label--c { background: rgba(234, 88, 12, 0.09); color: #9a3412; }
.lp-feat-cat-label--c .lp-feat-cat-letter { background: #ea580c; }

.lp-feat-cat-label--d { background: rgba(124, 58, 237, 0.09); color: #4c1d95; }
.lp-feat-cat-label--d .lp-feat-cat-letter { background: #7c3aed; }

.lp-feat-cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.lp-feat-cards-row--duo {
  grid-template-columns: repeat(2, 1fr);
  max-width: 720px;
}

.lp-feat-card {
  background: #fff;
  border: 1.5px solid #e4eaf4;
  border-radius: 18px;
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.25s cubic-bezier(.2, .8, .2, 1),
              box-shadow 0.25s cubic-bezier(.2, .8, .2, 1),
              border-color 0.2s;
  box-shadow: 0 4px 16px rgba(22, 43, 91, .05);
  position: relative;
  overflow: hidden;
}

.lp-feat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(22, 43, 91, .12);
  border-color: #c5d4f5;
}

.lp-feat-card strong {
  font-size: 15px;
  font-weight: 700;
  color: #14213d;
  display: block;
  margin-bottom: 4px;
}

.lp-feat-card p {
  font-size: 13.5px;
  color: #5e6b85;
  line-height: 1.6;
  margin: 0;
}

.lp-feat-card-icon {
  font-size: 28px;
  line-height: 1;
}

.lp-feat-card--timer {
  border-color: rgba(234, 88, 12, 0.25);
  background: linear-gradient(135deg, #fff 60%, rgba(234, 88, 12, 0.04) 100%);
}

.lp-feat-timer-badge {
  display: inline-block;
  background: #1a1a2e;
  color: #f59e0b;
  font-size: 15px;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.12em;
  padding: 6px 14px;
  border-radius: 8px;
  width: fit-content;
  border: 1px solid rgba(245, 158, 11, 0.3);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
  animation: lp-timer-pulse 2s ease-in-out infinite;
}

@keyframes lp-timer-pulse {
  0%, 100% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.2); }
  50% { box-shadow: 0 0 24px rgba(245, 158, 11, 0.5); }
}

.lp-feat-card--duo {
  padding: 26px 24px;
}

.lp-feat-card--accent {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  border-color: #4c1d95;
}

.lp-feat-card--accent strong { color: #e0e7ff; }
.lp-feat-card--accent p { color: #a5b4fc; }

.lp-feat-card--accent .lp-feat-card-icon {
  filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.5));
}

.lp-features-cta {
  max-width: 1120px;
  margin: 48px auto 0;
  display: flex;
  justify-content: center;
}

@media (max-width: 900px) {
  .lp-feat-cards-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .lp-features-section {
    padding: 72px 16px 60px;
  }
  .lp-feat-cards-row,
  .lp-feat-cards-row--duo {
    grid-template-columns: 1fr;
  }
}
`;

  fs.appendFileSync(cssPath, featuresCSS, 'utf8');
  console.log('CSS appended successfully.');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) Also update the nav link for "Fonctionnalités" to scroll to new section
// ─────────────────────────────────────────────────────────────────────────────
// (Optional — the existing nav already links to 'fonctionnalites' which is
// on the methodology section header. We keep it as-is for now.)

console.log('\\nAll done! Features section added successfully.');
