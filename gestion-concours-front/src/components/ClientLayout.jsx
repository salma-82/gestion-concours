import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // Sidebar items strictly matching the user screenshot:
  // 1. Dashboard
  // 2. Examens Nationaux
  // 3. Résumé
  // 4. Fiches & Résumés
  // 5. Concours Blanc
  // 6. Concours
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
      title: 'Résumé',
      path: '/client-resumes',
      color: '#10b981',
      bgColor: '#d1fae5',
      renderIcon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
      )
    },
    {
      title: 'Fiches & Résumés',
      path: '/client-resumes',
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
      title: 'Concours Blanc',
      path: '/client-concours',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      renderIcon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <polygon points="12 11 13.5 14 17 14.5 14.5 17 15 20.5 12 19 9 20.5 9.5 17 7 14.5 10.5 14" fill="#f59e0b" stroke="none" />
        </svg>
      )
    },
    {
      title: 'Concours',
      path: '/client-concours',
      color: '#0284c7',
      bgColor: '#e0f2fe',
      renderIcon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10.5 17.5L16.5 11.5" />
          <path d="M14.5 9.5l2 2" />
        </svg>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", overflow: 'hidden' }}>
      
      {/* SIDEBAR AVEC LE DESIGN EXACT DE LA CAPTURE */}
      <aside style={{
        width: '280px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px 20px 16px',
        boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* TOP: LOGO & NAV */}
        <div>
          {/* Logo Brand matching the screenshot (Header image) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '28px', paddingTop: '4px' }}>
            <img src={logoImg} alt="CONCOUR Logo" style={{ height: '70px', maxWidth: '180px', objectFit: 'contain' }} />
          </div>
          
          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              // Pour distinguer Résumé et Fiches & Résumés ou Concours Blanc et Concours si même path
              const isSelected = (index === 0 && location.pathname === '/client-dashboard') ||
                                 (index === 1 && location.pathname === '/client-examens') ||
                                 (index === 2 && location.pathname === '/client-resumes') ||
                                 (index === 4 && location.pathname === '/client-concours');

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
                    transition: 'all 0.2s ease',
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
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
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

                  {/* Right Arrow Chevron (hidden on active item in screenshot or displayed subtly) */}
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

        {/* BOTTOM: SEPARATOR + DÉCONNEXION + PROFIL ÉTUDIANT */}
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          {/* Subtle separator line */}
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

      {/* MAIN CONTENT AREA */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: '#f8fafc',
        position: 'relative'
      }}>
        <Outlet />
      </main>
    </div>
  );
}
