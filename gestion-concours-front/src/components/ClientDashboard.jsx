import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientMistakesDashboard from './ClientMistakesDashboard';

import logoImg from '../assets/logo.png';
import {
  getStudentPlanningKey,
  readStudentPlanning,
  readStudentProgress,
  setStudentActivityCompleted
} from '../studentProgress';

// ═══════════ DATA CALENDRIER ═══════════
const CONCOURS_OFFICIELS = [
  { id: 'c1', title: 'Examen National - Mathématiques', date: '2026-10-17', time: '09:00', type: 'exam', subject: 'Math' },
  { id: 'c2', title: 'Concours Médecine', date: '2026-10-26', time: '08:00', type: 'concours', subject: 'SVT' },
  { id: 'c3', title: 'Concours ENSA', date: '2026-11-02', time: '08:00', type: 'concours', subject: 'Math' },
  { id: 'c4', title: 'Concours ENCG', date: '2026-11-08', time: '09:00', type: 'concours', subject: '' },
  { id: 'c5', title: 'Concours ENSAM', date: '2026-11-15', time: '08:30', type: 'concours', subject: 'PC' },
  { id: 'c6', title: 'Concours FMP', date: '2026-11-22', time: '08:00', type: 'concours', subject: 'SVT' }
];

const TYPE_CFG = {
  exam: { icon: '🎯', color: '#ef4444', bg: '#fee2e2', label: 'Examen' },
  concours: { icon: '🏆', color: '#ec4899', bg: '#fce7f3', label: 'Concours' },
  qcm: { icon: '📝', color: '#10b981', bg: '#d1fae5', label: 'QCM' },
  revision: { icon: '📚', color: '#f59e0b', bg: '#fef3c7', label: 'Révision' },
  personal: { icon: '👤', color: '#8b5cf6', bg: '#ede9fe', label: 'Personnel' }
};

const PRIORITY_CFG = {
  low: { color: '#059669', bg: '#d1fae5', label: 'Basse' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Moyenne' },
  high: { color: '#dc2626', bg: '#fee2e2', label: 'Urgent' }
};

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

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
  const navigate = useNavigate();
  const showSidebarChoices = (menu) => navigate('/client-dashboard', {
    replace: true,
    state: { openSidebarMenu: menu }
  });

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

  // ─── Calendrier State ───
  const [curDate, setCurDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [planning, setPlanning] = useState(() => readStudentPlanning());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'revision', subject: '', priority: 'medium' });

  useEffect(() => { localStorage.setItem(getStudentPlanningKey(), JSON.stringify(planning)); }, [planning]);

  const getEvents = () => planning;

  const renderCalendarGrid = () => {
    const y = curDate.getFullYear(), m = curDate.getMonth();
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    let start = first.getDay() - 1; if (start < 0) start = 6;
    const today = new Date();
    const isCurMonth = today.getFullYear() === y && today.getMonth() === m;
    const cells = [];
    for (let i = 0; i < start; i++) cells.push(<div key={`e${i}`} style={{ minHeight: '66px' }} />);
    for (let d = 1; d <= last.getDate(); d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvs = getEvents().filter(e => e.date === dateStr);
      const isToday = isCurMonth && d === today.getDate();
      const isSel = selectedDay === dateStr;
      cells.push(
        <div
          key={d}
          onClick={() => setSelectedDay(isSel ? null : dateStr)}
          style={{
            minHeight: '66px',
            padding: '8px 10px',
            borderRadius: '12px',
            cursor: 'pointer',
            backgroundColor: isToday 
              ? '#eff6ff' 
              : isSel 
                ? '#e0e7ff' 
                : '#ffffff',
            border: isToday 
              ? '1.5px solid #3b82f6' 
              : isSel 
                ? '1.5px solid #4f46e5' 
                : '1px solid #e2e8f0',
            boxShadow: (isToday || isSel) 
              ? '0 2px 8px rgba(59, 130, 246, 0.12)' 
              : '0 1px 2px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!isToday && !isSel) {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }
          }}
          onMouseLeave={(e) => {
            if (!isToday && !isSel) {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }
          }}
        >
          <div style={{
            fontSize: '13.5px',
            fontWeight: 800,
            color: isToday ? '#1d4ed8' : isSel ? '#4338ca' : '#1e293b'
          }}>
            {d}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {dayEvs.slice(0, 4).map((ev, i) => (
              <div
                key={i}
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: (TYPE_CFG[ev.type] || TYPE_CFG.personal).color,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              />
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  const renderEventList = () => {
    let evs = [...getEvents()];
    if (selectedDay) evs = evs.filter(e => e.date === selectedDay);
    evs.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (evs.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '44px 20px',
          color: '#94a3b8',
          backgroundColor: '#f8fafc',
          borderRadius: '14px',
          border: '1px dashed #cbd5e1'
        }}>
          <div style={{ fontSize: '38px', marginBottom: '8px' }}>📭</div>
          <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Aucun événement prévu</div>
        </div>
      );
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return evs.map(ev => {
      const cfg = TYPE_CFG[ev.type] || TYPE_CFG.personal;
      const d = new Date(ev.date);
      const diff = Math.ceil((d - today) / 86400000);
      const diffTxt = diff > 0 ? `J-${diff}` : diff === 0 ? "Aujourd'hui" : 'Passé';
      return (
        <div
          key={ev.id}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderLeft: `4px solid ${cfg.color}`,
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
              {cfg.icon} {ev.title}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: diff <= 3 ? '#b91c1c' : '#475569',
              backgroundColor: diff <= 3 ? '#fee2e2' : '#f1f5f9',
              padding: '2px 8px',
              borderRadius: '6px',
              flexShrink: 0,
              marginLeft: '8px'
            }}>
              {diffTxt}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span>📅 {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            {ev.time && <span>• 🕐 {ev.time}</span>}
            {ev.subject && (
              <span style={{
                backgroundColor: '#f1f5f9',
                color: '#334155',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {ev.subject}
              </span>
            )}
          </div>
        </div>
      );
    });
  };

  const handleAdd = () => {
    if (!form.title || !form.date) { alert('Titre et date obligatoires'); return; }
    setPlanning([...planning, { ...form, id: 'u' + Date.now() }]);
    setForm({ title: '', date: '', time: '', type: 'revision', subject: '', priority: 'medium' });
    setShowModal(false);
  };

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
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const upcomingPlanning = planning
    .filter((event) => new Date(`${event.date}T00:00:00`).getTime() >= todayStart.getTime())
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime())
    .slice(0, 3);
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
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* ══════════════════════════════════════════════════════════
            1. HERO BANNER (IDENTIQUE AU DESIGN DE L'IMAGE)
        ══════════════════════════════════════════════════════════ */}
        <div style={{
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
          <div style={{ flex: 1, maxWidth: '640px', zIndex: 2 }}>
            {/* Pill Tag */}
            <div style={{
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
            <h1 style={{
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
            <p style={{
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
              {/* Primary Blue Button */}
              <button
                onClick={() => showSidebarChoices('examens')}
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
                <span>Consulter les Examens</span>
              </button>

              {/* Secondary Outline Button */}
              <button
                onClick={() => showSidebarChoices('concours-blanc')}
                style={{
                  background: '#ffffff',
                  color: '#1862ea',
                  border: '1.5px solid #2563eb',
                  padding: '11px 24px',
                  borderRadius: '9999px',
                  fontWeight: 750,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8faff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '15px' }}>🏆</span>
                <span>Concours Blancs</span>
              </button>
            </div>
          </div>

          {/* Logo du site */}
          <div style={{
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

        {/* ══════════════════════════════════════════════════════════
            4. CALENDRIER DES CONCOURS & PLANNING PERSONNEL
        ══════════════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #edf2f7',
          padding: '26px 30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.015)',
          marginBottom: '26px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '20px' }}>📅</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Calendrier de révision
            </h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              Organisez vos révisions, concours et objectifs personnels.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '9px 18px', borderRadius: '12px', border: 'none', fontWeight: 700,
                fontSize: '13px', cursor: 'pointer', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', transition: 'all 0.15s ease'
              }}
            >
              ➕ Ajouter un objectif
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '26px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button
                  onClick={() => setCurDate(new Date(curDate.getFullYear(), curDate.getMonth() - 1, 1))}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  ◀
                </button>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {MONTHS[curDate.getMonth()]} {curDate.getFullYear()}
                </h3>
                <button
                  onClick={() => setCurDate(new Date(curDate.getFullYear(), curDate.getMonth() + 1, 1))}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  ▶
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 0' }}>
                    {d}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {renderCalendarGrid()}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                {Object.entries(TYPE_CFG).map(([k, cfg]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color }} />
                    {cfg.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '520px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0', color: '#0f172a' }}>
                Mon planning personnel ({planning.length})
              </h4>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {renderEventList()}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
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

          {/* Events coming from the student's own calendar */}
          <div style={{
            background: '#ffffff', borderRadius: '22px', border: '1px solid #edf2f7',
            padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.015)'
          }}>
            <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>À venir</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px' }}>Vos prochains objectifs enregistrés.</p>
            {upcomingPlanning.length === 0 ? (
              <div style={{ padding: '18px', borderRadius: '14px', background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                Aucun objectif à venir. Ajoutez une date dans le calendrier.
              </div>
            ) : upcomingPlanning.map((event) => (
              <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '11px 12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #edf2f7', marginBottom: '8px' }}>
                <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: 750 }}>{event.title}</span>
                <span style={{ color: '#2563eb', fontSize: '11px', fontWeight: 750, whiteSpace: 'nowrap' }}>
                  {new Date(`${event.date}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}{event.time ? ` · ${event.time}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            6. ERREURS QCM ET ACTIVITÉS RÉCENTES
        ══════════════════════════════════════════════════════════ */}
        <ClientMistakesDashboard />
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

      {/* ══════════════════════════════════════════════════════════
          MODAL ADD EVENT (PLANNING PERSONNEL)
      ══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '28px 30px',
            width: '100%',
            maxWidth: '460px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0f172a' }}>➕ Nouvel événement</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Révision Mathématiques - Analyse"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', marginTop: '4px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', marginTop: '4px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Heure</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', marginTop: '4px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', marginTop: '4px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                >
                  <option value="revision">📚 Révision</option>
                  <option value="qcm">📝 QCM</option>
                  <option value="exam">🎯 Examen</option>
                  <option value="personal">👤 Personnel</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priorité</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {['low', 'medium', 'high'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '10px',
                        border: form.priority === p ? `2px solid ${PRIORITY_CFG[p].color}` : '1.5px solid #e2e8f0',
                        background: form.priority === p ? PRIORITY_CFG[p].bg : '#ffffff',
                        color: form.priority === p ? PRIORITY_CFG[p].color : '#64748b',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {PRIORITY_CFG[p].label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAdd}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  ✓ Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
