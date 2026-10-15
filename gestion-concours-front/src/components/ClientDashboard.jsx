import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import ensaImg from '../assets/ENSA.jpg';
import ensamImg from '../assets/ENSAM.jpg';
import medecineImg from '../assets/MEDCINE.jpg';
import encgImg from '../assets/ENCG.jpeg';

const API = 'http://localhost:8081';

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

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function ClientDashboard() {
  const navigate = useNavigate();

  let user = {};
  try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch (e) { user = {}; }
  const candidateName = user.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : (user.nom || 'Cher Candidat');

  // ─── Stats API ───
  const [dataCounts, setDataCounts] = useState({ examens: 18, resumes: 24, concours: 12 });
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [r1, r2, r3, r4] = await Promise.allSettled([
          axios.get(`${API}/api/examens-nationaux`),
          axios.get(`${API}/api/resumes`),
          axios.get(`${API}/api/cours-bac`),
          axios.get(`${API}/api/concours-blancs/publies`)
        ]);
        const totalRes = (r3.status === 'fulfilled' && Array.isArray(r3.value.data) ? r3.value.data.length : 0) +
                         (r2.status === 'fulfilled' && Array.isArray(r2.value.data) ? r2.value.data.length : 0);
        setDataCounts({
          examens: r1.status === 'fulfilled' && Array.isArray(r1.value.data) ? r1.value.data.length : 18,
          resumes: totalRes > 0 ? totalRes : 24,
          concours: r4.status === 'fulfilled' && Array.isArray(r4.value.data) ? r4.value.data.length : 12
        });
      } catch (err) {}
    };
    fetchCounts();
  }, []);

  // ─── Live Timer ───
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const fmtTime = () => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // ─── Calendrier State ───
  const [tab, setTab] = useState('concours');
  const [curDate, setCurDate] = useState(new Date(2026, 9, 1));
  const [selectedDay, setSelectedDay] = useState(null);
  const [planning, setPlanning] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'revision', subject: '', priority: 'medium' });

  useEffect(() => {
    try { setPlanning(JSON.parse(localStorage.getItem('userPlanning') || '[]')); } catch (e) { setPlanning([]); }
  }, []);
  useEffect(() => { localStorage.setItem('userPlanning', JSON.stringify(planning)); }, [planning]);

  const getEvents = () => tab === 'concours' ? CONCOURS_OFFICIELS : planning;

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

  // ─── Progress Data ───
  const progressByMatiere = [
    { nom: 'Mathématiques', icon: '📐', percent: 78, color: '#2563eb', gradient: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)', bgColor: '#dbeafe', chapitresFait: 11, totalChapitres: 14, details: 'Limites, Dérivation, Complexes' },
    { nom: 'Physique-Chimie', icon: '⚡', percent: 64, color: '#7c3aed', gradient: 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)', bgColor: '#ede9fe', chapitresFait: 9, totalChapitres: 14, details: 'Ondes, Nucléaire, RLC' },
    { nom: 'SVT', icon: '🧬', percent: 85, color: '#059669', gradient: 'linear-gradient(90deg, #10b981 0%, #047857 100%)', bgColor: '#d1fae5', chapitresFait: 6, totalChapitres: 7, details: 'Génétique, Immunologie' },
    { nom: 'Philosophie', icon: '🏛️', percent: 70, color: '#d97706', gradient: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', bgColor: '#fef3c7', chapitresFait: 5, totalChapitres: 8, details: 'Condition humaine, Morale' },
    { nom: 'Anglais', icon: '🌍', percent: 82, color: '#0284c7', gradient: 'linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)', bgColor: '#e0f2fe', chapitresFait: 8, totalChapitres: 10, details: 'Youth, Culture, Grammar' }
  ];
  const globalProgress = Math.round(progressByMatiere.reduce((a, m) => a + m.percent, 0) / progressByMatiere.length);

  const statsCards = [
    { title: 'Examens Nationaux', value: `${dataCounts.examens}`, icon: '🎓', color: '#4f46e5', bgColor: '#eef2ff', progress: '100% dispo', link: '/client-examens' },
    { title: 'Fiches & Résumés', value: `${dataCounts.resumes}`, icon: '📚', color: '#0284c7', bgColor: '#e0f2fe', progress: 'Révision', link: '/client-resumes' },
    { title: 'Concours Blancs', value: `${dataCounts.concours}`, icon: '🏆', color: '#059669', bgColor: '#ecfdf5', progress: 'Simulations', link: '/client-concours-blanc' },
    { title: 'Taux de Maîtrise', value: `${globalProgress}%`, icon: '📈', color: '#f59e0b', bgColor: '#fffbeb', progress: '+12%', link: '/client-concours-blanc' }
  ];

  const recentActivities = [
    { type: 'QCM', title: 'Concours Blanc ENSA - Math', date: 'Aujourd\'hui 16:30', score: '17.5/20', status: 'Terminé', statusColor: '#059669', statusBg: '#dcfce7' },
    { type: 'Examen', title: 'Bac 2023 - Physique-Chimie', date: 'Hier 20:15', score: 'Consulté', status: 'Révisé', statusColor: '#2563eb', statusBg: '#dbeafe' },
    { type: 'Fiche', title: 'Nombres Complexes', date: 'Il y a 2 jours', score: '100% lu', status: 'Validé', statusColor: '#7c3aed', statusBg: '#f3e8ff' }
  ];

  const schools = [
    { name: 'ENSA Maroc', desc: 'Sciences Appliquées', img: ensaImg, field: 'Ingénierie' },
    { name: 'ENSAM', desc: 'Arts et Métiers', img: ensamImg, field: 'Génie Mécanique' },
    { name: 'Médecine', desc: 'Médecine & Pharmacie', img: medecineImg, field: 'Médical' },
    { name: 'ENCG Maroc', desc: 'Commerce & Gestion', img: encgImg, field: 'Management' }
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

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", padding: '28px 32px 64px', color: '#0f172a' }}>
      <div style={{ maxWidth: '1260px', margin: '0 auto' }}>

        {/* ═══ HERO BANNER - VERSION PREMIUM ═══ */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 45%, #eff6ff 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '26px 32px',
          marginBottom: '28px',
          boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle ambient blur circle in the corner */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: '#eef2ff',
            border: '1px solid #c7d2fe',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '12px' }}>🎯</span>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#4338ca', letterSpacing: '0.2px' }}>
              Session Concours 2026 · Candidat Actif
            </span>
          </div>

          {/* Titre */}
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '26px',
            fontWeight: 850,
            color: '#0f172a',
            letterSpacing: '-0.4px',
            lineHeight: 1.25
          }}>
            Bonjour, {candidateName} 👋
          </h1>

          {/* Description */}
          <p style={{
            margin: '0 0 18px 0',
            fontSize: '14px',
            color: '#475569',
            lineHeight: 1.6,
            maxWidth: '720px'
          }}>
            Suivez votre progression en temps réel, préparez votre admission aux Grandes Écoles (ENSA, ENSAM, Médecine, ENCG) et perfectionnez pour le Baccalauréat.
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/client-examens')}
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(15,23,42,0.18)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,23,42,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,0.18)';
              }}
            >
              <span>🎓</span> Consulter les Examens
            </button>

            <button
              onClick={() => navigate('/client-concours-blanc')}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #cbd5e1',
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              <span>🏆</span> Concours Blancs
            </button>

            {/* Live Timer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              border: '1.5px solid #a7f3d0',
              padding: '9px 16px',
              borderRadius: '12px',
              marginLeft: 'auto',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '13.5px',
                color: '#047857',
                letterSpacing: '0.5px'
              }}>
                {fmtTime()}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ KPI CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '36px' }}>
          {statsCards.map((st, i) => (
            <div
              key={i}
              onClick={() => navigate(st.link)}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.025)',
                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(15, 23, 42, 0.08)';
                e.currentTarget.style.borderColor = st.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.025)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: st.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                flexShrink: 0
              }}>
                {st.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', letterSpacing: '-0.5px' }}>
                    {st.value}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: st.color,
                    background: st.bgColor,
                    padding: '3px 9px',
                    borderRadius: '20px',
                    letterSpacing: '0.2px'
                  }}>
                    {st.progress}
                  </span>
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {st.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ PROGRESSION PAR MATIÈRE ═══ */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '28px 32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
          marginBottom: '36px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>📊</span>
              <h2 style={{ fontSize: '20px', fontWeight: 850, margin: 0, color: '#0f172a', letterSpacing: '-0.3px' }}>
                Progression de Maîtrise par Matière
              </h2>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid #e2e8f0',
              padding: '10px 18px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score Global</div>
                <div style={{ fontSize: '20px', fontWeight: 850, color: '#0f172a' }}>{globalProgress}% Réalisé</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
            {progressByMatiere.map((mat, idx) => (
              <div
                key={idx}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '20px 22px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = mat.color;
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{mat.icon}</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{mat.nom}</span>
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: mat.color,
                    background: mat.bgColor,
                    padding: '3px 10px',
                    borderRadius: '14px'
                  }}>
                    {mat.percent}%
                  </span>
                </div>

                <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{
                    height: '100%',
                    width: `${mat.percent}%`,
                    background: mat.gradient || mat.color,
                    borderRadius: '999px',
                    transition: 'width 0.8s ease'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Chapitres : <strong style={{ color: '#0f172a' }}>{mat.chapitresFait}/{mat.totalChapitres}</strong></span>
                  <span style={{
                    color: mat.percent >= 75 ? '#059669' : '#d97706',
                    fontWeight: 700,
                    backgroundColor: mat.percent >= 75 ? '#ecfdf5' : '#fffbeb',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {mat.percent >= 75 ? '✓ Maîtrisé' : '⏳ À renforcer'}
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: '#94a3b8', borderTop: '1px solid #edf2f7', paddingTop: '8px', marginTop: '10px' }}>
                  Focus : {mat.details}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CALENDRIER ═══ */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '28px 32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
          marginBottom: '36px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '22px' }}>📅</span>
            <h2 style={{ fontSize: '20px', fontWeight: 850, margin: 0, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Calendrier des Concours
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => { setTab('concours'); setSelectedDay(null); }}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                background: tab === 'concours' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#f1f5f9',
                color: tab === 'concours' ? '#ffffff' : '#475569',
                boxShadow: tab === 'concours' ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              🎓 Concours Officiels ({CONCOURS_OFFICIELS.length})
            </button>

            <button
              onClick={() => { setTab('planning'); setSelectedDay(null); }}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                background: tab === 'planning' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#f1f5f9',
                color: tab === 'planning' ? '#ffffff' : '#475569',
                boxShadow: tab === 'planning' ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              👤 Mon Planning ({planning.length})
            </button>

            {tab === 'planning' && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  marginLeft: 'auto',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                ➕ Ajouter
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button
                  onClick={() => setCurDate(new Date(curDate.getFullYear(), curDate.getMonth() - 1, 1))}
                  style={{
                    width: '38px',
                    height: '38px',
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
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {MONTHS[curDate.getMonth()]} {curDate.getFullYear()}
                </h3>
                <button
                  onClick={() => setCurDate(new Date(curDate.getFullYear(), curDate.getMonth() + 1, 1))}
                  style={{
                    width: '38px',
                    height: '38px',
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

            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '560px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0', color: '#0f172a' }}>
                {tab === 'concours' ? '🎓 Concours Disponibles' : '👤 Mon Planning Personnel'}
              </h4>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {renderEventList()}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ DISCORD + AMIS + CLASSEMENT ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px', marginBottom: '36px' }}>

          {/* Discord Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '160px',
              height: '160px',
              background: 'radial-gradient(circle, rgba(88,101,242,0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #5865F2 0%, #4752c4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  boxShadow: '0 4px 14px rgba(88, 101, 242, 0.3)'
                }}>
                  💬
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 850, margin: 0, color: '#0f172a' }}>Discord Communauté</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>1,247 en ligne</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                Rejoignez +12,500 étudiants pour réviser ensemble, échanger des astuces et poser vos questions 24/7 !
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[['12.5K', 'Membres'], ['45', 'Salons'], ['24/7', 'Actif']].map(([v, l], i) => (
                  <div key={i} style={{ textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 6px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 850, color: '#0f172a' }}>{v}</div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700 }}>{l}</div>
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
                  fontSize: '13.5px',
                  padding: '12px',
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

          {/* Amis en ligne Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 850, margin: 0, color: '#0f172a' }}>👥 Amis en ligne</h3>
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontWeight: 800 }}>
                5 actifs
              </span>
            </div>
            {friends.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 6px',
                  borderRadius: '10px',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={`https://i.pravatar.cc/40?img=${f.img}`} alt={f.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid #ffffff'
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{f.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>{f.action}</div>
                </div>
                <button
                  style={{
                    fontSize: '11.5px',
                    background: '#eef2ff',
                    color: '#4f46e5',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  💬
                </button>
              </div>
            ))}
          </div>

          {/* Top Classement Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 850, margin: '0 0 16px 0', color: '#0f172a' }}>
              🏆 Top Classement
            </h3>
            {[
              { rank: 1, name: 'Mehdi A.', score: '18.5/20', img: 15, medal: '🥇', bg: '#fef3c7', border: '#f59e0b' },
              { rank: 2, name: 'Salma F.', score: '17.8/20', img: 22, medal: '🥈', bg: '#f8fafc', border: '#94a3b8' },
              { rank: 3, name: 'Rayan K.', score: '17.2/20', img: 33, medal: '🥉', bg: '#fff7ed', border: '#ea580c' }
            ].map((u, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: u.bg,
                  border: `1px solid ${u.border}30`,
                  marginBottom: '8px'
                }}
              >
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: u.border,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '12px'
                }}>
                  {u.rank}
                </div>
                <img src={`https://i.pravatar.cc/40?img=${u.img}`} alt={u.name} style={{ width: '38px', height: '38px', borderRadius: '50%', border: `2px solid ${u.border}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{u.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{u.score}</div>
                </div>
                <span style={{ fontSize: '20px' }}>{u.medal}</span>
              </div>
            ))}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '12px',
              background: '#eef2ff',
              border: '1.5px solid #c7d2fe',
              marginTop: '12px'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#4f46e5',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px'
              }}>
                23
              </div>
              <img src="https://i.pravatar.cc/40?img=47" alt="Toi" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid #4f46e5' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Toi ({user.prenom || 'Sara'})</div>
                <div style={{ fontSize: '11.5px', color: '#4f46e5', fontWeight: 700 }}>14.0/20</div>
              </div>
              <span style={{ fontSize: '11px', background: '#10b981', color: '#ffffff', padding: '3px 8px', borderRadius: '8px', fontWeight: 800 }}>
                ↑7
              </span>
            </div>
          </div>
        </div>

        {/* ═══ ACTIVITÉS RÉCENTES ═══ */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '28px 32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
          marginBottom: '36px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '22px' }}>⏱️</span>
            <h2 style={{ fontSize: '20px', fontWeight: 850, margin: 0, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Activités Récentes
            </h2>
          </div>
          {recentActivities.map((act, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
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
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: act.statusBg,
                  color: act.statusColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  flexShrink: 0
                }}>
                  {act.type}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{act.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{act.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>{act.score}</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: act.statusColor,
                  background: act.statusBg,
                  padding: '3px 10px',
                  borderRadius: '14px'
                }}>
                  {act.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ GRANDES ÉCOLES ═══ */}
        <div style={{ marginBottom: '44px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '22px' }}>🎯</span>
            <h2 style={{ fontSize: '20px', fontWeight: 850, margin: 0, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Grandes Écoles Préparées
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '22px' }}>
            {schools.map((sc, i) => (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.025)',
                  overflow: 'hidden',
                  transition: 'all 0.22s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.025)';
                }}
              >
                <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                  <img src={sc.img} alt={sc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15,23,42,0.8)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '20px'
                  }}>
                    {sc.field}
                  </div>
                </div>
                <div style={{ padding: '18px' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 850, color: '#0f172a' }}>{sc.name}</h4>
                  <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#64748b' }}>{sc.desc}</p>
                  <button
                    onClick={() => navigate('/client-concours')}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#0f172a',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      padding: '9px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0f172a';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = '#0f172a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    Voir les épreuves →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CONSEILS CLÉS ═══ */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '28px 32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '22px' }}>💡</span>
            <h3 style={{ fontSize: '18px', fontWeight: 850, margin: 0, color: '#0f172a' }}>Conseils Clés pour Réussir</h3>
          </div>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px 0' }}>
            Habitudes éprouvées et recommandées par les lauréats des sessions précédentes :
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {adviceList.map((adv, i) => (
              <div key={i} style={{ padding: '18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                <div style={{ fontSize: '26px', marginBottom: '8px' }}>{adv.icon}</div>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{adv.title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{adv.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══ MODAL ADD EVENT ═══ */}
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
              <h3 style={{ fontSize: '18px', fontWeight: 850, margin: 0, color: '#0f172a' }}>➕ Nouvel événement</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  fontSize: '18px',
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
                    padding: '12px',
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
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
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