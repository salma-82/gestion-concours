import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDemoContent.css';

const CATEGORIES = [
  {
    id: 'examens-nationaux',
    label: 'Examens nationaux',
    icon: '🎓',
    endpoint: '/api/examens-nationaux',
    rule: 'Un seul examen autorisé par option (ex: SM-A, SM-B, PC, SVT...).',
    groupName: 'Option / Filière',
    getGroup: (item) => item.optionBac || item.ecole || item.matiere || 'Général',
    getTitle: (item) => item.titre || `Session ${item.session || ''} ${item.annee || ''} - ${item.matiere || ''}`
  },
  {
    id: 'cours-bac',
    label: 'Cours',
    icon: '📖',
    endpoint: '/api/cours-bac',
    rule: 'Un seul cours autorisé par option / filière.',
    groupName: 'Filière / Option',
    getGroup: (item) => item.filiere || item.matiere || 'Général',
    getTitle: (item) => item.titre || item.chapitre || `Cours #${item.id}`
  },
  {
    id: 'concours',
    label: 'Concours',
    icon: '🏆',
    endpoint: '/api/concours',
    rule: 'Un seul concours autorisé par école (ex: ENSA, ENSAM...).',
    groupName: 'École',
    getGroup: (item) => item.ecole || 'Général',
    getTitle: (item) => item.titre || `Concours ${item.ecole || ''} ${item.annee || ''} - ${item.matiere || ''}`
  },
  {
    id: 'concours-blancs',
    label: 'Concours blancs',
    icon: '📝',
    endpoint: '/api/concours-blancs',
    rule: 'Sélection libre : choisissez les concours blancs accessibles gratuitement.',
    groupName: 'Matière',
    getGroup: (item) => item.matiere || 'Général',
    getTitle: (item) => item.titre || item.description || `Concours Blanc #${item.id}`
  },
  {
    id: 'resumes',
    label: 'Résumés',
    icon: '💡',
    endpoint: '/api/resumes',
    rule: 'Un seul résumé autorisé par matière (Mathématiques, Physique, SVT...).',
    groupName: 'Matière',
    getGroup: (item) => item.matiere || 'Général',
    getTitle: (item) => item.titre || item.chapitre || `Résumé #${item.id}`
  }
];

export default function AdminDemoContent({ embedded = false }) {
  const navigate = useNavigate();
  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES[0].id);
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'FREE' | 'LOCKED'

  const activeCategory = useMemo(() => {
    return CATEGORIES.find((cat) => cat.id === activeCategoryId) || CATEGORIES[0];
  }, [activeCategoryId]);

  // Chargement de tous les contenus
  const fetchAllContent = useCallback(async () => {
    setLoading(true);
    setError('');
    const results = await Promise.allSettled(
      CATEGORIES.map((cat) => axios.get(cat.endpoint))
    );

    const next = {};
    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        next[CATEGORIES[index].id] = Array.isArray(res.value.data) ? res.value.data : [];
      } else {
        next[CATEGORIES[index].id] = [];
      }
    });

    setItemsByCategory(next);
    if (results.every((res) => res.status === 'rejected')) {
      setError('Impossible de charger les contenus. Vérifiez que le serveur backend est démarré.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllContent();
  }, [fetchAllContent]);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Données de la catégorie active
  const currentCategoryItems = useMemo(() => {
    return itemsByCategory[activeCategoryId] || [];
  }, [itemsByCategory, activeCategoryId]);

  // Liste des groupes disponibles pour la catégorie active (options, filières, écoles, matières)
  const availableGroups = useMemo(() => {
    const set = new Set();
    currentCategoryItems.forEach((item) => {
      const g = activeCategory.getGroup(item);
      if (g) set.add(g.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [currentCategoryItems, activeCategory]);

  // Réinitialiser les filtres lors d'un changement de catégorie
  const handleCategoryChange = (catId) => {
    setActiveCategoryId(catId);
    setSearchQuery('');
    setSelectedGroupFilter('ALL');
    setSelectedStatusFilter('ALL');
  };

  // Liste filtrée
  const filteredItems = useMemo(() => {
    return currentCategoryItems.filter((item) => {
      const isFree = item.isFree === true || item.is_free === true;

      // Filtre statut
      if (selectedStatusFilter === 'FREE' && !isFree) return false;
      if (selectedStatusFilter === 'LOCKED' && isFree) return false;

      // Filtre groupe
      if (selectedGroupFilter !== 'ALL') {
        const g = activeCategory.getGroup(item);
        if (!g || g.trim().toLowerCase() !== selectedGroupFilter.toLowerCase()) return false;
      }

      // Filtre recherche
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const title = (activeCategory.getTitle(item) || '').toLowerCase();
        const group = (activeCategory.getGroup(item) || '').toLowerCase();
        const matiere = (item.matiere || '').toLowerCase();
        const ecole = (item.ecole || '').toLowerCase();
        const chapitre = (item.chapitre || '').toLowerCase();
        const annee = item.annee ? String(item.annee) : '';

        const match = title.includes(query) || group.includes(query) || matiere.includes(query)
          || ecole.includes(query) || chapitre.includes(query) || annee.includes(query);

        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      const groupA = activeCategory.getGroup(a) || '';
      const groupB = activeCategory.getGroup(b) || '';
      const cmp = groupA.localeCompare(groupB, 'fr');
      if (cmp !== 0) return cmp;
      return (activeCategory.getTitle(a) || '').localeCompare(activeCategory.getTitle(b) || '', 'fr');
    });
  }, [currentCategoryItems, activeCategory, selectedStatusFilter, selectedGroupFilter, searchQuery]);

  // Compteurs statistiques
  const totalCount = currentCategoryItems.length;
  const authorizedCount = currentCategoryItems.filter((i) => i.isFree === true || i.is_free === true).length;
  const blockedCount = totalCount - authorizedCount;

  // Modification d'état : AUTORISER ou BLOQUER
  const handleSetFreeStatus = async (item, targetFree) => {
    const isCurrentlyFree = item.isFree === true || item.is_free === true;
    if (isCurrentlyFree === targetFree) return; // État déjà conforme

    setBusyId(item.id);
    setError('');
    try {
      const res = await axios.patch(`/api/admin/demo-content/${activeCategoryId}/${item.id}/free`, {
        isFree: targetFree
      });

      const message = targetFree
        ? `« ${activeCategory.getTitle(item)} » est désormais AUTORISÉ en accès gratuit.`
        : `« ${activeCategory.getTitle(item)} » est désormais BLOQUÉ (réservé aux abonnés).`;

      setToast(res.data?.message || message);
      await fetchAllContent();
    } catch (err) {
      console.error('Erreur mise à jour autorisation:', err);
      setError(err.response?.data?.message || "Échec de l'enregistrement de l'autorisation.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={`jarab-fabor-admin-wrapper ${embedded ? 'is-embedded' : ''}`}>
      {/* Toast de notification instantanée */}
      {toast && (
        <div className="jarab-fabor-toast" role="status">
          <span className="jarab-fabor-toast-icon">✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* En-tête principal */}
      <header className="jarab-fabor-header">
        <div className="jarab-fabor-header-left">
          <div className="jarab-fabor-badge-eyebrow">
            <span>ADMINISTRATION</span>
            <span className="jarab-fabor-dot">•</span>
            <span>FREE TRIAL</span>
          </div>
          <h1 className="jarab-fabor-title">Gestion Jarab Fabor</h1>
          <p className="jarab-fabor-subtitle">
            Contrôlez individuellement les contenus accessibles gratuitement en mode Démo et ceux réservés aux abonnés payants.
          </p>
        </div>

        {!embedded && (
          <button
            type="button"
            className="jarab-fabor-back-btn"
            onClick={() => navigate('/admin-dashboard')}
          >
            ← Retour au Tableau de bord
          </button>
        )}
      </header>

      {/* Cartes KPI statistiques */}
      <div className="jarab-fabor-kpi-grid">
        <div className="jarab-fabor-kpi-card is-total">
          <div className="jarab-fabor-kpi-icon">📚</div>
          <div className="jarab-fabor-kpi-info">
            <span className="jarab-fabor-kpi-label">Total contenus ({activeCategory.label})</span>
            <strong className="jarab-fabor-kpi-value">{totalCount}</strong>
          </div>
        </div>

        <div className="jarab-fabor-kpi-card is-authorized">
          <div className="jarab-fabor-kpi-icon">🔓</div>
          <div className="jarab-fabor-kpi-info">
            <span className="jarab-fabor-kpi-label">Autorisés en Free Trial</span>
            <strong className="jarab-fabor-kpi-value">{authorizedCount}</strong>
          </div>
        </div>

        <div className="jarab-fabor-kpi-card is-blocked">
          <div className="jarab-fabor-kpi-icon">🔒</div>
          <div className="jarab-fabor-kpi-info">
            <span className="jarab-fabor-kpi-label">Bloqués (Réservés Abonnés)</span>
            <strong className="jarab-fabor-kpi-value">{blockedCount}</strong>
          </div>
        </div>

        <div className="jarab-fabor-kpi-card is-rule">
          <div className="jarab-fabor-kpi-icon">ℹ️</div>
          <div className="jarab-fabor-kpi-info">
            <span className="jarab-fabor-kpi-label">Règle de sélection</span>
            <span className="jarab-fabor-kpi-rule-text">{activeCategory.rule}</span>
          </div>
        </div>
      </div>

      {/* Onglets des 5 catégories de contenu */}
      <nav className="jarab-fabor-tabs-nav" aria-label="Catégories de contenu">
        {CATEGORIES.map((cat) => {
          const catItems = itemsByCategory[cat.id] || [];
          const freeInCat = catItems.filter((i) => i.isFree === true || i.is_free === true).length;
          const isActive = cat.id === activeCategoryId;

          return (
            <button
              key={cat.id}
              type="button"
              className={`jarab-fabor-tab-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <span className="jarab-fabor-tab-icon">{cat.icon}</span>
              <span className="jarab-fabor-tab-label">{cat.label}</span>
              <span className="jarab-fabor-tab-badge" title={`${freeInCat} autorisé(s) sur ${catItems.length}`}>
                {freeInCat} / {catItems.length}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Panneau principal avec filtres et liste */}
      <section className="jarab-fabor-panel">
        {/* Barre d'outils et de filtres */}
        <div className="jarab-fabor-toolbar">
          {/* Recherche */}
          <div className="jarab-fabor-search-box">
            <span className="jarab-fabor-search-icon">🔍</span>
            <input
              type="text"
              placeholder={`Rechercher un ${activeCategory.label.toLowerCase()} (titre, matière, école...)...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="jarab-fabor-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="jarab-fabor-clear-search"
                onClick={() => setSearchQuery('')}
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>

          <div className="jarab-fabor-filters-row">
            {/* Filtre par groupe (Option / Filière / École / Matière) */}
            <div className="jarab-fabor-filter-item">
              <label htmlFor="group-filter">{activeCategory.groupName} :</label>
              <select
                id="group-filter"
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="jarab-fabor-select"
              >
                <option value="ALL">Tous ({availableGroups.length})</option>
                {availableGroups.map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par statut */}
            <div className="jarab-fabor-filter-item">
              <label htmlFor="status-filter">Statut :</label>
              <select
                id="status-filter"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="jarab-fabor-select"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="FREE">🔓 Autorisés uniquement ({authorizedCount})</option>
                <option value="LOCKED">🔒 Bloqués uniquement ({blockedCount})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Message d'erreur éventuel */}
        {error && (
          <div className="jarab-fabor-alert is-error" role="alert">
            <span>⚠️ {error}</span>
            <button type="button" onClick={fetchAllContent} className="jarab-fabor-retry-btn">
              Réessayer
            </button>
          </div>
        )}

        {/* Liste des contenus */}
        {loading ? (
          <div className="jarab-fabor-loading-state">
            <div className="jarab-fabor-spinner" />
            <p>Chargement des contenus depuis la base de données...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="jarab-fabor-empty-state">
            <span className="jarab-fabor-empty-icon">📂</span>
            <h3>Aucun contenu trouvé</h3>
            <p>
              {searchQuery || selectedGroupFilter !== 'ALL' || selectedStatusFilter !== 'ALL'
                ? 'Aucun contenu ne correspond aux filtres appliqués.'
                : `Aucun contenu disponible pour la catégorie « ${activeCategory.label} ».`}
            </p>
            {(searchQuery || selectedGroupFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
              <button
                type="button"
                className="jarab-fabor-reset-filters-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGroupFilter('ALL');
                  setSelectedStatusFilter('ALL');
                }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="jarab-fabor-list">
            <div className="jarab-fabor-list-header">
              <span>CONTENU & DÉTAILS</span>
              <span>STATUT & AUTORISATION</span>
            </div>

            {filteredItems.map((item) => {
              const isFree = item.isFree === true || item.is_free === true;
              const isBusy = busyId === item.id;
              const title = activeCategory.getTitle(item);
              const group = activeCategory.getGroup(item);

              return (
                <article
                  key={item.id}
                  className={`jarab-fabor-item ${isFree ? 'is-free-card' : 'is-locked-card'}`}
                >
                  {/* Colonne Gauche : Titre et métadonnées */}
                  <div className="jarab-fabor-item-meta">
                    <div className="jarab-fabor-item-title-row">
                      <strong className="jarab-fabor-item-title" title={title}>
                        {title}
                      </strong>
                      <span className={`jarab-fabor-status-pill ${isFree ? 'is-free' : 'is-locked'}`}>
                        {isFree ? '✓ AUTORISÉ' : '🔒 BLOQUÉ'}
                      </span>
                    </div>

                    <div className="jarab-fabor-tags-row">
                      {group && (
                        <span className="jarab-fabor-tag is-group">
                          {activeCategory.groupName}: <strong>{group}</strong>
                        </span>
                      )}
                      {item.matiere && (
                        <span className="jarab-fabor-tag is-matiere">
                          {item.matiere}
                        </span>
                      )}
                      {item.ecole && (
                        <span className="jarab-fabor-tag is-ecole">
                          École : {item.ecole}
                        </span>
                      )}
                      {item.annee && (
                        <span className="jarab-fabor-tag is-annee">
                          Année : {item.annee}
                        </span>
                      )}
                      {item.chapitre && (
                        <span className="jarab-fabor-tag is-chapitre">
                          Chapitre : {item.chapitre}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Colonne Droite : Boutons d'action AUTORISER et BLOQUER */}
                  <div className="jarab-fabor-actions-cell">
                    {/* Bouton AUTORISER */}
                    <button
                      type="button"
                      className={`jarab-fabor-action-btn btn-authorize ${isFree ? 'is-current-active' : ''}`}
                      onClick={() => handleSetFreeStatus(item, true)}
                      disabled={isBusy}
                      title={isFree ? 'Déjà autorisé gratuitement' : 'Rendre ce contenu accessible gratuitement'}
                    >
                      {isBusy && !isFree ? (
                        <span className="jarab-fabor-mini-spinner" />
                      ) : (
                        <span>✓</span>
                      )}
                      <span>AUTORISER</span>
                    </button>

                    {/* Bouton BLOQUER */}
                    <button
                      type="button"
                      className={`jarab-fabor-action-btn btn-block ${!isFree ? 'is-current-active' : ''}`}
                      onClick={() => handleSetFreeStatus(item, false)}
                      disabled={isBusy}
                      title={!isFree ? 'Déjà bloqué (réservé aux abonnés)' : 'Verrouiller et réserver aux abonnés payants'}
                    >
                      {isBusy && isFree ? (
                        <span className="jarab-fabor-mini-spinner" />
                      ) : (
                        <span>🔒</span>
                      )}
                      <span>BLOQUER</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
