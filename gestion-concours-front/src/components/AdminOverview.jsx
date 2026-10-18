import React from 'react';
import './AdminOverview.css';

const formatMeta = (item) => [item.matiere, item.ecole, item.annee].filter(Boolean).join(' · ');

export default function AdminOverview({
  requests = [], users = [], contests = [], whiteContests = [], exams = [], courses = [], resumes = [],
  studentMistakesCount = 0, loading = false, onNavigate
}) {
  const cards = [
    { label: 'Utilisateurs', value: users.length, icon: '👥', tone: 'blue', tab: 'users', note: 'Comptes enregistrés' },
    { label: 'Demandes en attente', value: requests.length, icon: '📩', tone: 'amber', tab: 'demandes', note: 'À traiter' },
    { label: 'Concours', value: contests.length, icon: '🏆', tone: 'violet', tab: 'realConcours', note: 'Épreuves publiées' },
    { label: 'Concours blancs', value: whiteContests.length, icon: '📝', tone: 'cyan', tab: 'concours', note: 'QCM et entraînements' },
    { label: 'Examens nationaux', value: exams.length, icon: '🎓', tone: 'green', tab: 'examens', note: 'Sujets disponibles' },
    { label: 'Cours BAC', value: courses.length, icon: '📚', tone: 'rose', tab: 'coursBac', note: 'Cours publiés' },
    { label: 'Erreurs Étudiants', value: studentMistakesCount, icon: '❌', tone: 'amber', tab: 'studentMistakes', note: 'Questions sauvegardées' }
  ];

  const distribution = [
    { label: 'Concours', value: contests.length, color: '#7c3aed' },
    { label: 'Concours blancs', value: whiteContests.length, color: '#0891b2' },
    { label: 'Examens nationaux', value: exams.length, color: '#059669' },
    { label: 'Cours BAC', value: courses.length, color: '#e11d48' },
    { label: 'Résumés & astuces', value: resumes.length, color: '#d97706' }
  ];
  const maxDistribution = Math.max(1, ...distribution.map((item) => item.value));

  const recentItems = [
    ...contests.map((item) => ({ ...item, kind: 'Concours', icon: '🏆', tone: 'violet' })),
    ...whiteContests.map((item) => ({ ...item, kind: 'Concours blanc', icon: '📝', tone: 'cyan' })),
    ...exams.map((item) => ({ ...item, kind: 'Examen national', icon: '🎓', tone: 'green' })),
    ...courses.map((item) => ({ ...item, kind: 'Cours BAC', icon: '📚', tone: 'rose' })),
    ...resumes.map((item) => ({ ...item, kind: 'Résumé', icon: '💡', tone: 'amber' }))
  ].sort((a, b) => Number(b.id || 0) - Number(a.id || 0)).slice(0, 6);

  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const totalResources = contests.length + whiteContests.length + exams.length + courses.length + resumes.length;

  return (
    <div className="admin-overview">
      <header className="admin-overview-hero">
        <div>
          <span className="admin-overview-eyebrow">ESPACE ADMINISTRATEUR</span>
          <h1>Dashboard</h1>
          <p>Vue d’ensemble de votre plateforme et de ses contenus.</p>
        </div>
        <div className="admin-overview-date"><span>AUJOURD’HUI</span><strong>{today}</strong></div>
      </header>

      {loading && <div className="admin-overview-loading"><span className="admin-overview-spinner" /> Actualisation des données…</div>}

      <section className="admin-overview-metrics" aria-label="Indicateurs principaux">
        {cards.map((card) => (
          <button className="admin-metric-card" key={card.label} type="button" onClick={() => onNavigate?.(card.tab)}>
            <span className={`admin-metric-icon ${card.tone}`}>{card.icon}</span>
            <span className="admin-metric-label">{card.label}</span>
            <strong className="admin-metric-value">{card.value}</strong>
            <span className="admin-metric-note">{card.note}</span>
            <span className="admin-metric-link">Ouvrir la section <span aria-hidden="true">→</span></span>
          </button>
        ))}
      </section>

      <section className="admin-overview-lower">
        <article className="admin-overview-panel admin-distribution-panel">
          <div className="admin-panel-heading">
            <div><span className="admin-panel-kicker">CONTENUS</span><h2>Ressources publiées</h2></div>
            <span className="admin-panel-total">{totalResources} au total</span>
          </div>
          <div className="admin-distribution-list">
            {distribution.map((item) => (
              <div className="admin-distribution-row" key={item.label}>
                <div className="admin-distribution-label"><span>{item.label}</span><strong>{item.value}</strong></div>
                <div className="admin-distribution-track"><span style={{ width: `${item.value ? Math.max(4, (item.value / maxDistribution) * 100) : 0}%`, background: item.color }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-overview-panel admin-recent-panel">
          <div className="admin-panel-heading">
            <div><span className="admin-panel-kicker">MISE À JOUR</span><h2>Derniers contenus</h2></div>
            <button className="admin-text-button" type="button" onClick={() => onNavigate?.('realConcours')}>Voir les contenus</button>
          </div>
          {recentItems.length ? (
            <div className="admin-recent-list">
              {recentItems.map((item, index) => (
                <div className="admin-recent-item" key={`${item.kind}-${item.id ?? index}`}>
                  <span className={`admin-recent-icon ${item.tone}`}>{item.icon}</span>
                  <div className="admin-recent-copy"><strong>{item.titre || item.title || item.nom || item.kind}</strong><span>{formatMeta(item) || item.kind}</span></div>
                  <span className="admin-recent-kind">{item.kind}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-overview-empty"><span>📂</span><strong>Aucun contenu pour le moment</strong><p>Les nouvelles ressources apparaîtront ici.</p></div>
          )}
        </article>
      </section>

      <section className="admin-quick-actions">
        <div><span className="admin-panel-kicker">ACCÈS RAPIDE</span><h2>Gérer la plateforme</h2></div>
        <div className="admin-quick-action-buttons">
          <button type="button" onClick={() => onNavigate?.('demandes')}>📩 Traiter les demandes</button>
          <button type="button" onClick={() => onNavigate?.('realConcours')}>🏆 Gérer les concours</button>
        </div>
      </section>
    </div>
  );
}
