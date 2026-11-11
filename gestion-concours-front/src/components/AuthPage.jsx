import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import ThemeToggle from './ThemeToggle';
import loginMascotImg from '../assets/v1-mascot.png';
import registerMascotImg from '../assets/v3-mascot.png';

/* Mascot artwork: V1 for login and V3 for registration. */
function AuthOwl({ className = '', variant = 'register' }) {
  const src = variant === 'login' ? loginMascotImg : registerMascotImg;
  return (
    <img
      className={`auth-owl ${className}`}
      src={src}
      alt="Mascotte hibou diplômé E-CONCOURS"
      loading="lazy"
      decoding="async"
    />
  );
}
function LogoMark() {
  return (
    <div className="auth-logo">
      <span className="auth-logo-cap" aria-hidden="true">
        <svg viewBox="0 0 48 42" fill="none">
          <path d="M4 15 24 5l20 10-20 10L4 15Z" fill="#0b2d63" />
          <path d="M11 19v9c7 6 19 6 26 0v-9" fill="#0b2d63" />
          <path d="M42 16v16" stroke="#e2ae4f" strokeWidth="2" strokeLinecap="round" />
          <circle cx="42" cy="34" r="2.5" fill="#e2ae4f" />
        </svg>
      </span>
      <span className="auth-wordmark">
        <span className="auth-wordmark-prefix">E-</span>
        <span className="auth-wordmark-main">CONCOURS</span>
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DECORATIVE BACKGROUND SHAPES  (mirrors LandingPage)
───────────────────────────────────────────── */
function AuthBgDecor() {
  return (
    <div className="auth-bg-decor" aria-hidden="true">
      {/* Atom */}
      <svg className="auth-decor-atom" viewBox="0 0 90 90" fill="none">
        <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(-35 45 45)" stroke="#3b82f6" strokeWidth="1.7" />
        <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(35 45 45)" stroke="#60a5fa" strokeWidth="1.7" />
        <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(90 45 45)" stroke="#93c5fd" strokeWidth="1.7" />
        <circle cx="45" cy="45" r="5" fill="#f59e0b" />
        <circle cx="71" cy="29" r="3.5" fill="#2563eb" />
        <circle cx="27" cy="61" r="3.5" fill="#2563eb" />
      </svg>

      {/* Hexagon */}
      <svg className="auth-decor-hex" viewBox="0 0 70 70" fill="none">
        <polygon points="35,5 62,20 62,50 35,65 8,50 8,20" stroke="#94a3b8" strokeWidth="1.8" />
        <circle cx="35" cy="5" r="3.5" fill="#cbd5e1" />
        <circle cx="62" cy="20" r="3.5" fill="#93c5fd" />
        <circle cx="62" cy="50" r="3.5" fill="#cbd5e1" />
        <circle cx="35" cy="65" r="3.5" fill="#93c5fd" />
        <circle cx="8" cy="50" r="3.5" fill="#cbd5e1" />
        <circle cx="8" cy="20" r="3.5" fill="#93c5fd" />
      </svg>

      {/* DNA */}
      <svg className="auth-decor-dna" viewBox="0 0 80 140" fill="none">
        <path d="M20 10 Q50 30 20 50 Q-10 70 20 90 Q50 110 20 130" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M60 10 Q30 30 60 50 Q90 70 60 90 Q30 110 60 130" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" />
        <line x1="28" y1="20" x2="52" y2="20" stroke="#93c5fd" strokeWidth="1.8" />
        <line x1="18" y1="35" x2="62" y2="35" stroke="#bfdbfe" strokeWidth="1.5" />
        <line x1="20" y1="50" x2="60" y2="50" stroke="#93c5fd" strokeWidth="1.8" />
        <line x1="18" y1="65" x2="62" y2="65" stroke="#bfdbfe" strokeWidth="1.5" />
        <line x1="28" y1="80" x2="52" y2="80" stroke="#93c5fd" strokeWidth="1.8" />
        <line x1="18" y1="95" x2="62" y2="95" stroke="#bfdbfe" strokeWidth="1.5" />
        <line x1="20" y1="110" x2="60" y2="110" stroke="#93c5fd" strokeWidth="1.8" />
      </svg>

      {/* Water molecule */}
      <svg className="auth-decor-h2o" viewBox="0 0 100 66" fill="none">
        <path d="M50 30 26 49M50 30l24 19" stroke="#3b82f6" strokeWidth="1.8" />
        <circle cx="50" cy="27" r="8" fill="#fff" stroke="#f59e0b" strokeWidth="1.8" />
        <circle cx="22" cy="52" r="7" fill="#fff" stroke="#3b82f6" strokeWidth="1.8" />
        <circle cx="78" cy="52" r="7" fill="#fff" stroke="#3b82f6" strokeWidth="1.8" />
        <text x="3" y="14" fill="#2563eb" fontSize="11" fontFamily="'Fira Code', monospace">H₂O</text>
      </svg>

      {/* Ambient blobs */}
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   INPUT FIELD component
───────────────────────────────────────────── */
function Field({ label, id, type = 'text', value, onChange, placeholder, required, hint, icon }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        {icon && <span className="auth-input-icon">{icon}</span>}
        <input
          id={id}
          className="auth-input"
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={isPassword ? 'current-password' : undefined}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-eye-toggle"
            aria-label={show ? 'Masquer' : 'Afficher'}
            onClick={() => setShow(s => !s)}
          >
            {show ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hint && <p className="auth-field-hint">{hint}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN AUTH PAGE
───────────────────────────────────────────── */
export default function AuthPage({ initialMode = 'login', onBackToHome }) {
  const [mode, setMode] = useState(initialMode);
  const navigate = useNavigate();
  const panelRef = useRef(null);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTelephone, setRegTelephone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Animate panel on mode switch
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    el.classList.remove('auth-panel--in');
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('auth-panel--in'));
    });
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/login', {
        email: loginEmail,
        motDePasse: loginPassword,
      });
      const user = { ...response.data };
      if (user.sessionToken) localStorage.setItem('authToken', user.sessionToken);
      delete user.sessionToken;
      localStorage.setItem('user', JSON.stringify(user));
      if (user.role === 'ADMIN') navigate('/admin-dashboard');
      else navigate('/client-dashboard');
    } catch (err) {
      setError(
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (regPassword !== regConfirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }
    try {
      const res = await axios.post('/api/auth/register', {
        username: regUsername.trim(),
        email: regEmail.trim(),
        telephone: regTelephone.trim(),
        password: regPassword,
        role: 'CLIENT',
      });
      const msg = typeof res.data === 'string' ? res.data : "Demande d'inscription envoyée avec succès !";
      setSuccess(msg);
      setTimeout(() => { switchMode('login'); }, 3500);
    } catch (err) {
      setError(
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message || "Erreur lors de l'inscription."
      );
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className={`ecauth-root ecauth-root--${mode}`}>
      {/* Grid background (mirrors landing-root) */}
      <ThemeToggle style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }} />
      <div className="ecauth-grid" aria-hidden="true" />
      <div className="ecauth-grain" aria-hidden="true" />

      {/* ── LEFT PANEL ─────────────────────────── */}
      <aside className="ecauth-aside">
        <AuthBgDecor />

        {/* Back button */}
        <button
          type="button"
          className="ecauth-back-btn"
          onClick={onBackToHome || (() => navigate('/'))}
          style={{ position: 'absolute', top: '12px', left: '14px', zIndex: 50 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Accueil
        </button>

        <div className="ecauth-aside-content">
          {/* Logo */}
          <LogoMark />

          {/* Mascot */}
          <div className={`ecauth-mascot-badge ${isLogin ? 'ecauth-mascot-badge--login' : 'ecauth-mascot-badge--register'}`}>
            <AuthOwl className="ecauth-mascot-art" variant={isLogin ? 'login' : 'register'} />
          </div>

          {/* Headline */}
          <div className="ecauth-aside-copy">
            {isLogin ? (
              <>
                <h2>
                  Bon retour sur{' '}
                  <span className="ecauth-accent">E-CONCOURS</span> !
                </h2>
                <p>
                  Continuez votre préparation. Vos QCM, résumés et statistiques
                  vous attendent.
                </p>
              </>
            ) : (
              <>
                <h2>
                  Commence ta <span className="ecauth-accent">réussite</span>{' '}
                  aujourd'hui
                </h2>
                <p>
                  Rejoins des milliers d'étudiants qui préparent les concours
                  ENSA, ENSAM, Médecine et plus encore.
                </p>
              </>
            )}
          </div>

          {/* Feature pills */}
          <ul className="ecauth-features">
            <li><span className="ecauth-feat-icon">✓</span> Cours du Bac par option</li>
            <li><span className="ecauth-feat-icon">✓</span> Examens nationaux corrigés</li>
            <li><span className="ecauth-feat-icon">✓</span> Résumés &amp; Fiches de révision</li>
            <li><span className="ecauth-feat-icon">✓</span> Concours blancs en QCM chronométrés</li>
            <li><span className="ecauth-feat-icon">✓</span> Concours officiels des grandes écoles en QCM interactifs</li>
          </ul>

          {/* Switch mode CTA */}
          <button
            type="button"
            className="ecauth-aside-switch"
            onClick={() => switchMode(isLogin ? 'register' : 'login')}
          >
            {isLogin ? (
              <><span>Pas encore de compte ?</span> <strong>S'inscrire →</strong></>
            ) : (
              <><span>Déjà un compte ?</span> <strong>Se connecter →</strong></>
            )}
          </button>
        </div>
      </aside>

      {/* ── RIGHT PANEL ────────────────────────── */}
      <main className="ecauth-main">
        <div className="ecauth-panel" ref={panelRef}>

          {/* Tab switcher */}
          <div className="ecauth-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={isLogin}
              className={`ecauth-tab ${isLogin ? 'is-active' : ''}`}
              type="button"
              onClick={() => switchMode('login')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c.5-3.5 3.5-6 8-6s7.5 2.5 8 6" />
              </svg>
              Se connecter
            </button>
            <button
              role="tab"
              aria-selected={!isLogin}
              className={`ecauth-tab ${!isLogin ? 'is-active' : ''}`}
              type="button"
              onClick={() => switchMode('register')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Créer un compte
            </button>
          </div>

          {/* Header */}
          <div className="ecauth-panel-header">
            <div className="ecauth-panel-eyebrow">
              {isLogin ? 'CONNEXION' : 'INSCRIPTION'}
            </div>
            <h1 className="ecauth-panel-title">
              {isLogin ? 'Bon retour !' : 'Créer votre compte'}
            </h1>
            <p className="ecauth-panel-subtitle">
              {isLogin
                ? 'Entrez vos identifiants pour accéder à votre espace.'
                : 'Remplissez le formulaire pour commencer votre préparation.'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="ecauth-alert ecauth-alert--error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="ecauth-alert ecauth-alert--success" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {success}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {isLogin ? (
            <form className="ecauth-form" onSubmit={handleLogin} noValidate>
              <Field
                id="login-email"
                label="Adresse e-mail"
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="nom@exemple.com"
                required
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <path d="m2 7 10 7 10-7" />
                  </svg>
                }
              />
              <Field
                id="login-password"
                label="Mot de passe"
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />

              <div className="ecauth-row">
                <label className="ecauth-checkbox-label">
                  <input type="checkbox" className="ecauth-checkbox" />
                  Se souvenir de moi
                </label>
                <a href="#" className="ecauth-forgot">Mot de passe oublié ?</a>
              </div>

              <button type="submit" disabled={loading} className="ecauth-submit-btn">
                {loading ? (
                  <><span className="ecauth-spinner" />Connexion…</>
                ) : (
                  <>Se connecter <span className="ecauth-btn-arrow">→</span></>
                )}
              </button>

              <p className="ecauth-switch-text">
                Pas encore de compte ?{' '}
                <button type="button" className="ecauth-link-btn" onClick={() => switchMode('register')}>
                  S'inscrire gratuitement
                </button>
              </p>
            </form>
          ) : (
            /* ── REGISTER FORM ── */
            <form className="ecauth-form ecauth-form--register" onSubmit={handleRegister} noValidate>
              <div className="ecauth-form-grid">
                <Field
                  id="reg-username"
                  label="Nom d'utilisateur"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  placeholder="Ex : amine_benali"
                  required
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c.5-3.5 3.5-6 8-6s7.5 2.5 8 6" />
                    </svg>
                  }
                />
                <Field
                  id="reg-phone"
                  label="Téléphone"
                  type="tel"
                  value={regTelephone}
                  onChange={e => setRegTelephone(e.target.value)}
                  placeholder="06XXXXXXXX"
                  required
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.31 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.53 6.53l1.62-.93a2 2 0 0 1 2.11.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  }
                />
              </div>

              <Field
                id="reg-email"
                label="Adresse e-mail"
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="nom@exemple.com"
                required
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <path d="m2 7 10 7 10-7" />
                  </svg>
                }
              />

              <div className="ecauth-form-grid">
                <Field
                  id="reg-password"
                  label="Mot de passe"
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                />
                <Field
                  id="reg-confirm"
                  label="Confirmer le mot de passe"
                  type="password"
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  }
                />
              </div>

              {/* Password strength indicator */}
              {regPassword.length > 0 && (
                <div className="ecauth-strength">
                  <div className="ecauth-strength-bar">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`ecauth-strength-seg ${getStrength(regPassword) >= i ? `strength-${getStrength(regPassword)}` : ''}`}
                      />
                    ))}
                  </div>
                  <span className="ecauth-strength-label">{getStrengthLabel(regPassword)}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="ecauth-submit-btn">
                {loading ? (
                  <><span className="ecauth-spinner" />Création du compte…</>
                ) : (
                  <>Créer mon compte <span className="ecauth-btn-arrow">🎓</span></>
                )}
              </button>

              <p className="ecauth-switch-text">
                Déjà un compte ?{' '}
                <button type="button" className="ecauth-link-btn" onClick={() => switchMode('login')}>
                  Se connecter
                </button>
              </p>
            </form>
          )}

          {/* Security badge */}
          <div className="ecauth-security">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Connexion sécurisée — vos données sont protégées
          </div>
        </div>
      </main>
    </div>
  );
}

/* helpers */
function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
function getStrengthLabel(pw) {
  const s = getStrength(pw);
  return ['', 'Faible', 'Moyen', 'Fort', 'Très fort'][s] || '';
}
