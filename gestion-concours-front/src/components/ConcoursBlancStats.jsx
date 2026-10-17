import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:8081';
const SUBJECTS = ['Mathématiques', 'Physique-Chimie', 'SVT'];

export default function ConcoursBlancStats() {
  const [concours, setConcours] = useState([]);
  const [matiere, setMatiere] = useState('');
  const [chapitre, setChapitre] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    axios.get(`${API}/api/concours-blancs`, { withCredentials: true })
      .then(({ data }) => setConcours(Array.isArray(data) ? data : []))
      .catch(() => setError('Impossible de charger la liste des Concours Blancs.'));
  }, []);

  const chapters = useMemo(() => [...new Set(concours
    .filter((item) => !matiere || item.matiere === matiere)
    .map((item) => item.chapitre).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')), [concours, matiere]);

  useEffect(() => {
    setLoading(true);
    setError('');
    axios.get(`${API}/api/qcm/concours-blancs/stats`, {
      params: { ...(matiere && { matiere }), ...(chapitre && { chapitre }) },
      withCredentials: true
    }).then(({ data }) => setStats(data))
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
  }, [matiere, chapitre, refresh]);

  const panel = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 };
  const muted = { color: '#64748b', fontSize: 13 };
  const percent = (value) => `${Number(value || 0).toLocaleString('fr-FR')} %`;

  return (
    <section style={{ display: 'grid', gap: 18 }}>
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: 23 }}>Statistiques des Concours Blancs</h2>
            <p style={{ ...muted, margin: '6px 0 0' }}>Résultats calculés à partir des réponses enregistrées dans la base.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setRefresh((value) => value + 1)} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 12px', background: '#fff', cursor: 'pointer' }}>Actualiser</button>
            <button onClick={() => { setMatiere(''); setChapitre(''); }} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 12px', background: '#fff', cursor: 'pointer' }}>Réinitialiser</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginTop: 18 }}>
          <label style={{ display: 'grid', gap: 6, color: '#475569', fontSize: 12, fontWeight: 700 }}>MATIÈRE
            <select value={matiere} onChange={(event) => { setMatiere(event.target.value); setChapitre(''); }} style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#0f172a' }}>
              <option value="">Toutes les matières</option>
              {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6, color: '#475569', fontSize: 12, fontWeight: 700 }}>CHAPITRE
            <select value={chapitre} onChange={(event) => setChapitre(event.target.value)} style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#0f172a' }}>
              <option value="">Tous les chapitres</option>
              {chapters.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>

      {error && <div role="alert" style={{ ...panel, color: '#b91c1c', background: '#fef2f2' }}>{error}</div>}
      {loading ? <div style={panel}>Chargement des statistiques…</div> : stats && <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 14 }}>
          {[
            ['QCM', stats.totalQcm], ['Questions', stats.totalQuestions], ['Participations', stats.participations],
            ['Score moyen', percent(stats.averageScore)], ['Taux de réussite', percent(stats.successRate)]
          ].map(([label, value]) => <article key={label} style={{ ...panel, padding: 18 }}>
            <div style={{ ...muted, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 27, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>{value}</div>
          </article>)}
        </div>

        {!stats.hasResults && <div style={{ ...panel, textAlign: 'center', color: '#475569' }}>Aucune réponse enregistrée pour ces filtres. Les statistiques apparaîtront à mesure que les élèves répondent aux QCM suivis.</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <article style={panel}>
            <h3 style={{ margin: '0 0 14px', color: '#0f172a' }}>Questions les plus difficiles</h3>
            {stats.hardestQuestions?.length ? stats.hardestQuestions.map((item, index) => <div key={`${item.titre}-${item.questionNumber}-${index}`} style={{ borderTop: '1px solid #e2e8f0', padding: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, fontWeight: 700 }}><span>{item.titre} · Q{item.questionNumber || '—'}</span><span style={{ color: '#b91c1c' }}>{percent(item.errorRate)} d’erreurs</span></div>
              <p style={{ ...muted, margin: '6px 0' }}>{item.questionText || 'Énoncé non disponible'}</p>
              <div style={muted}>{item.matiere}{item.chapitre ? ` · ${item.chapitre}` : ''} · {item.responses} réponse(s)</div>
            </div>) : <p style={muted}>Les questions difficiles apparaîtront avec les premières réponses.</p>}
          </article>
          <article style={panel}>
            <h3 style={{ margin: '0 0 14px', color: '#0f172a' }}>Erreurs fréquentes</h3>
            {stats.frequentErrors?.length ? stats.frequentErrors.map((item, index) => <div key={`${item.titre}-${item.questionNumber}-${item.selectedChoiceLabel}-${index}`} style={{ borderTop: '1px solid #e2e8f0', padding: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, fontWeight: 700 }}><span>{item.titre} · Q{item.questionNumber || '—'} · Choix {item.selectedChoiceLabel}</span><span style={{ color: '#b91c1c' }}>{item.responses} fois</span></div>
              <p style={{ ...muted, margin: '6px 0' }}>{item.selectedChoiceText || item.questionText || 'Réponse incorrecte'}</p>
              <div style={muted}>{item.matiere}{item.chapitre ? ` · ${item.chapitre}` : ''}</div>
            </div>) : <p style={muted}>Aucune erreur n’a encore été enregistrée.</p>}
          </article>
        </div>
      </>}
    </section>
  );
}
