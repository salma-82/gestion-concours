import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { LandingMascot } from './LandingPage';
import { PACK_OPTIONS } from '../packAccess';
import './Auth.css';

const BAC_FILIERES = [
  'Sciences Mathématiques A',
  'Sciences Mathématiques B',
  'Sciences Physiques',
  'Sciences de la Vie et de la Terre (SVT)',
  'Sciences Économiques',
];

/* ─── Decorative Background ─── */
function RegisterBgDecor() {
  return (
    <div className="ecr-bg-wrap" aria-hidden="true">
      <svg className="ecr-decor ecr-decor--atom" viewBox="0 0 90 90" fill="none">
        <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(-35 45 45)" stroke="#3b82f6" strokeWidth="1.7" />
        <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(35 45 45)" stroke="#60a5fa" strokeWidth="1.7" />
        <ellipse cx="45" cy="45" rx="38" ry="15" transform="rotate(90 45 45)" stroke="#93c5fd" strokeWidth="1.7" />
        <circle cx="45" cy="45" r="5" fill="#f59e0b" />
        <circle cx="71" cy="29" r="3.5" fill="#2563eb" />
      </svg>
      <svg className="ecr-decor ecr-decor--hex" viewBox="0 0 70 70" fill="none">
        <polygon points="35,5 62,20 62,50 35,65 8,50 8,20" stroke="#94a3b8" strokeWidth="1.8" />
        <circle cx="35" cy="5" r="3.5" fill="#cbd5e1" /><circle cx="62" cy="20" r="3.5" fill="#93c5fd" />
        <circle cx="35" cy="65" r="3.5" fill="#93c5fd" /><circle cx="8" cy="50" r="3.5" fill="#cbd5e1" />
      </svg>
      <svg className="ecr-decor ecr-decor--h2o" viewBox="0 0 100 66" fill="none">
        <path d="M50 30 26 49M50 30l24 19" stroke="#3b82f6" strokeWidth="1.8" />
        <circle cx="50" cy="27" r="8" fill="#fff" stroke="#f59e0b" strokeWidth="1.8" />
        <circle cx="22" cy="52" r="7" fill="#fff" stroke="#3b82f6" strokeWidth="1.8" />
        <circle cx="78" cy="52" r="7" fill="#fff" stroke="#3b82f6" strokeWidth="1.8" />
        <text x="3" y="14" fill="#2563eb" fontSize="11" fontFamily="monospace">H₂O</text>
      </svg>
      <div className="ecr-blob ecr-blob--a" />
      <div className="ecr-blob ecr-blob--b" />
    </div>
  );
}

/* ─── Logo ─── */
/* ─── Password strength ─── */
function getStrength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'];

/* ═══════════════════════════════════════════════════════════════
   REGISTER PAGE
═══════════════════════════════════════════════════════════════ */
export default function Register() {
  const [searchParams] = useSearchParams();
  const requestedPack = searchParams.get('pack');
  const [formData, setFormData] = useState({
    username: '', email: '', telephone: '', filiere: '',
    password: '', confirmPassword: '',
    pack: PACK_OPTIONS.some(o => o.value === requestedPack) ? requestedPack : '',
    role: 'CLIENT'
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (step === 1) { setStep(2); return; }
    if (formData.password !== formData.confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (formData.password.length < 4) { setError('Le mot de passe doit contenir au moins 4 caractères.'); return; }
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', {
        username: formData.username.trim(), email: formData.email.trim(),
        telephone: formData.telephone.trim(), filiere: formData.filiere,
        password: formData.password, pack: formData.pack, role: 'CLIENT'
      });
      const successMsg = typeof response.data === 'string' ? response.data : "Demande d'inscription envoyée avec succès ! Votre compte sera activé après validation.";
      setMessage(successMsg); setStep(3);
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || "Erreur lors de l'envoi de la demande d'inscription.");
    } finally { setLoading(false); }
  };

  const whatsappMsg = `Salam, je viens d'envoyer une demande d'inscription sur ECONCOURS. Nom: ${formData.username}. Email: ${formData.email}. Téléphone: ${formData.telephone}. Pack: ${PACK_OPTIONS.find(o => o.value === formData.pack)?.label || formData.pack}. Je souhaite confirmer le paiement et l'activation de mon compte.`;
  const whatsappUrl = `https://wa.me/212776546095?text=${encodeURIComponent(whatsappMsg)}`;

  const strength = getStrength(formData.password);

  return (
    <>
      <style>{`
        /* ── Root ── */
        .ecr-root { display:flex;min-height:100vh;min-height:100svh;position:relative;overflow:hidden;font-family:Inter,Poppins,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;color:#14213d; }
        .ecr-root *,.ecr-root *::before,.ecr-root *::after { box-sizing:border-box; }
        .ecr-grid { position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(119,145,186,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(119,145,186,.06) 1px,transparent 1px);background-size:32px 32px; }
        .ecr-grain { position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.09;background-image:radial-gradient(#9aa9c4 .55px,transparent .55px);background-size:7px 7px; }

        /* ── Aside ── */
        .ecr-aside {
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
        .ecr-aside::after {
          content: '';
          position: absolute;
          inset: 0 0 0 auto;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(36,87,230,.14) 30%, rgba(36,87,230,.14) 70%, transparent);
        }
        .ecr-aside > *:not(.ecr-bg-wrap) {
          position: relative;
          z-index: 2;
        }

        /* ── Back button (tout en haut à gauche) ── */
        .ecr-back {
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
        .ecr-back:hover {
          background: #ffffff;
          color: #08224B;
          transform: translateX(-2px);
          box-shadow: 0 6px 18px rgba(11,45,99,.18);
        }

        /* ── Centered aside content ── */
        .ecr-aside-content {
          width: 100%;
          max-width: 420px;
          margin: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* ── Logo ── */
        .ecr-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 22px;
        }
        .ecr-logo__cap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,.8);
          box-shadow: 0 4px 14px rgba(36,87,230,.12);
        }
        .ecr-logo__cap svg { width: 26px; height: 24px; }
        .ecr-logo__wordmark { font-family: Poppins,Inter,sans-serif; font-size: 20px; font-weight: 900; letter-spacing: -.02em; }
        .ecr-logo__prefix { color: #2457e6; }
        .ecr-logo__main { color: #14213d; }

        /* ── Mascot Badge ── */
        .ecr-mascot-badge {
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
        .ecr-mascot-art {
          display: block;
          overflow: visible;
          filter: drop-shadow(0 8px 8px rgba(10,24,58,.16));
          animation: ecr-float 3.6s ease-in-out infinite;
          width: 108px;
          height: 120px;
        }
        @keyframes ecr-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .ecr-mascot-art .lp-mascot-eye { transform-box:fill-box;transform-origin:center;animation:ecr-blink 4.2s infinite; }
        @keyframes ecr-blink { 0%,92%,96%,100%{transform:scaleY(1)} 94%{transform:scaleY(.08)} }
        .ecr-mascot-art .lp-mascot-wing { transform-box:view-box; }
        .ecr-mascot-art .lp-mascot-wing-left { transform-origin:58px 140px;animation:ecr-wl 2.8s ease-in-out infinite; }
        .ecr-mascot-art .lp-mascot-wing-right { transform-origin:182px 140px;animation:ecr-wr 2.8s ease-in-out infinite; }
        @keyframes ecr-wl { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-8deg)} }
        @keyframes ecr-wr { 0%,100%{transform:rotate(0)} 50%{transform:rotate(8deg)} }

        /* ── Aside Copy ── */
        .ecr-aside-title {
          margin: 0 0 10px;
          color: #14213d;
          font-family: Poppins,Inter,sans-serif;
          font-size: clamp(23px, 2.2vw, 30px);
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -.04em;
          text-align: center;
        }
        .ecr-accent {
          color: #0B2D63;
          background: none;
          -webkit-text-fill-color: #0B2D63;
        }
        .ecr-aside-desc {
          margin: 0 0 20px;
          color: #5e6b85;
          font-size: 14.5px;
          line-height: 1.6;
          max-width: 360px;
          text-align: center;
        }

        /* ── Features Card ── */
        .ecr-features-card {
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
        .ecr-features-card li {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #334155;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.3;
        }
        .ecr-feat-icon {
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
        .ecr-aside-switch {
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
        .ecr-aside-switch:hover {
          background: #0B2D63;
          color: #ffffff;
          border-color: #0B2D63;
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(11, 45, 99, .25);
        }
        .ecr-aside-switch strong { font-weight: 800; }

        /* ── BG Decor ── */
        .ecr-bg-wrap { position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0; }
        .ecr-decor { position:absolute; }
        .ecr-decor--atom { width:80px;top:6%;right:8%;opacity:.22;animation:ecr-fa 7s ease-in-out infinite; }
        .ecr-decor--hex { width:58px;bottom:8%;left:6%;opacity:.18;animation:ecr-fb 9s ease-in-out infinite; }
        .ecr-decor--h2o { width:72px;bottom:10%;right:12%;opacity:.18;animation:ecr-fa 8s ease-in-out infinite 2s; }
        .ecr-blob { position:absolute;border-radius:50%;pointer-events:none;filter:blur(70px); }
        .ecr-blob--a { width:340px;height:260px;top:-80px;right:-80px;background:radial-gradient(circle,rgba(185,206,255,.5) 0%,transparent 75%); }
        .ecr-blob--b { width:280px;height:220px;bottom:-60px;left:-40px;background:radial-gradient(circle,rgba(167,199,255,.38) 0%,transparent 70%); }
        @keyframes ecr-fa { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ecr-fb { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(4deg)} }
        @keyframes ecr-fc { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }

        /* ── Main ── */
        .ecr-main { flex:1;display:flex;align-items:center;justify-content:center;padding:clamp(24px,4vw,56px) clamp(20px,4vw,52px);background:radial-gradient(ellipse at 90% 5%,rgba(36,87,230,.06),transparent 35%),radial-gradient(ellipse at 5% 90%,rgba(36,87,230,.04),transparent 35%),linear-gradient(125deg,#fbfbfc 0%,#f6f8fc 100%);position:relative;z-index:1;overflow-y:auto; }
        .ecr-panel { width:100%;max-width:560px; }
        .ecr-eyebrow { display:inline-block;margin-bottom:10px;color:#0B2D63;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase; }
        .ecr-title { margin:0 0 10px;color:#14213d;font-family:Poppins,Inter,sans-serif;font-size:clamp(26px,2.8vw,34px);font-weight:900;line-height:1.12;letter-spacing:-.055em; }
        .ecr-subtitle { margin:0 0 26px;color:#5e6b85;font-size:15px;line-height:1.65; }

        /* ── Alerts ── */
        .ecr-alert { display:flex;align-items:flex-start;gap:10px;padding:12px 16px;margin-bottom:18px;border-radius:14px;font-size:13px;font-weight:600;line-height:1.5; }
        .ecr-alert--error { background:#fff2f2;border:1px solid #fecaca;color:#b91c1c; }
        .ecr-alert--success { background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d; }

        /* ── Form Grid ── */
        .ecr-form { display:grid;gap:16px; }
        .ecr-grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:14px; }

        /* ── Fields ── */
        .ecr-field { display:grid;gap:8px; }
        .ecr-label { color:#14213d;font-size:13px;font-weight:700;letter-spacing:.01em; }
        .ecr-input-wrap { position:relative;display:flex;align-items:center; }
        .ecr-input-icon { position:absolute;left:15px;display:flex;align-items:center;pointer-events:none;color:#9aa6bb; }
        .ecr-input-icon svg { width:16px;height:16px; }
        .ecr-input { width:100%;min-height:50px;padding:13px 16px 13px 42px;border:1.5px solid #d7e1f0;border-radius:16px;background:rgba(246,248,252,.8);color:#14213d;font:500 14px/1.4 inherit;outline:none;transition:border-color .2s,box-shadow .2s,background .2s; }
        .ecr-input::placeholder { color:#9aa6bb; }
        .ecr-input:focus { border-color:#2457e6;background:#fff;box-shadow:0 0 0 4px rgba(36,87,230,.11); }
        .ecr-eye { position:absolute;right:14px;display:flex;align-items:center;padding:4px;border:none;background:transparent;color:#9aa6bb;cursor:pointer;transition:color .2s; }
        .ecr-eye:hover { color:#2457e6; }
        .ecr-eye svg { width:16px;height:16px; }
        .ecr-select { width:100%;min-height:50px;padding:13px 14px 13px 42px;border:1.5px solid #d7e1f0;border-radius:16px;background:rgba(246,248,252,.8) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239aa6bb' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 14px center;color:#14213d;font:500 14px/1.4 inherit;outline:none;cursor:pointer;-webkit-appearance:none;appearance:none;transition:border-color .2s,box-shadow .2s; }
        .ecr-select:focus { border-color:#2457e6;box-shadow:0 0 0 4px rgba(36,87,230,.11); }
        .ecr-no-icon .ecr-input { padding-left:16px; }
        .ecr-no-icon .ecr-select { padding-left:16px; }

        /* ── Strength ── */
        .ecr-strength { display:flex;align-items:center;gap:10px;margin-top:-6px; }
        .ecr-strength-bar { display:flex;gap:4px;flex:1; }
        .ecr-strength-seg { flex:1;height:4px;border-radius:99px;background:#e2e8f4;transition:background .3s; }
        .ecr-strength-seg.s1 { background:#f87171; }
        .ecr-strength-seg.s2 { background:#fb923c; }
        .ecr-strength-seg.s3 { background:#facc15; }
        .ecr-strength-seg.s4 { background:#4ade80; }
        .ecr-strength-label { color:#5e6b85;font-size:12px;font-weight:700;min-width:60px;text-align:right; }

        /* ── Step indicator ── */
        .ecr-steps { display:none; }
        .ecr-step-info { display:flex;align-items:center;gap:8px;margin-bottom:14px;color:#0B2D63;font-size:12px;font-weight:800; }
        .ecr-progress-track { width:100%;height:6px;margin:8px 0 18px;overflow:hidden;border-radius:999px;background:#e4eaf4; }
        .ecr-progress-fill { display:block;height:100%;border-radius:inherit;background:#0B2D63;transition:width .45s ease; }
        .ecr-step-dot { width:8px;height:8px;border-radius:50%;background:#0B2D63; }

        /* ── Submit ── */
        .ecr-submit { display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:54px;margin-top:4px;padding:14px 24px;border:none;border-radius:999px;background:#0B2D63;color:#fff;font:800 15px/1 inherit;cursor:pointer;box-shadow:0 12px 26px rgba(11,45,99,.28);transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s,background .22s;position:relative;overflow:hidden; }
        .ecr-submit::after { content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.18) 50%,transparent 60%);transform:translateX(-100%);transition:transform .5s; }
        .ecr-submit:hover::after { transform:translateX(100%); }
        .ecr-submit:hover:not(:disabled) { background:#08224B;transform:translateY(-2px);box-shadow:0 18px 34px rgba(11,45,99,.32); }
        .ecr-submit:disabled { opacity:.72;cursor:wait; }
        .ecr-spinner { display:inline-block;width:17px;height:17px;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:ecr-spin .7s linear infinite; }
        @keyframes ecr-spin { to{transform:rotate(360deg)} }

        /* ── Nav btn ── */
        .ecr-back-step { display:inline-flex;align-items:center;gap:6px;margin-top:4px;padding:10px 16px;border:1.5px solid #e4eaf4;border-radius:999px;background:#fff;color:#5e6b85;font:700 13px/1 inherit;cursor:pointer;transition:all .2s; }
        .ecr-back-step:hover { border-color:#2457e6;color:#2457e6; }
        .ecr-next-btn { display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;padding:14px 24px;border:none;border-radius:999px;background:#0B2D63;color:#fff;font:800 15px/1 inherit;cursor:pointer;box-shadow:0 12px 26px rgba(11,45,99,.28);transition:transform .22s,box-shadow .22s,background .22s; }
        .ecr-next-btn:hover { background:#08224B;transform:translateY(-2px); }

        /* ── Switch text ── */
        .ecr-switch-text { margin:8px 0 0;text-align:center;color:#5e6b85;font-size:13px; }
        .ecr-link { color:#0B2D63;font-weight:700;text-decoration:none;transition:opacity .2s; }
        .ecr-link:hover { opacity:.75; }

        /* ── Success panel ── */
        .ecr-success { display:grid;gap:18px;color:#14213d; }
        .ecr-success-icon { display:grid;width:56px;height:56px;place-items:center;border-radius:50%;background:#dcfce7;color:#15803d;font-size:28px;font-weight:900; }
        .ecr-success-title { margin:0;font-family:Poppins,Inter,sans-serif;font-size:26px;font-weight:900;letter-spacing:-.04em; }
        .ecr-success-desc,.ecr-success-note { margin:0;color:#5e6b85;line-height:1.6; }
        .ecr-summary { display:grid;gap:7px;padding:16px;border-radius:16px;background:#f3f6fd;border:1px solid #e4eaf4;font-size:14px; }
        .ecr-summary span strong { color:#14213d; }
        .ecr-wa-btn { display:flex;min-height:56px;align-items:center;justify-content:center;gap:9px;padding:0 20px;border-radius:999px;background:#25D366;color:#fff;font:850 15px/1 inherit;text-decoration:none;box-shadow:0 10px 24px rgba(37,211,102,.28);transition:background .2s,transform .2s; }
        .ecr-wa-btn:hover { background:#128C7E;transform:translateY(-2px); }
        .ecr-login-link { display:block;margin:4px auto 0;padding:10px 16px;border:0;background:transparent;color:#0B2D63;font:700 14px/1 inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px; }

        /* ── Security ── */
        .ecr-security { display:flex;align-items:center;justify-content:center;gap:7px;margin-top:20px;color:#97a3b8;font-size:12px;font-weight:600; }

        /* ── Responsive ── */
        @media (max-width:820px) {
          .ecr-root { flex-direction:column;overflow-x:hidden;overflow-y:auto; }
          .ecr-back { top: 12px; left: 14px; }
          .ecr-aside { flex:0 0 auto;min-height:0;padding:clamp(56px,8vw,78px) clamp(20px,6vw,36px) 26px;text-align:center; }
          .ecr-aside::after { display:none; }
          .ecr-logo { justify-content:center;margin-bottom:20px; }
          .ecr-mascot-wrap { flex-direction:column;align-items:center;gap:12px;margin-bottom:18px; }
          .ecr-mascot-badge { width:96px;height:96px;border-radius:24px; }
          .ecr-mascot-art { width:76px;height:84px; }
          .ecr-aside-title { margin-inline:auto;font-size:clamp(20px,4.5vw,26px); }
          .ecr-aside-desc { margin:0 auto 18px; }
          .ecr-features { width:fit-content;margin:0 auto 20px;text-align:left; }
          .ecr-aside-switch { align-self:center;margin-top:0; }
          .ecr-main { padding:24px 16px 40px; }
          .ecr-grid-2 { grid-template-columns:1fr; }
        }
        @media (max-width:480px) {
          .ecr-aside { padding:52px 16px 18px; }
          .ecr-mascot-badge { width:80px;height:80px; }
          .ecr-title { font-size:24px; }
        }
        @media (prefers-reduced-motion:reduce) {
          .ecr-root *,.ecr-root *::before,.ecr-root *::after { animation-duration:.01ms!important;transition-duration:.01ms!important; }
        }
      `}</style>

      <div className="ecr-root">
        <div className="ecr-grid" aria-hidden="true" />
        <div className="ecr-grain" aria-hidden="true" />

        {/* ── ASIDE ── */}
        <aside className="ecr-aside">
          <RegisterBgDecor />

          <Link
            to="/"
            className="ecr-back"
            style={{ position: 'absolute', top: '12px', left: '14px', zIndex: 50 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Accueil
          </Link>

          <div className="ecr-aside-content">
            <div className="ecr-mascot-badge">
              <LandingMascot className="ecr-mascot-art" holdingNotebook />
            </div>

            <h2 className="ecr-aside-title">
              Commence ta <span className="ecr-accent">réussite</span> aujourd'hui
            </h2>
            <p className="ecr-aside-desc">
              Rejoins des milliers d'étudiants qui préparent les concours ENSA, ENSAM, Médecine et plus encore.
            </p>

            <ul className="ecr-features-card">
              <li><span className="ecr-feat-icon">✓</span> Cours du Bac par option</li>
              <li><span className="ecr-feat-icon">✓</span> Examens nationaux corrigés</li>
              <li><span className="ecr-feat-icon">✓</span> Résumés &amp; Fiches de révision</li>
              <li><span className="ecr-feat-icon">✓</span> Concours blancs en QCM chronométrés</li>
              <li><span className="ecr-feat-icon">✓</span> Concours officiels des grandes écoles en QCM interactifs</li>
            </ul>

            <Link to="/login" className="ecr-aside-switch">
              <span>Déjà un compte ?</span>
              <strong>Se connecter →</strong>
            </Link>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="ecr-main">
          <div className="ecr-panel">

            {step < 3 && (
              <>
                <div className="ecr-eyebrow">INSCRIPTION</div>
                <h1 className="ecr-title">Créer votre compte</h1>
                <p className="ecr-subtitle">Remplissez le formulaire pour rejoindre E-CONCOURS.</p>

                {/* Progress steps */}
                <div className="ecr-steps">
                  {[1, 2].map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={`ecr-step ${s < step ? 'is-done' : s === step ? 'is-active' : 'is-upcoming'}`}>
                        {s < step ? '✓' : s}
                      </div>
                      {i < 1 && <div className={`ecr-step-line ${s < step ? 'is-done' : 'is-upcoming'}`} />}
                    </React.Fragment>
                  ))}
                </div>

                <div
                  className="ecr-progress-track"
                  role="progressbar"
                  aria-label={`Étape ${step} sur 2`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={step === 1 ? 0 : 50}
                >
                  <span className="ecr-progress-fill" style={{ width: step === 1 ? '0%' : '50%' }} />
                </div>

                <div className="ecr-step-info">
                  <div className="ecr-step-dot" />
                  {step === 1 ? 'Informations personnelles' : 'Pack & Sécurité'}
                </div>
              </>
            )}

            {error && (
              <div className="ecr-alert ecr-alert--error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </div>
            )}
            {message && (
              <div className="ecr-alert ecr-alert--success" role="status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                {message}
              </div>
            )}

            {/* ── SUCCESS PANEL ── */}
            {step === 3 ? (
              <div className="ecr-success" role="status">
                <div className="ecr-success-icon">✓</div>
                <h2 className="ecr-success-title">Confirmez votre inscription</h2>
                <p className="ecr-success-desc">
                  Votre demande a été envoyée. Pour activer votre compte, contactez ECONCOURS sur WhatsApp, confirmez le pack choisi et envoyez la preuve de paiement.
                </p>
                <div className="ecr-summary">
                  <span><strong>Pack :</strong> {PACK_OPTIONS.find(o => o.value === formData.pack)?.label || formData.pack}</span>
                  <span><strong>Nom :</strong> {formData.username}</span>
                  <span><strong>Email :</strong> {formData.email}</span>
                  <span><strong>Téléphone :</strong> {formData.telephone}</span>
                </div>
                <a className="ecr-wa-btn" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M11.5 2.001C6.201 2.001 1.883 6.319 1.883 11.618c0 1.93.551 3.733 1.511 5.256L2 22l5.264-1.381a9.469 9.469 0 0 0 4.236.998c5.3 0 9.617-4.318 9.617-9.617S16.8 2.001 11.5 2.001z" /></svg>
                  Confirmer sur WhatsApp ↗
                </a>
                <small className="ecr-success-note">Le compte sera activé après confirmation du paiement par l'équipe ECONCOURS.</small>
                <button className="ecr-login-link" type="button" onClick={() => navigate('/login')}>Retour à la connexion</button>
              </div>
            ) : (
              /* ── FORM ── */
              <form className="ecr-form" onSubmit={handleSubmit} noValidate>
                {step === 1 && (
                  <>
                    {/* Step 1: Nom & Email */}
                    <div className="ecr-field">
                      <label className="ecr-label" htmlFor="reg-username">Nom &amp; Prénom</label>
                      <div className="ecr-input-wrap">
                        <span className="ecr-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c.5-3.5 3.5-6 8-6s7.5 2.5 8 6" /></svg></span>
                        <input id="reg-username" className="ecr-input" type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Ex: Amine Benali" required />
                      </div>
                    </div>
                    <div className="ecr-field">
                      <label className="ecr-label" htmlFor="reg-email">Adresse e-mail</label>
                      <div className="ecr-input-wrap">
                        <span className="ecr-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m2 7 10 7 10-7" /></svg></span>
                        <input id="reg-email" className="ecr-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="nom@exemple.com" required />
                      </div>
                    </div>
                    <div className="ecr-field">
                      <label className="ecr-label" htmlFor="reg-phone">Numéro de téléphone</label>
                      <div className="ecr-input-wrap">
                        <span className="ecr-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.31 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.53 6.53l1.62-.93a2 2 0 0 1 2.11.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg></span>
                        <input id="reg-phone" className="ecr-input" type="tel" name="telephone" value={formData.telephone} onChange={handleChange} placeholder="06XXXXXXXX" />
                      </div>
                    </div>
                    <button type="button" className="ecr-next-btn" onClick={() => {
                      if (!formData.username.trim() || !formData.email.trim()) { setError('Veuillez remplir le nom et l\'email.'); return; }
                      setError(''); setStep(2);
                    }}>
                      Continuer <span>→</span>
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    {/* Step 2: Pack, Filière, Mot de passe */}
                    <div className="ecr-field ecr-no-icon">
                      <label className="ecr-label" htmlFor="reg-pack">Offre de préparation</label>
                      <div className="ecr-input-wrap">
                        <select id="reg-pack" className="ecr-select" name="pack" value={formData.pack} onChange={handleChange} required>
                          <option value="" disabled>Choisissez votre pack</option>
                          {PACK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="ecr-field ecr-no-icon">
                      <label className="ecr-label" htmlFor="reg-filiere">Filière du baccalauréat</label>
                      <div className="ecr-input-wrap">
                        <select id="reg-filiere" className="ecr-select" name="filiere" value={formData.filiere} onChange={handleChange} required>
                          <option value="" disabled>Choisissez votre filière</option>
                          {BAC_FILIERES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="ecr-grid-2">
                      <div className="ecr-field">
                        <label className="ecr-label" htmlFor="reg-password">Mot de passe</label>
                        <div className="ecr-input-wrap">
                          <span className="ecr-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                          <input id="reg-password" className="ecr-input" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                        </div>
                      </div>
                      <div className="ecr-field">
                        <label className="ecr-label" htmlFor="reg-confirm">Confirmation</label>
                        <div className="ecr-input-wrap">
                          <span className="ecr-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></span>
                          <input id="reg-confirm" className="ecr-input" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required />
                        </div>
                      </div>
                    </div>

                    {formData.password.length > 0 && (
                      <div className="ecr-strength">
                        <div className="ecr-strength-bar">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`ecr-strength-seg ${strength >= i ? `s${strength}` : ''}`} />
                          ))}
                        </div>
                        <span className="ecr-strength-label">{STRENGTH_LABELS[strength]}</span>
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="ecr-submit">
                      {loading ? <><span className="ecr-spinner" />Création…</> : <>Créer mon compte 🎓</>}
                    </button>
                    <button type="button" className="ecr-back-step" onClick={() => { setError(''); setStep(1); }}>
                      ← Retour
                    </button>
                  </>
                )}
              </form>
            )}

            {step < 3 && (
              <p className="ecr-switch-text">
                Déjà un compte ?{' '}
                <Link to="/login" className="ecr-link">Se connecter</Link>
              </p>
            )}

            <div className="ecr-security">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Inscription sécurisée — vos données sont protégées
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
