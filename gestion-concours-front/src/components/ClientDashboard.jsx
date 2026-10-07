import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ClientDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const cards = [
    {
      title: '📚 Fiches & Résumés',
      description: 'Consultez les résumés par matière et chapitre (Maths, Physique, SVT...) avec lecture haute fidélité.',
      path: '/client-resumes',
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
    },
    {
      title: '🎓 Examens Nationaux',
      description: 'Entraînez-vous avec les sujets et corrigés officiels du Baccalauréat filtrés par année et matière.',
      path: '/client-examens',
      color: '#059669',
      gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)'
    }
  ];


  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '25px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>👤 Espace Client</h1>
          <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#94a3b8' }}>Bienvenue dans votre espace candidat</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background 0.2s'
          }}
        >
          Déconnexion
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ color: '#0f172a', marginBottom: '30px', fontSize: '22px' }}>📋 Tableau de bord</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              style={{
                background: card.gradient,
                color: '#ffffff',
                borderRadius: '12px',
                padding: '30px',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
              }}
            >
              <h3 style={{ fontSize: '20px', margin: '0 0 10px', fontWeight: 'bold' }}>{card.title}</h3>
              <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>{card.description}</p>
              <div style={{
                marginTop: '20px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                Accéder →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
