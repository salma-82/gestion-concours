import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { recordStudentActivity } from '../studentProgress';
import TrackedQcmFrame from './TrackedQcmFrame';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8081';

// Couleurs et badges thématiques pour les matières
const MATIERE_THEMES = {
  'Mathématiques': { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '📐' },
  'Maths': { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '📐' },
  'Math': { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '📐' },
  'Physique-Chimie': { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '⚡' },
  'Physique': { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '⚡' },
  'Chimie': { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', icon: '🧪' },
  'SVT': { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '🌿' },
  'Biologie': { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '🔬' },
  'Français': { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '✍️' },
  'Anglais': { color: '#ea580c', bg: '#fff7ed', border: '#ffedd5', icon: '🌐' },
  'Culture Générale': { color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', icon: '🌍' },
  'Informatique': { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', icon: '💻' },
  'Économie': { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', icon: '📊' }
};

const getMatiereTheme = (matiereName = '') => {
  const trimmed = (matiereName || '').trim();
  if (MATIERE_THEMES[trimmed]) return MATIERE_THEMES[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(MATIERE_THEMES)) {
    if (lower === key.toLowerCase() || lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }

  return {
    color: '#0f766e',
    bg: '#f0fdfa',
    border: '#99f6e4',
    icon: '📚'
  };
};

// Palettes et métadonnées pour les grandes écoles
const ECOLE_METADATA = {
  'ENSA': {
    nomComplet: 'Écoles Nationales des Sciences Appliquées',
    badgeColor: '#0d9488',
    bgGradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
    iconBg: '#ccfbf1',
    type: 'Ingénierie & Sciences'
  },
  'ENCG': {
    nomComplet: 'Écoles Nationales de Commerce et de Gestion',
    badgeColor: '#2563eb',
    bgGradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
    iconBg: '#dbeafe',
    type: 'Commerce & Management'
  },
  'ENSAM': {
    nomComplet: 'École Nationale Supérieure d\'Arts et Métiers',
    badgeColor: '#dc2626',
    bgGradient: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
    iconBg: '#fee2e2',
    type: 'Génie Mécanique & Industriel'
  },
  'MEDECINE': {
    nomComplet: 'Facultés de Médecine et de Pharmacie (FMP/FMD)',
    badgeColor: '#059669',
    bgGradient: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
    iconBg: '#d1fae5',
    type: 'Santé & Sciences Médicales'
  },
  'FMP': {
    nomComplet: 'Facultés de Médecine et de Pharmacie',
    badgeColor: '#059669',
    bgGradient: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
    iconBg: '#d1fae5',
    type: 'Santé & Sciences Médicales'
  },
  'FST': {
    nomComplet: 'Facultés des Sciences et Techniques',
    badgeColor: '#7c3aed',
    bgGradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
    iconBg: '#ede9fe',
    type: 'Sciences Appliquées & Technologies'
  },
  'APESA': {
    nomComplet: 'Année Préparatoire aux Études Supérieures Agronomiques',
    badgeColor: '#16a34a',
    bgGradient: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
    iconBg: '#dcfce7',
    type: 'Agronomie & Vétérinaire'
  },
  'IAV': {
    nomComplet: 'Institut Agronomique et Vétérinaire Hassan II',
    badgeColor: '#15803d',
    bgGradient: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
    iconBg: '#dcfce7',
    type: 'Agronomie & Vétérinaire'
  }
};

const getEcoleMeta = (ecoleName = '') => {
  const upper = (ecoleName || '').trim().toUpperCase();
  for (const [key, val] of Object.entries(ECOLE_METADATA)) {
    if (upper === key || upper.includes(key)) {
      return val;
    }
  }
  return {
    nomComplet: `Concours d'accès - ${ecoleName}`,
    badgeColor: '#0f766e',
    bgGradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    iconBg: '#ccfbf1',
    type: 'Grande École / Faculté'
  };
};

const getPdfUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('localhost:8080')) return url.replace('localhost:8080', 'localhost:8081');
    return url;
  }
  return `${API_BASE}/uploads/${url}`;
};

const ALL_MATIERES = 'Toutes les matières';

export default function ClientConcours() {
  const location = useLocation();
  const navigate = useNavigate();
  const requestedEcole = new URLSearchParams(location.search).get('ecole');
  const [concoursList, setConcoursList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Étapes de navigation :
  // Étape 1 : selectedEcole === null (Afficher uniquement les écoles ajoutées par l'Admin)
  // Étape 2 : selectedEcole !== null && selectedMatiere === null (Afficher les matières disponibles pour cette école)
  // Étape 3 : selectedEcole !== null && selectedMatiere !== null (Afficher les concours classés par année du plus récent au plus ancien avec sélection de l'année)
  const [selectedEcole, setSelectedEcole] = useState(null);
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [expandedYear, setExpandedYear] = useState('');
  const [expandedSubject, setExpandedSubject] = useState(null);

  // Recherches rapides
  const [searchEcole, setSearchEcole] = useState('');
  const [searchMatiere, setSearchMatiere] = useState('');
  const [searchConcours, setSearchConcours] = useState('');

  // Modal de consultation du fichier (Sujet / Corrigé)
  const [viewerModal, setViewerModal] = useState({
    isOpen: false,
    concours: null,
    activeTab: 'sujet' // 'sujet' | 'correction'
  });

  const returnToConcoursOptions = () => {
    navigate('/client-dashboard', { state: { openSidebarMenu: 'concours' } });
  };

  // Chargement des données live depuis la base de données
  const fetchAllConcours = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/concours`);
      const data = Array.isArray(res.data) ? res.data : [];
      setConcoursList(data);
    } catch (err) {
      console.error("Erreur chargement concours:", err);
      setError("Impossible de charger les concours pour le moment. Veuillez vérifier la connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllConcours();
  }, []);

  // 1. Liste UNIQUEMENT des écoles ajoutées par l'Admin (avec leurs concours et matières associées)
  const ecolesSummary = useMemo(() => {
    const map = {};
    concoursList.forEach((c) => {
      if (!c.ecole || !c.ecole.trim()) return;
      const rawEcole = c.ecole.trim();
      const key = rawEcole.toLowerCase();

      if (!map[key]) {
        map[key] = {
          name: rawEcole,
          count: 0,
          years: new Set(),
          matieresMap: {},
          concours: []
        };
      }
      map[key].count += 1;
      if (c.annee) map[key].years.add(Number(c.annee));

      const mat = (c.matiere && c.matiere.trim()) ? c.matiere.trim() : 'Général';
      map[key].matieresMap[mat] = (map[key].matieresMap[mat] || 0) + 1;
      map[key].concours.push(c);
    });

    return Object.values(map).map(item => ({
      ...item,
      yearsList: Array.from(item.years).sort((a, b) => b - a),
      matieresList: Object.keys(item.matieresMap).sort((a, b) => a.localeCompare(b))
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [concoursList]);

  // Sans école choisie, revenir au Dashboard où les écoles sont dans la sidebar.
  useEffect(() => {
    if (!requestedEcole) {
      navigate('/client-dashboard', {
        replace: true,
        state: { openSidebarMenu: 'concours' }
      });
      return;
    }

    const matchingEcole = ecolesSummary.find(
      ecole => ecole.name.toLowerCase() === requestedEcole.trim().toLowerCase()
    );
    if (matchingEcole) {
      handleOpenSchool(matchingEcole);
    } else if (!loading) {
      navigate('/client-dashboard', {
        replace: true,
        state: { openSidebarMenu: 'concours' }
      });
    }
  }, [requestedEcole, ecolesSummary, loading, navigate]);

  // Écoles filtrées par la recherche globale
  const filteredEcoles = useMemo(() => {
    if (!searchEcole.trim()) return ecolesSummary;
    const q = searchEcole.toLowerCase();
    return ecolesSummary.filter(ec =>
      ec.name.toLowerCase().includes(q) ||
      getEcoleMeta(ec.name).nomComplet.toLowerCase().includes(q)
    );
  }, [ecolesSummary, searchEcole]);

  // Données de l'école actuellement sélectionnée
  const activeEcoleData = useMemo(() => {
    if (!selectedEcole) return null;
    return ecolesSummary.find(e => e.name.toLowerCase() === selectedEcole.toLowerCase()) || null;
  }, [selectedEcole, ecolesSummary]);

  // 2. Liste des matières disponibles pour l'école sélectionnée
  const matieresForSelectedEcole = useMemo(() => {
    if (!activeEcoleData) return [];

    const list = activeEcoleData.matieresList.map(matName => {
      const concs = activeEcoleData.concours.filter(c => {
        const m = (c.matiere && c.matiere.trim()) ? c.matiere.trim() : 'Général';
        return m.toLowerCase() === matName.toLowerCase();
      });
      const years = Array.from(new Set(concs.map(c => Number(c.annee)).filter(Boolean))).sort((a, b) => b - a);

      return {
        name: matName,
        count: concs.length,
        years,
        latestYear: years.length > 0 ? years[0] : null
      };
    });

    if (!searchMatiere.trim()) return list;
    const q = searchMatiere.toLowerCase();
    return list.filter(m => m.name.toLowerCase().includes(q));
  }, [activeEcoleData, searchMatiere]);

  // 3. Années disponibles pour l'école ET la matière sélectionnées
  const availableYearsForSelectedMatiere = useMemo(() => {
    if (!activeEcoleData || !selectedMatiere) return [];

    const concs = activeEcoleData.concours.filter(c => {
      const m = (c.matiere && c.matiere.trim()) ? c.matiere.trim() : 'Général';
      return selectedMatiere === ALL_MATIERES || m.toLowerCase() === selectedMatiere.toLowerCase();
    });

    const years = Array.from(new Set(concs.map(c => Number(c.annee)).filter(Boolean)));
    // Du plus récent au plus ancien
    return years.sort((a, b) => b - a);
  }, [activeEcoleData, selectedMatiere]);

  // 4. Concours pour l'école ET matière sélectionnées, classés par année (du plus récent au plus ancien)
  const filteredConcoursForDisplay = useMemo(() => {
    if (!activeEcoleData || !selectedMatiere) return [];

    let list = activeEcoleData.concours.filter(c => {
      const m = (c.matiere && c.matiere.trim()) ? c.matiere.trim() : 'Général';
      return selectedMatiere === ALL_MATIERES || m.toLowerCase() === selectedMatiere.toLowerCase();
    });

    // Filtre Année choisie par l'étudiant
    if (selectedYear) {
      list = list.filter(c => String(c.annee) === String(selectedYear));
    }

    // Recherche mot-clé dans les concours
    if (searchConcours.trim()) {
      const q = searchConcours.toLowerCase();
      list = list.filter(c =>
        (c.titre && c.titre.toLowerCase().includes(q)) ||
        (c.annee && String(c.annee).includes(q))
      );
    }

    // RÈGLE OBLIGATOIRE : Classés par année du plus récent au plus ancien
    return list.sort((a, b) => {
      const diffAnnee = (Number(b.annee) || 0) - (Number(a.annee) || 0);
      if (diffAnnee !== 0) return diffAnnee;
      return (a.titre || '').localeCompare(b.titre || '');
    });
  }, [activeEcoleData, selectedMatiere, selectedYear, searchConcours]);

  const concoursForNavigation = useMemo(() => {
    if (!activeEcoleData || !selectedMatiere) return [];
    return activeEcoleData.concours
      .filter(c => selectedMatiere === ALL_MATIERES || ((c.matiere && c.matiere.trim()) ? c.matiere.trim() : 'Général').toLowerCase() === selectedMatiere.toLowerCase())
      .sort((a, b) => (Number(b.annee) || 0) - (Number(a.annee) || 0));
  }, [activeEcoleData, selectedMatiere]);

  const concoursForNavigationYear = (year) => concoursForNavigation.filter(
    concours => String(concours.annee || 'Sans année') === String(year)
  );

  // Gestion de l'ouverture du visualiseur
  const handleOpenViewer = (concours, tab = 'sujet') => {
    let finalTab = tab;
    if (tab === 'sujet' && !concours.htmlUrl && (concours.htmlCorrectionUrl || concours.pdfCorrectionUrl)) {
      finalTab = 'correction';
    } else if (tab === 'correction' && !concours.htmlCorrectionUrl && !concours.pdfCorrectionUrl && concours.htmlUrl) {
      finalTab = 'sujet';
    }

    setViewerModal({
      isOpen: true,
      concours,
      activeTab: finalTab
    });
    recordStudentActivity({
      type: 'Concours',
      resourceId: `${concours.id}:${finalTab}`,
      title: concours.titre || concours.title || `${concours.ecole || 'Concours'} — ${concours.annee || ''}`.trim(),
      subject: concours.matiere || selectedMatiere || '',
      chapter: concours.annee ? String(concours.annee) : ''
    });
  };

  const handleOpenSchool = (ecole) => {
    const contests = [...(ecole.concours || [])].sort((a, b) => {
      const yearDiff = (Number(b.annee) || 0) - (Number(a.annee) || 0);
      return yearDiff || (a.titre || '').localeCompare(b.titre || '');
    });
    const firstConcours = contests.find(c => c.htmlUrl || c.htmlCorrectionUrl || c.pdfCorrectionUrl) || contests[0];
    setSelectedEcole(ecole.name);
    setSelectedMatiere(ALL_MATIERES);
    setSelectedYear(firstConcours?.annee ? String(firstConcours.annee) : '');
    setExpandedYear('');
    setExpandedSubject(null);
    setSearchMatiere('');
    setSearchConcours('');
    if (firstConcours) handleOpenViewer(firstConcours, 'sujet');
  };

  const closeViewerAndReturnToDashboard = () => {
    setViewerModal({ isOpen: false, concours: null, activeTab: 'sujet' });
    setSelectedEcole(null);
    setSelectedMatiere(null);
    setSelectedYear('');
    returnToConcoursOptions();
  };

  const currentViewerUrl = useMemo(() => {
    if (!viewerModal.concours) return '';
    if (viewerModal.activeTab === 'sujet') {
      return getPdfUrl(viewerModal.concours.htmlUrl);
    } else {
      return getPdfUrl(viewerModal.concours.htmlCorrectionUrl || viewerModal.concours.pdfCorrectionUrl);
    }
  }, [viewerModal]);

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', padding: requestedEcole ? '20px 16px 40px' : '24px 28px 60px', color: '#0f172a' }}>

      {/* =========================================================================
          FIL D'ARIANE / NAVIGATION HIÉRARCHIQUE (ÉCOLES -> MATIÈRES -> CONCOURS)
      ========================================================================= */}
      {!requestedEcole && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '22px',
        padding: '12px 18px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '13.5px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <button
          onClick={() => {
            setSelectedEcole(null);
            setSelectedMatiere(null);
            setSelectedYear('');
            setSearchConcours('');
            setSearchMatiere('');
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: selectedEcole ? '#2563eb' : '#0f172a',
            fontWeight: selectedEcole ? 600 : 800,
            cursor: selectedEcole ? 'pointer' : 'default',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'background 0.15s ease'
          }}
        >
          <span>🏫</span> Écoles ({ecolesSummary.length})
        </button>

        {selectedEcole && (
          <>
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>›</span>
            <button
              onClick={() => {
                setSelectedMatiere(ALL_MATIERES);
                setSelectedYear('');
                setSearchConcours('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: selectedMatiere ? '#2563eb' : '#0f172a',
                fontWeight: selectedMatiere ? 600 : 800,
                cursor: selectedMatiere ? 'pointer' : 'default',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background 0.15s ease'
              }}
            >
              <span>🏛️</span> {selectedEcole}
            </button>
          </>
        )}

        {selectedMatiere && (
          <>
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>›</span>
            <span style={{
              color: '#0f172a',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px'
            }}>
              <span>{getMatiereTheme(selectedMatiere).icon}</span> {selectedMatiere}
            </span>
          </>
        )}
      </div>
      )}

      {/* Message d'erreur éventuel */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '14px',
          padding: '16px 20px',
          color: '#b91c1c',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600 }}>
            <span>⚠️</span> {error}
          </div>
          <button
            onClick={fetchAllConcours}
            style={{
              background: '#ffffff',
              border: '1px solid #fca5a5',
              padding: '6px 14px',
              borderRadius: '8px',
              color: '#b91c1c',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* État de chargement */}
      {loading ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '80px 20px',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'inline-block',
            width: '42px',
            height: '42px',
            border: '4px solid #ccfbf1',
            borderTopColor: '#0d9488',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
            Chargement des données...
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Récupération des écoles et concours ajoutés par l'administrateur
          </div>
        </div>
      ) : selectedEcole === null ? (

        /* =========================================================================
            ÉTAPE 1 : AFFICHER UNIQUEMENT LES ÉCOLES AJOUTÉES PAR L'ADMIN
        ========================================================================= */
        <div>
          {/* Header de la section Écoles avec recherche */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div>
              <h1 style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.3px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                Grandes Écoles Disponibles
                <span style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  backgroundColor: '#ccfbf1',
                  color: '#0f766e',
                  padding: '3px 10px',
                  borderRadius: '20px'
                }}>
                  {filteredEcoles.length} école{filteredEcoles.length > 1 ? 's' : ''}
                </span>
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13.5px' }}>
                Cliquez sur une école pour afficher les matières et épreuves publiées par l'administration.
              </p>
            </div>

            {/* Barre de recherche d'école */}
            {ecolesSummary.length > 0 && (
              <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Rechercher une école..."
                  value={searchEcole}
                  onChange={(e) => setSearchEcole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 14px 9px 36px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13.5px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>

          {/* Aucune école ajoutée par l'admin */}
          {filteredEcoles.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '70px 20px',
              textAlign: 'center',
              border: '2px dashed #cbd5e1'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>🎓</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                {searchEcole ? `Aucune école ne correspond à "${searchEcole}"` : 'Aucune école disponible pour le moment'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 18px 0', maxWidth: '480px', marginInline: 'auto' }}>
                {searchEcole
                  ? 'Essayez de modifier votre mot-clé de recherche ou réinitialisez le filtre.'
                  : 'Seules les écoles ajoutées par l\'administrateur apparaîtront ici dès leur publication.'}
              </p>
              {searchEcole ? (
                <button
                  onClick={() => setSearchEcole('')}
                  style={{
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Effacer la recherche
                </button>
              ) : (
                <button
                  onClick={fetchAllConcours}
                  style={{
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Actualiser la liste
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {filteredEcoles.map((ec) => {
                const meta = getEcoleMeta(ec.name);
                const latestYear = ec.yearsList.length > 0 ? ec.yearsList[0] : null;

                return (
                  <div
                    key={ec.name}
                    onClick={() => handleOpenSchool(ec)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                      padding: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 14px 28px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderColor = meta.badgeColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.04)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    {/* Bande de couleur en haut */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '5px',
                      background: meta.bgGradient
                    }} />

                    <div>
                      {/* En-tête de la carte */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '14px',
                          backgroundColor: meta.iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: meta.badgeColor,
                          fontWeight: 900,
                          fontSize: '18px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                          {ec.name.substring(0, 4)}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '8px'
                          }}>
                            {ec.matieresList.length} matière{ec.matieresList.length > 1 ? 's' : ''}
                          </span>
                          <span style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#64748b',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '8px'
                          }}>
                            {ec.count} épreuve{ec.count > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Titre et détails de l'école */}
                      <h2 style={{
                        fontSize: '21px',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: '0 0 4px 0',
                        letterSpacing: '-0.3px'
                      }}>
                        {ec.name}
                      </h2>

                      <div style={{
                        fontSize: '13px',
                        color: '#64748b',
                        fontWeight: 600,
                        marginBottom: '14px',
                        minHeight: '36px',
                        lineHeight: 1.4
                      }}>
                        {meta.nomComplet}
                      </div>

                      {/* Matières disponibles */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                        {latestYear && (
                          <span style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#0f172a',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            📅 Jusqu'à {latestYear}
                          </span>
                        )}

                        {ec.matieresList.slice(0, 3).map((mat) => (
                          <span
                            key={mat}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              color: '#475569',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            {mat}
                          </span>
                        ))}

                        {ec.matieresList.length > 3 && (
                          <span style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            fontWeight: 700,
                            padding: '3px 4px'
                          }}>
                            +{ec.matieresList.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bouton d'action */}
                    <div style={{
                      paddingTop: '14px',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: meta.badgeColor,
                      fontWeight: 800,
                      fontSize: '13.5px'
                    }}>
                      <span>Choisir cette école</span>
                      <span style={{ fontSize: '18px' }}>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : selectedMatiere === null ? (

        /* =========================================================================
            ÉTAPE 2 : AFFICHER LES MATIÈRES DISPONIBLES POUR L'ÉCOLE SÉLECTIONNÉE
        ========================================================================= */
        <div>
          {/* Barre supérieure : Retour aux écoles + Titre de l'école */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={returnToConcoursOptions}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                >
                  ← Retour aux écoles
                </button>

                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Matières disponibles pour {selectedEcole}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: '#ccfbf1',
                      color: '#0f766e',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {matieresForSelectedEcole.length} matière{matieresForSelectedEcole.length > 1 ? 's' : ''}
                    </span>
                  </h2>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    {getEcoleMeta(selectedEcole).nomComplet}
                  </div>
                </div>
              </div>

              {/* Champ de recherche de matière si besoin */}
              {activeEcoleData && activeEcoleData.matieresList.length > 4 && (
                <div style={{ position: 'relative', width: '240px' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Filtrer les matières..."
                    value={searchMatiere}
                    onChange={(e) => setSearchMatiere(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px 7px 30px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Grille des matières */}
          {matieresForSelectedEcole.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '2px dashed #cbd5e1'
            }}>
              <div style={{ fontSize: '42px', marginBottom: '10px' }}>📚</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Aucune matière trouvée
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0' }}>
                Aucune matière n'est actuellement associée à cette école.
              </p>
              <button
                onClick={returnToConcoursOptions}
                style={{
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Retour aux écoles
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {matieresForSelectedEcole.map((mat) => {
                const theme = getMatiereTheme(mat.name);

                return (
                  <div
                    key={mat.name}
                    onClick={() => {
                      setSelectedMatiere(mat.name);
                      setSelectedYear('');
                      setSearchConcours('');
                    }}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
                      padding: '22px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.06)';
                      e.currentTarget.style.borderColor = theme.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.03)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div>
                      {/* Icône et badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          backgroundColor: theme.bg,
                          color: theme.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px'
                        }}>
                          {theme.icon}
                        </div>

                        <span style={{
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          {mat.count} épreuve{mat.count > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Nom de la matière */}
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '18px',
                        fontWeight: 800,
                        color: '#0f172a'
                      }}>
                        {mat.name}
                      </h3>

                      {/* Années couvertes */}
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                        {mat.years.length > 0 ? (
                          <span>
                            📅 Années : <strong>{mat.years.slice(0, 4).join(', ')}{mat.years.length > 4 ? '...' : ''}</strong>
                          </span>
                        ) : (
                          <span>Années non spécifiées</span>
                        )}
                      </div>
                    </div>

                    {/* Footer carte matière */}
                    <div style={{
                      paddingTop: '12px',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: theme.color,
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      <span>Voir les concours</span>
                      <span style={{ fontSize: '16px' }}>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : (

        /* =========================================================================
            ÉTAPE 3 : CONCOURS CORRESPONDANTS CLASSÉS PAR ANNÉE (RÉCENT -> ANCIEN)
                      AVEC SÉLECTION DE L'ANNÉE DU CONCOURS
        ========================================================================= */
        <div>
          {/* Header de navigation et filtres */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            marginBottom: '24px'
          }}>
            {/* Rangée 1 : Bouton retour + Titre */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => {
                    setSelectedMatiere(ALL_MATIERES);
                    setSelectedYear('');
                    setSearchConcours('');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                >
                  ← Tous les concours
                </button>

                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Concours {selectedMatiere === ALL_MATIERES ? '' : `${selectedMatiere} • `}{selectedEcole}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {filteredConcoursForDisplay.length} concours
                    </span>
                  </h2>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    {getEcoleMeta(selectedEcole).nomComplet}
                  </div>
                </div>
              </div>

              {/* Règle de classement : du plus récent au plus ancien */}
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#0d9488',
                background: '#ccfbf1',
                padding: '6px 12px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>⏳</span> Classés du plus récent au plus ancien
              </div>
            </div>

            {/* Rangée 2 : Sélecteur d'année + Barre de recherche de concours */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}>
              {/* Sélecteur d'année (Pastilles interactives) */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginRight: '4px' }}>
                  📅 Sélectionner l'Année :
                </span>

                <button
                  onClick={() => setSelectedYear('')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: selectedYear === '' ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                    backgroundColor: selectedYear === '' ? '#0f172a' : '#ffffff',
                    color: selectedYear === '' ? '#ffffff' : '#334155',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Toutes les années
                </button>

                {availableYearsForSelectedMatiere.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(String(yr))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: String(selectedYear) === String(yr) ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
                      backgroundColor: String(selectedYear) === String(yr) ? '#0d9488' : '#ffffff',
                      color: String(selectedYear) === String(yr) ? '#ffffff' : '#334155',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Année {yr}
                  </button>
                ))}
              </div>

              {/* Recherche par mot-clé */}
              <div style={{ position: 'relative', width: '220px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Rechercher épreuve..."
                  value={searchConcours}
                  onChange={(e) => setSearchConcours(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 30px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Grille des concours correspondants */}
          {filteredConcoursForDisplay.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '2px dashed #cbd5e1'
            }}>
              <div style={{ fontSize: '42px', marginBottom: '10px' }}>📄</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Aucun concours disponible pour ces critères
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0' }}>
                {selectedYear ? `Aucune épreuve trouvée pour l'année ${selectedYear}.` : 'Aucune épreuve n\'a été publiée pour cette matière.'}
              </p>
              {selectedYear && (
                <button
                  onClick={() => setSelectedYear('')}
                  style={{
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Voir toutes les années
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '20px'
            }}>
              {filteredConcoursForDisplay.map((c) => {
                const theme = getMatiereTheme(c.matiere);
                const hasSujet = Boolean(c.htmlUrl);
                const hasCorrection = Boolean(c.htmlCorrectionUrl || c.pdfCorrectionUrl);

                return (
                  <div
                    key={c.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.07)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.03)';
                    }}
                  >
                    <div>
                      {/* Top tags: Année sélectionnée + Matière */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                        <span style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: 800,
                          padding: '4px 12px',
                          borderRadius: '6px',
                          letterSpacing: '0.3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          📅 {c.annee || 'Année non spécifiée'}
                        </span>

                        <span style={{
                          backgroundColor: theme.bg,
                          color: theme.color,
                          border: `1px solid ${theme.border}`,
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '6px'
                        }}>
                          {c.matiere || selectedMatiere}
                        </span>
                      </div>

                      {/* Titre du Concours */}
                      <h3 style={{
                        fontSize: '17px',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: '0 0 10px 0',
                        lineHeight: 1.4
                      }}>
                        {c.titre}
                      </h3>

                      {/* Indicateurs de disponibilité des fichiers ajoutés par l'Admin */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <span>{hasSujet ? '🟢' : '⚪'}</span>
                          <span style={{ color: hasSujet ? '#15803d' : '#94a3b8', fontWeight: hasSujet ? 700 : 500 }}>
                            {hasSujet ? 'Fichier Sujet disponible' : 'Sujet non disponible'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <span>{hasCorrection ? '🟢' : '⚪'}</span>
                          <span style={{ color: hasCorrection ? '#15803d' : '#94a3b8', fontWeight: hasCorrection ? 700 : 500 }}>
                            {hasCorrection ? 'Correction détaillée disponible' : 'Correction en attente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Boutons d'Action pour Consulter les Fichiers */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: hasSujet && hasCorrection ? '1fr 1fr' : '1fr',
                      gap: '8px',
                      paddingTop: '14px',
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      {/* Bouton Consulter le Sujet */}
                      {hasSujet ? (
                        <button
                          onClick={() => handleOpenViewer(c, 'sujet')}
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                        >
                          <span>📄</span> Consulter Sujet
                        </button>
                      ) : (
                        <button
                          disabled
                          style={{
                            background: '#f8fafc',
                            color: '#94a3b8',
                            border: '1px solid #e2e8f0',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'not-allowed'
                          }}
                        >
                          Sujet non dispo
                        </button>
                      )}

                      {/* Bouton Consulter la Correction */}
                      {hasCorrection ? (
                        <button
                          onClick={() => handleOpenViewer(c, 'correction')}
                          style={{
                            background: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#dcfce7'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}
                        >
                          <span>✅</span> Consulter Corrigé
                        </button>
                      ) : (
                        <button
                          disabled
                          style={{
                            background: '#f8fafc',
                            color: '#94a3b8',
                            border: '1px solid #e2e8f0',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'not-allowed'
                          }}
                        >
                          Corrigé en attente
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL DE CONSULTATION DU FICHIER CONCOURS (SUJET / CORRIGÉ)
      ========================================================================= */}
      {viewerModal.isOpen && viewerModal.concours && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#f8fafc',
          display: 'flex',
          zIndex: 9999,
          padding: 0
        }}>
          <div style={{
            backgroundColor: '#f8fafc',
            width: '100%',
            height: '100dvh',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Contenu du Document (Iframe) */}
            <div style={{
              flex: 1,
              minHeight: 0,
              backgroundColor: '#f1f5f9',
              padding: '20px 16px',
              display: 'flex',
              gap: '18px',
              overflow: 'auto',
              alignItems: 'flex-start'
            }}>
              <aside style={{ flex: '0 1 280px', minWidth: '250px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', padding: '14px', background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', position: 'sticky', top: 0 }}>
                <h2 style={{ margin: '2px 4px 12px', color: '#1e3a8a', fontSize: '15px', fontWeight: 750 }}>Concours et QCM</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {availableYearsForSelectedMatiere.map((year) => {
                    const yearConcours = concoursForNavigationYear(year);
                    const yearKey = String(year);
                    const isExpandedYear = expandedYear === yearKey;
                    const concoursBySubject = yearConcours.reduce((groups, concours) => {
                      const subject = (concours.matiere || 'G\u00e9n\u00e9ral').trim();
                      if (!groups[subject]) groups[subject] = [];
                      groups[subject].push(concours);
                      return groups;
                    }, {});

                    return (
                      <div key={year}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedYear(yearKey);
                            setExpandedYear(current => current === yearKey ? '' : yearKey);
                            setExpandedSubject(null);
                          }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', border: '1px solid', borderColor: isExpandedYear ? '#60a5fa' : '#dbeafe', borderRadius: '12px', background: isExpandedYear ? '#eff6ff' : '#ffffff', color: isExpandedYear ? '#1d4ed8' : '#1e293b', textAlign: 'left', fontWeight: 750, fontSize: '13px', cursor: 'pointer', boxShadow: isExpandedYear ? '0 4px 12px rgba(37,99,235,.12)' : '0 2px 6px rgba(15,23,42,.04)', transition: 'all .15s ease' }}
                        >
                          <span style={{ width: '36px', height: '36px', flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '10px', background: isExpandedYear ? '#dbeafe' : '#f1f5f9', color: '#2563eb' }} aria-hidden="true">
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 3.75h7l5 5v11.5a1.75 1.75 0 0 1-1.75 1.75h-10.5A1.75 1.75 0 0 1 5 20.25V5.5a1.75 1.75 0 0 1 2-1.75Z" />
                              <path d="M14 4v5h5M8.5 13h7M8.5 16.5h7" />
                            </svg>
                          </span>
                          <span style={{ flex: 1 }}>Concours {year}</span>
                          <span style={{ fontSize: '21px', lineHeight: 1, color: isExpandedYear ? '#2563eb' : '#94a3b8' }} aria-hidden="true">{isExpandedYear ? '\u2304' : '\u203a'}</span>
                        </button>
                        {isExpandedYear && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', margin: '5px 0 2px 9px', paddingLeft: '9px', borderLeft: '2px solid #bfdbfe' }}>
                            {Object.entries(concoursBySubject).map(([subject, subjectConcours]) => {
                              const subjectKey = `${yearKey}:${subject}`;
                              const isExpandedSubject = expandedSubject === subjectKey;
                              return (
                                <div key={subjectKey}>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedSubject(current => current === subjectKey ? null : subjectKey)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 10px', border: 0, borderRadius: '8px', background: isExpandedSubject ? '#dbeafe' : 'transparent', color: isExpandedSubject ? '#1d4ed8' : '#475569', textAlign: 'left', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    <span>{subject}</span>
                                    <span>{subjectConcours.length}</span>
                                  </button>
                                  {isExpandedSubject && subjectConcours.map(concours => {
                                    const activeConcours = String(viewerModal.concours.id) === String(concours.id);
                                    return (
                                      <button
                                        key={concours.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedYear(String(concours.annee || ''));
                                          handleOpenViewer(concours, 'sujet');
                                        }}
                                        style={{ width: '100%', marginTop: '3px', padding: '8px 10px 8px 16px', border: 0, borderRadius: '8px', background: activeConcours ? '#2563eb' : 'transparent', color: activeConcours ? '#ffffff' : '#475569', textAlign: 'left', fontSize: '12px', fontWeight: activeConcours ? 750 : 600, cursor: 'pointer' }}
                                      >
                                        {concours.titre || `QCM ${concours.id}`}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </aside>
              <div style={{ flex: '1 1 620px', minWidth: 'min(100%, 320px)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={closeViewerAndReturnToDashboard}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#1e293b', padding: '8px 12px', borderRadius: '9px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    ← Retour
                  </button>
                </div>
                <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
              {currentViewerUrl ? (
                viewerModal.activeTab === 'sujet' && viewerModal.concours.htmlUrl ? (
                  <div style={{ width: '100%', background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                    <TrackedQcmFrame
                      src={currentViewerUrl}
                      title={`${viewerModal.concours.titre} - ${viewerModal.activeTab}`}
                      sourceType="Concours"
                      resourceId={viewerModal.concours.id}
                      resourceTitle={viewerModal.concours.titre || viewerModal.concours.title}
                      subject={viewerModal.concours.matiere || selectedMatiere || ''}
                      school={viewerModal.concours.ecole || selectedEcole || ''}
                      year={viewerModal.concours.annee || ''}
                      style={{ width: '100%', height: '84vh', border: 'none', display: 'block', background: '#ffffff' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', background: '#ffffff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <iframe
                      src={currentViewerUrl}
                      title={`${viewerModal.concours.titre} - ${viewerModal.activeTab}`}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      style={{ width: '100%', height: '84vh', border: 'none', display: 'block', background: '#ffffff' }}
                    />
                  </div>
                )
              ) : (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1'
                }}>
                  <div style={{ fontSize: '42px', marginBottom: '12px' }}>📂</div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Aucun fichier {viewerModal.activeTab === 'sujet' ? 'Sujet' : 'Corrigé'} disponible
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '380px', textAlign: 'center' }}>
                    L'administrateur n'a pas encore téléversé le document correspondant pour cette épreuve.
                  </p>
                </div>
              )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
