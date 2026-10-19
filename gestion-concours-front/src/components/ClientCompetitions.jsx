import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8081';
const valueOf = (value) => String(value || '').trim();

export default function ClientCompetitions() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [school, setSchool] = useState('all');
  const [year, setYear] = useState('all');
  const [subject, setSubject] = useState('all');
  const [chapter, setChapter] = useState('all');

  useEffect(() => {
    let active = true;
    const loadHistory = () => {
      let studentId = null;
      try { studentId = JSON.parse(localStorage.getItem('user') || '{}')?.id ?? null; } catch {}
      if (!studentId) {
        setAttempts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      axios.get(`${API_BASE}/api/qcm/mes-concours`, { params: { studentId } })
        .then(({ data }) => { if (active) { setAttempts(Array.isArray(data?.attempts) ? data.attempts : []); setError(''); } })
        .catch(() => { if (active) setError('Impossible de charger vos tentatives pour le moment.'); })
        .finally(() => { if (active) setLoading(false); });
    };
    loadHistory();
    window.addEventListener('student-qcm-history-updated', loadHistory);
    return () => { active = false; window.removeEventListener('student-qcm-history-updated', loadHistory); };
  }, []);

  const options = useMemo(() => ({
    schools: [...new Set(attempts.map((item) => valueOf(item.school)).filter(Boolean))].sort(),
    years: [...new Set(attempts.map((item) => valueOf(item.year)).filter(Boolean))].sort((a, b) => Number(b) - Number(a)),
    subjects: [...new Set(attempts.map((item) => valueOf(item.subject)).filter(Boolean))].sort(),
    chapters: [...new Set(attempts.map((item) => valueOf(item.chapter)).filter(Boolean))].sort()
  }), [attempts]);

  const filtered = useMemo(() => attempts.filter((item) =>
    (school === 'all' || valueOf(item.school) === school)
    && (year === 'all' || String(item.year || '') === year)
    && (subject === 'all' || valueOf(item.subject) === subject)
    && (chapter === 'all' || valueOf(item.chapter) === chapter)
  ), [attempts, school, year, subject, chapter]);

  const concours = filtered.filter((item) => !valueOf(item.resourceType).toLowerCase().includes('blanc'));
  const blancs = filtered.filter((item) => valueOf(item.resourceType).toLowerCase().includes('blanc'));
  const selectStyle = { width: '100%', minWidth: 0, padding: '10px 12px', border: '1px solid #dbe3ef', borderRadius: 10, background: '#fff', color: '#334155', font: 'inherit', fontSize: 12 };
  const sectionStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '20px 22px', marginBottom: 20, boxShadow: '0 3px 14px rgba(15,23,42,.03)' };
  const rowStyle = { display: 'grid', gridTemplateColumns: 'minmax(160px, 1.5fr) repeat(4, minmax(85px, .7fr)) minmax(100px, .7fr)', gap: 10, alignItems: 'center', padding: '11px 10px', borderBottom: '1px solid #eef2f7', color: '#475569', fontSize: 12 };

  const renderAttempts = (items, kind) => items.length === 0
    ? <p style={{ margin: '12px 0 2px', color: '#64748b', fontSize: 13 }}>Aucune tentative enregistrée pour ces filtres.</p>
    : <div style={{ overflowX: 'auto' }}>
      <div style={{ ...rowStyle, color: '#64748b', fontWeight: 750, fontSize: 11 }}>
        <span>{kind === 'blanc' ? 'Nom du QCM' : 'Concours'}</span><span>{kind === 'blanc' ? 'Matière' : 'École'}</span><span>{kind === 'blanc' ? 'Chapitre' : 'Matière'}</span><span>Année</span><span>Questions</span><span>Score</span>
      </div>
      {items.map((item) => (
        <details key={`${item.resourceType}-${item.resourceId}-${item.attemptId}`}>
          <summary style={{ ...rowStyle, cursor: 'pointer', listStylePosition: 'inside' }}>
            <strong style={{ color: '#1e293b' }}>{item.resourceTitle || 'QCM'}</strong>
            <span>{kind === 'blanc' ? item.subject || '—' : item.school || '—'}</span>
            <span>{kind === 'blanc' ? item.chapter || '—' : item.subject || '—'}</span>
            <span>{item.year || '—'}</span>
            <span>{item.correctAnswers}/{item.expectedQuestions || item.totalQuestions}</span>
            <strong style={{ color: Number(item.score) >= 50 ? '#059669' : '#dc2626' }}>{item.score}%</strong>
          </summary>
          <div style={{ padding: '8px 12px 14px 30px', background: '#f8fafc', borderBottom: '1px solid #eef2f7' }}>
            <div style={{ marginBottom: 8, color: '#64748b', fontSize: 11 }}>{new Date(item.answeredAt).toLocaleString('fr-FR')} · Tentative {item.attemptId}</div>
            {(item.answers || []).map((answer, index) => (
              <div key={`${answer.questionId}-${index}`} style={{ padding: '10px 0', borderTop: '1px solid #e2e8f0', fontSize: 12 }}>
                <strong style={{ color: '#1e293b' }}>{answer.questionNumber ? `Question ${answer.questionNumber}` : `Question ${index + 1}`} · {answer.correct ? 'Réponse correcte' : 'Erreur'}</strong>
                <div style={{ marginTop: 4, color: '#475569' }}>{answer.questionText}</div>
                {!answer.correct && <div style={{ marginTop: 5, color: '#b91c1c' }}>Votre réponse : {answer.selectedChoiceLabel} — {answer.selectedChoiceText || '—'}</div>}
                <div style={{ marginTop: 3, color: '#047857' }}>Bonne réponse : {answer.correctChoiceLabel} — {answer.correctChoiceText || '—'}</div>
                {answer.explanation && <details style={{ marginTop: 5, color: '#64748b' }}><summary>Correction</summary><p>{answer.explanation}</p></details>}
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>;

  return (
    <section style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 19, fontWeight: 800 }}>Mes concours</h2>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 12 }}>Résultats et historique détaillé enregistrés pour votre compte.</p>
        </div>
        <strong style={{ color: '#2563eb', fontSize: 12 }}>{filtered.length} tentative{filtered.length > 1 ? 's' : ''}</strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[[school, setSchool, 'Toutes les écoles', options.schools], [year, setYear, 'Toutes les années', options.years], [subject, setSubject, 'Toutes les matières', options.subjects], [chapter, setChapter, 'Tous les chapitres', options.chapters]].map(([selected, setter, label, values]) => (
          <select key={label} value={selected} onChange={(event) => setter(event.target.value)} aria-label={label} style={selectStyle}>
            <option value="all">{label}</option>{values.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        ))}
      </div>

      {loading ? <p style={{ color: '#64748b', fontSize: 13 }}>Chargement de vos résultats…</p>
        : error ? <p role="status" style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>
          : attempts.length === 0 ? <p style={{ color: '#64748b', fontSize: 13 }}>Vos concours apparaîtront ici dès qu’une réponse sera enregistrée.</p>
            : <>
              <h3 style={{ margin: '8px 0', color: '#1e293b', fontSize: 15 }}>Concours</h3>
              {renderAttempts(concours, 'concours')}
              <h3 style={{ margin: '22px 0 8px', color: '#1e293b', fontSize: 15 }}>Concours Blancs</h3>
              {renderAttempts(blancs, 'blanc')}
            </>}
    </section>
  );
}
