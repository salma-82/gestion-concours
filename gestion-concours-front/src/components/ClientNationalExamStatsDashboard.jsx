import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './ClientNationalExamStatsDashboard.css';

const API_BASE = 'http://localhost:8081';
const normalize = (value) => String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR');
const isExamEvent = (event) => ['examen', 'examen national'].includes(normalize(event?.type));
const examIdOf = (event) => String(event?.resourceId || '').split(':')[0];
const documentOf = (event) => {
  const variant = normalize(event?.resourceVariant);
  if (variant.includes('correction') || normalize(event?.title).includes('correction')) return 'correction';
  if (variant === 'sujet' || variant === 'subject') return 'sujet';
  return 'unknown';
};
const fmtNumber = (value) => new Intl.NumberFormat('fr-FR').format(value || 0);
const fmtDate = (value, time = false) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', time ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
};
const weekKey = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const unavailableMetrics = [
  ['Examens réalisés', 'Les ouvertures de sujets ne comptent pas comme des examens passés.'],
  ['Tentatives enregistrées', 'Les tentatives de réponse ne sont pas stockées.'],
  ['Moyenne générale des notes', 'Aucune note réelle à agréger.'],
  ['Meilleure note obtenue', 'Aucun résultat réel n’est enregistré.'],
  ['Taux de réussite', 'Calculable uniquement à partir de notes réelles.'],
  ['Réponses correctes', 'Les sujets PDF ne remontent pas les réponses.'],
  ['Réponses incorrectes', 'Les sujets PDF ne remontent pas les réponses.'],
  ['Réponses sans réponse', 'Aucune tentative ne permet de les compter.']
];

export default function ClientNationalExamStatsDashboard({ events = [], loading = false, error = false, onRetry }) {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [year, setYear] = useState('all');
  const [subject, setSubject] = useState('all');
  const [option, setOption] = useState('all');
  const [period, setPeriod] = useState('all');
  const [examFilter, setExamFilter] = useState('all');
  const [documentFilter, setDocumentFilter] = useState('all');

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    axios.get(`${API_BASE}/api/examens-nationaux`, { withCredentials: true })
      .then(({ data }) => { if (active) { setCatalog(Array.isArray(data) ? data : []); setCatalogError(false); } })
      .catch(() => { if (active) { setCatalog([]); setCatalogError(true); } })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [catalogRetry]);

  const byId = useMemo(() => new Map(catalog.map((item) => [String(item.id), item])), [catalog]);
  const examEvents = useMemo(() => (Array.isArray(events) ? events : []).filter(isExamEvent), [events]);
  const years = useMemo(() => [...new Set(catalog.map((item) => String(item.annee || '')).filter(Boolean))].sort((a, b) => Number(b) - Number(a)), [catalog]);
  const subjects = useMemo(() => [...new Set(catalog.map((item) => item.matiere).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')), [catalog]);
  const options = useMemo(() => [...new Set(catalog.map((item) => item.optionBac).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')), [catalog]);
  const exams = useMemo(() => [...catalog].sort((a, b) => Number(b.annee || 0) - Number(a.annee || 0) || String(a.titre || '').localeCompare(String(b.titre || ''), 'fr')), [catalog]);

  const filteredEvents = useMemo(() => {
    const cutoff = period === 'all' ? null : Date.now() - Number(period) * 86400000;
    return examEvents.filter((event) => {
      const id = examIdOf(event);
      const item = byId.get(id);
      const date = new Date(event.occurredAt).getTime();
      return (year === 'all' || String(item?.annee || '') === year)
        && (subject === 'all' || normalize(item?.matiere || event.subject) === normalize(subject))
        && (option === 'all' || normalize(item?.optionBac) === normalize(option))
        && (examFilter === 'all' || id === examFilter)
        && (documentFilter === 'all' || documentOf(event) === documentFilter)
        && (cutoff === null || (Number.isFinite(date) && date >= cutoff));
    });
  }, [examEvents, byId, year, subject, option, period, examFilter, documentFilter]);

  const views = useMemo(() => filteredEvents.filter((event) => event.eventType === 'VIEW'), [filteredEvents]);
  const subjectViews = views.filter((event) => documentOf(event) === 'sujet').length;
  const correctionViews = views.filter((event) => documentOf(event) === 'correction').length;
  const unknownViews = views.filter((event) => documentOf(event) === 'unknown').length;
  const consultedExams = new Set(views.map(examIdOf).filter(Boolean)).size;
  const activeDays = new Set(views.map((event) => {
    const date = new Date(event.occurredAt);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-CA');
  }).filter(Boolean)).size;

  const rows = useMemo(() => {
    const grouped = new Map();
    filteredEvents.filter((event) => event.eventType === 'VIEW').forEach((event) => {
      const id = examIdOf(event);
      if (!id) return;
      const item = byId.get(id) || {};
      const row = grouped.get(id) || { id, exam: item, title: item.titre || event.title || `Examen national ${item.annee || ''}`.trim(), subject: item.matiere || event.subject || 'Matière non précisée', option: item.optionBac || 'Option non précisée', year: item.annee || '', sujets: 0, corrections: 0, unknown: 0, latest: null };
      documentOf(event) === 'correction' ? row.corrections++ : documentOf(event) === 'sujet' ? row.sujets++ : row.unknown++;
      const timestamp = new Date(event.occurredAt);
      if (!Number.isNaN(timestamp.getTime()) && (!row.latest || timestamp > new Date(row.latest))) row.latest = event.occurredAt;
      grouped.set(id, row);
    });
    return [...grouped.values()].sort((a, b) => new Date(b.latest || 0) - new Date(a.latest || 0));
  }, [filteredEvents, byId]);

  const weeklyActivity = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - 49);
    const data = Array.from({ length: 8 }, (_, index) => {
      const start = new Date(monday);
      start.setDate(monday.getDate() + index * 7);
      return { key: weekKey(start), label: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(start), sujets: 0, corrections: 0, nonPrecises: 0 };
    });
    views.forEach((event) => {
      const bucket = data.find((item) => item.key === weekKey(event.occurredAt));
      if (bucket) {
        const metric = documentOf(event) === 'correction' ? 'corrections' : documentOf(event) === 'sujet' ? 'sujets' : 'nonPrecises';
        bucket[metric] += 1;
      }
    });
    return data;
  }, [views]);

  const bySubject = useMemo(() => {
    const grouped = new Map();
    views.forEach((event) => {
      const name = byId.get(examIdOf(event))?.matiere || event.subject || 'Matière non précisée';
      grouped.set(name, (grouped.get(name) || 0) + 1);
    });
    return [...grouped].map(([name, consultations]) => ({ name, consultations })).sort((a, b) => b.consultations - a.consultations).slice(0, 8);
  }, [views, byId]);
  const splitData = [{ name: 'Sujets', value: subjectViews, color: '#2563eb' }, { name: 'Corrigés', value: correctionViews, color: '#0f9f78' }, { name: 'Non précisés', value: unknownViews, color: '#94a3b8' }].filter((item) => item.value);

  const reset = () => { setYear('all'); setSubject('all'); setOption('all'); setPeriod('all'); setExamFilter('all'); setDocumentFilter('all'); };

  return (
    <section className="national-exam-stats" aria-labelledby="national-exam-stats-title">
      <header className="national-exam-hero">
        <div><span className="national-exam-eyebrow">▦ &nbsp; SUIVI DES EXAMENS NATIONAUX</span><h1 id="national-exam-stats-title">Statistiques des examens</h1><p>Consultez votre historique des sujets et corrigés officiels avec des données réellement enregistrées.</p></div>
        <button className="national-exam-primary-link" type="button" onClick={() => navigate('/client-examens')}>Voir les examens <span aria-hidden="true">↗</span></button>
      </header>

      <section className="national-exam-filter-panel" aria-label="Filtres des examens nationaux">
        <div className="national-exam-panel-title"><div><span className="national-exam-kicker">AFFINER L’ANALYSE</span><h2>Filtres</h2></div><button type="button" onClick={reset}>Réinitialiser</button></div>
        <div className="national-exam-filters">
          <label>Année<select value={year} onChange={(e) => setYear(e.target.value)}><option value="all">Toutes les années</option>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Matière<select value={subject} onChange={(e) => setSubject(e.target.value)}><option value="all">Toutes les matières</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Option du Bac<select value={option} onChange={(e) => setOption(e.target.value)}><option value="all">Toutes les options</option>{options.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Période<select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="7">7 derniers jours</option><option value="30">30 derniers jours</option><option value="90">3 derniers mois</option><option value="365">12 derniers mois</option><option value="all">Toute la période</option></select></label>
          <label>Examen<select value={examFilter} onChange={(e) => setExamFilter(e.target.value)}><option value="all">Tous les examens</option>{exams.map((item) => <option value={String(item.id)} key={item.id}>{item.titre || `Examen ${item.annee || ''}`} · {item.annee || '—'}</option>)}</select></label>
          <label>Tentative<select value="untracked" disabled aria-describedby="national-attempt-note"><option value="untracked">Non enregistrée</option></select><small id="national-attempt-note">Aucune note de tentative n’est stockée.</small></label>
          <label>Document consulté<select value={documentFilter} onChange={(e) => setDocumentFilter(e.target.value)}><option value="all">Tous les documents</option><option value="sujet">Sujets</option><option value="correction">Corrigés</option><option value="unknown">Type non précisé</option></select></label>
        </div>
      </section>

      {(error || catalogError) && <div className="national-exam-alert" role="alert"><span>{error ? 'Historique indisponible.' : 'Catalogue des examens indisponible.'}</span>{error && <button type="button" onClick={onRetry}>Réessayer</button>}{catalogError && <button type="button" onClick={() => setCatalogRetry((value) => value + 1)}>Recharger</button>}</div>}

      <section className="national-exam-activity-kpis" aria-label="Consultations enregistrées">
        <article><i className="is-blue">▤</i><div><span>Examens consultés</span><strong>{loading ? '…' : error ? '—' : fmtNumber(consultedExams)}</strong></div></article>
        <article><i className="is-green">↗</i><div><span>Consultations de sujets</span><strong>{loading ? '…' : error ? '—' : fmtNumber(subjectViews)}</strong></div></article>
        <article><i className="is-violet">✓</i><div><span>Consultations de corrigés</span><strong>{loading ? '…' : error ? '—' : fmtNumber(correctionViews)}</strong></div></article>
        <article><i className="is-amber">◷</i><div><span>Jours avec activité</span><strong>{loading ? '…' : error ? '—' : fmtNumber(activeDays)}</strong></div></article>
      </section>

      <section className="national-exam-performance">
        <div className="national-exam-section-title"><div><span className="national-exam-kicker">RÉSULTATS ET TENTATIVES</span><h2>Performance aux examens</h2><p>Aucun résultat de tentative n’est actuellement enregistré pour les examens nationaux.</p></div><span className="national-exam-status">Notes non suivies</span></div>
        <div className="national-exam-result-grid">{unavailableMetrics.map(([label, note]) => <article key={label}><span>{label}</span><strong>—</strong><small>{note}</small></article>)}</div>
        <div className="national-exam-data-note"><b>i</b><p><strong>Les examens nationaux sont actuellement suivis comme des documents PDF.</strong> Le système enregistre les consultations des sujets et corrigés, mais aucune réponse, note ou tentative n’est liée à ces examens. Les graphiques de notes, de réponses correctes/incorrectes, de réussite, de performance par matière et de comparaison des tentatives ne peuvent donc pas être calculés à partir des données actuelles.</p></div>
      </section>

      <section className="national-exam-analytics">
        <div className="national-exam-section-title"><div><span className="national-exam-kicker">ACTIVITÉ RÉELLE</span><h2>Vos consultations</h2><p>Ces graphiques montrent les ouvertures enregistrées des documents nationaux, pas les notes.</p></div><span className="national-exam-total">{loading || error ? '—' : fmtNumber(views.length)} consultation{views.length === 1 ? '' : 's'}</span></div>
        <div className="national-exam-chart-grid">
          <article className="national-exam-panel national-exam-panel-wide"><div className="national-exam-panel-title"><div><span className="national-exam-kicker">DANS LE TEMPS</span><h3>Sujets et corrigés consultés</h3></div><small>8 dernières semaines</small></div>
            {loading ? <div className="national-exam-chart-empty">Chargement des activités…</div> : error ? <div className="national-exam-chart-empty">Historique des consultations indisponible.</div> : views.length ? <div className="national-exam-chart national-exam-chart-line"><ResponsiveContainer width="100%" height="100%"><LineChart data={weeklyActivity} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}><CartesianGrid stroke="#edf1f7" vertical={false} strokeDasharray="4 6" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} minTickGap={8} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} width={32} /><Tooltip contentStyle={{ border: '1px solid #e2eaf5', borderRadius: 10 }} /><Line type="monotone" dataKey="sujets" name="Sujets" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="corrections" name="Corrigés" stroke="#0f9f78" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="nonPrecises" name="Type non précisé" stroke="#94a3b8" strokeWidth={2} dot={{ r: 2 }} /></LineChart></ResponsiveContainer></div> : <div className="national-exam-chart-empty">Les consultations apparaîtront après l’ouverture d’un sujet ou d’un corrigé national.</div>}
          </article>
          <article className="national-exam-panel"><div className="national-exam-panel-title"><div><span className="national-exam-kicker">DOCUMENTS</span><h3>Répartition des ouvertures</h3></div></div>
            {loading ? <div className="national-exam-chart-empty">Chargement des activités…</div> : error ? <div className="national-exam-chart-empty">Historique des consultations indisponible.</div> : splitData.length ? <div className="national-exam-donut-row"><div className="national-exam-chart national-exam-chart-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={splitData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="82%" paddingAngle={4} stroke="none">{splitData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value, name) => [fmtNumber(value), name]} /></PieChart></ResponsiveContainer><b>{fmtNumber(views.length)}<small>consultations</small></b></div><div className="national-exam-legend">{splitData.map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}<b>{fmtNumber(item.value)}</b></span>)}</div></div> : <div className="national-exam-chart-empty">Aucune consultation enregistrée pour ces filtres.</div>}
          </article>
          <article className="national-exam-panel national-exam-panel-wide"><div className="national-exam-panel-title"><div><span className="national-exam-kicker">MATIÈRES</span><h3>Volume des consultations par matière</h3></div><small>Consultations, pas résultats</small></div>
            {loading ? <div className="national-exam-chart-empty">Chargement des activités…</div> : error ? <div className="national-exam-chart-empty">Historique des consultations indisponible.</div> : bySubject.length ? <div className="national-exam-chart national-exam-chart-bars"><ResponsiveContainer width="100%" height="100%"><BarChart data={bySubject} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}><CartesianGrid stroke="#edf1f7" vertical={false} strokeDasharray="4 6" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} interval={0} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} width={30} /><Tooltip formatter={(value) => [fmtNumber(value), 'Consultations']} /><Bar dataKey="consultations" name="Consultations" radius={[6, 6, 0, 0]} maxBarSize={48}>{bySubject.map((item, index) => <Cell key={item.name} fill={['#2563eb', '#0f9f78', '#8b5cf6', '#f59e0b', '#0ea5e9', '#e11d48'][index % 6]} />)}</Bar></BarChart></ResponsiveContainer></div> : <div className="national-exam-chart-empty">Aucune matière consultée pour ces filtres.</div>}
          </article>
        </div>
      </section>

      <section className="national-exam-analysis">
        <div className="national-exam-section-title"><div><span className="national-exam-kicker">ANALYSE DÉTAILLÉE</span><h2>Analyse de vos résultats</h2></div></div>
        <div className="national-exam-analysis-grid"><article><b>↗</b><div><strong>Points forts et matières à améliorer</strong><span>Non disponibles sans réponses et notes par matière.</span></div></article><article><b>▤</b><div><strong>Chapitres maîtrisés ou difficiles</strong><span>Les résultats ne sont pas enregistrés chapitre par chapitre.</span></div></article><article><b>!</b><div><strong>Questions incorrectes à revoir</strong><span>Aucune réponse d’examen n’est collectée depuis les sujets PDF.</span></div></article><article><b>★</b><div><strong>Examens les mieux réussis</strong><span>Les scores des examens nationaux ne sont pas disponibles.</span></div></article><article><b>↻</b><div><strong>Comparaison des tentatives</strong><span>Aucun historique de tentatives n’est enregistré pour ces examens.</span></div></article></div>
      </section>

      <section className="national-exam-history">
        <div className="national-exam-section-title"><div><span className="national-exam-kicker">HISTORIQUE</span><h2 id="national-exam-history-title">Examens consultés</h2><p>Date de la dernière ouverture enregistrée d’un sujet ou d’un corrigé.</p></div><span className="national-exam-total">{loading || error ? '—' : fmtNumber(rows.length)} examen{rows.length === 1 ? '' : 's'}</span></div>
        {loading || catalogLoading ? <div className="national-exam-table-empty">Chargement de l’historique…</div> : error ? <div className="national-exam-table-empty"><strong>Historique indisponible</strong><p>Les consultations n’ont pas pu être chargées.</p><button type="button" onClick={onRetry}>Réessayer</button></div> : rows.length ? <div className="national-exam-table-scroll"><table><thead><tr><th>Examen / année</th><th>Matière / option</th><th>Nombre de tentatives</th><th>Dernière note</th><th>Meilleure note</th><th>Taux de réussite</th><th>Consultations</th><th>Date de consultation</th><th>Correction</th></tr></thead><tbody>{rows.map((row) => {
          const hasCorrection = Boolean(row.exam.pdfCorrectionUrl || row.exam.correctionPageImages?.length);
          return <tr key={row.id}><td><strong>{row.title}</strong><small>{row.year || 'Année non précisée'}{row.exam.session ? ` · ${row.exam.session}` : ''}</small></td><td><strong>{row.subject}</strong><small>{row.option}</small></td><td className="not-recorded">Non suivies</td><td>—</td><td>—</td><td>—</td><td><strong>{fmtNumber(row.sujets + row.corrections + row.unknown)}</strong><small>{row.sujets} sujet · {row.corrections} corrigé{row.unknown ? ` · ${row.unknown} non précisé` : ''}</small></td><td>{fmtDate(row.latest, true)}</td><td>{hasCorrection ? <button className="national-exam-correction-link" type="button" onClick={() => navigate(`/client-examens?examId=${encodeURIComponent(row.id)}&document=correction`)}>Ouvrir le corrigé ↗</button> : <span className="not-recorded">Indisponible</span>}</td></tr>;
        })}</tbody></table></div> : <div className="national-exam-table-empty"><b>▤</b><strong>Aucun examen consulté pour ces filtres</strong><p>Les sujets et corrigés ouverts apparaîtront avec leur date réelle de consultation.</p><button type="button" onClick={() => catalogError ? setCatalogRetry((value) => value + 1) : navigate('/client-examens')}>{catalogError ? 'Recharger le catalogue' : 'Parcourir les examens'}</button></div>}
      </section>
    </section>
  );
}
