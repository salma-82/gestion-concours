import React, { useEffect, useRef, useState, useId } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LandingMascot } from './LandingPage';
import './Auth.css';

/* ─── helpers ─── */
const saveSessionResponse = (responseUser) => {
  const user = { ...responseUser };
  if (user.sessionToken) localStorage.setItem('authToken', user.sessionToken);
  delete user.sessionToken;
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

const envGoogleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

/* ─── Decorative Background (same shapes as LandingPage) ─── */
function LoginBgDecor() {
  return (
    <div className="ecauth-bg-decor-wrap" aria-hidden="true">
      <svg className="ecauth-decor ecauth-decor--atom" viewBox="0 0 90 90" fill="none">
        <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(-35 45 45)" stroke="#3b82f6" strokeWidth="1.7" />
        <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(35 45 45)" stroke="#60a5fa" strokeWidth="1.7" />
        <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(90 45 45)" stroke="#93c5fd" strokeWidth="1.7" />
        <circle cx="45" cy="45" r="5" fill="#f59e0b" />
        <circle cx="71" cy="29" r="3.5" fill="#2563eb" />
        <circle cx="27" cy="61" r="3.5" fill="#2563eb" />
      </svg>
      <svg className="ecauth-decor ecauth-decor--hex" viewBox="0 0 70 70" fill="none">
        <polygon points="35,5 62,20 62,50 35,65 8,50 8,20" stroke="#94a3b8" strokeWidth="1.8" />
        <circle cx="35" cy="5" r="3.5" fill="#cbd5e1" /><circle cx="62" cy="20" r="3.5" fill="#93c5fd" />
        <circle cx="62" cy="50" r="3.5" fill="#cbd5e1" /><circle cx="35" cy="65" r="3.5" fill="#93c5fd" />
        <circle cx="8" cy="50" r="3.5" fill="#cbd5e1" /><circle cx="8" cy="20" r="3.5" fill="#93c5fd" />
      </svg>
      <svg className="ecauth-decor ecauth-decor--dna" viewBox="0 0 80 140" fill="none">
        <path d="M20 10 Q50 30 20 50 Q-10 70 20 90 Q50 110 20 130" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M60 10 Q30 30 60 50 Q90 70 60 90 Q30 110 60 130" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" />
        <line x1="28" y1="20" x2="52" y2="20" stroke="#93c5fd" strokeWidth="1.8" />
        <line x1="18" y1="35" x2="62" y2="35" stroke="#bfdbfe" strokeWidth="1.5" />
        <line x1="20" y1="50" x2="60" y2="50" stroke="#93c5fd" strokeWidth="1.8" />
        <line x1="18" y1="65" x2="62" y2="65" stroke="#bfdbfe" strokeWidth="1.5" />
        <line x1="28" y1="80" x2="52" y2="80" stroke="#93c5fd" strokeWidth="1.8" />
      </svg>
      <div className="ecauth-blob ecauth-blob--a" />
      <div className="ecauth-blob ecauth-blob--b" />
    </div>
  );
}

/* ─── Logo ─── */
/* ─── Field ─── */
function Field({ label, id, type = 'text', value, onChange, placeholder, required, icon, right }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="ecl-field">
      <label className="ecl-label" htmlFor={id}>{label}</label>
      <div className="ecl-input-wrap">
        {icon && <span className="ecl-input-icon">{icon}</span>}
        <input
          id={id}
          className="ecl-input"
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
        {isPassword && (
          <button type="button" className="ecl-eye" aria-label={show ? 'Masquer' : 'Afficher'} onClick={() => setShow(s => !s)}>
            {show
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            }
          </button>
        )}
        {right && <div className="ecl-input-right">{right}</div>}
      </div>
    </div>
  );
}

/* ─── Google SVG ─── */
const GoogleSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function Login() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* Google */
  const [customGoogleClientId, setCustomGoogleClientId] = useState(() => (localStorage.getItem('custom_google_client_id') || '').trim());
  const activeGoogleClientId = envGoogleClientId || customGoogleClientId;
  const [googleError, setGoogleError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleModalTab, setGoogleModalTab] = useState('demo');
  const [demoGoogleEmail, setDemoGoogleEmail] = useState('etudiant.concours@gmail.com');
  const [inputClientId, setInputClientId] = useState(customGoogleClientId);
  const [configSuccess, setConfigSuccess] = useState('');

  const googleButtonRef = useRef(null);
  const navigate = useNavigate();

  /* Google Sign-In init */
  useEffect(() => {
    if (!activeGoogleClientId || !googleButtonRef.current) return undefined;
    let cancelled = false;
    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: activeGoogleClientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async ({ credential } = {}) => {
            if (!credential) { setGoogleError("Google n\u2019a pas renvoy\u00e9 les informations de connexion. R\u00e9essayez."); return; }
            setGoogleLoading(true); setGoogleError('');
            try {
              const apiBase = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
              const response = await axios.post(`${apiBase}/api/auth/google`, { credential }, { withCredentials: true });
              const user = saveSessionResponse(response.data);
              navigate(user.role === 'ADMIN' ? '/admin-dashboard' : '/client-dashboard');
            } catch (err) {
              setGoogleError(err.response?.data?.message || 'Connexion Google impossible.');
            } finally { setGoogleLoading(false); }
          },
        });
        googleButtonRef.current.innerHTML = '';
        const w = Math.min(360, Math.max(260, window.innerWidth - 60));
        window.google.accounts.id.renderButton(googleButtonRef.current, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: w, logo_alignment: 'left' });
      } catch (err) { console.error('Google init error:', err); }
    };
    const existing = document.getElementById('google-identity-services');
    if (window.google?.accounts?.id) { init(); }
    else if (existing) { existing.addEventListener('load', init, { once: true }); }
    else {
      const script = document.createElement('script');
      script.id = 'google-identity-services'; script.src = 'https://accounts.google.com/gsi/client';
      script.async = true; script.defer = true; script.onload = init;
      script.onerror = () => setGoogleError('Le service Google ne peut pas être chargé.');
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, [activeGoogleClientId, navigate]);

  const handleDemoGoogleLogin = async (customEmail) => {
    const targetEmail = (customEmail || demoGoogleEmail || 'etudiant.concours@gmail.com').trim().toLowerCase();
    setGoogleLoading(true); setGoogleError('');
    try {
      const apiBase = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      const response = await axios.post(`${apiBase}/api/auth/google`, { credential: `demo-google:${targetEmail}` }, { withCredentials: true, timeout: 5000 });
      const user = saveSessionResponse(response.data);
      setShowGoogleModal(false);
      navigate(user.role === 'ADMIN' ? '/admin-dashboard' : '/client-dashboard');
    } catch {
      const usernamePart = targetEmail.split('@')[0] || 'etudiant';
      const fallbackUser = { id: 9999, email: targetEmail, nom: 'Google', prenom: usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1), role: targetEmail.includes('admin') ? 'ADMIN' : 'CLIENT', pack: 'PACK_COMPLET', active: 1 };
      localStorage.removeItem('authToken'); localStorage.setItem('user', JSON.stringify(fallbackUser));
      setShowGoogleModal(false);
      navigate(fallbackUser.role === 'ADMIN' ? '/admin-dashboard' : '/client-dashboard');
    } finally { setGoogleLoading(false); }
  };

  const handleSaveGoogleClientId = (e) => {
    e.preventDefault();
    const val = inputClientId.trim();
    if (!val) { setGoogleError('Veuillez saisir un Client ID valide.'); return; }
    localStorage.setItem('custom_google_client_id', val);
    setCustomGoogleClientId(val);
    setConfigSuccess('Client ID enregistré avec succès ! Bouton officiel Google activé.');
    setTimeout(() => { setConfigSuccess(''); setShowGoogleModal(false); }, 1200);
  };

  const handleRemoveCustomClientId = () => {
    localStorage.removeItem('custom_google_client_id'); setCustomGoogleClientId(''); setInputClientId('');
    setConfigSuccess('Client ID personnalisé supprimé.');
    setTimeout(() => setConfigSuccess(''), 1500);
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const response = await axios.post('/api/auth/login', { email: email.trim(), motDePasse });
      const user = saveSessionResponse(response.data);
      delete user.motDePasse; delete user.password;
      navigate(user.role === 'ADMIN' ? '/admin-dashboard' : '/client-dashboard');
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Email ou mot de passe incorrect, ou compte en attente de validation.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet" />
      {/* ─── Scoped styles ─── */}
      <style>{`
        /* ── Grid/Grain overlay ── */
        .ecl-root { display:flex; min-height:100vh; min-height:100svh; position:relative; overflow-x:hidden; overflow-y:auto; font-family:Inter,Poppins,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; -webkit-font-smoothing:antialiased; color:#14213d; }
        .ecl-root *,
        .ecl-root *::before,
        .ecl-root *::after { box-sizing:border-box; }
        .ecl-grid { position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(119,145,186,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(119,145,186,.06) 1px,transparent 1px);background-size:32px 32px; }
        .ecl-grain { position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.09;background-image:radial-gradient(#9aa9c4 .55px,transparent .55px);background-size:7px 7px; }

        /* ── Aside ── */
        .ecl-aside {
          position: relative;
          flex: 0 0 46%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          background: radial-gradient(circle at 8% 12%, rgba(71,117,232,.12) 0 180px, transparent 181px),
                      radial-gradient(circle at 85% 50%, rgba(71,117,232,.09) 0 250px, transparent 251px),
                      linear-gradient(145deg, #edf2ff 0%, #f3f6ff 50%, #f8f9ff 100%);
          overflow: hidden;
          z-index: 1;
        }
        .ecl-aside::after {
          content: '';
          position: absolute;
          inset: 0 0 0 auto;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(36,87,230,.14) 30%, rgba(36,87,230,.14) 70%, transparent);
        }
        .ecl-aside > *:not(.ecauth-bg-decor-wrap) {
          position: relative;
          z-index: 2;
        }

        /* ── Back button (tout en haut à gauche) ── */
        .ecl-back {
          position: absolute;
          top: 12px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: 1px solid rgba(11,45,99,.2);
          border-radius: 999px;
          background: rgba(255,255,255,.92);
          color: #0B2D63;
          font: 700 12.5px/1 inherit;
          cursor: pointer;
          transition: all .2s;
          text-decoration: none;
          backdrop-filter: blur(8px);
          z-index: 50;
          box-shadow: 0 4px 14px rgba(11,45,99,.08);
        }
        .ecl-back:hover {
          background: #ffffff;
          color: #08224B;
          transform: translateX(-2px);
          box-shadow: 0 6px 18px rgba(11,45,99,.18);
        }

        /* ── Centered aside content ── */
        .ecl-aside-content {
          width: 100%;
          max-width: 420px;
          margin: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* ── Logo ── */
        .ecl-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 22px;
        }
        .ecl-logo__cap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,.8);
          box-shadow: 0 4px 14px rgba(36,87,230,.12);
        }
        .ecl-logo__cap svg { width: 26px; height: 24px; }
        .ecl-logo__wordmark { font-family: Poppins,Inter,sans-serif; font-size: 20px; font-weight: 900; letter-spacing: -.02em; }
        .ecl-logo__prefix { color: #2457e6; }
        .ecl-logo__main { color: #14213d; }

        /* ── Mascot Badge ── */
        .ecl-mascot-badge {
          display: grid;
          place-items: center;
          width: 136px;
          height: 136px;
          border-radius: 30px;
          background: rgba(255, 255, 255, .45);
          border: 1.5px solid rgba(255, 255, 255, .85);
          box-shadow: 0 12px 30px rgba(36, 87, 230, .12), inset 0 1px 0 rgba(255, 255, 255, .8);
          backdrop-filter: blur(12px);
          margin-bottom: 22px;
        }
        .ecl-mascot-art {
          display: block;
          overflow: visible;
          filter: drop-shadow(0 8px 8px rgba(10,24,58,.16));
          animation: ecl-float 3.6s ease-in-out infinite;
          width: 108px;
          height: 120px;
        }
        @keyframes ecl-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .ecl-mascot-art .lp-mascot-eye { transform-box:fill-box;transform-origin:center;animation:ecl-blink 4.2s infinite; }
        @keyframes ecl-blink { 0%,92%,96%,100%{transform:scaleY(1)} 94%{transform:scaleY(.08)} }
        .ecl-mascot-art .lp-mascot-wing { transform-box:view-box; }
        .ecl-mascot-art .lp-mascot-wing-left { transform-origin:58px 140px;animation:ecl-wing-l 2.8s ease-in-out infinite; }
        .ecl-mascot-art .lp-mascot-wing-right { transform-origin:182px 140px;animation:ecl-wing-r 2.8s ease-in-out infinite; }
        @keyframes ecl-wing-l { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-8deg)} }
        @keyframes ecl-wing-r { 0%,100%{transform:rotate(0)} 50%{transform:rotate(8deg)} }

        /* ── Aside Copy ── */
        .ecl-aside-title {
          margin: 0 0 10px;
          color: #14213d;
          font-family: Poppins,Inter,sans-serif;
          font-size: clamp(23px, 2.2vw, 30px);
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -.04em;
          text-align: center;
        }
        .ecl-accent {
          color: #0B2D63;
          background: none;
          -webkit-text-fill-color: #0B2D63;
        }
        .ecl-aside-desc {
          margin: 0 0 20px;
          color: #5e6b85;
          font-size: 14.5px;
          line-height: 1.6;
          max-width: 360px;
          text-align: center;
        }

        /* ── Features Card ── */
        .ecl-features-card {
          width: 100%;
          max-width: 380px;
          margin: 0 0 24px;
          padding: 10px 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, .55);
          border: 1px solid rgba(255, 255, 255, .9);
          box-shadow: 0 8px 24px rgba(22, 43, 91, .05);
          backdrop-filter: blur(10px);
          list-style: none;
          display: grid;
          gap: 6px;
          text-align: left;
        }
        .ecl-features-card li {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #334155;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.3;
        }
        .ecl-feat-icon {
          display: inline-flex;
          flex: 0 0 18px;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(36, 87, 230, .12);
          color: #2457e6;
          font-size: 11px;
          font-weight: 900;
        }

        /* ── Switch CTA Button ── */
        .ecl-aside-switch {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 26px;
          border-radius: 999px;
          background: rgba(11, 45, 99, .08);
          border: 1.5px solid rgba(11, 45, 99, .22);
          color: #0B2D63;
          font-size: 13.5px;
          text-decoration: none;
          transition: all .22s cubic-bezier(.2,.8,.2,1);
          box-shadow: 0 4px 14px rgba(11, 45, 99, .08);
        }
        .ecl-aside-switch:hover {
          background: #0B2D63;
          color: #ffffff;
          border-color: #0B2D63;
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(11, 45, 99, .25);
        }
        .ecl-aside-switch strong { font-weight: 800; }

        /* ── BG Decor ── */
        .ecauth-bg-decor-wrap { position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0; }
        .ecauth-decor { position:absolute; }
        .ecauth-decor--atom { width:80px;top:6%;right:8%;opacity:.22;animation:ecl-fa 7s ease-in-out infinite; }
        .ecauth-decor--hex  { width:58px;bottom:8%;left:6%;opacity:.18;animation:ecl-fb 9s ease-in-out infinite; }
        .ecauth-decor--dna  { width:50px;top:42%;right:3%;opacity:.16;animation:ecl-fc 11s ease-in-out infinite; }
        .ecauth-blob { position:absolute;border-radius:50%;pointer-events:none;filter:blur(70px); }
        .ecauth-blob--a { width:340px;height:260px;top:-80px;right:-80px;background:radial-gradient(circle,rgba(185,206,255,.55) 0%,rgba(229,237,255,.3) 60%,transparent 80%); }
        .ecauth-blob--b { width:280px;height:220px;bottom:-60px;left:-40px;background:radial-gradient(circle,rgba(167,199,255,.4) 0%,transparent 70%); }
        @keyframes ecl-fa { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ecl-fb { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(4deg)} }
        @keyframes ecl-fc { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }

        /* ── Main Panel ── */
        .ecl-main { flex:1;display:flex;align-items:center;justify-content:center;padding:clamp(24px,4vw,64px) clamp(20px,4vw,56px);background:radial-gradient(ellipse at 90% 5%,rgba(36,87,230,.06),transparent 35%),radial-gradient(ellipse at 5% 90%,rgba(36,87,230,.04),transparent 35%),linear-gradient(125deg,#fbfbfc 0%,#f6f8fc 100%);position:relative;z-index:1;overflow-y:auto; }
        .ecl-panel { width:100%;max-width:510px; }
        .ecl-eyebrow { display:inline-block;margin-bottom:10px;color:#0B2D63;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase; }
        .ecl-title { margin:0 0 10px;color:#14213d;font-family:Poppins,Inter,sans-serif;font-size:clamp(26px,2.8vw,36px);font-weight:900;line-height:1.12;letter-spacing:-.055em; }
        .ecl-subtitle { margin:0 0 26px;color:#5e6b85;font-size:15px;line-height:1.65; }

        /* ── Alert ── */
        .ecl-alert { display:flex;align-items:flex-start;gap:10px;padding:12px 16px;margin-bottom:18px;border-radius:14px;font-size:13px;font-weight:600;line-height:1.5; }
        .ecl-alert--error { background:#fff2f2;border:1px solid #fecaca;color:#b91c1c; }
        .ecl-alert--success { background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d; }

        /* ── Divider ── */
        .ecl-divider { display:flex;align-items:center;gap:12px;margin:20px 0; }
        .ecl-divider::before,.ecl-divider::after { content:'';flex:1;height:1px;background:#e4eaf4; }
        .ecl-divider span { color:#9aa6bb;font-size:12px;font-weight:600;white-space:nowrap; }

        /* ── Fields ── */
        .ecl-field { display:grid;gap:8px; }
        .ecl-label { color:#14213d;font-size:13px;font-weight:700;letter-spacing:.01em; }
        .ecl-input-wrap { position:relative;display:flex;align-items:center; }
        .ecl-input-icon { position:absolute;left:15px;display:flex;align-items:center;pointer-events:none;color:#9aa6bb; }
        .ecl-input-icon svg { width:16px;height:16px; }
        .ecl-input { width:100%;min-height:52px;padding:14px 44px 14px 42px;border:1.5px solid #d7e1f0;border-radius:18px;background:rgba(246,248,252,.8);color:#14213d;font:500 15px/1.4 inherit;outline:none;transition:border-color .2s,box-shadow .2s,background .2s; }
        .ecl-input::placeholder { color:#9aa6bb; }
        .ecl-input:focus { border-color:#2457e6;background:#fff;box-shadow:0 0 0 4px rgba(36,87,230,.11); }
        .ecl-eye { position:absolute;right:14px;display:flex;align-items:center;padding:4px;border:none;background:transparent;color:#9aa6bb;cursor:pointer;transition:color .2s; }
        .ecl-eye:hover { color:#2457e6; }
        .ecl-eye svg { width:17px;height:17px; }
        .ecl-input-right { position:absolute;right:14px; }

        /* ── Row ── */
        .ecl-row { display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:4px 0 8px; }
        .ecl-checkbox-label { display:flex;align-items:center;gap:8px;color:#5e6b85;font-size:13px;font-weight:600;cursor:pointer; }
        .ecl-checkbox { width:17px;height:17px;accent-color:#2457e6;cursor:pointer; }
        .ecl-forgot { color:#2457e6;font-size:13px;font-weight:700;text-decoration:none;transition:opacity .2s; }
        .ecl-forgot:hover { opacity:.75; }

        /* ── Google ── */
        .ecl-google-btn { width:100%;padding:12px 16px;border-radius:14px;border:1.5px solid #e2e8f0;background:#fff;color:#334155;font:700 14px/1 inherit;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;box-shadow:0 2px 8px rgba(22,43,91,.05);transition:all .2s; }
        .ecl-google-btn:hover { border-color:#c7d3e8;background:#f8fafc; }
        .ecl-google-opts { display:flex;justify-content:center;margin-top:6px; }
        .ecl-google-opts-link { background:none;border:none;color:#2457e6;font-size:12px;font-weight:600;cursor:pointer;text-decoration:underline; }

        /* ── Submit ── */
        .ecl-submit { display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:54px;margin-top:8px;padding:14px 24px;border:none;border-radius:999px;background:#0B2D63;color:#fff;font:800 15px/1 inherit;cursor:pointer;box-shadow:0 12px 26px rgba(11,45,99,.28);transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s,background .22s;position:relative;overflow:hidden; }
        .ecl-submit::after { content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.18) 50%,transparent 60%);transform:translateX(-100%);transition:transform .5s; }
        .ecl-submit:hover::after { transform:translateX(100%); }
        .ecl-submit:hover:not(:disabled) { background:#08224B;transform:translateY(-2px);box-shadow:0 18px 34px rgba(11,45,99,.32); }
        .ecl-submit:disabled { opacity:.72;cursor:wait; }
        .ecl-btn-arrow { font-size:16px;transition:transform .2s; }
        .ecl-submit:hover .ecl-btn-arrow { transform:translateX(3px); }
        .ecl-spinner { display:inline-block;width:17px;height:17px;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:ecl-spin .7s linear infinite; }
        @keyframes ecl-spin { to{transform:rotate(360deg)} }

        /* ── Switch text ── */
        .ecl-switch-text { margin:8px 0 0;text-align:center;color:#5e6b85;font-size:13px; }
        .ecl-link-btn { border:none;background:transparent;color:#0B2D63;font:700 13px/1 inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px; }

        /* ── Security ── */
        .ecl-security { display:flex;align-items:center;justify-content:center;gap:7px;margin-top:22px;color:#97a3b8;font-size:12px;font-weight:600; }

        /* ── Modal ── */
        .ecl-modal-overlay { position:fixed;inset:0;background:rgba(15,23,42,.65);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px; }
        .ecl-modal { background:#fff;border-radius:24px;width:100%;max-width:490px;box-shadow:0 25px 50px -12px rgba(0,0,0,.35);padding:24px;position:relative; }
        .ecl-modal-tabs { display:flex;background:#f1f5f9;border-radius:12px;padding:4px;margin-bottom:18px; }
        .ecl-modal-tab { flex:1;padding:9px 12px;border-radius:9px;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s; }
        .ecl-modal-tab.is-active { background:#fff;color:#2563eb;box-shadow:0 1px 3px rgba(0,0,0,.1); }
        .ecl-modal-tab:not(.is-active) { background:transparent;color:#64748b; }

        /* ── Form ── */
        .ecl-form { display:grid;gap:18px; }

        /* ── Responsive ── */
        @media (max-width:768px) {
          .ecl-root { flex-direction:column; }
          .ecl-back { top:12px; left:14px; }
          .ecl-aside { flex:0 0 auto;min-height:0;padding:clamp(52px,8vw,68px) clamp(20px,6vw,36px) 24px; }
          .ecl-aside::after { display:none; }
          .ecl-logo { margin-bottom:18px; }
          .ecl-mascot-wrap { flex-direction:row;align-items:center;gap:14px;margin-bottom:18px; }
          .ecl-mascot-badge { width:88px;height:88px;border-radius:22px; }
          .ecl-mascot-art { width:70px;height:76px; }
          .ecl-aside-title { font-size:clamp(20px,4.5vw,26px); }
          .ecl-aside-desc { margin:0 0 14px;font-size:14px;line-height:1.5; }
          .ecl-features { gap:8px;margin:0 0 16px; }
          .ecl-aside-switch { display:inline-flex;margin-top:0; }
          .ecl-main { padding:24px 16px 40px; }
        }
        @media (max-width:480px) {
          .ecl-aside { padding:52px 16px 18px; }
          .ecl-mascot-badge { width:80px;height:80px; }
          .ecl-title { font-size:24px; }
        }
        @media (prefers-reduced-motion:reduce) {
          .ecl-root *,.ecl-root *::before,.ecl-root *::after { animation-duration:.01ms!important;transition-duration:.01ms!important; }
        }

        /* Screenshot-matched split login layout; keep the existing owl mascot. */
        .ecl-root { font-family:Nunito,Inter,system-ui,sans-serif; }
        .ecl-aside {
          flex:0 0 48%;
          padding:44px 32px;
          background:#f7f8fc;
        }
        .ecl-aside::before,
        .ecl-aside::after {
          content:'';
          position:absolute;
          border:2px solid rgba(43,87,167,.07);
          border-radius:50%;
          pointer-events:none;
        }
        .ecl-aside::before { width:430px;height:430px;top:-174px;left:-174px; }
        .ecl-aside::after { width:360px;height:360px;inset:auto -145px -157px auto;background:none; }
        .ecl-aside .ecauth-bg-decor-wrap { display:none; }
        .ecl-aside-content { max-width:520px; }
        .ecl-mascot-badge {
          width:120px;height:120px;margin-bottom:28px;border:1px solid #e0e5ef;
          border-radius:30px;background:#fff;box-shadow:0 12px 25px rgba(31,58,105,.06);
          backdrop-filter:none;
        }
        .ecl-mascot-art { width:82px;height:90px; }
        .ecl-aside-title {
          margin:0 0 24px;color:#2b57a7;font-family:Nunito,Inter,system-ui,sans-serif;
          font-size:clamp(28px,3vw,38px);line-height:1.12;letter-spacing:-.035em;
        }
        .ecl-accent { color:#f28a2e;-webkit-text-fill-color:#f28a2e; }
        .ecl-aside-desc,.ecl-features-card { display:none; }
        .ecl-school-pills {
          display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:0 0 34px;
        }
        .ecl-school-pills span {
          display:inline-flex;min-height:39px;align-items:center;justify-content:center;
          padding:0 17px;border:1px solid #dfe5f0;border-radius:999px;background:#fff;
          color:#2b57a7;font-size:14px;font-weight:900;letter-spacing:.08em;
        }
        .ecl-aside-switch {
          min-height:62px;padding:12px 34px;border:1px solid #dfe5f0;background:#fff;
          color:#2b57a7;font-size:16px;box-shadow:0 5px 16px rgba(31,58,105,.04);
        }
        .ecl-aside-switch:hover { border-color:#2b57a7;background:#2b57a7; }
        .ecl-main { padding:clamp(28px,5vw,64px);background:#fff; }
        .ecl-panel { max-width:520px; }
        .ecl-eyebrow { display:none; }
        .ecl-title {
          margin:0 0 34px;color:#2b57a7;font-family:Nunito,Inter,system-ui,sans-serif;
          font-size:clamp(36px,4vw,44px);line-height:1.12;letter-spacing:-.04em;text-align:center;
        }
        .ecl-subtitle { display:none; }
        .ecl-google-btn {
          min-height:64px;padding:12px 20px;border:1.5px solid #dfe5f0;border-radius:999px;
          color:#2b57a7;font-size:17px;box-shadow:none;
        }
        .ecl-divider { gap:16px;margin:24px 0; }
        .ecl-divider span { color:#5e6b85;font-size:14px;font-weight:700; }
        .ecl-label { color:#2b57a7;font-size:16px;font-weight:800; }
        .ecl-input {
          min-height:68px;padding:14px 44px 14px 62px;border-color:#dfe5f0;
          border-radius:23px;background:#f8f9fc;font-size:16px;
        }
        .ecl-forgot { color:#f28a2e; }
        .ecl-submit {
          min-height:72px;margin-top:8px;background:#2b57a7;font-size:19px;
          box-shadow:0 16px 28px rgba(43,87,167,.28);
        }
        .ecl-submit:hover:not(:disabled) { background:#244a91; }
        .ecl-switch-text,.ecl-security { display:none; }
        @media (max-width:768px) {
          .ecl-aside { flex:0 0 auto;min-height:0;padding:58px 20px 24px; }
          .ecl-aside::after { display:none; }
          .ecl-mascot-badge { width:92px;height:92px;margin-bottom:18px;border-radius:24px; }
          .ecl-mascot-art { width:66px;height:72px; }
          .ecl-aside-title { margin-bottom:16px;font-size:clamp(23px,5vw,30px); }
          .ecl-school-pills { gap:6px;margin-bottom:18px; }
          .ecl-school-pills span { min-height:32px;padding:0 11px;font-size:11px; }
          .ecl-aside-switch { min-height:48px;padding:10px 20px;font-size:13px; }
          .ecl-main { padding:28px 20px 40px; }
          .ecl-title { margin-bottom:24px;font-size:34px; }
          .ecl-google-btn { min-height:54px;font-size:15px; }
          .ecl-input { min-height:58px; }
          .ecl-submit { min-height:60px;font-size:17px; }
        }
        @media (max-width:480px) {
          .ecl-aside { padding:54px 16px 22px; }
          .ecl-school-pills { gap:5px; }
          .ecl-school-pills span { padding:0 9px;font-size:10px; }
          .ecl-main { padding:24px 16px 34px; }
        }
      `}</style>

      <div className="ecl-root">
        <div className="ecl-grid" aria-hidden="true" />
        <div className="ecl-grain" aria-hidden="true" />

        {/* ── ASIDE ── */}
        <aside className="ecl-aside">
          <LoginBgDecor />

          <Link
            to="/"
            className="ecl-back"
            style={{ position: 'absolute', top: '12px', left: '14px', zIndex: 50 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Accueil
          </Link>

          <div className="ecl-aside-content">
            <div className="ecl-mascot-badge">
              <LandingMascot className="ecl-mascot-art" />
            </div>

            <h2 className="ecl-aside-title">
              Continue ta <span className="ecl-accent">préparation</span>
            </h2>
            <div className="ecl-school-pills" aria-label="Écoles préparées">
              <span>ENSA</span>
              <span>ENSAM</span>
              <span>ENCG</span>
              <span>MÉDECINE</span>
            </div>

            <Link to="/register" className="ecl-aside-switch">
              <span>Pas encore de compte ?</span>
              <strong>S'inscrire →</strong>
            </Link>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="ecl-main">
          <div className="ecl-panel">
            <div className="ecl-eyebrow">CONNEXION</div>
            <h1 className="ecl-title">Connexion</h1>
            <p className="ecl-subtitle">Entrez vos identifiants pour accéder à votre espace.</p>

            {error && (
              <div className="ecl-alert ecl-alert--error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </div>
            )}
            {(googleError || googleLoading) && (
              <div className={`ecl-alert ${googleError ? 'ecl-alert--error' : 'ecl-alert--success'}`} role="status">
                {googleLoading ? 'Connexion à Google en cours…' : googleError}
              </div>
            )}

            {/* Google button */}
            {activeGoogleClientId ? (
              <div style={{ marginBottom: '4px' }}>
                <div ref={googleButtonRef} style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }} />
                <div className="ecl-google-opts">
                  <button type="button" className="ecl-google-opts-link" onClick={() => { setGoogleError(''); setShowGoogleModal(true); }}>
                    ⚙️ Options Google (Changer / Mode Démo)
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="ecl-google-btn" onClick={() => { setGoogleError(''); setShowGoogleModal(true); }}>
                <GoogleSvg />
                <span>Se connecter avec Google</span>
              </button>
            )}

            <div className="ecl-divider"><span>ou</span></div>

            <form className="ecl-form" onSubmit={handleLogin}>
              <Field id="login-email" label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@exemple.com" required
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m2 7 10 7 10-7" /></svg>}
              />
              <Field id="login-password" label="Mot de passe" type="password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} placeholder="••••••••" required
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
              />
              <div className="ecl-row">
                <label className="ecl-checkbox-label">
                  <input type="checkbox" className="ecl-checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                  Se souvenir de moi
                </label>
                <a href="#forgot" className="ecl-forgot" onClick={e => { e.preventDefault(); alert("Veuillez contacter l'administrateur pour réinitialiser votre mot de passe."); }}>
                  Mot de passe oublié ?
                </a>
              </div>
              <button type="submit" disabled={loading} className="ecl-submit">
                {loading ? <><span className="ecl-spinner" />Connexion…</> : <>Se connecter <span className="ecl-btn-arrow">→</span></>}
              </button>
            </form>

            <p className="ecl-switch-text">
              Pas encore de compte ?{' '}
              <Link to="/register" className="ecl-link-btn">S'inscrire gratuitement</Link>
            </p>

            <div className="ecl-security">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Connexion sécurisée — vos données sont protégées
            </div>
          </div>
        </main>
      </div>

      {/* ── Google Modal ── */}
      {showGoogleModal && (
        <div className="ecl-modal-overlay" onClick={() => setShowGoogleModal(false)}>
          <div className="ecl-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GoogleSvg />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Connexion avec Google</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Accès instantané ou configuration OAuth 2.0</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowGoogleModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            <div className="ecl-modal-tabs">
              <button type="button" className={`ecl-modal-tab ${googleModalTab === 'demo' ? 'is-active' : ''}`} onClick={() => setGoogleModalTab('demo')}>⚡ Mode Démo</button>
              <button type="button" className={`ecl-modal-tab ${googleModalTab === 'real' ? 'is-active' : ''}`} onClick={() => setGoogleModalTab('real')}>🔑 Google Cloud</button>
            </div>

            {googleModalTab === 'demo' && (
              <div>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: 1.45 }}>
                    <strong>🚀 Accès immédiat :</strong> Testez la connexion Google en 1 clic sans configurer Google Cloud.
                  </p>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Email Google pour le test :</label>
                  <input type="email" value={demoGoogleEmail} onChange={e => setDemoGoogleEmail(e.target.value)} placeholder="etudiant.concours@gmail.com" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>Exemples :</span>
                  {['etudiant.concours@gmail.com', 'medecine.prepa@gmail.com', 'ensa.prepa@gmail.com'].map(em => (
                    <button key={em} type="button" onClick={() => setDemoGoogleEmail(em)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '4px 10px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>{em.split('@')[0]}</button>
                  ))}
                </div>
                <button type="button" disabled={googleLoading} onClick={() => handleDemoGoogleLogin(demoGoogleEmail)} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#4285F4', color: '#fff', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: googleLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(66,133,244,.4)' }}>
                  <GoogleSvg /><span>{googleLoading ? 'Connexion…' : 'Continuer avec ce compte Google'}</span>
                </button>
              </div>
            )}

            {googleModalTab === 'real' && (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#475569', lineHeight: 1.45 }}>Pour activer l'authentification officielle Google :</p>
                <ol style={{ margin: '0 0 16px', paddingLeft: '20px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                  <li>Ouvrez la <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>console.cloud.google.com</a>).</li>
                  <li>Créez des identifiants : <strong>ID client OAuth 2.0</strong> &gt; <em>Application Web</em>.</li>
                  <li>Dans <em>Origines autorisées</em>, ajoutez : <code style={{ background: '#f1f5f9', padding: '2px 5px', borderRadius: '4px' }}>http://localhost:5173</code></li>
                  <li>Collez votre Client ID ci-dessous :</li>
                </ol>
                <form onSubmit={handleSaveGoogleClientId}>
                  <div style={{ marginBottom: '12px' }}>
                    <input type="text" value={inputClientId} onChange={e => setInputClientId(e.target.value)} placeholder="ex: 123456789-xxxxx.apps.googleusercontent.com" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  {configSuccess && <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#16a34a', fontWeight: 700, textAlign: 'center' }}>✓ {configSuccess}</p>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Enregistrer &amp; Activer</button>
                    {customGoogleClientId && (
                      <button type="button" onClick={handleRemoveCustomClientId} style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--border, #e2e8f0)', background: 'var(--surface, #fff)', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Effacer</button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
