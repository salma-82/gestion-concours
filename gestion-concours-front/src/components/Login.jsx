import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8081/api/auth/login', {
        email: email.trim(),
        motDePasse
      });

      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else {
        navigate('/client-dashboard');
      }
    } catch (err) {
      const errorMsg = 
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message || 'Email ou mot de passe incorrect, ou compte en attente de validation.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      backgroundColor: '#ffffff',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {/* ========================================================
          PANNEAU DE GAUCHE : VIOLET AVEC LOGO & BOUTON D'INSCRIPTION
      ======================================================== */}
      <div style={{
        flex: '1 1 50%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 50%, #6366f1 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 30px',
        color: '#ffffff',
        overflow: 'hidden'
      }}>

        {/* Cercles décoratifs d'arrière-plan */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '-80px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-40px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '-100px',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none'
        }} />

        {/* Bouton "← Accueil" en haut à gauche */}
        <Link
          to="/"
          style={{
            position: 'absolute',
            top: '32px',
            left: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.16)',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 700,
            backdropFilter: 'blur(8px)',
            transition: 'background 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'; }}
        >
          <span>←</span>
          <span>Accueil</span>
        </Link>

        {/* Bouton circulaire flottant gauche "<" */}
        <button
          onClick={() => navigate('/')}
          title="Retour à l'accueil"
          style={{
            position: 'absolute',
            left: '32px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: '#1e1b4b',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            transition: 'transform 0.2s, background 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; e.currentTarget.style.background = '#0f172a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.background = '#1e1b4b'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Contenu central gauche : Logo Stylisé & Appel à l'inscription */}
        <div style={{
          maxWidth: '380px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 5
        }}>
          {/* Logo réel de la plateforme */}
          <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '24px',
              padding: '16px 24px',
              backdropFilter: 'blur(8px)',
              marginBottom: '8px'
            }}>
              <img
                src={logoImg}
                alt="Logo"
                style={{ height: '72px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
            </div>
          </div>

          <h2 style={{
            fontSize: '26px',
            fontWeight: 800,
            margin: '0 0 10px',
            letterSpacing: '-0.3px',
            color: '#ffffff'
          }}>
            Nouveau sur la plateforme ?
          </h2>

          <p style={{
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.85)',
            margin: '0 0 26px',
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            Créez votre compte en quelques secondes.
          </p>

          <Link
            to="/register"
            style={{
              padding: '12px 34px',
              borderRadius: '24px',
              border: '2px solid #ffffff',
              background: 'transparent',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.25s ease',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#4f46e5';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Je m'inscris
          </Link>
        </div>
      </div>

      {/* ========================================================
          PANNEAU DE DROITE : FORMULAIRE DE CONNEXION BLANC
      ======================================================== */}
      <div style={{
        flex: '1 1 50%',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 30px',
        position: 'relative'
      }}>

        {/* Bouton circulaire flottant droit ">" */}
        <button
          onClick={() => navigate('/register')}
          title="Aller à l'inscription"
          style={{
            position: 'absolute',
            right: '32px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: '#e2e8f0',
            color: '#64748b',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s, background 0.2s, color 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; e.currentTarget.style.background = '#cbd5e1'; e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div style={{ width: '100%', maxWidth: '420px' }}>
          
          {/* En-tête */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{
              margin: '0 0 8px',
              fontSize: '28px',
              fontWeight: 800,
              color: '#1e293b',
              letterSpacing: '-0.4px'
            }}>
              Bienvenue !
            </h1>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#64748b',
              fontWeight: 500
            }}>
              Connectez-vous pour accéder à votre compte
            </p>
          </div>

          {/* Bouton "Se connecter avec Google" */}
          <button
            type="button"
            onClick={() => alert('La connexion Google sera bientôt disponible !')}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: '12px',
              border: '1.5px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              marginBottom: '22px',
              transition: 'background-color 0.2s, border-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            {/* Logo Google SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Se connecter avec Google</span>
          </button>

          {/* Séparateur "ou avec votre email" */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '22px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{
              padding: '0 12px',
              fontSize: '12px',
              color: '#94a3b8',
              fontWeight: 600
            }}>
              ou avec votre email
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div style={{
              marginBottom: '18px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Formulaire Email + Mot de passe */}
          <form onSubmit={handleLogin}>
            
            {/* Champ Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#4f46e5',
                marginBottom: '6px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre email"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #818cf8',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4f46e5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#818cf8';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Champ Mot de passe */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px'
              }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Ligne "Se souvenir de moi" et "Mot de passe oublié ?" */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#64748b',
                cursor: 'pointer',
                fontWeight: 500,
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#4f46e5',
                    cursor: 'pointer'
                  }}
                />
                <span>Se souvenir de moi</span>
              </label>

              <a
                href="#forgot"
                onClick={(e) => { e.preventDefault(); alert("Veuillez contacter l'administrateur pour réinitialiser votre mot de passe."); }}
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#4f46e5',
                  textDecoration: 'none'
                }}
              >
                Mot de passe oublié?
              </a>
            </div>

            {/* Bouton de Soumission "->] Se connecter" */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#5b50e6',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 18px rgba(91, 80, 230, 0.35)',
                transition: 'background-color 0.2s, transform 0.2s',
                opacity: loading ? 0.75 : 1
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = '#5b50e6'; e.currentTarget.style.transform = 'translateY(0)'; } }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
