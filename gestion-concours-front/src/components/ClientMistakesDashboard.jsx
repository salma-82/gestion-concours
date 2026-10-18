import React, { useMemo, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MathContent from './MathContent';
import { readStudentMistakes, markStudentMistakeReviewed, deleteStudentMistake } from '../studentProgress';
import './ClientMistakesDashboard.css';

const API_BASE = 'http://localhost:8081';

const isoWeekForDate = (d) => {
  if (!d || isNaN(d.getTime())) return '';
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

export default function ClientMistakesDashboard() {
  const [isReviewing, setIsReviewing] = useState(false);
  const [type, setType] = useState('all');
  const [dateMode, setDateMode] = useState('all'); // 'all' | 'week' | 'day'
  const [week, setWeek] = useState(() => isoWeekForDate(new Date()));
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [subject, setSubject] = useState('all');
  const [chapter, setChapter] = useState('all');
  const [reviewed, setReviewed] = useState({});
  const [rawMistakes, setRawMistakes] = useState(() => readStudentMistakes());
  const [loading, setLoading] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState('');

  let user = {};
  try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch {}
  const studentId = user?.id;

  // Charger les erreurs depuis le backend et localStorage
  const fetchMistakes = useCallback(async () => {
    const localItems = readStudentMistakes();
    if (!studentId) {
      setRawMistakes(localItems);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/student-mistakes`, {
        params: { studentId }
      });
      if (Array.isArray(res.data)) {
        // Fusionner backend et local pour ne rien perdre
        const dbItems = res.data.map(item => ({
          ...item,
          id: `db-${item.id}`,
          databaseId: item.id,
          source: item.sourceType || item.resourceTitle || 'QCM',
          occurredAt: item.createdAt || new Date().toISOString()
        }));

        // Combiner en évitant les doublons
        const combined = [...dbItems];
        localItems.forEach(loc => {
          const already = combined.some(c =>
            (c.databaseId && loc.databaseId && c.databaseId === loc.databaseId) ||
            (c.questionText && loc.questionText && c.questionText === loc.questionText)
          );
          if (!already) combined.push(loc);
        });

        setRawMistakes(combined);

        // Synchroniser reviewed state
        const revMap = {};
        combined.forEach(m => {
          if (m.reviewed) revMap[m.id] = true;
        });
        setReviewed(revMap);
      } else {
        setRawMistakes(localItems);
      }
    } catch (e) {
      console.warn('Impossible de charger les erreurs du serveur (mode local):', e);
      setRawMistakes(localItems);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchMistakes();

    const handleUpdate = () => fetchMistakes();
    window.addEventListener('student-mistakes-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('student-mistakes-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchMistakes]);

  // Normalisation des questions pour l'affichage
  const normalizedQuestions = useMemo(() => {
    return rawMistakes.map((item, idx) => {
      const dateObj = item.occurredAt || item.createdAt ? new Date(item.occurredAt || item.createdAt) : new Date();
      const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
      const dateStr = validDate.toLocaleDateString('fr-FR');
      const timeStr = validDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const isoDate = validDate.toISOString().slice(0, 10);
      const isoWeek = isoWeekForDate(validDate);

      const source = item.source || item.sourceType || item.resourceTitle || 'QCM';
      const subj = (item.subject || 'Mathématiques').trim();
      const chap = (item.chapter || '').trim();

      const selectedLabel = item.selectedChoiceLabel ? `${item.selectedChoiceLabel} - ` : '';
      const selectedText = item.selectedChoiceText || 'Réponse enregistrée';
      const correctLabel = item.correctChoiceLabel ? `${item.correctChoiceLabel} - ` : '';
      const correctText = item.correctChoiceText || 'Bonne réponse';

      return {
        id: item.id || `mistake-${idx}`,
        databaseId: item.databaseId || (/^\d+$/.test(String(item.id)) ? item.id : null),
        source,
        date: dateStr,
        time: timeStr,
        isoDate,
        isoWeek,
        subject: subj,
        chapter: chap,
        question: item.questionText || item.question || 'Énoncé de la question',
        selected: item.selected || `${selectedLabel}${selectedText}`,
        correct: item.correct || `${correctLabel}${correctText}`,
        explanation: item.explanation || 'Aucune explication détaillée disponible pour cette question.',
        reviewed: Boolean(reviewed[item.id] ?? item.reviewed)
      };
    });
  }, [rawMistakes, reviewed]);

  // Liste des matières uniques pour les filtres
  const availableSubjects = useMemo(() => {
    const set = new Set();
    normalizedQuestions.forEach(q => { if (q.subject) set.add(q.subject); });
    return Array.from(set);
  }, [normalizedQuestions]);

  // Liste des chapitres uniques pour la matière sélectionnée
  const availableChapters = useMemo(() => {
    const set = new Set();
    normalizedQuestions.forEach(q => {
      if ((subject === 'all' || q.subject.toLowerCase() === subject.toLowerCase()) && q.chapter) {
        set.add(q.chapter);
      }
    });
    return Array.from(set);
  }, [normalizedQuestions, subject]);

  // Filtrage des questions selon les sélections de l'étudiant
  const filteredQuestions = useMemo(() => {
    return normalizedQuestions.filter((item) => {
      // Filtre par type
      if (type === 'blancs' && !item.source.toLowerCase().includes('blanc')) return false;
      if (type === 'schools' && item.source.toLowerCase().includes('blanc')) return false;

      // Filtre de période
      if (dateMode === 'week' && item.isoWeek !== week) return false;
      if (dateMode === 'day' && item.isoDate !== day) return false;

      // Filtre par matière
      if (subject !== 'all' && item.subject.toLowerCase() !== subject.toLowerCase()) return false;

      // Filtre par chapitre
      if (chapter !== 'all' && item.chapter.toLowerCase() !== chapter.toLowerCase()) return false;

      return true;
    });
  }, [normalizedQuestions, type, dateMode, week, day, subject, chapter]);

  // Statistiques calculées dynamiquement
  const statsList = useMemo(() => {
    const total = filteredQuestions.length;
    const reviewedCount = filteredQuestions.filter(q => reviewed[q.id] || q.reviewed).length;
    const remaining = total - reviewedCount;
    const reviewRate = total > 0 ? Math.round((reviewedCount / total) * 100) : 0;
    const subjectsCount = new Set(filteredQuestions.map(q => q.subject)).size;

    return [
      ['Erreurs sauvegardées', String(total)],
      ['À réviser', String(remaining)],
      ['Questions révisées', String(reviewedCount)],
      ['Taux de révision', `${reviewRate}%`],
      ['Matières concernées', String(subjectsCount)],
      ['Taux de réussite', reviewRate >= 80 ? '80%+' : `${reviewRate}%`]
    ];
  }, [filteredQuestions, reviewed]);

  // Basculer l'état révisée
  const handleToggleReviewed = async (id) => {
    const nextReviewed = !reviewed[id];
    setReviewed(current => ({ ...current, [id]: nextReviewed }));
    markStudentMistakeReviewed(id, nextReviewed);

    const cleanId = String(id).replace(/^db-/, '');
    if (/^\d+$/.test(cleanId) && studentId) {
      try {
        await axios.patch(`${API_BASE}/api/student-mistakes/${cleanId}/reviewed`, { reviewed: nextReviewed }, {
          params: { studentId }
        });
      } catch (err) {
        console.warn('Erreur mise à jour révisée sur le serveur:', err);
      }
    }
  };

  // Côté étudiant : Supprimer de mes erreurs
  const handleDeleteMistake = async (id) => {
    if (!window.confirm('Voulez-vous retirer cette question de vos erreurs sauvegardées ?')) {
      return;
    }

    try {
      await deleteStudentMistake(id, studentId);
      setRawMistakes(prev => prev.filter(item => item.id !== id && `db-${item.databaseId}` !== id));
      setDeleteNotice('✓ Question retirée de vos erreurs.');
      setTimeout(() => setDeleteNotice(''), 3000);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'erreur:', err);
    }
  };

  return (
    <section className={`mistakes-dashboard${isReviewing ? ' is-fullscreen' : ''}`}>
      <header className="mistakes-header">
        <div>
          <p className="mistakes-eyebrow">
            🎯 Révision QCM · {subject !== 'all' ? subject : 'Toutes les matières'}{chapter !== 'all' ? ` · ${chapter}` : ''}
          </p>
          <h2>Erreurs QCM à réviser</h2>
          <p>Questions enregistrées lors de vos QCM pour vous entraîner et les maîtriser définitivement.</p>
        </div>
        <div className="mistakes-header-actions">
          {deleteNotice && (
            <span style={{ color: '#059669', fontSize: '12px', fontWeight: 700, padding: '6px 12px', background: '#ecfdf5', borderRadius: '8px' }}>
              {deleteNotice}
            </span>
          )}
          <span className="mistakes-week-badge">
            {filteredQuestions.length} erreur{filteredQuestions.length > 1 ? 's' : ''}
          </span>
          {isReviewing ? (
            <button className="mistakes-navigation-button secondary" type="button" onClick={() => setIsReviewing(false)}>← Retour</button>
          ) : (
            <button className="mistakes-navigation-button" type="button" onClick={() => setIsReviewing(true)}>
              Réviser mes erreurs ({filteredQuestions.length})
            </button>
          )}
        </div>
      </header>

      {/* Filtres des erreurs */}
      <div className="mistakes-filters" aria-label="Filtres des erreurs">
        <label>Type de concours
          <select value={type} onChange={(event) => { setType(event.target.value); setChapter('all'); }}>
            <option value="all">Tous les concours</option>
            <option value="blancs">Concours Blancs</option>
            <option value="schools">Concours Écoles</option>
          </select>
        </label>
        <label>Période
          <select value={dateMode} onChange={(event) => setDateMode(event.target.value)}>
            <option value="all">Toutes les dates</option>
            <option value="week">Par semaine</option>
            <option value="day">Par date précise</option>
          </select>
        </label>
        {dateMode === 'week' && (
          <label>Semaine<input type="week" value={week} onChange={(event) => setWeek(event.target.value)} /></label>
        )}
        {dateMode === 'day' && (
          <label>Date<input type="date" value={day} onChange={(event) => setDay(event.target.value)} /></label>
        )}
        <label>Matière
          <select value={subject} onChange={(event) => { setSubject(event.target.value); setChapter('all'); }}>
            <option value="all">Toutes les matières</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            {availableSubjects.length === 0 && (
              <>
                <option value="Mathématiques">Mathématiques</option>
                <option value="Physique-Chimie">Physique-Chimie</option>
                <option value="SVT">SVT</option>
              </>
            )}
          </select>
        </label>
        <label>Chapitre
          <select value={chapter} onChange={(event) => setChapter(event.target.value)}>
            <option value="all">Tous les chapitres</option>
            {availableChapters.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Statistiques dynamiques */}
      <div className="mistakes-stats" aria-label="Statistiques">
        {statsList.map(([label, value]) => (
          <article className="mistakes-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      {/* Liste des cartes d'erreurs en mode révision ou aperçu */}
      {isReviewing ? (
        <>
          <div className="mistakes-list-heading">
            <div>
              <h3>
                📚 {subject !== 'all' ? subject : 'Toutes les matières'} <span>({filteredQuestions.length} question{filteredQuestions.length > 1 ? 's' : ''})</span>
              </h3>
              {chapter !== 'all' && <p>Chapitre : {chapter}</p>}
            </div>
            <span>{filteredQuestions.length} question(s) trouvée(s)</span>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="mistakes-empty">
              {loading ? 'Chargement de vos erreurs...' : 'Aucune erreur ne correspond à ces filtres. Utilisez le bouton « Sauvegarder mes erreurs » lors d\'un QCM pour les ajouter.'}
            </div>
          ) : (
            <div className="mistakes-cards">
              {filteredQuestions.map((item) => (
                <article className={`mistake-card${reviewed[item.id] ? ' is-reviewed' : ''}`} key={item.id}>
                  <div className="mistake-card-meta">
                    <div className="mistake-badges">
                      <span className="mistake-badge subject">📐 {item.subject}</span>
                      {item.chapter && <span className="mistake-badge chapter">{item.chapter}</span>}
                      <span className="mistake-badge source">{item.source}</span>
                    </div>
                    <time>{item.date} {item.time}</time>
                  </div>

                  <p className="mistake-question">
                    <MathContent>{item.question}</MathContent>
                  </p>

                  <div className="mistake-answers">
                    <div className="mistake-answer incorrect">
                      <span>Votre réponse</span>
                      <strong><MathContent>{item.selected}</MathContent></strong>
                    </div>
                    <div className="mistake-answer correct">
                      <span>Bonne réponse</span>
                      <strong><MathContent>{item.correct}</MathContent></strong>
                    </div>
                  </div>

                  <details className="mistake-explanation">
                    <summary>Explication & Corrigé</summary>
                    <div><MathContent>{item.explanation}</MathContent></div>
                  </details>

                  <div className="mistake-card-actions">
                    <button
                      className={`mistake-review-button${reviewed[item.id] ? ' is-reviewed' : ''}`}
                      type="button"
                      aria-pressed={Boolean(reviewed[item.id])}
                      onClick={() => handleToggleReviewed(item.id)}
                    >
                      {reviewed[item.id] ? '✓ Révisée' : 'Marquer révisée'}
                    </button>

                    {/* Bouton demandé : « Supprimer de mes erreurs » pour retirer une question une fois maîtrisée */}
                    <button
                      className="mistake-delete-button"
                      type="button"
                      title="Retirer définitivement cette question une fois maîtrisée"
                      onClick={() => handleDeleteMistake(item.id)}
                    >
                      🗑️ Supprimer de mes erreurs
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        filteredQuestions.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px'
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                Vous avez {filteredQuestions.length} question(s) enregistrée(s) dans votre carnet d'erreurs
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Consultez la correction détaillée, cochez les questions révisées ou supprimez celles que vous maîtrisez.
              </div>
            </div>
            <button
              className="mistakes-navigation-button"
              type="button"
              onClick={() => setIsReviewing(true)}
            >
              Ouvrir la révision ({filteredQuestions.length}) →
            </button>
          </div>
        )
      )}
    </section>
  );
}
