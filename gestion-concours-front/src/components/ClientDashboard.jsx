import React, { useState, useEffect } from 'react';
import ClientMistakesDashboard from './ClientMistakesDashboard';

import logoImg from '../assets/logo.png';
import './ClientDashboard.css';
import {
  readStudentProgress,
  setStudentActivityCompleted
} from '../studentProgress';

const getSubjectStyle = (subject) => {
  const normalized = String(subject || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('math')) return { name: 'Mathématiques', icon: '📐', color: '#2563eb', bgColor: '#eaf2ff' };
  if (normalized.includes('phys') || normalized.includes('chim') || normalized === 'pc') return { name: 'Physique-Chimie', icon: '⚡', color: '#7c3aed', bgColor: '#f3e8ff' };
  if (normalized.includes('svt') || normalized.includes('vie') || normalized.includes('terre')) return { name: 'SVT', icon: '🧬', color: '#059669', bgColor: '#dcfce7' };
  if (normalized.includes('philo')) return { name: 'Philosophie', icon: '🏛️', color: '#d97706', bgColor: '#fef3c7' };
  if (normalized.includes('ang') || normalized.includes('eng')) return { name: 'Anglais', icon: '🌐', color: '#0284c7', bgColor: '#e0f2fe' };
  return { name: subject || 'Autres ressources', icon: '📚', color: '#475569', bgColor: '#f1f5f9' };
};

export default function ClientDashboard() {
  let user = {};
  try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch (e) { user = {}; }
  const candidateName = user.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : (user.nom || 'Étudiant');
  const currentYear = new Date().getFullYear();

  const [studentActivities, setStudentActivities] = useState(() => readStudentProgress());
  useEffect(() => {
    const refreshProgress = () => {
      setStudentActivities(readStudentProgress());
    };
    refreshProgress();
    window.addEventListener('student-progress-updated', refreshProgress);
    window.addEventListener('storage', refreshProgress);
    return () => {
      window.removeEventListener('student-progress-updated', refreshProgress);
      window.removeEventListener('storage', refreshProgress);
    };
  }, []);

  const progressBySubject = studentActivities.reduce((groups, activity) => {
    const style = getSubjectStyle(activity.subject);
    const group = groups[style.name] || { ...style, total: 0, completed: 0 };
    group.total += 1;
    if (activity.completed) group.completed += 1;
    groups[style.name] = group;
    return groups;
  }, {});
  const studentProgressByMatiere = Object.values(progressBySubject)
    .map((group) => ({ ...group, percent: group.total ? Math.round((group.completed / group.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
  const trackedResourceCount = studentActivities.length;
  const completedResourceCount = studentActivities.filter((activity) => activity.completed).length;
  const overallProgress = trackedResourceCount ? Math.round((completedResourceCount / trackedResourceCount) * 100) : 0;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activitiesThisWeek = studentActivities.filter((activity) => new Date(activity.lastViewedAt).getTime() >= weekAgo).length;
  const completionsThisWeek = studentActivities.filter((activity) => activity.completedAt && new Date(activity.completedAt).getTime() >= weekAgo).length;
  const recentStudentActivities = [...studentActivities]
    .sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime())
    .slice(0, 5);
  // ─── Progress Data (Matches the reference image exactly: 78%, 64%, 85%) ───
  const progressByMatiere = [
    {
      nom: 'Mathématiques',
      icon: '📐',
      percent: 78,
      color: '#2563eb',
      bgColor: '#eaf2ff',
      chapitresFait: 11,
      totalChapitres: 14,
      details: 'Limites, Dérivation, Complexes'
    },
    {
      nom: 'Physique-Chimie',
      icon: '⚡',
      percent: 64,
      color: '#7c3aed',
      bgColor: '#f3e8ff',
      chapitresFait: 9,
      totalChapitres: 14,
      details: 'Ondes, Nucléaire, RLC'
    },
    {
      nom: 'SVT',
      icon: '🧬',
      percent: 85,
      color: '#059669',
      bgColor: '#dcfce7',
      chapitresFait: 6,
      totalChapitres: 7,
      details: 'Génétique, Immunologie'
    }
  ];

  const recentActivities = [
    { type: 'QCM', title: 'Concours Blanc ENSA - Math', date: 'Aujourd\'hui 16:30', score: '17.5/20', status: 'Terminé', statusColor: '#059669', statusBg: '#dcfce7' },
    { type: 'Examen', title: 'Bac 2023 - Physique-Chimie', date: 'Hier 20:15', score: 'Consulté', status: 'Révisé', statusColor: '#2563eb', statusBg: '#dbeafe' },
    { type: 'Fiche', title: 'Nombres Complexes', date: 'Il y a 2 jours', score: '100% lu', status: 'Validé', statusColor: '#7c3aed', statusBg: '#f3e8ff' }
  ];

  const adviceList = [
    { icon: '⏱️', title: 'Simulez en temps réel', text: 'Chronométrez-vous pour maîtriser la gestion du temps.' },
    { icon: '💡', title: 'Analysez les erreurs', text: 'Relisez toujours le corrigé détaillé après un test.' },
    { icon: '📅', title: 'Pratique quotidienne', text: 'Résolvez au moins 1 sujet ou QCM chaque jour.' }
  ];

  const friends = [
    { name: 'Youssef M.', action: 'QCM Math', img: 12 },
    { name: 'Amina K.', action: 'Résumé SVT', img: 32 },
    { name: 'Omar R.', action: 'Classement #5', img: 25 },
    { name: 'Lina S.', action: 'QCM PC', img: 44 },
    { name: 'Karim B.', action: 'Streak 22j', img: 8 }
  ];

  return (
    <div style={{
      minHeight: '100%',
      backgroundColor: '#f3f6fb',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      padding: '26px 32px 50px 32px',
      color: '#0f172a'
    }} className="client-dashboard">
      <div style={{ maxWidth: '1560px', margin: '0 auto' }} className="client-dashboard-content">

        {/* ══════════════════════════════════════════════════════════
            1. HERO BANNER (IDENTIQUE AU DESIGN DE L'IMAGE)
        ══════════════════════════════════════════════════════════ */}
        <div className="client-dashboard-hero" style={{
          position: 'relative',
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(105deg, #ffffff 0%, #ffffff 52%, #edf6fe 78%, #dbedfe 100%)',
          borderRadius: '26px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 20px -2px rgba(37, 99, 235, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
          padding: '28px 36px',
          marginBottom: '24px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '230px'
        }}>
          {/* Subtle Decorative Dots Pattern in Top-Right */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '40px',
            width: '120px',
            height: '60px',
            backgroundImage: 'radial-gradient(#93c5fd 1.2px, transparent 1.2px)',
            backgroundSize: '14px 14px',
            opacity: 0.55,
            pointerEvents: 'none'
          }} />

          {/* Left Content */}
          <div className="client-dashboard-hero-content" style={{ flex: 1, maxWidth: '640px', zIndex: 2 }}>
            {/* Pill Tag */}
            <div className="client-dashboard-hero-badge" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: '#e9f2fe',
              color: '#1d68f2',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '14px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d68f2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Préparation {currentYear} · Espace étudiant</span>
            </div>

            {/* Title */}
            <h1 className="client-dashboard-hero-title" style={{
              margin: '0 0 10px 0',
              fontSize: '30px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.5px',
              lineHeight: 1.2
            }}>
              Bonjour, {candidateName} 👋
            </h1>

            {/* Description Subtitle */}
            <p className="client-dashboard-hero-description" style={{
              margin: '0 0 22px 0',
              fontSize: '13.5px',
              color: '#475569',
              lineHeight: 1.55,
              fontWeight: 450
            }}>
              Suivez votre progression en temps réel, préparez votre admission aux Grandes Écoles (ENSA, ENSAM, Médecine, ENCG) et perfectionnez pour le Baccalauréat.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => document.getElementById('client-mistakes-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{
                  background: 'linear-gradient(90deg, #1862ea 0%, #2979fb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 26px',
                  borderRadius: '9999px',
                  fontWeight: 750,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 18px -2px rgba(24, 98, 234, 0.35)',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 22px -2px rgba(24, 98, 234, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 18px -2px rgba(24, 98, 234, 0.35)';
                }}
              >
                <span>→</span>
                <span>Consulter mes erreurs</span>
              </button>
            </div>
          </div>

          {/* Logo du site */}
          <div className="client-dashboard-logo-stage" style={{
            position: 'relative',
            width: '280px',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: '14px',
            boxSizing: 'border-box',
            borderRadius: '24px',
            border: '1px solid rgba(191, 219, 254, 0.9)',
            background: 'rgba(255, 255, 255, 0.72)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.08)'
          }}>
            <img
              src={logoImg}
              alt="Logo ECONCOURS"
              className="client-dashboard-logo"
              style={{
                width: '100%',
                height: '100%',
                maxWidth: '250px',
                maxHeight: '170px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 5px 10px rgba(37, 99, 235, 0.12))'
              }}
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            3. PROGRESSION DE MAÎTRISE PAR MATIÈRE
        ══════════════════════════════════════════════════════════ */}
        <div id="student-progress-section" style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #edf2f7',
          padding: '24px 28px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.015)',
          marginBottom: '26px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#eaf2ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#2563eb">
                  <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zM16.2 13h2.8v6h-2.8z" />
                </svg>
              </div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 800,
                margin: 0,
                color: '#0f172a',
                letterSpacing: '-0.3px'
              }}>
                Ma progression par matière
              </h2>
            </div>

            {/* Score Global Badge */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '6px 18px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                lineHeight: 1.2
              }}>
                AVANCEMENT SUIVI
              </div>
              <div style={{
                fontSize: '17px',
                fontWeight: 850,
                color: '#0f172a',
                lineHeight: 1.3
              }}>
                {overallProgress}% terminé
              </div>
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                {completedResourceCount} sur {trackedResourceCount} ressources consultées
              </div>
            </div>
          </div>

          {/* Progression calculée à partir des ressources réellement consultées */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '18px'
          }}>
            {studentProgressByMatiere.map((mat) => (
              <div
                key={mat.name}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e8edf4',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = mat.color;
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e8edf4';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Title + Percentage Pill */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: mat.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      {mat.icon}
                    </div>
                    <span style={{ fontSize: '14.5px', fontWeight: 750, color: '#0f172a' }}>
                      {mat.nom}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '12px',
                    fontWeight: 750,
                    color: mat.color,
                    backgroundColor: mat.bgColor,
                    padding: '3px 9px',
                    borderRadius: '10px'
                  }}>
                    {mat.percent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{
                  height: '8px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${mat.percent}%`,
                    backgroundColor: mat.color,
                    borderRadius: '999px',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
                <div style={{ marginTop: '8px', color: '#64748b', fontSize: '11.5px' }}>
                  {mat.completed} terminée{mat.completed > 1 ? 's' : ''} sur {mat.total} ressource{mat.total > 1 ? 's' : ''} consultée{mat.total > 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
          {studentProgressByMatiere.length === 0 && (
            <div style={{ padding: '22px', borderRadius: '14px', background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
              Votre progression apparaîtra ici après la consultation de vos cours, résumés ou épreuves.
            </div>
          )}
          <p style={{ margin: '16px 0 0', color: '#64748b', fontSize: '12px' }}>
            Marquez une ressource comme terminée dans « Activités récentes » pour suivre votre avancement.
          </p>
        </div>

        {/*
            5. DISCORD + AMIS + CLASSEMENT
        ══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px', marginBottom: '28px' }}>
          {/* Discord Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '22px',
            border: '1px solid #edf2f7',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.015)'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '160px',
              height: '160px',
              background: 'radial-gradient(circle, rgba(88,101,242,0.12) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #5865F2 0%, #4752c4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 4px 14px rgba(88, 101, 242, 0.25)'
                }}>
                  💬
                </div>
                <div>
                  <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Discord Communauté</h3>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                Rejoignez la communauté pour réviser ensemble, échanger des conseils et poser vos questions.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {['Révisions en groupe', 'Questions & réponses', 'Entraide'].map((label) => (
                  <div key={label} style={{ background: '#f5f6ff', border: '1px solid #e1e4ff', borderRadius: '999px', padding: '7px 10px', color: '#4752c4', fontSize: '10.5px', fontWeight: 700 }}>
                    {label}
                  </div>
                ))}
              </div>
              <a
                href="https://discord.gg/bacprep"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #5865F2 0%, #4752c4 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '11px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(88, 101, 242, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                🚀 Rejoindre le Discord
              </a>
            </div>
          </div>

          {/* Weekly progress from this student's actual activity */}
          <div style={{
            background: '#ffffff', borderRadius: '22px', border: '1px solid #edf2f7',
            padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.015)'
          }}>
            <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>Cette semaine</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 18px' }}>Votre activité sur les 7 derniers jours.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '25px', fontWeight: 850, color: '#2563eb' }}>{activitiesThisWeek}</div>
                <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>Ressources étudiées</div>
              </div>
              <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '25px', fontWeight: 850, color: '#059669' }}>{completionsThisWeek}</div>
                <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>Terminées cette semaine</div>
              </div>
            </div>
            {activitiesThisWeek === 0 && (
              <p style={{ margin: '14px 0 0', color: '#64748b', fontSize: '12px' }}>Consultez un cours ou un résumé pour commencer à suivre votre progression.</p>
            )}
          </div>


        {/* ══════════════════════════════════════════════════════════
            6. ERREURS QCM ET ACTIVITÉS RÉCENTES
        ══════════════════════════════════════════════════════════ */}
        </div>
        <div id="client-mistakes-section">
        <ClientMistakesDashboard />
        </div>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #edf2f7',
          padding: '26px 30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.015)',
          marginBottom: '26px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '20px' }}>⏱️</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Activités Récentes
            </h2>
          </div>
          {recentStudentActivities.length === 0 ? (
            <div style={{ padding: '24px', borderRadius: '14px', background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', textAlign: 'center', fontSize: '13px' }}>
              Vos cours, résumés et épreuves consultés apparaîtront ici.
            </div>
          ) : recentStudentActivities.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 18px',
                background: '#f8fafc',
                border: '1px solid #edf2f7',
                borderRadius: '16px',
                marginBottom: '10px',
                flexWrap: 'wrap',
                gap: '12px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: act.completed ? '#dcfce7' : '#dbeafe',
                  color: act.completed ? '#059669' : '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '11px',
                  flexShrink: 0
                }}>
                  {act.type.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>{act.title}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    {[act.subject, act.chapter].filter(Boolean).join(' · ')}{act.lastViewedAt ? ` · ${new Date(act.lastViewedAt).toLocaleString('fr-FR')}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 650 }}>Consulté {act.visits || 1} fois</span>
                <button
                  type="button"
                  onClick={() => setStudentActivityCompleted(act.id, !act.completed)}
                  style={{
                    fontSize: '11px', fontWeight: 750, color: act.completed ? '#047857' : '#2563eb',
                    background: act.completed ? '#ecfdf5' : '#eff6ff', border: `1px solid ${act.completed ? '#a7f3d0' : '#bfdbfe'}`,
                    padding: '7px 10px', borderRadius: '10px', cursor: 'pointer'
                  }}
                >
                  {act.completed ? '✓ Terminée · Réouvrir' : 'Marquer terminée'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            8. CONSEILS CLÉS POUR RÉUSSIR
        ══════════════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #edf2f7',
          padding: '26px 30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.015)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>💡</span>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Conseils Clés pour Réussir</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
            Habitudes éprouvées et recommandées par les lauréats des sessions précédentes :
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px' }}>
            {adviceList.map((adv, i) => (
              <div key={i} style={{ padding: '16px', background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: '16px' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{adv.icon}</div>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{adv.title}</h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>{adv.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}