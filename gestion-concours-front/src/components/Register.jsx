import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    role: 'CLIENT'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8081/api/auth/register', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        password: formData.password,
        role: 'CLIENT'
      });

      const successMsg = 
        typeof response.data === 'string'
          ? response.data
          : "Demande d'inscription envoyée avec succès ! Votre compte sera activé après validation.";
      
      setMessage(successMsg);
      setFormData({
        username: '',
        email: '',
        telephone: '',
        password: '',
        confirmPassword: '',
        role: 'CLIENT'
      });
      // Redirection automatique vers login après 2 secondes
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      const errorMsg = 
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message || "Erreur lors de l'envoi de la demande d'inscription.";
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
          PANNEAU DE GAUCHE : VIOLET AVEC LOGO & RETOUR CONNEXION
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

        {/* Bouton "← Accueil" */}
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

        {/* Contenu central gauche */}
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
            Déjà inscrit ?
          </h2>

          <p style={{
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.85)',
            margin: '0 0 26px',
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            Accédez directement à vos cours et concours blancs.
          </p>

          <Link
            to="/login"
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
            Se connecter
          </Link>
        </div>
      </div>

      {/* ========================================================
          PANNEAU DE DROITE : FORMULAIRE D'INSCRIPTION BLANC
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

        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          {/* En-tête */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{
              margin: '0 0 8px',
              fontSize: '28px',
              fontWeight: 800,
              color: '#1e293b',
              letterSpacing: '-0.4px'
            }}>
              Créer un compte
            </h1>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#64748b',
              fontWeight: 500
            }}>
              Rejoignez Quizy pour préparer vos concours
            </p>
          </div>

          {/* Messages alertes */}
          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '13px',
              fontWeight: 600
            }}>
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              fontSize: '13px',
              fontWeight: 600
            }}>
              ✅ {message}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Nom & Prénom
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ex: Amine Benali"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4f46e5', marginBottom: '5px' }}>
                Adresse Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Entrez votre email"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #818cf8',
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Numéro de Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="06XXXXXXXX"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Confirmation
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

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
                opacity: loading ? 0.75 : 1
              }}
            >
              <span>{loading ? 'Création en cours...' : "S'inscrire"}</span>
              <span>🚀</span>
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
