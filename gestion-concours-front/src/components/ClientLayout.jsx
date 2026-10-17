import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logoImg from '../assets/logo.png';

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sous-menus accordéon pour Cours et Examens Nationaux
  const [coursOpen, setCoursOpen] = useState(location.pathname.startsWith('/client-cours'));
  const [examensOpen, setExamensOpen] = useState(location.pathname.startsWith('/client-examens'));
  const [resumesOpen, setResumesOpen] = useState(location.pathname.startsWith('/client-resumes'));
  const [concoursOpen, setConcoursOpen] = useState(location.pathname === '/client-concours');
  const [concoursBlancOpen, setConcoursBlancOpen] = useState(location.pathname === '/client-concours-blanc');
  const [coursFilieres, setCoursFilieres] = useState([]);
  const [examensFilieres, setExamensFilieres] = useState([]);
  const [concoursEcoles, setConcoursEcoles] = useState([]);
  const [concoursBlancMatieres, setConcoursBlancMatieres] = useState([]);
  const resumesMatieres = ['Mathématiques', 'Physique-Chimie', 'SVT'];

  const currentFiliereParam = new URLSearchParams(location.search).get('filiere');
  const currentResumeMatiere = new URLSearchParams(location.search).get('matiere');
  const currentConcoursEcole = new URLSearchParams(location.search).get('ecole');
  const currentConcoursBlancMatiere = new URLSearchParams(location.search).get('matiere');
  const isFullScreenResume = location.pathname === '/client-resumes' && Boolean(currentResumeMatiere);
  const isFullScreenConcours = location.pathname === '/client-concours' && Boolean(currentConcoursEcole);
  const isFullScreenConcoursBlanc = location.pathname === '/client-concours-blanc' && Boolean(currentConcoursBlancMatiere);
  const isFullScreenLearningPage = isFullScreenResume || isFullScreenConcours || isFullScreenConcoursBlanc;

  useEffect(() => {
    if (location.pathname.startsWith('/client-cours')) {
      setCoursOpen(true);
    }
    if (location.pathname.startsWith('/client-examens')) {
      setExamensOpen(true);
    }
    if (location.pathname.startsWith('/client-resumes')) {
      setResumesOpen(true);
    }
    if (location.pathname === '/client-concours') {
      setConcoursOpen(true);
    }
    if (location.pathname === '/client-concours-blanc') {
      setConcoursBlancOpen(true);
    }
  }, [location.pathname]);

  // Les raccourcis du dashboard demandent l'ouverture d'un sous-menu sans
  // quitter le dashboard.
  useEffect(() => {
    const menu = location.state?.openSidebarMenu;
    if (menu === 'cours') setCoursOpen(true);
    if (menu === 'examens') setExamensOpen(true);
    if (menu === 'resumes') setResumesOpen(true);
    if (menu === 'concours') setConcoursOpen(true);
    if (menu === 'concours-blanc') setConcoursBlancOpen(true);
  }, [location.state]);

  // Chargement dynamique des filières depuis la base de données
  useEffect(() => {
    const fetchFilieres = async () => {
      try {
        const [resCoursF, resCoursAll, resExamAll, resConcours, resConcoursBlanc] = await Promise.allSettled([
          axios.get('http://localhost:8081/api/cours-bac/filieres'),
          axios.get('http://localhost:8081/api/cours-bac'),
          axios.get('http://localhost:8081/api/examens-nationaux'),
          axios.get('http://localhost:8081/api/concours'),
          axios.get('http://localhost:8081/api/concours-blancs/publies')
        ]);

        // 1. Filières pour les Cours
        const cfSet = new Set();
        if (resCoursF.status === 'fulfilled' && Array.isArray(resCoursF.value.data)) {
          resCoursF.value.data.filter(Boolean).forEach(f => cfSet.add(f.trim()));
        }
        if (resCoursAll.status === 'fulfilled' && Array.isArray(resCoursAll.value.data)) {
          resCoursAll.value.data.map(c => c.filiere).filter(Boolean).forEach(f => cfSet.add(f.trim()));
        }

        const defaultCoursFilieres = [
          'Sciences Mathématiques A',
          'Sciences Mathématiques B',
          'Sciences Physiques (PC)',
          'Sciences de la Vie et de la Terre (SVT)',
          'Sciences Économiques & Gestion'
        ];

        const finalCoursFilieres = cfSet.size > 0 ? Array.from(cfSet) : defaultCoursFilieres;
        setCoursFilieres(finalCoursFilieres);

        // 2. Filières / Options pour les Examens Nationaux
        const efSet = new Set();
        if (resExamAll.status === 'fulfilled' && Array.isArray(resExamAll.value.data)) {
          resExamAll.value.data.map(e => e.optionBac).filter(Boolean).forEach(o => efSet.add(o.trim()));
        }

        const defaultExamOptions = [
          'Sciences Mathématiques A',
          'Sciences Mathématiques B',
          'Sciences Physiques (PC)',
          'Sciences de la Vie et de la Terre (SVT)',
          'Sciences Économiques & Gestion'
        ];

        const finalExamFilieres = efSet.size > 0 ? Array.from(efSet) : defaultExamOptions;
        setExamensFilieres(finalExamFilieres);

        // 3. Écoles proposées dans Concours : uniquement celles présentes
        // dans les épreuves publiées par l'administration.
        if (resConcours.status === 'fulfilled' && Array.isArray(resConcours.value.data)) {
          const ecolesSet = new Set(
            resConcours.value.data
              .map(concours => typeof concours.ecole === 'string' ? concours.ecole.trim() : '')
              .filter(Boolean)
          );
          setConcoursEcoles(Array.from(ecolesSet).sort((a, b) => a.localeCompare(b)));
        }

        // 4. Matières qui ont au moins un fichier HTML dans les concours blancs.
        let concoursBlancData = resConcoursBlanc.status === 'fulfilled'
          ? resConcoursBlanc.value.data
          : null;
        if (!concoursBlancData) {
          try {
            const fallbackResponse = await axios.get('http://localhost:8081/api/concours-blancs');
            concoursBlancData = fallbackResponse.data;
          } catch (err) {
            console.error('Erreur chargement des concours blancs du sidebar:', err);
          }
        }
        const concoursBlancList = Array.isArray(concoursBlancData)
          ? concoursBlancData
          : (Array.isArray(concoursBlancData?.concours) ? concoursBlancData.concours : []);
        const concoursBlancMatieresSet = new Set(
          concoursBlancList
            .filter(concours => typeof concours.htmlUrl === 'string' && concours.htmlUrl.trim())
            .map(concours => typeof concours.matiere === 'string' ? concours.matiere.trim() : '')
            .filter(Boolean)
        );
        setConcoursBlancMatieres(Array.from(concoursBlancMatieresSet).sort((a, b) => a.localeCompare(b)));
      } catch (err) {
        console.error("Erreur chargement filières client:", err);
      }
    };
    fetchFilieres();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // Sidebar items matching reference design:
  // 1. Dashboard
  // 2. Examens Nationaux
  // 3. Cours
  // 4. Résumés
  // 5. Concours
  // 6. Concours Blanc
  const navItems = [
    {
      title: 'Dashboard',
      path: '/client-dashboard',
      renderIcon: (isActive) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#ffffff" : "#2563eb"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      title: 'Examens Nationaux',
      path: '/client-examens',
      renderIcon: (isActive) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#ffffff" : "#2563eb"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
      )
    },
    {
      title: 'Cours Bac',
      path: '/client-cours',
      renderIcon: (isActive) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#ffffff" : "#2563eb"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
      renderIcon: (isActive) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#ffffff" : "#2563eb"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      title: 'Concours',
      path: '/client-concours',
      renderIcon: (isActive) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#ffffff" : "#2563eb"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="10" r="3" />
          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
        </svg>
      )
    },
    {
      title: 'Concours Blanc',
      path: '/client-concours-blanc',
      renderIcon: (isActive) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#ffffff" : "#2563eb"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="4" width="14" height="17" rx="3" />
          <path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z" />
          <polyline points="9 13 11 15 15 11" />
        </svg>
      )
    }
  ];

  let user = {};
  try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch (e) { user = {}; }
  const userName = user.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : (user.nom || 'Salma Boussami');
  
  // Calculate user initials (default to "SB" if user is Salma or default)
  let userInitials = 'SB';
  if (user.prenom || user.nom) {
    userInitials = `${(user.prenom || '').charAt(0)}${(user.nom || '').charAt(0)}`.toUpperCase();
    if (!userInitials) userInitials = 'SB';
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f3f6fb',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* SIDEBAR AVEC LOGO & NAV */}
      <aside style={{
        width: '265px',
        minWidth: '265px',
        backgroundColor: '#ffffff',
        borderRight: isSidebarOpen ? '1px solid #edf2f7' : 'none',
        display: isFullScreenLearningPage ? 'none' : 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 18px 20px 18px',
        boxShadow: '2px 0 20px rgba(0,0,0,0.015)',
        overflowY: 'auto',
        position: 'relative',
        marginLeft: isSidebarOpen ? '0' : '-265px',
        opacity: isSidebarOpen ? 1 : 0,
        transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
        flexShrink: 0,
        zIndex: 50
      }}>
        {/* TOP: LOGO & NAV */}
        <div>
          {/* Logo officiel ECONCOURS */}
          <div
            onClick={() => navigate('/client-dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: '88px',
              boxSizing: 'border-box',
              padding: '10px 12px',
              marginBottom: '22px',
              borderRadius: '20px',
              border: '1px solid #dbeafe',
              background: 'linear-gradient(135deg, #f3f8ff 0%, #eaf3ff 100%)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.06)',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
          >
            <img
              src={logoImg}
              alt="ECONCOURS"
              style={{
                height: '62px',
                maxWidth: '150px',
                objectFit: 'contain'
              }}
            />
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item, index) => {
              const isSelected = location.pathname === item.path
                && !currentFiliereParam
                && !(item.path === '/client-resumes' && currentResumeMatiere);
              const isCours = item.path === '/client-cours';
              const isExamens = item.path === '/client-examens';
              const isResumes = item.path === '/client-resumes';
              const isConcours = item.path === '/client-concours';
              const isConcoursBlanc = item.path === '/client-concours-blanc';
              const hasSubmenu = isCours || isExamens || isResumes || isConcours || isConcoursBlanc;
              const isSubmenuOpen = isCours
                ? coursOpen
                : (isExamens ? examensOpen : (isResumes ? resumesOpen : (isConcours ? concoursOpen : (isConcoursBlanc ? concoursBlancOpen : false))));

              const handleItemClick = () => {
                if (isCours) {
                  setCoursOpen(prev => !prev);
                  if (location.pathname !== '/client-dashboard') {
                    navigate('/client-dashboard');
                  }
                } else if (isExamens) {
                  if (location.pathname === '/client-dashboard') {
                    setExamensOpen(prev => !prev);
                  } else {
                    setExamensOpen(true);
                    navigate('/client-dashboard', { state: { openSidebarMenu: 'examens' } });
                  }
                } else if (isResumes) {
                  setResumesOpen(true);
                  if (location.pathname !== '/client-dashboard') {
                    navigate('/client-dashboard');
                  }
                } else if (isConcours) {
                  setConcoursOpen(true);
                  if (location.pathname !== '/client-dashboard') {
                    navigate('/client-dashboard');
                  }
                } else if (isConcoursBlanc) {
                  setConcoursBlancOpen(true);
                  if (location.pathname !== '/client-dashboard') {
                    navigate('/client-dashboard');
                  }
                } else {
                  navigate(item.path);
                }
              };

              return (
                <div key={`${item.title}-${index}`}>
                  <div
                    onClick={handleItemClick}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'linear-gradient(135deg, #1865f2 0%, #2f82fa 100%)'
                        : (location.pathname === item.path ? '#edf4fe' : 'transparent'),
                      boxShadow: isSelected
                        ? '0 6px 18px -2px rgba(24, 101, 242, 0.35)'
                        : 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && location.pathname !== item.path) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && location.pathname !== item.path) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {/* Icon Box */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : '#edf4fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginRight: '12px',
                      transition: 'transform 0.2s ease'
                    }}>
                      {item.renderIcon(isSelected)}
                    </div>

                    {/* Title */}
                    <span style={{
                      flex: 1,
                      fontSize: '14px',
                      fontWeight: isSelected ? 750 : 650,
                      color: isSelected ? '#ffffff' : (location.pathname === item.path ? '#1865f2' : '#334155'),
                      letterSpacing: '-0.2px'
                    }}>
                      {item.title}
                    </span>

                    {/* Chevron (Accordion or Arrow) */}
                    {hasSubmenu ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCours) setCoursOpen(prev => !prev);
                          if (isExamens) setExamensOpen(prev => !prev);
                          if (isResumes) setResumesOpen(prev => !prev);
                          if (isConcours) setConcoursOpen(prev => !prev);
                          if (isConcoursBlanc) setConcoursBlancOpen(prev => !prev);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={isSelected ? "#ffffff" : "#94a3b8"}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: isSubmenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    ) : !isSelected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </div>

                  {/* SOUS-MENU FILIÈRES POUR « COURS » */}
                  {isCours && isSubmenuOpen && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      paddingLeft: '14px',
                      marginTop: '4px',
                      marginBottom: '6px',
                      borderLeft: '2px solid #e2e8f0',
                      marginLeft: '26px'
                    }}>
                      {coursFilieres.map((fil, fIdx) => {
                        const isSubSelected = location.pathname === '/client-cours' && currentFiliereParam === fil;
                        return (
                          <div
                            key={`cours-fil-${fIdx}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/client-cours?filiere=${encodeURIComponent(fil)}`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '12.5px',
                              fontWeight: isSubSelected ? 750 : 600,
                              color: isSubSelected ? '#1865f2' : '#475569',
                              backgroundColor: isSubSelected ? '#eff6ff' : 'transparent',
                              transition: 'all 0.15s ease',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isSubSelected ? '#1865f2' : '#cbd5e1',
                              flexShrink: 0
                            }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fil}>
                              {fil}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SOUS-MENU FILIÈRES POUR « EXAMENS NATIONAUX » */}
                  {isExamens && isSubmenuOpen && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      paddingLeft: '14px',
                      marginTop: '4px',
                      marginBottom: '6px',
                      borderLeft: '2px solid #e2e8f0',
                      marginLeft: '26px'
                    }}>
                      {examensFilieres.map((fil, fIdx) => {
                        const isSubSelected = location.pathname === '/client-examens' && currentFiliereParam === fil;
                        return (
                          <div
                            key={`exam-fil-${fIdx}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/client-examens?filiere=${encodeURIComponent(fil)}`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '12.5px',
                              fontWeight: isSubSelected ? 750 : 600,
                              color: isSubSelected ? '#1865f2' : '#475569',
                              backgroundColor: isSubSelected ? '#eff6ff' : 'transparent',
                              transition: 'all 0.15s ease',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isSubSelected ? '#1865f2' : '#cbd5e1',
                              flexShrink: 0
                            }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fil}>
                              {fil}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isResumes && isSubmenuOpen && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      paddingLeft: '14px',
                      marginTop: '4px',
                      marginBottom: '6px',
                      borderLeft: '2px solid #e2e8f0',
                      marginLeft: '26px'
                    }}>
                      {resumesMatieres.map((matiere) => {
                        const label = matiere === 'Physique-Chimie' ? 'Physique - Chimie' : matiere;
                        const isSubSelected = location.pathname === '/client-resumes'
                          && currentResumeMatiere === matiere;
                        return (
                          <div
                            key={`resume-matiere-${matiere}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/client-resumes?matiere=${encodeURIComponent(matiere)}`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '12.5px',
                              fontWeight: isSubSelected ? 750 : 600,
                              color: isSubSelected ? '#1865f2' : '#475569',
                              backgroundColor: isSubSelected ? '#eff6ff' : 'transparent',
                              transition: 'all 0.15s ease',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isSubSelected ? '#1865f2' : '#cbd5e1',
                              flexShrink: 0
                            }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isConcours && isSubmenuOpen && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      paddingLeft: '14px',
                      marginTop: '4px',
                      marginBottom: '6px',
                      borderLeft: '2px solid #e2e8f0',
                      marginLeft: '26px'
                    }}>
                      {concoursEcoles.map((ecole) => {
                        const isSubSelected = location.pathname === '/client-concours'
                          && currentConcoursEcole?.toLowerCase() === ecole.toLowerCase();
                        return (
                          <div
                            key={`concours-ecole-${ecole}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/client-concours?ecole=${encodeURIComponent(ecole)}`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '12.5px',
                              fontWeight: isSubSelected ? 750 : 600,
                              color: isSubSelected ? '#1865f2' : '#475569',
                              backgroundColor: isSubSelected ? '#eff6ff' : 'transparent',
                              transition: 'all 0.15s ease',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isSubSelected ? '#1865f2' : '#cbd5e1',
                              flexShrink: 0
                            }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ecole}>
                              {ecole}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isConcoursBlanc && isSubmenuOpen && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      paddingLeft: '14px',
                      marginTop: '4px',
                      marginBottom: '6px',
                      borderLeft: '2px solid #e2e8f0',
                      marginLeft: '26px'
                    }}>
                      {concoursBlancMatieres.map((matiere) => {
                        const isSubSelected = location.pathname === '/client-concours-blanc'
                          && currentConcoursBlancMatiere?.toLowerCase() === matiere.toLowerCase();
                        return (
                          <div
                            key={`concours-blanc-matiere-${matiere}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/client-concours-blanc?matiere=${encodeURIComponent(matiere)}`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '12.5px',
                              fontWeight: isSubSelected ? 750 : 600,
                              color: isSubSelected ? '#1865f2' : '#475569',
                              backgroundColor: isSubSelected ? '#eff6ff' : 'transparent',
                              transition: 'all 0.15s ease',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubSelected) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isSubSelected ? '#1865f2' : '#cbd5e1',
                              flexShrink: 0
                            }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={matiere}>
                              {matiere}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Déconnexion, à la place de la carte décorative */}
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid #fecdd3',
              background: '#fff1f2',
              color: '#e11d48',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.18s ease, border-color 0.18s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ffe4e6'; e.currentTarget.style.borderColor = '#fda4af'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.borderColor = '#fecdd3'; }}
          >
            <span style={{
              width: '38px',
              height: '38px',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              borderRadius: '12px',
              background: '#fee2e2'
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span style={{ fontSize: '14px', fontWeight: 750 }}>Déconnexion</span>
          </button>
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
        backgroundColor: '#f3f6fb'
      }}>
        {/* TOPBAR MODERNE & IDENTIQUE AU DESIGN */}
        <header style={{
          height: '68px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #edf2f7',
          display: isFullScreenLearningPage ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          flexShrink: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.015)'
        }}>
          {/* Gauche : Bouton Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              title={isSidebarOpen ? "Masquer le menu" : "Afficher le menu"}
              aria-label="Toggle menu"
              style={{
                width: '38px',
                height: '38px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none',
                padding: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            </button>

          </div>

          {/* Droite : Notification Bell & Profil Étudiant avec Initiale SB */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Cloche Notification */}
            <div
              title="Notifications"
              style={{
                position: 'relative',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {/* Notification dot */}
              <span style={{
                position: 'absolute',
                top: '7px',
                right: '8px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#2563eb'
              }} />
            </div>

            {/* Profile Avatar & Name */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '12px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
              onClick={() => navigate('/client-profile')}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {/* Circular Avatar SB */}
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#1865f2',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 750,
                fontSize: '13.5px',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 8px rgba(24, 101, 242, 0.28)'
              }}>
                {userInitials}
              </div>

              {/* Name & Role */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 750, color: '#0f172a', lineHeight: 1.25 }}>
                  {userName}
                </span>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                  Étudiant
                </span>
              </div>

              {/* Dropdown arrow */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </header>

        {/* ZONE CONTENU DE LA PAGE */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#f3f6fb',
          position: 'relative'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
