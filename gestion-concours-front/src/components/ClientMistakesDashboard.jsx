import React, { useMemo, useState } from 'react';
import MathContent from './MathContent';
import './ClientMistakesDashboard.css';

const questions = [
  {
    id: 1, source: 'Concours blanc · 1', date: '17/10/2026', time: '14:44:41', subject: 'math', chapter: 'les suite',
    question: String.raw`Question 7 : Si $\int_1^2 f'(x)f''(x) dx = 8$ et $f'(2) - f'(1) = 2$ alors $f'(2) + f'(1)$ est égal à :`,
    selected: String.raw`D - 10`, correct: String.raw`C - 8`,
    explanation: String.raw`On pose : $g(x) = f'(x)$
$\int_1^2 g(x) \cdot g'(x) dx = 8$
$\frac{1}{2} \int_1^2 2 \cdot g(x) \cdot g'(x) dx = 8 \iff [\frac{1}{2} g^2(x)]_1^2 = 8$
$\iff [\frac{1}{2} f'^2(x)]_1^2 = 8 \iff f'^2(2) - f'^2(1) = 16$
$\iff (f'(2) - f'(1))(f'(2) + f'(1)) = 16$
$\iff 2(f'(2) + f'(1)) = 16 \iff f'(2) + f'(1) = 8$`
  },
  {
    id: 2, source: 'Concours blanc · 1', date: '17/10/2026', time: '14:44:39', subject: 'math', chapter: 'les suite',
    question: String.raw`Question 6 : L'intégrale $\int_0^1 \frac{x}{1 + e^{-x^2}} dx$ est égale à :`,
    selected: String.raw`C - $\ln(1+e)$`, correct: String.raw`D - $\ln\sqrt{\frac{1+e}{2}}$`,
    explanation: String.raw`$=\int_0^1 \frac{x e^{x^2}}{e^{x^2}+1} dx = \frac{1}{2} \int_0^1 \frac{(e^{x^2}+1)'}{e^{x^2}+1} dx$
$=\frac{1}{2} [\ln|e^{x^2}+1|]_0^1 = \frac{1}{2}(\ln(e+1) - \ln(2)) = \frac{1}{2}\ln(\frac{e+1}{2})$`
  },
  {
    id: 3, source: 'Concours blanc · 1', date: '17/10/2026', time: '14:44:37', subject: 'math', chapter: 'les suite',
    question: String.raw`Question 5 : Si pour tout entier naturel $n$, $I_n = \int_1^e x(\ln x)^n dx$ alors $(\forall n \in \mathbb{N}^*) \, 2I_{n+1} + (n+1)I_n$ est égal à :`,
    selected: String.raw`C - 1`, correct: String.raw`B - $e^2$`,
    explanation: String.raw`$I_{n+1} = \int_1^e x \cdot \ln^{n+1}(x) dx$
Intégration par parties : $U(x) = \ln^{n+1}(x)$, $U'(x) = \frac{n+1}{x}\ln^n(x)$ ; $V'(x) = x$, $V(x) = \frac{x^2}{2}$.
$I_{n+1} = [\frac{x^2}{2}\ln^{n+1}(x)]_1^e - \frac{1}{2}(n+1)\int_1^e x \cdot \ln^n(x) dx$
$I_{n+1} = \frac{e^2}{2} - \frac{1}{2}(n+1)I_n$
$2I_{n+1} = e^2 - (n+1)I_n \implies 2I_{n+1} + (n+1)I_n = e^2$`.replace(/^\+/gm, '')
  },
  {
    id: 4, source: 'Concours blanc · 1', date: '17/10/2026', time: '14:44:33', subject: 'math', chapter: 'les suite',
    question: String.raw`Question 4 : L'intégrale $\int_0^3 \frac{x^2+2}{\sqrt{x^3+6x+4}} dx$ est égale à :`,
    selected: String.raw`B - $\frac{8}{3}$`, correct: String.raw`C - $\frac{10}{3}$`,
    explanation: String.raw`$\int_0^3 (x^2+2)(x^3+6x+4)^{-1/2} dx = \frac{1}{3} \int_0^3 (x^3+6x+4)'(x^3+6x+4)^{-1/2} dx$
$=\frac{1}{3} [\frac{(x^3+6x+4)^{1/2}}{1/2}]_0^3 = \frac{10}{3}$`.replace(/^\+/gm, '')
  },
  {
    id: 5, source: 'Concours blanc · 1', date: '17/10/2026', time: '14:44:32', subject: 'math', chapter: 'les suite',
    question: String.raw`Question 3 : Soit $\alpha \in \mathbb{R}^*$, si $\int_0^1 \frac{e^{\alpha x}}{1+e^{\alpha x}} dx = \frac{1}{\alpha}$ alors $\alpha$ est égal à :`,
    selected: String.raw`C - $\ln(2e+1)$`, correct: String.raw`D - $\ln(2e-1)$`,
    explanation: String.raw`$\frac{1}{\alpha} \int_0^1 \frac{(1+e^{\alpha x})'}{1+e^{\alpha x}} dx = \frac{1}{\alpha} \implies [\ln|1+e^{\alpha x}|]_0^1 = 1$
$\implies \ln(\frac{1+e^\alpha}{2}) = 1 \implies \alpha = \ln(2e-1)$`.replace(/^\+/gm, '')
  },
  {
    id: 6, source: 'Concours blanc · 1', date: '17/10/2026', time: '14:44:25', subject: 'math', chapter: 'les suite',
    question: String.raw`Question 1 : L'intégrale $\int_{\pi/6}^{\pi/4} \frac{1}{\sin x \tan x} dx$ est égale à :`,
    selected: String.raw`A - $\frac{1}{2} - \frac{\sqrt{2}}{2}$`, correct: String.raw`B - $2 - \sqrt{2}$`,
    explanation: String.raw`$\int_{\pi/6}^{\pi/4} \frac{\cos x}{\sin^2 x} dx = \int_{\pi/6}^{\pi/4} \sin'(x)\sin^{-2}(x) dx$
$= [-\frac{1}{\sin x}]_{\pi/6}^{\pi/4} = [\frac{1}{\sin x}]_{\pi/4}^{\pi/6} = 2 - \sqrt{2}$`.replace(/^\+/gm, '')
  }
];

const stats = [
  ['Erreurs', '11'], ['Participations', '2'], ['Questions répondues', '14'],
  ['Bonnes réponses', '3'], ['Score moyen', '21.4%'], ['Taux de réussite', '0%']
];

const isoWeekFor = (dateText) => {
  const [day, month, year] = dateText.split('/').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

export default function ClientMistakesDashboard() {
  const [isReviewing, setIsReviewing] = useState(false);
  const [type, setType] = useState('all');
  const [dateMode, setDateMode] = useState('week');
  const [week, setWeek] = useState('2026-W42');
  const [day, setDay] = useState('2026-10-17');
  const [subject, setSubject] = useState('all');
  const [chapter, setChapter] = useState('all');
  const [reviewed, setReviewed] = useState({});

  const filteredQuestions = useMemo(() => questions.filter((item) => {
    if (type === 'schools') return false;
    if (dateMode === 'week' && isoWeekFor(item.date) !== week) return false;
    if (dateMode === 'day') {
      const [d, m, y] = item.date.split('/');
      if (`${y}-${m}-${d}` !== day) return false;
    }
    if (subject !== 'all' && item.subject !== subject) return false;
    if (chapter !== 'all' && item.chapter !== chapter) return false;
    return true;
  }), [type, dateMode, week, day, subject, chapter]);
  const visibleStats = filteredQuestions.length
    ? stats
    : stats.map(([label], index) => [label, index >= 4 ? '0%' : '0']);

  return (
    <section className={`mistakes-dashboard${isReviewing ? ' is-fullscreen' : ''}`}>
      <header className="mistakes-header">
        <div>
          <p className="mistakes-eyebrow">Semaine 42, 2026 · 📐 math{type === 'blancs' ? ' · les suite' : ''}</p>
          <h2>Erreurs QCM à réviser</h2>
          <p>Erreurs des concours blancs et concours, conservées pour les revoir plus tard.</p>
        </div>
        <div className="mistakes-header-actions">
          <span className="mistakes-week-badge">Semaine 42, 2026</span>
          {isReviewing ? (
            <button className="mistakes-navigation-button secondary" type="button" onClick={() => setIsReviewing(false)}>← Retour</button>
          ) : (
            <button className="mistakes-navigation-button" type="button" onClick={() => setIsReviewing(true)}>Réviser</button>
          )}
        </div>
      </header>

      <div className="mistakes-filters" aria-label="Filtres des erreurs">
        <label>Type de concours
          <select value={type} onChange={(event) => { setType(event.target.value); setChapter('all'); }}>
            <option value="all">Tous</option>
            <option value="blancs">Concours Blancs</option>
            <option value="schools">Concours Écoles</option>
          </select>
        </label>
        <label>Période
          <select value={dateMode} onChange={(event) => setDateMode(event.target.value)}>
            <option value="week">Par semaine</option>
            <option value="day">Par date précise</option>
          </select>
        </label>
        {dateMode === 'week' ? (
          <label>Semaine<input type="week" value={week} onChange={(event) => setWeek(event.target.value)} /></label>
        ) : (
          <label>Date<input type="date" value={day} onChange={(event) => setDay(event.target.value)} /></label>
        )}
        <label>Matière
          <select value={subject} onChange={(event) => setSubject(event.target.value)}>
            <option value="all">Toutes les matières</option>
            <option value="math">math</option>
          </select>
        </label>
        {type === 'blancs' && (
          <label>Chapitre
            <select value={chapter} onChange={(event) => setChapter(event.target.value)}>
              <option value="all">Tous les chapitres</option>
              <option value="les suite">les suite</option>
            </select>
          </label>
        )}
      </div>

      <div className="mistakes-stats" aria-label="Statistiques">
        {visibleStats.map(([label, value]) => (
          <article className="mistakes-stat" key={label}><span>{label}</span><strong>{value}</strong></article>
        ))}
      </div>

      {isReviewing && (
        <>
          <div className="mistakes-list-heading">
            <div>
              <h3>📐 math <span>({filteredQuestions.length ? '11' : '0'} erreurs)</span></h3>
              {type === 'blancs' && <p>Chapitre : les suite</p>}
            </div>
            <span>{filteredQuestions.length} questions fournies</span>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="mistakes-empty">Aucune erreur ne correspond à ces filtres.</div>
          ) : (
            <div className="mistakes-cards">
              {filteredQuestions.map((item) => (
            <article className={`mistake-card${reviewed[item.id] ? ' is-reviewed' : ''}`} key={item.id}>
              <div className="mistake-card-meta">
                <div className="mistake-badges">
                  <span className="mistake-badge subject">📐 {item.subject}</span>
                  {item.source.startsWith('Concours blanc') && <span className="mistake-badge chapter">{item.chapter}</span>}
                  <span className="mistake-badge source">{item.source}</span>
                </div>
                <time>{item.date} {item.time}</time>
              </div>
              <p className="mistake-question"><MathContent>{item.question}</MathContent></p>
              <div className="mistake-answers">
                <div className="mistake-answer incorrect"><span>Votre reponse</span><strong><MathContent>{item.selected}</MathContent></strong></div>
                <div className="mistake-answer correct"><span>Bonne reponse</span><strong><MathContent>{item.correct}</MathContent></strong></div>
              </div>
              <details className="mistake-explanation">
                <summary>Explication</summary>
                <div><MathContent>{item.explanation}</MathContent></div>
              </details>
              <button
                className={`mistake-review-button${reviewed[item.id] ? ' is-reviewed' : ''}`}
                type="button"
                aria-pressed={Boolean(reviewed[item.id])}
                onClick={() => setReviewed((current) => ({ ...current, [item.id]: !current[item.id] }))}
              >
                {reviewed[item.id] ? '✓ Révisée' : 'Marquer révisée'}
              </button>
            </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
