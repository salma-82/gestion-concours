import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import './CompetitionCalendar.css';
import { getStudentPlanningKey, readStudentPlanning } from '../studentProgress';

const API = 'http://localhost:8081/api/calendrier';
const eventTypes = [
  { value: 'REGISTRATION_START', label: 'Ouverture des inscriptions', color: 'blue' },
  { value: 'REGISTRATION_DEADLINE', label: 'Date limite d’inscription', color: 'orange' },
  { value: 'COMPETITION', label: 'Date du concours', color: 'purple' },
  { value: 'OTHER', label: 'Autre date', color: 'green' },
];
const emptyForm = { title: '', eventType: 'COMPETITION', concoursName: '', school: '', startAt: '', endAt: '', description: '', registrationUrl: '' };
const pad = (value) => String(value).padStart(2, '0');
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toLocalInput = (value) => value ? String(value).slice(0, 16) : '';

export default function CompetitionCalendar({ admin = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialClientDateSelected = useRef(false);
  const [calendarView, setCalendarView] = useState('competitions');
  const [personalEvents, setPersonalEvents] = useState(() => readStudentPlanning());
  const [personalFormOpen, setPersonalFormOpen] = useState(false);
  const [personalEditingId, setPersonalEditingId] = useState(null);
  const [personalForm, setPersonalForm] = useState({ title: '', date: '', time: '', type: 'revision', subject: '', priority: 'medium' });

  useEffect(() => {
    localStorage.setItem(getStudentPlanningKey(), JSON.stringify(personalEvents));
  }, [personalEvents]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(API);
      const nextEvents = Array.isArray(response.data) ? response.data : [];
      setEvents(nextEvents);
      if (!admin && !initialClientDateSelected.current) {
        const now = new Date();
        const upcoming = nextEvents
          .filter((event) => event.startAt && new Date(event.startAt) >= now)
          .sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)))[0];
        if (upcoming) {
          initialClientDateSelected.current = true;
          const upcomingDate = String(upcoming.startAt).slice(0, 10);
          setSelectedDate(upcomingDate);
          const date = new Date(`${upcomingDate}T00:00:00`);
          setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        }
      }
    } catch {
      setError('Le calendrier est momentanément indisponible. Vérifiez que le serveur est démarré.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    if (admin) return undefined;
    const refreshOnFocus = () => loadEvents();
    const interval = window.setInterval(loadEvents, 60000);
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [admin, loadEvents]);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [month]);

  const shownEvents = !admin && calendarView === 'personal'
    ? personalEvents.map((event) => ({
      ...event,
      startAt: `${event.date}T${event.time || '00:00'}`,
      eventType: event.type,
      description: event.subject ? `Matière : ${event.subject}` : '',
      isPersonal: true,
    }))
    : events;
  const eventsForDay = (key) => shownEvents.filter((event) => String(event.startAt || '').slice(0, 10) === key);
  const selectedEvents = eventsForDay(selectedDate).sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)));
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(month);
  const formatTime = (value) => value ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '';
  const typeInfo = (value) => {
    const personalTypes = {
      exam: { label: 'Examen', color: 'orange' },
      concours: { label: 'Concours', color: 'purple' },
      qcm: { label: 'QCM', color: 'green' },
      revision: { label: 'Révision', color: 'blue' },
      personal: { label: 'Personnel', color: 'purple' },
    };
    return eventTypes.find((type) => type.value === value) || personalTypes[value] || eventTypes[3];
  };

  const openPersonalForm = (event = null) => {
    setPersonalEditingId(event?.id || null);
    setPersonalForm(event
      ? { title: event.title || '', date: event.date || '', time: event.time || '', type: event.type || 'revision', subject: event.subject || '', priority: event.priority || 'medium' }
      : { title: '', date: selectedDate, time: '', type: 'revision', subject: '', priority: 'medium' });
    setPersonalFormOpen(true);
  };
  const savePersonalEvent = (event) => {
    event.preventDefault();
    if (!personalForm.title.trim() || !personalForm.date) return;
    const savedEvent = { ...personalForm, title: personalForm.title.trim(), id: personalEditingId || `u${Date.now()}` };
    setPersonalEvents((current) => personalEditingId
      ? current.map((item) => item.id === personalEditingId ? savedEvent : item)
      : [...current, savedEvent]);
    setSelectedDate(savedEvent.date);
    const date = new Date(`${savedEvent.date}T00:00:00`);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setPersonalFormOpen(false);
  };
  const deletePersonalEvent = (id) => {
    if (window.confirm('Supprimer cet événement personnel ?')) {
      setPersonalEvents((current) => current.filter((event) => event.id !== id));
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, startAt: `${selectedDate}T09:00` });
    setFormOpen(true);
  };
  const openEdit = (event) => {
    setEditingId(event.id);
    setForm({ ...emptyForm, ...event, startAt: toLocalInput(event.startAt), endAt: toLocalInput(event.endAt) });
    setFormOpen(true);
  };
  const saveEvent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, endAt: form.endAt || null, registrationUrl: form.registrationUrl || null };
      if (editingId) await axios.put(`${API}/${editingId}`, payload);
      else await axios.post(API, payload);
      const newSelected = String(form.startAt).slice(0, 10);
      setSelectedDate(newSelected);
      const newDate = new Date(`${newSelected}T00:00:00`);
      setMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
      setFormOpen(false);
      await loadEvents();
    } catch {
      setError('Enregistrement impossible. Vérifiez les informations et réessayez.');
    } finally {
      setSaving(false);
    }
  };
  const deleteEvent = async (id) => {
    if (!window.confirm('Supprimer cet événement du calendrier ?')) return;
    try { await axios.delete(`${API}/${id}`); await loadEvents(); }
    catch { setError('Suppression impossible. Réessayez.'); }
  };

  return (
    <main className="competition-calendar">
      <header className="calendar-heading">
        <div><span className="calendar-kicker">ESPACE {admin ? 'ADMINISTRATEUR' : 'ÉTUDIANT'}</span>
          <h1>Calendrier des concours</h1>
          <p>{admin ? 'Planifiez les inscriptions et les dates des concours pour tous les étudiants.' : 'Consultez les dates des concours ou retrouvez votre planning personnel.'}</p>
        </div>
        {admin ? <button className="calendar-primary" onClick={openNew}>＋ Ajouter une date</button> : calendarView === 'personal' && <button className="calendar-primary" onClick={() => openPersonalForm()}>＋ Ajouter un objectif</button>}
      </header>

      {error && <div className="calendar-alert" role="alert">{error}</div>}

      {!admin && <div className="calendar-view-switch" role="tablist" aria-label="Choisir un calendrier">
        <button className={calendarView === 'competitions' ? 'active' : ''} onClick={() => setCalendarView('competitions')} role="tab" aria-selected={calendarView === 'competitions'}>🏆 Événements des concours</button>
        <button className={calendarView === 'personal' ? 'active' : ''} onClick={() => setCalendarView('personal')} role="tab" aria-selected={calendarView === 'personal'}>👤 Mon calendrier personnel</button>
      </div>}

      <section className="calendar-layout">
        <div className="calendar-panel">
          <div className="calendar-toolbar">
            <button aria-label="Mois précédent" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
            <h2>{monthLabel}</h2>
            <button aria-label="Mois suivant" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
            <button className="calendar-today" onClick={() => { const today = new Date(); setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(dateKey(today)); }}>Aujourd’hui</button>
          </div>
          <div className="calendar-grid calendar-weekdays">{['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'].map((day) => <div key={day}>{day}</div>)}</div>
          <div className="calendar-grid">
            {days.map((day) => {
              const key = dateKey(day);
              const dayEvents = eventsForDay(key);
              return <button key={key} className={`calendar-day ${day.getMonth() === month.getMonth() ? '' : 'outside'} ${key === selectedDate ? 'selected' : ''} ${key === dateKey(new Date()) ? 'today' : ''}`} onClick={() => setSelectedDate(key)}>
                <span>{day.getDate()}</span>
                <div className="calendar-dots">{dayEvents.slice(0, 3).map((event) => <i key={event.id} className={`dot-${typeInfo(event.eventType).color}`} title={event.title} />)}{dayEvents.length > 3 && <small>+{dayEvents.length - 3}</small>}</div>
              </button>;
            })}
          </div>
          <div className="calendar-legend">{(admin || calendarView === 'competitions' ? eventTypes.slice(0, 3) : [
            { value: 'revision', label: 'Révision', color: 'blue' }, { value: 'exam', label: 'Examen', color: 'orange' }, { value: 'personal', label: 'Personnel', color: 'purple' }, { value: 'qcm', label: 'QCM', color: 'green' },
          ]).map((type) => <span key={type.value}><i className={`dot-${type.color}`} />{type.label}</span>)}</div>
        </div>

        <aside className="calendar-agenda">
          <div className="agenda-heading"><div><span>AGENDA</span><h2>{new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(`${selectedDate}T00:00:00`))}</h2></div>
            {!admin && calendarView === 'competitions' && <button className="agenda-refresh" aria-label="Actualiser le calendrier" title="Actualiser le calendrier" onClick={loadEvents}>↻</button>}
            {admin && <button aria-label="Ajouter un événement" onClick={openNew}>＋</button>}</div>
          {loading && calendarView === 'competitions' ? <p className="agenda-empty">Chargement du calendrier…</p> : selectedEvents.length === 0 ? <div className="agenda-empty"><span>📅</span><p>{calendarView === 'personal' ? 'Aucun objectif personnel prévu ce jour.' : 'Aucun événement prévu ce jour.'}</p></div> : <div className="agenda-list">{selectedEvents.map((event) => {
            const type = typeInfo(event.eventType);
            return <article className={`agenda-event event-${type.color}`} key={event.id}>
              <div className="event-time">{formatTime(event.startAt)}{event.endAt ? ` – ${formatTime(event.endAt)}` : ''}</div>
              <span className="event-type">{type.label}</span><h3>{event.title}</h3>
              {(event.concoursName || event.school) && <p className="event-school">{[event.concoursName, event.school].filter(Boolean).join(' · ')}</p>}
              {event.description && <p>{event.description}</p>}
              {event.registrationUrl && <a href={event.registrationUrl} target="_blank" rel="noreferrer">Lien d’inscription ↗</a>}
              {admin && <div className="event-actions"><button onClick={() => openEdit(event)}>Modifier</button><button onClick={() => deleteEvent(event.id)}>Supprimer</button></div>}
              {!admin && event.isPersonal && <div className="event-actions"><button onClick={() => openPersonalForm(event)}>Modifier</button><button onClick={() => deletePersonalEvent(event.id)}>Supprimer</button></div>}
            </article>;
          })}</div>}
        </aside>
      </section>

      {admin && formOpen && <div className="calendar-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}>
        <form className="calendar-modal" onSubmit={saveEvent}>
          <div className="modal-heading"><div><span>GESTION DU CALENDRIER</span><h2>{editingId ? 'Modifier la date' : 'Ajouter une date'}</h2></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Fermer">×</button></div>
          <label>Titre de l’événement<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex. Concours d’accès ENSA" /></label>
          <div className="modal-fields"><label>Type de date<select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>{eventTypes.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}</select></label><label>École<input value={form.school || ''} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="ENSA, ENCG…" /></label></div>
          <label>Concours<input value={form.concoursName || ''} onChange={(e) => setForm({ ...form, concoursName: e.target.value })} placeholder="Nom du concours" /></label>
          <div className="modal-fields"><label>Date et heure<input required type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} /></label><label>Fin (facultatif)<input type="datetime-local" value={form.endAt || ''} onChange={(e) => setForm({ ...form, endAt: e.target.value })} /></label></div>
          <label>Description<textarea rows="3" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Informations utiles pour les étudiants" /></label>
          <label>Lien d’inscription<input type="url" value={form.registrationUrl || ''} onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })} placeholder="https://…" /></label>
          <div className="modal-actions"><button type="button" className="calendar-secondary" onClick={() => setFormOpen(false)}>Annuler</button><button className="calendar-primary" disabled={saving}>{saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Ajouter au calendrier'}</button></div>
        </form>
      </div>}

      {!admin && personalFormOpen && <div className="calendar-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPersonalFormOpen(false); }}>
        <form className="calendar-modal" onSubmit={savePersonalEvent}>
          <div className="modal-heading"><div><span>MON PLANNING</span><h2>{personalEditingId ? 'Modifier mon objectif' : 'Ajouter un objectif'}</h2></div><button type="button" onClick={() => setPersonalFormOpen(false)} aria-label="Fermer">×</button></div>
          <label>Titre<input required value={personalForm.title} onChange={(e) => setPersonalForm({ ...personalForm, title: e.target.value })} placeholder="Ex. Réviser les suites" /></label>
          <div className="modal-fields"><label>Date<input required type="date" value={personalForm.date} onChange={(e) => setPersonalForm({ ...personalForm, date: e.target.value })} /></label><label>Heure<input type="time" value={personalForm.time} onChange={(e) => setPersonalForm({ ...personalForm, time: e.target.value })} /></label></div>
          <div className="modal-fields"><label>Type<select value={personalForm.type} onChange={(e) => setPersonalForm({ ...personalForm, type: e.target.value })}><option value="revision">Révision</option><option value="exam">Examen</option><option value="qcm">QCM</option><option value="personal">Personnel</option></select></label><label>Matière<input value={personalForm.subject} onChange={(e) => setPersonalForm({ ...personalForm, subject: e.target.value })} placeholder="Mathématiques…" /></label></div>
          <div className="modal-actions"><button type="button" className="calendar-secondary" onClick={() => setPersonalFormOpen(false)}>Annuler</button><button className="calendar-primary">{personalEditingId ? 'Enregistrer' : 'Ajouter à mon calendrier'}</button></div>
        </form>
      </div>}
    </main>
  );
}
