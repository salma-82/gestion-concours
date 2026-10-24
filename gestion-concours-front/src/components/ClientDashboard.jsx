import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ClientDashboard.css';
import {
  readStudentMistakes,
  readStudentProgress,
  setStudentActivityCompleted
} from '../studentProgress';

const API_BASE = 'http://localhost:8081';
const normalizeSchool = (name) => String(name || '').trim().toLocaleLowerCase();
const scoresOf = (records) => records
  .map((record) => record.score)
  .filter((score) => score !== null && score !== undefined && score !== '')
  .map(Number)
  .filter(Number.isFinite);

const subjectStyle = (subject) => {
  const normalized = String(subject || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('math')) return { name: 'Math\u00e9matiques', icon: '\u2211', color: '#2563eb', tint: '#eff6ff' };
  if (normalized.includes('phys') || normalized.includes('chim') || normalized === 'pc') return { name: 'Physique-Chimie', icon: '\u03A8', color: '#7c3aed', tint: '#f5f3ff' };
  if (normalized.includes('svt') || normalized.includes('vie') || normalized.includes('terre')) return { name: 'SVT', icon: '\u25C9', color: '#059669', tint: '#ecfdf5' };
  if (normalized.includes('philo')) return { name: 'Philosophie', icon: '\u03A6', color: '#d97706', tint: '#fffbeb' };
  if (normalized.includes('ang') || normalized.includes('eng')) return { name: 'Anglais', icon: 'A', color: '#0284c7', tint: '#f0f9ff' };
  return { name: subject || 'Autres ressources', icon: '\u25A4', color: '#475569', tint: '#f1f5f9' };
};

const formatDate = (value) => {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  let user = {};
  try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch { user = {}; }
  const firstName = user.prenom || user.nom || 'Etudiant';

  const [studentActivities, setStudentActivities] = useState(() => readStudentProgress());
  const [mistakes, setMistakes] = useState(() => readStudentMistakes());
  const [schoolCatalog, setSchoolCatalog] = useState([]);
  const [schoolAttempts, setSchoolAttempts] = useState([]);
  const [schoolDataLoading, setSchoolDataLoading] = useState(true);
  const [schoolCatalogError, setSchoolCatalogError] = useState(false);
  const [schoolHistoryError, setSchoolHistoryError] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState('');

  useEffect(() => {
    const refreshData = () => {
      setStudentActivities(readStudentProgress());
      setMistakes(readStudentMistakes());
    };
    refreshData();
    window.addEventListener('student-progress-updated', refreshData);
    window.addEventListener('student-mistakes-updated', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('student-progress-updated', refreshData);
      window.removeEventListener('student-mistakes-updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSchoolData = async () => {
      let studentId = null;
      try { studentId = JSON.parse(localStorage.getItem('user') || '{}')?.id ?? null; } catch {}
      const [catalogResult, attemptsResult] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/concours`),
        studentId
          ? axios.get(`${API_BASE}/api/qcm/mes-concours`, { params: { studentId } })
          : Promise.resolve({ data: { attempts: [] } })
      ]);
      if (!active) return;
      setSchoolCatalogError(catalogResult.status === 'rejected');
      setSchoolHistoryError(attemptsResult.status === 'rejected');
      setSchoolCatalog(catalogResult.status === 'fulfilled' && Array.isArray(catalogResult.value.data) ? catalogResult.value.data : []);
      setSchoolAttempts(attemptsResult.status === 'fulfilled' && Array.isArray(attemptsResult.value.data?.attempts) ? attemptsResult.value.data.attempts : []);
      setSchoolDataLoading(false);
    };
    loadSchoolData();
    window.addEventListener('student-qcm-history-updated', loadSchoolData);
    return () => {
      active = false;
      window.removeEventListener('student-qcm-history-updated', loadSchoolData);
    };
  }, []);

  const completedCount = studentActivities.filter((activity) => activity.completed).length;
  const resourceCount = studentActivities.length;
  const overallProgress = resourceCount ? Math.round((completedCount / resourceCount) * 100) : 0;
  const pendingMistakes = mistakes.filter((mistake) => !mistake.reviewed).length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activitiesThisWeek = studentActivities.filter((activity) => {
    const timestamp = new Date(activity.lastViewedAt).getTime();
    return Number.isFinite(timestamp) && timestamp >= weekAgo;
  }).length;

  const progressBySubject = useMemo(() => {
    const groups = studentActivities.reduce((result, activity) => {
      const style = subjectStyle(activity.subject);
      const group = result[style.name] || { ...style, total: 0, completed: 0 };
      group.total += 1;
      if (activity.completed) group.completed += 1;
      result[style.name] = group;
      return result;
    }, {});
    return Object.values(groups)
      .map((group) => ({ ...group, percent: group.total ? Math.round((group.completed / group.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [studentActivities]);

  const schoolCards = useMemo(() => {
    const grouped = new Map();
    schoolCatalog.forEach((contest) => {
      const name = String(contest.ecole || '').trim();
      const key = normalizeSchool(name);
      if (!key) return;
      const current = grouped.get(key) || { name, contestCount: 0, subjects: new Set(), years: new Set() };
      current.contestCount += 1;
      if (String(contest.matiere || '').trim()) current.subjects.add(String(contest.matiere).trim());
      if (contest.annee) current.years.add(String(contest.annee));
      grouped.set(key, current);
    });

    return [...grouped.values()].map((school) => {
      const attempts = schoolAttempts.filter((attempt) => normalizeSchool(attempt.school) === normalizeSchool(school.name));
      const scored = scoresOf(attempts);
      const subjects = [...new Set(attempts.map((attempt) => String(attempt.subject || '').trim()).filter(Boolean))]
        .map((name) => {
          const records = attempts.filter((attempt) => String(attempt.subject || '').trim() === name);
          const scores = scoresOf(records);
          return {
            name,
            attempts: records.length,
            average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null
          };
        })
        .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
      return {
        ...school,
        subjects: [...school.subjects],
        years: [...school.years].sort((a, b) => Number(b) - Number(a)),
        attemptCount: attempts.length,
        attemptedContests: new Set(attempts.map((attempt) => `${attempt.resourceType || ''}:${attempt.resourceId}`)).size,
        average: scored.length ? Math.round(scored.reduce((sum, score) => sum + score, 0) / scored.length) : null,
        best: scored.length ? Math.max(...scored) : null,
        successRate: scored.length ? Math.round((scored.filter((score) => score >= 50).length / scored.length) * 100) : null,
        subjectStats: subjects
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [schoolCatalog, schoolAttempts]);
  const selectedSchoolStats = schoolCards.find((school) => normalizeSchool(school.name) === normalizeSchool(selectedSchool));

  const recentActivities = [...studentActivities]
    .sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime())
    .slice(0, 5);

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const count = studentActivities.filter((activity) => {
      const viewed = new Date(activity.lastViewedAt);
      return !Number.isNaN(viewed.getTime())
        && viewed.getFullYear() === date.getFullYear()
        && viewed.getMonth() === date.getMonth()
        && viewed.getDate() === date.getDate();
    }).length;
    return { label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', ''), count, key: date.toISOString() };
  });
  const maxDayCount = Math.max(1, ...weekDays.map((day) => day.count));

  const stats = [
    { label: 'Ressources consult\u00e9es', value: resourceCount, note: 'Cours, fiches et epreuves', icon: '\u25A4', tint: '#eff6ff', color: '#2563eb' },
    { label: 'Ressources termin\u00e9es', value: completedCount, note: 'Marquees comme terminees', icon: '\u2713', tint: '#ecfdf5', color: '#059669' },
    { label: 'Activite cette semaine', value: activitiesThisWeek, note: 'Ressources consultees', icon: '\u2197', tint: '#f5f3ff', color: '#7c3aed' },
    { label: 'Erreurs a revoir', value: pendingMistakes, note: 'Questions a retravailler', icon: '!', tint: '#fff7ed', color: '#ea580c' }
  ];

  return (
    <div className="client-dashboard">
      <div className="client-dashboard-content">
        <section className="dashboard-welcome">
          <div className="dashboard-welcome-copy">
            <span className="dashboard-eyebrow">VOTRE ESPACE DE R&Eacute;VISION</span>
            <h1>Bonjour, {firstName}</h1>
            <p>Retrouvez votre progression et reprenez vos r&eacute;visions l&agrave; o&ugrave; vous les avez laiss&eacute;es.</p>
            <div className="dashboard-welcome-actions">
              <button type="button" className="dashboard-primary-action" onClick={() => navigate('/client-cours')}>Continuer mes r&eacute;visions <span aria-hidden="true">{'\u2192'}</span></button>
              <button type="button" className="dashboard-secondary-action" onClick={() => navigate('/client-examens')}>Voir les examens</button>
            </div>
          </div>
          <div className="dashboard-overall-card">
            <div className="dashboard-ring" style={{ '--progress': `${overallProgress}%` }}>
              <div><strong>{overallProgress}%</strong><span>termin&eacute;</span></div>
            </div>
            <div className="dashboard-overall-copy">
              <strong>Progression g&eacute;n&eacute;rale</strong>
              <span>{completedCount} sur {resourceCount} ressources consult&eacute;es</span>
            </div>
          </div>
        </section>

        <section className="dashboard-stats" aria-label="Statistiques de progression">
          {stats.map((stat) => (
            <article className="dashboard-stat-card" key={stat.label}>
              <span className="dashboard-stat-icon" style={{ color: stat.color, background: stat.tint }}>{stat.icon}</span>
              <div className="dashboard-stat-copy"><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small></div>
            </article>
          ))}
        </section>

        <section className="dashboard-panel dashboard-school-section" aria-label="Statistiques par école">
          <div className="dashboard-panel-heading">
            <div><span className="dashboard-section-kicker">VOS OBJECTIFS</span><h2>Progression par &eacute;cole</h2></div>
            <span className="dashboard-school-count">{schoolCards.length} &eacute;cole{schoolCards.length > 1 ? 's' : ''}</span>
          </div>
          <p className="dashboard-panel-description">Choisissez une &eacute;cole pour consulter vos r&eacute;sultats et votre progression.</p>
          {schoolDataLoading ? <div className="dashboard-school-message">Chargement des &eacute;coles et des r&eacute;sultats...</div>
            : schoolCatalogError ? <div className="dashboard-school-message">Impossible de charger la liste des &eacute;coles pour le moment.</div>
            : schoolCards.length ? <>
              <div className="dashboard-school-cards">
                {schoolCards.map((school) => (
                  <button type="button" key={school.name} className={`dashboard-school-card ${normalizeSchool(selectedSchool) === normalizeSchool(school.name) ? 'is-selected' : ''}`} onClick={() => setSelectedSchool(normalizeSchool(selectedSchool) === normalizeSchool(school.name) ? '' : school.name)} aria-pressed={normalizeSchool(selectedSchool) === normalizeSchool(school.name)}>
                    <span className="dashboard-school-mark" aria-hidden="true">{school.name.slice(0, 1).toUpperCase()}</span>
                    <span className="dashboard-school-card-copy"><strong>{school.name}</strong><small>{school.contestCount} concours &middot; {school.subjects.length} mati&egrave;re{school.subjects.length > 1 ? 's' : ''}</small></span>
                    <span className="dashboard-school-average">{school.average === null ? '--' : `${school.average}%`}<small>moyenne</small></span>
                  </button>
                ))}
              </div>
              {selectedSchoolStats && <div className="dashboard-school-detail">
                <div className="dashboard-school-detail-heading"><div><span>VOTRE DASHBOARD</span><h3>{selectedSchoolStats.name}</h3></div><button type="button" onClick={() => setSelectedSchool('')} aria-label="Fermer le dashboard de cette école">&times;</button></div>
                <div className="dashboard-school-metrics">
                  <article><span>Concours disponibles</span><strong>{selectedSchoolStats.contestCount}</strong></article>
                  <article><span>Concours tent&eacute;s</span><strong>{selectedSchoolStats.attemptedContests}</strong><small>{selectedSchoolStats.attemptCount} tentative{selectedSchoolStats.attemptCount > 1 ? 's' : ''}</small></article>
                  <article><span>Score moyen</span><strong>{selectedSchoolStats.average === null ? '--' : `${selectedSchoolStats.average}%`}</strong></article>
                  <article><span>Meilleur score</span><strong>{selectedSchoolStats.best === null ? '--' : `${selectedSchoolStats.best}%`}</strong></article>
                  <article><span>Scores &agrave; 50% ou plus</span><strong>{selectedSchoolStats.successRate === null ? '--' : `${selectedSchoolStats.successRate}%`}</strong></article>
                </div>
                {!!selectedSchoolStats.years.length && <div className="dashboard-school-years"><strong>Ann&eacute;es disponibles</strong>{selectedSchoolStats.years.map((year) => <span key={year}>{year}</span>)}</div>}
                {schoolHistoryError ? <div className="dashboard-school-no-data">Impossible de charger vos r&eacute;sultats pour le moment.</div>
                  : selectedSchoolStats.attemptCount ? <>
                  <div className="dashboard-school-detail-title">R&eacute;sultats par mati&egrave;re</div>
                  {selectedSchoolStats.subjectStats.length ? <div className="dashboard-school-subjects">
                    {selectedSchoolStats.subjectStats.map((subject) => <div className="dashboard-school-subject-row" key={subject.name}><strong>{subject.name}</strong><span>{subject.attempts} tentative{subject.attempts > 1 ? 's' : ''}</span><b>{subject.average === null ? '--' : `${subject.average}%`}</b></div>)}
                  </div> : <p className="dashboard-school-no-data">Les mati&egrave;res ne sont pas disponibles dans les r&eacute;sultats enregistr&eacute;s.</p>}
                </> : <div className="dashboard-school-no-data">Aucune tentative enregistr&eacute;e pour cette &eacute;cole pour le moment. Vos r&eacute;sultats appara&icirc;tront ici apr&egrave;s un concours.</div>}
              </div>}
            </> : <div className="dashboard-school-message">Aucune &eacute;cole avec des concours publi&eacute;s pour le moment.</div>}
        </section>

        <div className="dashboard-content-grid">
          <section className="dashboard-panel dashboard-subject-panel">
            <div className="dashboard-panel-heading">
              <div><span className="dashboard-section-kicker">VOTRE APPRENTISSAGE</span><h2>Progression par mati&egrave;re</h2></div>
              <button type="button" onClick={() => navigate('/client-cours')}>Parcourir les cours <span aria-hidden="true">{'\u2192'}</span></button>
            </div>
            {progressBySubject.length ? (
              <div className="dashboard-subject-list">
                {progressBySubject.map((subject) => (
                  <article className="dashboard-subject-row" key={subject.name}>
                    <span className="dashboard-subject-icon" style={{ color: subject.color, background: subject.tint }}>{subject.icon}</span>
                    <div className="dashboard-subject-main">
                      <div className="dashboard-subject-title"><strong>{subject.name}</strong><span>{subject.completed}/{subject.total} termin&eacute;es</span></div>
                      <div className="dashboard-progress-track"><span style={{ width: `${subject.percent}%`, background: subject.color }} /></div>
                    </div>
                    <strong className="dashboard-subject-percent" style={{ color: subject.color }}>{subject.percent}%</strong>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <span>{'\u25CB'}</span><strong>Votre progression appara&icirc;tra ici</strong>
                <p>Consultez un cours, un r&eacute;sum&eacute; ou un sujet pour commencer &agrave; suivre votre avanc&eacute;e.</p>
                <button type="button" onClick={() => navigate('/client-cours')}>D&eacute;couvrir les cours</button>
              </div>
            )}
          </section>

          <section className="dashboard-panel dashboard-week-panel">
            <div className="dashboard-panel-heading">
              <div><span className="dashboard-section-kicker">R&Eacute;GULARIT&Eacute;</span><h2>Cette semaine</h2></div>
              <span className="dashboard-week-total">{activitiesThisWeek} ressource{activitiesThisWeek > 1 ? 's' : ''}</span>
            </div>
            <p className="dashboard-panel-description">Ressources consult&eacute;es au cours des sept derniers jours.</p>
            <div className="dashboard-week-chart" aria-label="Ressources consultees par jour">
              {weekDays.map((day) => (
                <div className="dashboard-week-day" key={day.key}>
                  <span className="dashboard-week-count">{day.count || ''}</span>
                  <div className="dashboard-week-bar-track"><span style={{ height: `${day.count ? Math.max(10, day.count / maxDayCount * 100) : 4}%` }} /></div>
                  <span className="dashboard-week-label">{day.label}</span>
                </div>
              ))}
            </div>
            <div className="dashboard-week-footer"><span className="dashboard-week-dot" />Votre activit&eacute; est mise &agrave; jour automatiquement</div>
          </section>
        </div>

        <section className="dashboard-panel dashboard-activity-panel">
          <div className="dashboard-panel-heading">
            <div><span className="dashboard-section-kicker">REPRENDRE</span><h2>Activit&eacute;s r&eacute;centes</h2></div>
            <button type="button" onClick={() => navigate('/client-erreurs?view=all')}>R&eacute;viser mes erreurs <span aria-hidden="true">{'\u2192'}</span></button>
          </div>
          {recentActivities.length ? (
            <div className="dashboard-activity-list">
              {recentActivities.map((activity) => {
                const subject = subjectStyle(activity.subject);
                return (
                  <article className="dashboard-activity-row" key={activity.id}>
                    <span className="dashboard-activity-type" style={{ color: subject.color, background: subject.tint }}>{String(activity.type || 'Ressource').slice(0, 3).toUpperCase()}</span>
                    <div className="dashboard-activity-copy"><strong>{activity.title}</strong><span>{[activity.subject, activity.chapter].filter(Boolean).join(' / ') || subject.name}</span></div>
                    <time>{formatDate(activity.lastViewedAt)}</time>
                    <button className={`dashboard-completion-button ${activity.completed ? 'is-complete' : ''}`} type="button" onClick={() => setStudentActivityCompleted(activity.id, !activity.completed)}>
                      {activity.completed ? 'Termin&eacute;e \u2713' : 'Marquer termin&eacute;e'}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-activity-empty">Vos ressources consult&eacute;es appara&icirc;tront ici. Commencez par choisir un cours ou un examen.</div>
          )}
        </section>

        <section className="dashboard-quick-links" aria-label="Acces rapide">
          <button type="button" onClick={() => navigate('/client-concours')}><span>{'\u25CE'}</span><strong>Concours</strong><small>&Eacute;coles et &eacute;preuves</small><b>{'\u2192'}</b></button>
          <button type="button" onClick={() => navigate('/client-concours-blanc')}><span>{'\u2713'}</span><strong>Concours blancs</strong><small>Entra&icirc;nements disponibles</small><b>{'\u2192'}</b></button>
          <button type="button" onClick={() => navigate('/client-resumes')}><span>{'\u25A4'}</span><strong>R&eacute;sum&eacute;s</strong><small>R&eacute;viser l'essentiel</small><b>{'\u2192'}</b></button>
          <button type="button" onClick={() => navigate('/client-calendrier')}><span>{'\u25A6'}</span><strong>Calendrier</strong><small>Dates des concours</small><b>{'\u2192'}</b></button>
          <a className="dashboard-discord-link" href="https://discord.com/app" target="_blank" rel="noreferrer" aria-label="Ouvrir Discord dans un nouvel onglet">
            <span><svg viewBox="0 0 20 19" aria-hidden="true" focusable="false"><use href="/icons.svg#discord-icon" /></svg></span>
            <strong>Discord</strong><small>Rejoindre la communaut&eacute;</small><b>{'\u2197'}</b>
          </a>
        </section>
      </div>
    </div>
  );
}
