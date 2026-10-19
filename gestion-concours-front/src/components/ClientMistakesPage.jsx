import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import MathContent from './MathContent';
import { readStudentMistakes, deleteStudentMistake } from '../studentProgress';

const API_BASE = 'http://localhost:8081';
const isBlanc = (type) => String(type || '').toLowerCase().includes('blanc');
const groupKey = (item) => `${item.resourceType || item.sourceType || ''}|${item.resourceId}|${item.attemptId || ''}`;
const dateLabel = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '—';

export default function ClientMistakesPage() {
  const [params] = useSearchParams();
  const view = params.get('view') === 'saved' ? 'saved' : 'all';
  const [category, setCategory] = useState('blanc');
  const [attempts, setAttempts] = useState([]);
  const [savedMistakes, setSavedMistakes] = useState(() => readStudentMistakes().filter((item) => item.savedForReview));
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);

  const loadData = useCallback(async () => {
    let id = null;
    try { id = JSON.parse(localStorage.getItem('user') || '{}')?.id ?? null; } catch {}
    setStudentId(id);
    if (!id) {
      setAttempts([]);
      setSavedMistakes(readStudentMistakes().filter((item) => item.savedForReview));
      setLoading(false);
      return;
    }
    setLoading(true);
    const [historyResult, savedResult] = await Promise.allSettled([
      axios.get(`${API_BASE}/api/qcm/mes-concours`, { params: { studentId: id } }),
      axios.get(`${API_BASE}/api/student-mistakes`, { params: { studentId: id } })
    ]);
    setAttempts(historyResult.status === 'fulfilled' && Array.isArray(historyResult.value.data?.attempts)
      ? historyResult.value.data.attempts : []);
    const savedFromDb = savedResult.status === 'fulfilled' && Array.isArray(savedResult.value.data)
      ? savedResult.value.data.map((item) => ({ ...item, sourceType: item.sourceType, savedForReview: true })) : [];
    const savedLocal = readStudentMistakes().filter((item) => item.savedForReview);
    const merged = [...savedFromDb];
    savedLocal.forEach((local) => {
      const found = merged.some((item) => String(item.resourceId) === String(local.resourceId)
        && String(item.attemptId || '') === String(local.attemptId || '')
        && String(item.questionId || '') === String(local.questionId || ''));
      if (!found) merged.push(local);
    });
    setSavedMistakes(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('student-mistakes-updated', loadData);
    window.addEventListener('student-qcm-history-updated', loadData);
    return () => {
      window.removeEventListener('student-mistakes-updated', loadData);
      window.removeEventListener('student-qcm-history-updated', loadData);
    };
  }, [loadData]);

  const latestAttempts = useMemo(() => {
    const latest = new Map();
    attempts.forEach((attempt) => {
      const key = `${attempt.resourceType}|${attempt.resourceId}`;
      const previous = latest.get(key);
      if (!previous || new Date(attempt.answeredAt) > new Date(previous.answeredAt)) latest.set(key, attempt);
    });
    return [...latest.values()].sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt));
  }, [attempts]);

  const errorAttempts = latestAttempts
    .filter((attempt) => isBlanc(attempt.resourceType) === (category === 'blanc'))
    .map((attempt) => ({ ...attempt, errors: (attempt.answers || []).filter((answer) => !answer.correct) }))
    .filter((attempt) => attempt.errors.length > 0);

  const savedGroups = useMemo(() => {
    const groups = new Map();
    savedMistakes.filter((item) => item.savedForReview !== false).forEach((item) => {
      const key = groupKey(item);
      if (!groups.has(key)) groups.set(key, { key, resourceType: item.sourceType || item.resourceType, resourceId: item.resourceId, resourceTitle: item.resourceTitle, school: item.school, subject: item.subject, chapter: item.chapter, year: item.year, attemptId: item.attemptId, savedAt: item.createdAt || item.occurredAt, errors: [] });
      groups.get(key).errors.push(item);
    });
    return [...groups.values()].sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
  }, [savedMistakes]);

  const attemptForGroup = (group) => attempts.find((attempt) => String(attempt.resourceId) === String(group.resourceId)
    && String(attempt.attemptId || '') === String(group.attemptId || '')
    && (group.resourceType ? String(attempt.resourceType) === String(group.resourceType) : true));

  const removeSavedError = async (error) => {
    await deleteStudentMistake(error.id || error.databaseId, studentId);
    setSavedMistakes((items) => items.filter((item) => item.id !== error.id && item.databaseId !== error.databaseId));
  };

  const page = { minHeight: '100%', padding: '24px 28px 40px', background: '#f3f6fb', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" };
  const panel = { maxWidth: 1380, margin: '0 auto', overflow: 'hidden', background: '#fff', border: '1px solid #dbeafe', borderRadius: 18, boxShadow: '0 3px 14px rgba(37,99,235,.04)' };
  const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, padding: '20px 24px', background: 'linear-gradient(100deg,#f8fbff,#eef6ff)', borderBottom: '1px solid #dbeafe' };
  const tableWrap = { overflowX: 'auto', padding: '0 14px 14px' };
  const table = { width: '100%', minWidth: 880, borderCollapse: 'separate', borderSpacing: '0 5px', fontSize: 12 };
  const th = { padding: '11px 10px', textAlign: 'left', color: '#2563eb', background: '#eff6ff', fontWeight: 750, whiteSpace: 'nowrap' };
  const td = { padding: '12px 10px', color: '#475569', borderTop: '1px solid #e7effa', borderBottom: '1px solid #e7effa', background: '#fff', verticalAlign: 'middle' };
  const blueAction = { border: 0, borderRadius: 9, padding: '8px 13px', background: '#1769f5', color: '#fff', fontSize: 12, fontWeight: 750, cursor: 'pointer', whiteSpace: 'nowrap' };
  const segmented = { display: 'flex', padding: 4, gap: 4, border: '1px solid #dbeafe', borderRadius: 999, background: '#fff' };

  return (
    <main style={page}>
      <section style={panel}>
        <header style={header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: '50%', color: '#fff', background: '#2875f5', fontSize: 25 }} aria-hidden="true">{view === 'saved' ? '▣' : '◎'}</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 850 }}>{view === 'saved' ? 'Erreurs sauvegardées' : 'Mes erreurs'}</h1>
              <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: 12 }}>{view === 'saved' ? 'Uniquement les questions que vous avez sauvegardées manuellement.' : 'Les erreurs de la dernière tentative de chaque QCM, actualisées automatiquement.'}</p>
            </div>
          </div>
          {view === 'all' && (
            <div style={segmented} role="group" aria-label="Filtrer par type de concours">
              {[["blanc", 'Concours Blancs'], ["concours", 'Concours']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setCategory(value)} aria-pressed={category === value} style={{ border: 0, borderRadius: 999, padding: '10px 18px', color: category === value ? '#fff' : '#2563eb', background: category === value ? '#1769f5' : 'transparent', fontWeight: 750, fontSize: 12, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          )}
        </header>

        <div style={{ padding: '16px 18px 6px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 14, color: '#1e3a8a' }}>{view === 'saved' ? 'Mes erreurs sauvegardées' : 'Erreurs par QCM'}</h2>
        </div>
        {loading ? <p style={{ padding: '10px 24px 24px', color: '#64748b', fontSize: 13 }}>Chargement…</p> : view === 'saved' ? (
          savedGroups.length === 0 ? <p style={{ padding: '8px 24px 24px', color: '#64748b', fontSize: 13 }}>Aucune erreur sauvegardée manuellement pour le moment.</p> : (
            <div style={tableWrap}><table style={table}><thead><tr>{['QCM', 'École / Concours', 'Matière', 'Chapitre', 'Date de sauvegarde', 'Score', 'Action'].map((label) => <th key={label} style={th}>{label}</th>)}</tr></thead>
              <tbody>{savedGroups.map((group) => {
                const attempt = attemptForGroup(group);
                return <React.Fragment key={group.key}>
                  <tr>
                    <td style={{ ...td, fontWeight: 800, color: '#1e3a8a' }}>{group.resourceTitle || 'QCM'}</td>
                    <td style={td}>{isBlanc(group.resourceType) ? 'Concours Blanc' : group.school || 'Concours'}</td>
                    <td style={td}>{group.subject || '—'}</td>
                    <td style={td}>{group.chapter || '—'}</td>
                    <td style={td}>{dateLabel(group.savedAt)}</td>
                    <td style={{ ...td, fontWeight: 800 }}>{attempt ? `${attempt.correctAnswers}/${attempt.expectedQuestions || attempt.totalQuestions}` : '—'}</td>
                    <td style={td}><button type="button" onClick={() => setExpanded((state) => ({ ...state, [group.key]: !state[group.key] }))} style={blueAction}>{expanded[group.key] ? 'Fermer' : 'Réviser'} · {group.errors.length}</button></td>
                  </tr>
                  {expanded[group.key] && group.errors.map((error, index) => <tr key={error.id || error.databaseId || `${group.key}-${index}`}><td colSpan="7" style={{ ...td, background: '#f8fbff', padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>Question {error.questionNumber || index + 1}</strong><button type="button" onClick={() => removeSavedError(error)} style={{ border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px', color: '#dc2626', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Retirer</button></div>
                    <div style={{ marginTop: 8 }}><MathContent>{error.questionText}</MathContent></div><p style={{ color: '#b91c1c' }}>Votre réponse : <MathContent>{`${error.selectedChoiceLabel || ''} ${error.selectedChoiceText || ''}`}</MathContent></p><p style={{ color: '#047857' }}>Bonne réponse : <MathContent>{`${error.correctChoiceLabel || ''} ${error.correctChoiceText || ''}`}</MathContent></p>{error.explanation && <details><summary>Correction</summary><MathContent>{error.explanation}</MathContent></details>}
                  </td></tr>)}
                </React.Fragment>;
              })}</tbody>
            </table></div>
          )
        ) : errorAttempts.length === 0 ? <p style={{ padding: '8px 24px 24px', color: '#64748b', fontSize: 13 }}>Aucune erreur dans la dernière tentative de ces QCM.</p> : (
          <div style={tableWrap}><table style={table}><thead><tr>{['QCM', 'École / Concours', 'Matière', 'Chapitre', 'Date de dernière tentative', 'Erreurs', 'Score', 'Action'].map((label) => <th key={label} style={th}>{label}</th>)}</tr></thead>
            <tbody>{errorAttempts.map((attempt) => {
              const key = `${attempt.resourceType}|${attempt.resourceId}`;
              return <React.Fragment key={key}>
                <tr>
                  <td style={{ ...td, fontWeight: 800, color: '#1e3a8a' }}>{attempt.resourceTitle || 'QCM'}</td>
                  <td style={td}>{isBlanc(attempt.resourceType) ? 'Concours Blanc' : attempt.school || 'Concours'}</td>
                  <td style={td}>{attempt.subject || '—'}</td><td style={td}>{attempt.chapter || '—'}</td><td style={td}>{dateLabel(attempt.answeredAt)}</td>
                  <td style={{ ...td, color: '#dc2626', fontWeight: 800 }}>{attempt.errors.length}</td>
                  <td style={{ ...td, fontWeight: 800, color: Number(attempt.score) >= 50 ? '#059669' : '#dc2626' }}>{attempt.correctAnswers}/{attempt.expectedQuestions || attempt.totalQuestions}</td>
                  <td style={td}><button type="button" onClick={() => setExpanded((state) => ({ ...state, [key]: !state[key] }))} style={blueAction}>{expanded[key] ? 'Fermer' : 'Réviser'}</button></td>
                </tr>
                {expanded[key] && attempt.errors.map((error, index) => <tr key={`${key}-${error.questionId}`}><td colSpan="8" style={{ ...td, background: '#f8fbff', padding: 16 }}>
                  <strong>Question {error.questionNumber || index + 1}</strong><div style={{ marginTop: 8 }}><MathContent>{error.questionText}</MathContent></div><p style={{ color: '#b91c1c' }}>Votre réponse : <MathContent>{`${error.selectedChoiceLabel || ''} ${error.selectedChoiceText || ''}`}</MathContent></p><p style={{ color: '#047857' }}>Bonne réponse : <MathContent>{`${error.correctChoiceLabel || ''} ${error.correctChoiceText || ''}`}</MathContent></p>{error.explanation && <details><summary>Correction</summary><MathContent>{error.explanation}</MathContent></details>}
                </td></tr>)}
              </React.Fragment>;
            })}</tbody>
          </table></div>
        )}
      </section>
    </main>
  );
}
