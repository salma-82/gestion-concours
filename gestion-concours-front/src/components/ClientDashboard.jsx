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
    for (let i = 0; i < start; i++) cells.push(<div key={`e${i}`} style={{ minHeight: '68px' }} />);
    for (let d = 1; d <= last.getDate(); d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvs = getEvents().filter(e => e.date === dateStr);
      const isToday = isCurMonth && d === today.getDate();
      const isSel = selectedDay === dateStr;
      cells.push(
        <div key={d} onClick={() => setSelectedDay(isSel ? null : dateStr)} style={{
          minHeight: '68px', padding: '8px', borderRadius: '10px', cursor: 'pointer',
          background: isToday ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))' : isSel ? '#e0e7ff' : '#f8fafc',
          border: isToday || isSel ? '2px solid #6366f1' : '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: isToday ? '#4338ca' : '#334155' }}>{d}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
            {dayEvs.slice(0, 4).map((ev, i) => (
              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: (TYPE_CFG[ev.type] || TYPE_CFG.personal).color }} />
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
    if (evs.length === 0) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}><div style={{ fontSize: '42px' }}>📭</div><div>Aucun événement</div></div>;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return evs.map(ev => {
      const cfg = TYPE_CFG[ev.type] || TYPE_CFG.personal;
      const d = new Date(ev.date);
      const diff = Math.ceil((d - today) / 86400000);
      const diffTxt = diff > 0 ? `J-${diff}` : diff === 0 ? "Aujourd'hui" : 'Passé';
      return (
        <div key={ev.id} style={{ backgroundColor: '#f8fafc', borderLeft: `4px solid ${cfg.color}`, borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{cfg.icon} {ev.title}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: diff <= 3 ? '#dc2626' : '#64748b' }}>{diffTxt}</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            📅 {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}{ev.time && ` · 🕐 ${ev.time}`}{ev.subject && ` · ${ev.subject}`}
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
    { nom: 'Mathématiques', icon: '📐', percent: 78, color: '#2563eb', bgColor: '#dbeafe', chapitresFait: 11, totalChapitres: 14, details: 'Limites, Dérivation, Complexes' },
    { nom: 'Physique-Chimie', icon: '⚡', percent: 64, color: '#7c3aed', bgColor: '#ede9fe', chapitresFait: 9, totalChapitres: 14, details: 'Ondes, Nucléaire, RLC' },
    { nom: 'SVT', icon: '🧬', percent: 85, color: '#059669', bgColor: '#d1fae5', chapitresFait: 6, totalChapitres: 7, details: 'Génétique, Immunologie' },
    { nom: 'Philosophie', icon: '🏛️', percent: 70, color: '#d97706', bgColor: '#fef3c7', chapitresFait: 5, totalChapitres: 8, details: 'Condition humaine, Morale' },
    { nom: 'Anglais', icon: '🌍', percent: 82, color: '#0284c7', bgColor: '#e0f2fe', chapitresFait: 8, totalChapitres: 10, details: 'Youth, Culture, Grammar' }
  ];
  const globalProgress = Math.round(progressByMatiere.reduce((a, m) => a + m.percent, 0) / progressByMatiere.length);

  const statsCards = [
    { title: 'Examens Nationaux', value: `${dataCounts.examens}`, icon: '🎓', color: '#4f46e5', bgColor: '#eef2ff', progress: '100% dispo', link: '/client-examens' },
    { title: 'Fiches & Résumés', value: `${dataCounts.resumes}`, icon: '📚', color: '#0284c7', bgColor: '#e0f2fe', progress: 'Révision', link: '/client-resumes' },
    { title: 'Concours Blancs', value: `${dataCounts.concours}`, icon: '🏆', color: '#059669', bgColor: '#ecfdf5', progress: 'Simulations', link: '/client-concours' },
    { title: 'Taux de Maîtrise', value: `${globalProgress}%`, icon: '📈', color: '#f59e0b', bgColor: '#fffbeb', progress: '+12%', link: '/client-concours' }
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
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '28px 32px 60px', color: '#0f172a' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* ═══ HERO BANNER - VERSION COMPACTE ═══ */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: '#cbd5e1',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '12px' }}>🎯</span>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155' }}>
              Session Concours 2026 · Candidat Actif
            </span>
          </div>

          {/* Titre */}
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.3px',
            lineHeight: 1.2
          }}>
            Bonjour, {candidateName} 👋
          </h1>

          {/* Description */}
          <p style={{
            margin: '0 0 16px 0',
            fontSize: '13.5px',
            color: '#475569',
            lineHeight: 1.6,
            maxWidth: '680px'
          }}>
            Suivez votre progression en temps réel, préparez votre admission aux Grandes Écoles (ENSA, ENSAM, Médecine, ENCG) et perfectionnez pour le Baccalauréat.
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/client-examens')}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(15,23,42,0.15)'
              }}
            >
              🎓 Consulter les Examens
            </button>

            <button
              onClick={() => navigate('/client-concours')}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                padding: '9px 18px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🏆 Concours Blancs
            </button>

            {/* Live Timer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #10b98140',
              padding: '9px 14px',
              borderRadius: '10px',
              marginLeft: 'auto'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '13px',
                color: '#059669'
              }}>
                {fmtTime()}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ KPI CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '36px' }}>
          {statsCards.map((st, i) => (
            <div key={i} onClick={() => navigate(st.link)} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '22px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = st.color; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: st.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{st.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800 }}>{st.value}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: st.color, background: st.bgColor, padding: '2px 8px', borderRadius: '12px' }}>{st.progress}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{st.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ PROGRESSION PAR MATIÈRE ═══ */}
        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '28px 32px', marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>📊</span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Progression de Maîtrise par Matière</h2>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Score Global</div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{globalProgress}% Réalisé</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
            {progressByMatiere.map((mat, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{mat.icon}</span>
                    <span style={{ fontSize: '15px', fontWeight: 800 }}>{mat.nom}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: mat.color, background: mat.bgColor, padding: '3px 10px', borderRadius: '12px' }}>{mat.percent}%</span>
                </div>
                <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ height: '100%', width: `${mat.percent}%`, background: mat.color, transition: 'width 0.8s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Chapitres : <strong>{mat.chapitresFait}/{mat.totalChapitres}</strong></span>
                  <span style={{ color: mat.percent >= 75 ? '#059669' : '#d97706', fontWeight: 600 }}>{mat.percent >= 75 ? '✓ Bon' : '⏳ Renfo'}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', borderTop: '1px solid #edf2f7', paddingTop: '8px', marginTop: '8px' }}>Focus : {mat.details}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CALENDRIER ═══ */}
        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '28px 32px', marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '22px' }}>📅</span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Calendrier des Concours</h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => { setTab('concours'); setSelectedDay(null); }} style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              background: tab === 'concours' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f1f5f9',
              color: tab === 'concours' ? '#ffffff' : '#475569'
            }}>🎓 Concours Officiels ({CONCOURS_OFFICIELS.length})</button>
            <button onClick={() => { setTab('planning'); setSelectedDay(null); }} style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              background: tab === 'planning' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f1f5f9',
              color: tab === 'planning' ? '#ffffff' : '#475569'
            }}>👤 Mon Planning ({planning.length})</button>
            {tab === 'planning' && (
              <button onClick={() => setShowModal(true)} style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', background: '#10b981', color: '#ffffff', marginLeft: 'auto' }}>➕ Ajouter</button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button onClick={() => setCurDate(new Date(curDate.getFullYear(), curDate.getMonth() - 1, 1))} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', cursor: 'pointer', fontWeight: 700 }}>◀</button>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>{MONTHS[curDate.getMonth()]} {curDate.getFullYear()}</h3>
                <button onClick={() => setCurDate(new Date(curDate.getFullYear(), curDate.getMonth() + 1, 1))} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', cursor: 'pointer', fontWeight: 700 }}>▶</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', padding: '6px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {renderCalendarGrid()}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                {Object.entries(TYPE_CFG).map(([k, cfg]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cfg.color }} />
                    {cfg.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '560px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0' }}>
                {tab === 'concours' ? '🎓 Concours' : '👤 Mon Planning'}
              </h4>
              <div style={{ flex: 1, overflowY: 'auto' }}>{renderEventList()}</div>
            </div>
          </div>
        </div>

        {/* ═══ DISCORD + AMIS + CLASSEMENT ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '36px' }}>

          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '140px', height: '140px', background: 'radial-gradient(circle, rgba(88,101,242,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#5865F2,#7289da)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>💬</div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Discord Server</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>1,247 en ligne</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>Rejoins +12,500 étudiants BAC !</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
                {[['12.5K', 'Membres'], ['45', 'Salons'], ['24/7', 'Actif']].map(([v, l], i) => (
                  <div key={i} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: '10px', padding: '10px 6px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>{v}</div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>{l}</div>
                  </div>
                ))}
              </div>
              <a href="https://discord.gg/bacprep" target="_blank" rel="noopener noreferrer" style={{
                display: 'block', textAlign: 'center', background: 'linear-gradient(135deg,#5865F2,#7289da)',
                color: '#ffffff', fontWeight: 700, fontSize: '14px', padding: '13px', borderRadius: '12px', textDecoration: 'none'
              }}>🚀 Rejoindre le Discord</a>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>👥 Amis en ligne</h3>
              <span style={{ fontSize: '11px', background: '#d1fae5', color: '#059669', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>5 online</span>
            </div>
            {friends.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                <div style={{ position: 'relative' }}>
                  <img src={`https://i.pravatar.cc/40?img=${f.img}`} alt={f.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '2px solid #fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{f.action}</div>
                </div>
                <button style={{ fontSize: '11px', background: '#eef2ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>💬</button>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 16px 0' }}>🏆 Top Classement</h3>
            {[
              { rank: 1, name: 'Mehdi A.', score: '18.5/20', img: 15, medal: '🥇', bg: '#fef3c7', border: '#f59e0b' },
              { rank: 2, name: 'Salma F.', score: '17.8/20', img: 22, medal: '🥈', bg: '#f1f5f9', border: '#94a3b8' },
              { rank: 3, name: 'Rayan K.', score: '17.2/20', img: 33, medal: '🥉', bg: '#fed7aa', border: '#ea580c' }
            ].map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', background: u.bg, border: `1px solid ${u.border}30`, marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: u.border, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>{u.rank}</div>
                <img src={`https://i.pravatar.cc/40?img=${u.img}`} alt={u.name} style={{ width: '40px', height: '40px', borderRadius: '50%', border: `2px solid ${u.border}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{u.score}</div>
                </div>
                <span style={{ fontSize: '22px' }}>{u.medal}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', background: '#eef2ff', border: '1px solid #c7d2fe', marginTop: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>23</div>
              <img src="https://i.pravatar.cc/40?img=47" alt="Toi" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #6366f1' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Toi ({user.prenom || 'Sara'})</div>
                <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 700 }}>14.0/20</div>
              </div>
              <span style={{ fontSize: '11px', background: '#10b981', color: '#fff', padding: '3px 8px', borderRadius: '8px', fontWeight: 700 }}>↑7</span>
            </div>
          </div>
        </div>

        {/* ═══ ACTIVITÉS RÉCENTES ═══ */}
        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '28px 32px', marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '22px' }}>⏱️</span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Activités Récentes</h2>
          </div>
          {recentActivities.map((act, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', borderRadius: '14px', marginBottom: '10px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: act.statusBg, color: act.statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>{act.type}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{act.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{act.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700 }}>{act.score}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: act.statusColor, background: act.statusBg, padding: '3px 10px', borderRadius: '12px' }}>{act.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ GRANDES ÉCOLES ═══ */}
        <div style={{ marginBottom: '44px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 20px 0' }}>🎯 Grandes Écoles Préparées</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {schools.map((sc, i) => (
              <div key={i} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                  <img src={sc.img} alt={sc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>{sc.field}</div>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>{sc.name}</h4>
                  <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#64748b' }}>{sc.desc}</p>
                  <button onClick={() => navigate('/client-concours')} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 600, fontSize: '12.5px', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
                    Voir les épreuves →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CONSEILS ═══ */}
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '28px 32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>💡 Conseils Clés</h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px 0' }}>Habitudes recommandées par les lauréats :</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {adviceList.map((adv, i) => (
              <div key={i} style={{ padding: '18px', background: '#f8fafc', borderRadius: '14px' }}>
                <div style={{ fontSize: '26px', marginBottom: '8px' }}>{adv.icon}</div>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700 }}>{adv.title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{adv.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══ MODAL ADD EVENT ═══ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>➕ Nouvel événement</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Titre *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Révision Math" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Heure</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '4px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="revision">📚 Révision</option>
                  <option value="qcm">📝 QCM</option>
                  <option value="exam">🎯 Examen</option>
                  <option value="personal">👤 Personnel</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Priorité</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {['low', 'medium', 'high'].map(p => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })} style={{
                      flex: 1, padding: '8px', borderRadius: '10px', border: form.priority === p ? `2px solid ${PRIORITY_CFG[p].color}` : '2px solid #e2e8f0',
                      background: form.priority === p ? PRIORITY_CFG[p].bg : '#ffffff',
                      color: form.priority === p ? PRIORITY_CFG[p].color : '#64748b',
                      fontWeight: 700, fontSize: '12px', cursor: 'pointer'
                    }}>{PRIORITY_CFG[p].label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleAdd} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}>✓ Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}