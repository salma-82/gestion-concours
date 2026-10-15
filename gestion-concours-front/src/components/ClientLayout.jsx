import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // Sidebar items:
  // 1. Dashboard
  // 2. Examens Nationaux
  // 3. Cours
  // 4. Résumés
  // 5. Concours Blanc
  const navItems = [
    {
      title: 'Dashboard',
      path: '/client-dashboard',
      color: '#2563eb',
      bgColor: '#dbeafe',
      renderIcon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="4" width="14" height="17" rx="3" />
          <path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z" />
          <line x1="9" y1="10" x2="15" y2="10" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      )
    },
    {
      title: 'Examens Nationaux',
      path: '/client-examens',
      color: '#9333ea',
      bgColor: '#f3e8ff',
      renderIcon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
      )
    },
    {
      title: 'Cours',
      path: '/client-cours',
      color: '#f43f5e',
      bgColor: '#ffe4e6',
      renderIcon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="15" y2="11" />
        </svg>
      )
    },
    {
      title: 'Résumés',
      path: '/client-resumes',
      color: '#d97706',
      bgColor: '#fef3c7',
      renderIcon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
          <line x1="12" y1="9" x2="12" y2="13" />
        </svg>
      )
    },
    {
      title: 'Concours',
      path: '/client-concours',
      color: '#0d9488',
      bgColor: '#ccfbf1',
      renderIcon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      )
    },
    {
      title: 'Concours Blanc',
      path: '/client-concours-blanc',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      renderIcon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <polygon points="12 11 13.5 14 17 14.5 14.5 17 15 20.5 12 19 9 20.5 9.5 17 7 14.5 10.5 14" fill="#f59e0b" stroke="none" />
        </svg>
      )
    }
  ];

  let user = {};
  try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch (e) { user = {}; }
  const userName = user.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : (user.nom || 'Étudiant');
  const userInitial = (user.prenom || user.nom || 'E').charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", overflow: 'hidden', position: 'relative' }}>
      
      {/* SIDEBAR AVEC LOGO & NAV */}
      <aside style={{
        width: '280px',
        minWidth: '280px',
        backgroundColor: '#ffffff',
        borderRight: isSidebarOpen ? '1px solid #e2e8f0' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px 20px 16px',
        boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
        overflowY: 'auto',
        position: 'relative',
        marginLeft: isSidebarOpen ? '0' : '-280px',
        opacity: isSidebarOpen ? 1 : 0,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
        flexShrink: 0,
        zIndex: 50
      }}>
        {/* TOP: LOGO & NAV */}
        <div>
          {/* Logo replacé dans la sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '28px', paddingTop: '4px' }}>
            <img src={logoImg} alt="CONCOUR Logo" style={{ height: '70px', maxWidth: '180px', objectFit: 'contain' }} />
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map((item, index) => {
              const isSelected = location.pathname === item.path;

              return (
                <div
                  key={`${item.title}-${index}`}
                  onClick={() => navigate(item.path)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#edf4fe' : 'transparent',
                    borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                    boxShadow: isSelected ? '0 1px 3px rgba(37, 99, 235, 0.06)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* Rounded Icon Box */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: item.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginRight: '14px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    transition: 'transform 0.2s ease'
                  }}>
                    {item.renderIcon()}
                  </div>

                  {/* Title */}
                  <span style={{
                    flex: 1,
                    fontSize: '15px',
                    fontWeight: isSelected ? 800 : 700,
                    color: isSelected ? '#1d4ed8' : '#0f172a',
                    letterSpacing: '-0.2px'
                  }}>
                    {item.title}
                  </span>

                  {/* Right Arrow Chevron */}
                  {!isSelected && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM: Déconnexion & Profil Étudiant */}
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <div style={{ height: '1px', backgroundColor: '#e2e8f0', width: '90%', margin: '0 auto 16px auto' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Déconnexion Item */}
            <div
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff1f2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginRight: '14px'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>

              <span style={{
                flex: 1,
                fontSize: '15px',
                fontWeight: 800,
                color: '#ef4444',
                letterSpacing: '-0.2px'
              }}>
                Déconnexion
              </span>

              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            {/* Profil Étudiant Item */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginRight: '14px'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <span style={{
                flex: 1,
                fontSize: '15px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.2px'
              }}>
                Profil Étudiant
              </span>

              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      </aside>

      {/* ZONE CONTENU PRINCIPAL AVEC TOPBAR */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#f8fafc'
      }}>
        {/* TOPBAR MODERNE & ÉLÉGANTE */}
        <header style={{
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
        }}>
          {/* Gauche : Bouton Hamburger + Fil d'ariane contextuel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              title={isSidebarOpen ? "Masquer le menu" : "Afficher le menu"}
              aria-label="Toggle menu"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease',
                outline: 'none',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                Espace Étudiant
              </span>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>•</span>
              <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>
                Portail Prépa Concours
              </span>
            </div>
          </div>

          {/* Droite : Badge Session Active & Profil Candidat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)'
              }} />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#047857', letterSpacing: '0.2px' }}>
                Session 2026
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 12px 4px 5px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
              }}>
                {userInitial}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {userName}
                </span>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                  Candidat
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ZONE CONTENU DE LA PAGE */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#f8fafc',
          position: 'relative'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
