import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { isNationalExamActivityEvent, isNationalExamCorrectionEvent } from '../studentDashboardStats';
import './ClientNationalExamStatsDashboard.css';
import './ClientStatsDashboardTheme.css';
import './ClientNationalExamStatsDashboardCompact.css';

const API_BASE = '';
const PAGE_SIZE = 8;
const COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  muted: '#94a3b8',
  ink: '#0f172a',
};

const normalize = (value) => String(value || '')
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('fr-FR');

const eventKind = (event) => String(event?.eventType || '').toUpperCase();
const resourceParts = (event) => {
  const rawId = String(event?.resourceId || '');
  const [id, ...suffix] = rawId.split(':');
  return { id, suffix: suffix.join(':') };
};
const examIdOf = (event) => resourceParts(event).id;
const documentOf = (event) => {
  const { suffix } = resourceParts(event);
  const variant = normalize(event?.resourceVariant || event?.documentType || suffix);
  if (variant.includes('correction') || variant.includes('corrige') || normalize(event?.title).includes('correction')) return 'correction';
  if (variant.includes('sujet') || variant.includes('subject')) return 'sujet';
  return 'unknown';
};
const fmtNumber = (value) => new Intl.NumberFormat('fr-FR').format(Number(value) || 0);
const fmtDate = (value, withTime = false) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
};
const hasCorrection = (exam) => Boolean(exam?.pdfCorrectionUrl || exam?.correctionPageImages?.length);

function MetricIcon({ name }) {
  const paths = {
    exams: <><path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V9h5M9 13h6M9 17h6" /></>,
    complete: <><path d="M20 11.2v.8a8 8 0 1 1-4.7-7.3" /><path d="m8.5 11.5 3 3 9-9" /></>,
    correction: <><path d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V9h5M9 14h6m-6 3h4" /><path d="m9 11 1.5 1.5L13 10" /></>,
    subjects: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 5.5v15M8 7h8M8 11h8M8 15h5" /></>,
    pending: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const getStatus = (id, startedIds, completedIds) => {
  if (completedIds.has(id)) return 'completed';
  if (startedIds.has(id)) return 'in-progress';
  return 'not-started';
};

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [correctionFilter, setCorrectionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    axios.get(`${API_BASE}/api/examens-nationaux`, { withCredentials: true })
      .then(({ data }) => {
        if (!active) return;
        setCatalog(Array.isArray(data) ? data : []);
        setCatalogError(false);
      })
      .catch(() => {
        if (!active) return;
        setCatalog([]);
        setCatalogError(true);
      })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [catalogRetry]);

  const examEvents = useMemo(() => (Array.isArray(events) ? events : []).filter(isNationalExamActivityEvent), [events]);
  const byId = useMemo(() => new Map(catalog.map((exam) => [String(exam.id), exam])), [catalog]);
  const years = useMemo(() => [...new Set(catalog.map((exam) => String(exam.annee || '')).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a)), [catalog]);
  const subjects = useMemo(() => [...new Set(catalog.map((exam) => exam.matiere).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr')), [catalog]);
  const options = useMemo(() => [...new Set(catalog.map((exam) => exam.optionBac).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr')), [catalog]);

  const visibleCatalog = useMemo(() => catalog.filter((exam) =>
    (year === 'all' || String(exam.annee || '') === year)
    && (subject === 'all' || normalize(exam.matiere) === normalize(subject))
    && (option === 'all' || normalize(exam.optionBac) === normalize(option))), [catalog, year, subject, option]);
  const visibleIds = useMemo(() => new Set(visibleCatalog.map((exam) => String(exam.id))), [visibleCatalog]);
  const visibleEvents = useMemo(() => examEvents.filter((event) => visibleIds.has(examIdOf(event))), [examEvents, visibleIds]);
  const viewEvents = useMemo(() => visibleEvents.filter((event) => eventKind(event) === 'VIEW'), [visibleEvents]);
  const subjectViewEvents = useMemo(() => viewEvents.filter((event) => documentOf(event) !== 'correction'), [viewEvents]);
  const correctionActivityEvents = useMemo(() => visibleEvents.filter(isNationalExamCorrectionEvent), [visibleEvents]);

  // Completion is a manual state. Keep only the latest COMPLETE/UNCOMPLETE event per document.
  const completionByExam = useMemo(() => {
    const latestByDocument = new Map();
    examEvents
      .map((event, index) => ({ event, index, timestamp: new Date(event.occurredAt).getTime() }))
      .filter(({ event }) => ['COMPLETE', 'UNCOMPLETE'].includes(eventKind(event)))
      .sort((a, b) => {
        const aTime = Number.isFinite(a.timestamp) ? a.timestamp : 0;
        const bTime = Number.isFinite(b.timestamp) ? b.timestamp : 0;
        return aTime - bTime || a.index - b.index;
      })
      .forEach(({ event }) => {
        const { id } = resourceParts(event);
        if (!id) return;
        const document = documentOf(event) === 'unknown' ? 'sujet' : documentOf(event);
        latestByDocument.set(`${id}:${document}`, eventKind(event) === 'COMPLETE');
      });
    const completed = new Set();
    latestByDocument.forEach((isCompleted, key) => {
      if (isCompleted) completed.add(key.split(':')[0]);
    });
    return completed;
  }, [examEvents]);

  const startedIds = useMemo(() => new Set(subjectViewEvents.map(examIdOf).filter(Boolean)), [subjectViewEvents]);
  const correctionIds = useMemo(() => new Set(correctionActivityEvents
    .filter((event) => hasCorrection(byId.get(examIdOf(event))))
    .map(examIdOf).filter(Boolean)), [correctionActivityEvents, byId]);
  const workedSubjects = useMemo(() => new Set(subjectViewEvents.map((event) => {
    const exam = byId.get(examIdOf(event));
    return normalize(exam?.matiere || event.subject);
  }).filter(Boolean)), [subjectViewEvents, byId]);

  const metrics = useMemo(() => ({
    consulted: startedIds.size,
    completed: visibleCatalog.filter((exam) => completionByExam.has(String(exam.id))).length,
    corrections: correctionIds.size,
    subjects: workedSubjects.size,
    pending: [...startedIds].filter((id) => !completionByExam.has(id)).length,
  }), [startedIds, visibleCatalog, completionByExam, correctionIds, workedSubjects]);

  const statusCounts = useMemo(() => {
    const counts = { 'not-started': 0, 'in-progress': 0, completed: 0 };
    visibleCatalog.forEach((exam) => { counts[getStatus(String(exam.id), startedIds, completionByExam)] += 1; });
    return [
      { name: 'Non commencés', value: counts['not-started'], color: '#94a3b8' },
      { name: 'En cours', value: counts['in-progress'], color: COLORS.primary },
      { name: 'Terminés', value: counts.completed, color: COLORS.success },
    ];
  }, [visibleCatalog, startedIds, completionByExam]);

  const lineData = useMemo(() => {
    const now = new Date();
    const datedEvents = visibleEvents.map((event, index) => ({
      event,
      index,
      date: new Date(event.occurredAt),
    })).filter((item) => !Number.isNaN(item.date.getTime()));
    let granularity = 'month';
    let start;
    let bucketCount;

    if (period === 'week') {
      granularity = 'day';
      bucketCount = 7;
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - bucketCount + 1);
    } else if (period === 'month') {
      granularity = 'day';
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      bucketCount = now.getDate();
    } else if (period === 'quarter') {
      granularity = 'month';
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterStartMonth, 1);
      bucketCount = now.getMonth() - quarterStartMonth + 1;
    } else {
      const firstActivity = datedEvents.reduce((earliest, item) => item.date < earliest ? item.date : earliest, now);
      start = datedEvents.length ? new Date(firstActivity.getFullYear(), firstActivity.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth(), 1);
      bucketCount = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1);
    }

    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const date = new Date(start);
      if (granularity === 'day') date.setDate(start.getDate() + index);
      else date.setMonth(start.getMonth() + index);
      const key = granularity === 'day'
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return {
        key,
        label: new Intl.DateTimeFormat('fr-FR', granularity === 'day'
          ? { weekday: 'short', day: 'numeric' }
          : { month: 'short', year: bucketCount > 6 ? '2-digit' : undefined }).format(date),
        exams: new Set(),
        completed: new Set(),
        corrections: new Set(),
      };
    });

    const keyFor = (date) => granularity === 'day'
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    datedEvents.forEach(({ event, date }) => {
      const bucket = buckets.find((item) => item.key === keyFor(date));
      if (!bucket) return;
      const id = examIdOf(event);
      const kind = eventKind(event);
      if (kind === 'VIEW' && documentOf(event) === 'correction') bucket.corrections.add(id);
      else if (kind === 'VIEW') bucket.exams.add(id);
      if (kind === 'COMPLETE') {
        bucket.completed.add(id);
        if (documentOf(event) === 'correction') bucket.corrections.add(id);
      }
    });
    return buckets.map((bucket) => ({
      label: bucket.label,
      exams: bucket.exams.size,
      completed: bucket.completed.size,
      corrections: bucket.corrections.size,
    }));
  }, [visibleEvents, period]);

  const subjectData = useMemo(() => {
    const workedBySubject = new Map();
    subjectViewEvents.forEach((event) => {
      const exam = byId.get(examIdOf(event));
      const name = exam?.matiere || event.subject;
      if (!name) return;
      if (!workedBySubject.has(name)) workedBySubject.set(name, new Set());
      workedBySubject.get(name).add(examIdOf(event));
    });
    return [...new Set(visibleCatalog.map((exam) => exam.matiere).filter(Boolean))]
      .map((name) => ({
        name,
        exams: workedBySubject.get(name)?.size || 0,
        available: visibleCatalog.filter((exam) => exam.matiere === name).length,
      }))
      .sort((a, b) => b.exams - a.exams || a.name.localeCompare(b.name, 'fr'));
  }, [visibleCatalog, subjectViewEvents, byId]);

  const yearData = useMemo(() => years
    .filter((item) => year === 'all' || item === year)
    .map((item) => {
      const examsOfYear = visibleCatalog.filter((exam) => String(exam.annee || '') === item);
      const worked = examsOfYear.filter((exam) => startedIds.has(String(exam.id))).length;
      return { year: item, worked, undiscovered: Math.max(0, examsOfYear.length - worked) };
    })
    .sort((a, b) => Number(a.year) - Number(b.year)), [years, year, visibleCatalog, startedIds]);

  const correctionSummary = useMemo(() => {
    const available = visibleCatalog.filter(hasCorrection);
    const consulted = available.filter((exam) => correctionIds.has(String(exam.id))).length;
    const pending = Math.max(0, available.length - consulted);
    return { available: available.length, consulted, pending, rate: available.length ? Math.round((consulted / available.length) * 100) : 0 };
  }, [visibleCatalog, correctionIds]);

  const latestViewByExam = useMemo(() => {
    const latest = new Map();
    viewEvents.forEach((event) => {
      const id = examIdOf(event);
      const previous = latest.get(id);
      if (!previous || new Date(event.occurredAt).getTime() > new Date(previous).getTime()) latest.set(id, event.occurredAt);
    });
    return latest;
  }, [viewEvents]);

  const historyRows = useMemo(() => {
    const query = normalize(search);
    return visibleCatalog
      .map((exam) => {
        const id = String(exam.id);
        const status = getStatus(id, startedIds, completionByExam);
        const isCorrectionConsulted = correctionIds.has(id);
        return {
          exam,
          id,
          status,
          latest: latestViewByExam.get(id) || null,
          isCorrectionConsulted,
          correctionAvailable: hasCorrection(exam),
        };
      })
      .filter((row) => {
        const searchable = normalize([row.exam.titre, row.exam.matiere, row.exam.annee, row.exam.optionBac, row.exam.session].join(' '));
        return (!query || searchable.includes(query))
          && (statusFilter === 'all' || row.status === statusFilter)
          && (correctionFilter === 'all'
            || (correctionFilter === 'consulted' && row.isCorrectionConsulted)
            || (correctionFilter === 'pending' && row.correctionAvailable && !row.isCorrectionConsulted)
            || (correctionFilter === 'unavailable' && !row.correctionAvailable));
      })
      .sort((a, b) => new Date(b.latest || 0) - new Date(a.latest || 0)
        || Number(b.exam.annee || 0) - Number(a.exam.annee || 0));
  }, [visibleCatalog, startedIds, completionByExam, correctionIds, latestViewByExam, search, statusFilter, correctionFilter]);

  const totalPages = Math.max(1, Math.ceil(historyRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = historyRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const lineHasData = lineData.some((item) => item.exams || item.completed || item.corrections);
  const statusTotal = statusCounts.reduce((sum, item) => sum + item.value, 0);

  const recommendations = useMemo(() => {
    const items = [];
    const unfinished = [...startedIds].filter((id) => !completionByExam.has(id)).length;
    if (unfinished) items.push({
      title: 'Reprendre les examens en cours',
      detail: `${fmtNumber(unfinished)} examen${unfinished > 1 ? 's' : ''} commencé${unfinished > 1 ? 's' : ''} ${unfinished > 1 ? 'restent' : 'reste'} à terminer.`,
      action: 'Voir l’historique',
      onClick: () => { setStatusFilter('in-progress'); setCurrentPage(1); },
    });
    if (correctionSummary.pending) items.push({
      title: 'Consulter les corrections disponibles',
      detail: `${fmtNumber(correctionSummary.pending)} correction${correctionSummary.pending > 1 ? 's restent' : ' reste'} à découvrir.`,
      action: 'Filtrer les corrections',
      onClick: () => { setCorrectionFilter('pending'); setCurrentPage(1); },
    });
    const leastWorkedSubject = subjectData
      .filter((item) => item.available > 0 && item.exams < item.available)
      .sort((a, b) => (a.exams / a.available) - (b.exams / b.available) || a.name.localeCompare(b.name, 'fr'))[0];
    if (leastWorkedSubject) {
      const targetExam = visibleCatalog.find((exam) => exam.matiere === leastWorkedSubject.name && !startedIds.has(String(exam.id)))
        || visibleCatalog.find((exam) => exam.matiere === leastWorkedSubject.name);
      items.push({
        title: 'Équilibrer vos révisions',
        detail: leastWorkedSubject.exams
          ? `${leastWorkedSubject.name} : ${leastWorkedSubject.exams} examen${leastWorkedSubject.exams > 1 ? 's' : ''} travaillé${leastWorkedSubject.exams > 1 ? 's' : ''} sur ${leastWorkedSubject.available}.`
          : `Vous n’avez pas encore ouvert d’examen de ${leastWorkedSubject.name}.`,
        action: 'Voir les examens',
        onClick: () => {
          if (!targetExam) return navigate('/client-examens');
          const params = new URLSearchParams();
          if (targetExam.optionBac) params.set('filiere', targetExam.optionBac);
          params.set('examId', String(targetExam.id));
          params.set('document', 'sujet');
          navigate(`/client-examens?${params.toString()}`);
        },
      });
    }
    return items.slice(0, 3);
  }, [startedIds, completionByExam, correctionSummary.pending, subjectData, visibleCatalog, navigate]);

  const openExam = (exam, document = 'sujet') => {
    const params = new URLSearchParams();
    if (exam.optionBac) params.set('filiere', exam.optionBac);
    params.set('examId', String(exam.id));
    params.set('document', document);
    navigate(`/client-examens?${params.toString()}`);
  };

  return (
    <section className="national-exam-stats" aria-label="Suivi des examens nationaux">
      <header className="national-exam-hero">
        <span className="national-exam-heading-icon" aria-hidden="true">▤</span>
        <div>
          <h1>Suivi des examens nationaux</h1>
          <p>Ta progression sur les épreuves du Bac</p>
        </div>
      </header>

      <section className="national-exam-filter-panel" aria-label="Filtres des examens">
        <div className="national-exam-filters" role="group">
          <label>Année<select value={year} onChange={(event) => { setYear(event.target.value); setCurrentPage(1); }}><option value="all">Toutes les années</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Matière<select value={subject} onChange={(event) => { setSubject(event.target.value); setCurrentPage(1); }}><option value="all">Toutes les matières</option>{subjects.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Option du Bac<select value={option} onChange={(event) => { setOption(event.target.value); setCurrentPage(1); }}><option value="all">Toutes les options</option>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
      </section>

      {(error || catalogError) && <div className="national-exam-alert" role="alert">
        <span>{error ? 'Les activités de votre compte sont indisponibles.' : 'Le catalogue des examens est indisponible.'}</span>
        {error && onRetry && <button type="button" onClick={onRetry}>Réessayer</button>}
        {catalogError && <button type="button" onClick={() => setCatalogRetry((value) => value + 1)}>Recharger</button>}
      </div>}

      <section className="national-exam-kpis" aria-label="Indicateurs principaux">
        {[
          { label: 'Examens consultés', value: metrics.consulted, icon: 'exams', tone: 'blue', note: 'Examens distincts ouverts' },
          { label: 'Examens terminés', value: metrics.completed, icon: 'complete', tone: 'green', note: 'Marqués manuellement terminés' },
          { label: 'Corrections consultées', value: metrics.corrections, icon: 'correction', tone: 'violet', note: 'Corrections PDF distinctes' },
          { label: 'Matières travaillées', value: metrics.subjects, icon: 'subjects', tone: 'amber', note: 'Matières distinctes étudiées' },
          { label: 'Examens à terminer', value: metrics.pending, icon: 'pending', tone: 'rose', note: 'Commencés, non terminés' },
        ].map((item) => (
          <article className={`national-exam-kpi is-${item.tone}`} key={item.label}>
            <span className="national-exam-kpi-icon"><MetricIcon name={item.icon} /></span>
            <span className="national-exam-kpi-label">{item.label}</span>
            <strong>{loading || catalogLoading ? '…' : error || catalogError ? '—' : fmtNumber(item.value)}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </section>

      <section className="national-exam-section">
        <div className="national-exam-section-title">
          <div><span className="national-exam-kicker">ÉVOLUTION DE L’ACTIVITÉ</span><h2>Votre rythme de révision</h2><p>Examens ouverts, validations manuelles et corrections consultées.</p></div>
          <label className="national-exam-period">Période
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="week">Cette semaine</option><option value="month">Ce mois</option><option value="quarter">Ce trimestre</option><option value="all">Toute la période</option>
            </select>
          </label>
        </div>
        <article className="national-exam-panel">
          {loading ? <div className="national-exam-empty">Chargement des activités…</div> : error ? <div className="national-exam-empty">L’historique des activités est indisponible.</div> : lineHasData ? (
            <div className="national-exam-chart national-exam-line-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 12, right: 14, left: -15, bottom: 4 }}>
                  <CartesianGrid stroke="#e8eef7" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 11 }} minTickGap={18} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 11 }} width={32} />
                  <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,.08)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                  <Line type="monotone" dataKey="exams" name="Examens consultés" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="completed" name="Examens terminés" stroke={COLORS.success} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="corrections" name="Corrections consultées" stroke={COLORS.violet} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="national-exam-empty">Les consultations et validations apparaîtront ici dès votre première activité.</div>}
        </article>
      </section>

      <section className="national-exam-chart-grid">
        <article className="national-exam-panel">
          <div className="national-exam-panel-heading"><div><span className="national-exam-kicker">RÉPARTITION PAR MATIÈRE</span><h3>Examens travaillés</h3></div></div>
          {loading || catalogLoading ? <div className="national-exam-empty">Chargement…</div> : error || catalogError ? <div className="national-exam-empty">Les données ne sont pas disponibles.</div> : subjectData.length ? (
            <div className="national-exam-chart national-exam-subject-chart" style={{ height: Math.max(180, subjectData.length * 38) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 4 }}>
                  <CartesianGrid stroke="#e8eef7" strokeDasharray="4 6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={128} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip formatter={(value) => [fmtNumber(value), 'Examens travaillés']} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12 }} />
                  <Bar dataKey="exams" name="Examens travaillés" radius={[0, 7, 7, 0]} maxBarSize={24}>
                    {subjectData.map((item, index) => <Cell key={item.name} fill={index === 0 ? COLORS.primary : index === subjectData.length - 1 ? '#cbd5e1' : '#7c9cff'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="national-exam-empty">Aucune matière disponible dans le catalogue sélectionné.</div>}
        </article>

        <article className="national-exam-panel">
          <div className="national-exam-panel-heading"><div><span className="national-exam-kicker">ÉTAT D’AVANCEMENT</span><h3>Examens du catalogue</h3></div></div>
          {loading || catalogLoading ? <div className="national-exam-empty">Chargement…</div> : error || catalogError ? <div className="national-exam-empty">Les données ne sont pas disponibles.</div> : statusTotal ? (
            <div className="national-exam-donut-layout">
              <div className="national-exam-chart national-exam-donut-chart">
                <ResponsiveContainer width="100%" height="100%"><PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="88%" paddingAngle={3} stroke="none">
                    {statusCounts.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [fmtNumber(value), name]} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12 }} />
                </PieChart></ResponsiveContainer>
                <div className="national-exam-donut-center"><strong>{fmtNumber(visibleCatalog.length)}</strong><span>examens</span></div>
              </div>
              <div className="national-exam-legend">
                {statusCounts.map((item) => (
                  <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{fmtNumber(item.value)}</strong></div>
                ))}
              </div>
            </div>
          ) : <div className="national-exam-empty">Aucun examen n’est présent dans le catalogue.</div>}
        </article>

        <article className="national-exam-panel">
          <div className="national-exam-panel-heading"><div><span className="national-exam-kicker">CORRECTIONS PDF</span><h3>Corrections à consulter</h3></div></div>
          {loading || catalogLoading ? <div className="national-exam-empty">Chargement…</div> : error || catalogError ? <div className="national-exam-empty">Les données ne sont pas disponibles.</div> : correctionSummary.available ? (
            <>
              <div className="national-exam-correction-rate"><strong>{correctionSummary.rate}%</strong><span>de corrections consultées</span></div>
              <div className="national-exam-chart national-exam-correction-chart">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: 'Corrections disponibles', consulted: correctionSummary.consulted, pending: correctionSummary.pending }]} layout="vertical" margin={{ top: 10, right: 10, left: 8, bottom: 10 }}>
                  <XAxis type="number" hide allowDecimals={false} /><YAxis type="category" dataKey="name" hide />
                  <Tooltip formatter={(value, name) => [fmtNumber(value), name === 'consulted' ? 'Consultées' : 'À consulter']} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12 }} />
                  <Legend formatter={(value) => value === 'consulted' ? 'Consultées' : 'À consulter'} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="consulted" name="consulted" stackId="corrections" fill={COLORS.success} radius={[8, 0, 0, 8]} />
                  <Bar dataKey="pending" name="pending" stackId="corrections" fill="#dbe5f3" radius={[0, 8, 8, 0]} />
                </BarChart></ResponsiveContainer>
              </div>
              <div className="national-exam-correction-footnote">{fmtNumber(correctionSummary.available)} corrections disponibles dans les examens sélectionnés.</div>
            </>
          ) : <div className="national-exam-empty">Aucune correction PDF disponible dans le catalogue sélectionné.</div>}
        </article>

        <article className="national-exam-panel national-exam-year-panel">
          <div className="national-exam-panel-heading"><div><span className="national-exam-kicker">ACTIVITÉ PAR ANNÉE</span><h3>Années travaillées et à découvrir</h3></div></div>
          {loading || catalogLoading ? <div className="national-exam-empty">Chargement…</div> : error || catalogError ? <div className="national-exam-empty">Les données ne sont pas disponibles.</div> : yearData.length ? (
            <div className="national-exam-chart national-exam-year-chart" style={{ height: Math.max(190, yearData.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%"><BarChart data={yearData} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 4 }}>
                <CartesianGrid stroke="#e8eef7" strokeDasharray="4 6" horizontal={false} />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 10 }} />
                <YAxis type="category" dataKey="year" width={50} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip formatter={(value, name) => [fmtNumber(value), name === 'worked' ? 'Travaillés' : 'À découvrir']} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12 }} />
                <Legend formatter={(value) => value === 'worked' ? 'Travaillés' : 'À découvrir'} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="worked" name="worked" stackId="year" fill={COLORS.primary} radius={[0, 0, 0, 0]} />
                <Bar dataKey="undiscovered" name="undiscovered" stackId="year" fill="#dbe5f3" radius={[0, 7, 7, 0]} />
              </BarChart></ResponsiveContainer>
            </div>
          ) : <div className="national-exam-empty">Aucune année n’est enregistrée dans le catalogue.</div>}
        </article>
      </section>

      <section className="national-exam-panel national-exam-history">
        <div className="national-exam-section-title">
          <div><span className="national-exam-kicker">HISTORIQUE DES EXAMENS</span><h2>Examens du catalogue</h2><p>Chaque ligne représente un examen distinct, y compris ceux qui n’ont pas encore été ouverts.</p></div>
          <span className="national-exam-result-count">{fmtNumber(historyRows.length)} résultat{historyRows.length > 1 ? 's' : ''}</span>
        </div>
        <div className="national-exam-table-filters">
          <label className="national-exam-search">Recherche<input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Examen, matière, année…" /></label>
          <label>Statut<select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}><option value="all">Tous les statuts</option><option value="not-started">Non commencé</option><option value="in-progress">En cours</option><option value="completed">Terminé</option></select></label>
          <label>Correction<select value={correctionFilter} onChange={(event) => { setCorrectionFilter(event.target.value); setCurrentPage(1); }}><option value="all">Toutes</option><option value="consulted">Consultée</option><option value="pending">À consulter</option><option value="unavailable">Indisponible</option></select></label>
        </div>
        {loading || catalogLoading ? <div className="national-exam-empty">Chargement de votre historique…</div> : error || catalogError ? <div className="national-exam-empty">Impossible de charger l’historique des examens.</div> : pageRows.length ? (
          <div className="national-exam-table-scroll"><table>
            <thead><tr><th>Examen</th><th>Matière</th><th>Année</th><th>Dernière consultation</th><th>Statut</th><th>Correction</th><th>Actions</th></tr></thead>
            <tbody>{pageRows.map((row) => <tr key={row.id}>
              <td><strong>{row.exam.titre || `Examen national ${row.exam.annee || ''}`}</strong><small>{row.exam.session || 'Session normale'}{row.exam.optionBac ? ` · ${row.exam.optionBac}` : ''}</small></td>
              <td>{row.exam.matiere || '—'}</td>
              <td>{row.exam.annee || '—'}</td>
              <td>{fmtDate(row.latest, true)}</td>
              <td><span className={`national-exam-status is-${row.status}`}>{row.status === 'completed' ? 'Terminé' : row.status === 'in-progress' ? 'En cours' : 'Non commencé'}</span></td>
              <td><span className={`national-exam-correction-status ${row.isCorrectionConsulted ? 'is-consulted' : row.correctionAvailable ? 'is-pending' : 'is-unavailable'}`}>{row.isCorrectionConsulted ? 'Consultée' : row.correctionAvailable ? 'À consulter' : 'Indisponible'}</span></td>
              <td><div className="national-exam-row-actions"><button type="button" onClick={() => openExam(row.exam, 'sujet')}>Ouvrir l’examen</button><button type="button" disabled={!row.correctionAvailable} onClick={() => openExam(row.exam, 'correction')}>Correction</button></div></td>
            </tr>)}</tbody>
          </table></div>
        ) : <div className="national-exam-empty">Aucun examen ne correspond à votre recherche et à ces filtres.</div>}
        {historyRows.length > PAGE_SIZE && <div className="national-exam-pagination">
          <span>Page {safePage} sur {totalPages}</span>
          <div><button type="button" disabled={safePage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Précédent</button><button type="button" disabled={safePage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Suivant</button></div>
        </div>}
      </section>

      <section className="national-exam-recommendations">
        <button className="national-exam-recommendations-open" type="button" onClick={() => navigate('/client-examens')}>
          Ouvrir un examen <span aria-hidden="true">→</span>
        </button>
        <div className="national-exam-section-title"><div><span className="national-exam-kicker">À PARTIR DE VOTRE ACTIVITÉ</span><h2>Prochaines révisions</h2><p>Des pistes fondées sur vos examens et consultations enregistrés.</p></div></div>
        {loading || catalogLoading ? <div className="national-exam-empty">Préparation de vos recommandations…</div> : error || catalogError ? <div className="national-exam-empty">Les recommandations seront disponibles lorsque vos données auront été chargées.</div> : recommendations.length ? (
          <div className="national-exam-recommendation-grid">{recommendations.map((item) => <article key={item.title}>
            <span className="national-exam-recommendation-mark" aria-hidden="true">→</span><h3>{item.title}</h3><p>{item.detail}</p><button type="button" onClick={item.onClick}>{item.action} <span aria-hidden="true">→</span></button>
          </article>)}</div>
        ) : <div className="national-exam-empty">Aucune action prioritaire ne ressort de vos données actuelles.</div>}
      </section>
    </section>
  );
}
