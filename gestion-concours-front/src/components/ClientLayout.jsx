import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuItems = [
    { title: '🏠 Dashboard', path: '/client-dashboard' },
    { title: '📚 Fiches & Résumés', path: '/client-resumes' },
    { title: '📄 Examens Nationaux', path: '/client-examens' },
    { title: '🎓 Concours', path: '/client-concours' }
  ];

  const matieres = ['Mathématiques', 'Physique', 'SVT'];
  const concoursList = ['ENSA', 'ENSAM', 'Médecine'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      {/* HEADER */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 10,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '8px', 
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '20px'
          }}>
            G
          </div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Gestion<span style={{ color: '#2563eb' }}>Concours</span>
          </h1>
        </div>

        <div style={{ flex: 1, maxWidth: '500px', margin: '0 24px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Rechercher un cours, un examen..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 36px',
                borderRadius: '99px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f1f5f9',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, background-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#f1f5f9';
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', color: '#475569'
            }}>
              👤
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Profil Étudiant</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Candidat Libre</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#fca5a5'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#fee2e2'}
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* BODY (SIDEBAR + MAIN) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <aside style={{
          width: '260px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '20px 0'
        }}>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
            {menuItems.slice(0, 1).map((item) => (
              <SidebarItem key={item.path} item={item} location={location} navigate={navigate} />
            ))}
            
            <div style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ressources
            </div>
            
            <SidebarItem item={menuItems[1]} location={location} navigate={navigate} />
            <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              {matieres.map((mat) => (
                <div key={mat} style={{ fontSize: '13px', color: '#64748b', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px' }}
                     onMouseEnter={(e) => { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; }}
                     onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#64748b'; }}
                >
                  • {mat}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', marginBottom: '8px', paddingLeft: '12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Entraînement
            </div>
            <SidebarItem item={menuItems[2]} location={location} navigate={navigate} />
            <SidebarItem item={menuItems[3]} location={location} navigate={navigate} />
            
            <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              {concoursList.map((concours) => (
                <div key={concours} style={{ fontSize: '13px', color: '#64748b', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px' }}
                     onMouseEnter={(e) => { e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#0f172a'; }}
                     onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#64748b'; }}
                >
                  • {concours}
                </div>
              ))}
            </div>

          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#f8fafc',
          position: 'relative'
        }}>
          {/* Outlet renders the nested child routes (e.g., ClientDashboard, ClientResumes) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ item, location, navigate }) {
  const isActive = location.pathname === item.path;
  return (
    <div 
      onClick={() => navigate(item.path)}
      style={{
        padding: '10px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: isActive ? 700 : 500,
        backgroundColor: isActive ? '#eff6ff' : 'transparent',
        color: isActive ? '#2563eb' : '#475569',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#f1f5f9';
          e.currentTarget.style.color = '#0f172a';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#475569';
        }
      }}
    >
      {item.title}
    </div>
  );
}
