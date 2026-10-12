import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminConcours() {
  const [concoursList, setConcoursList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  
  // --- STATES DYAL LES FILTRES ---
  const [searchTitre, setSearchTitre] = useState('');
  const [selectedEcole, setSelectedEcole] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedChapitre, setSelectedChapitre] = useState('');
  const [selectedAnnee, setSelectedAnnee] = useState('');

  // --- LISTES DYAL LES OPTIONS ---
  const [ecolesList, setEcolesList] = useState([]);
  const [matieresList, setMatieresList] = useState([]);
  const [chapitresList, setChapitresList] = useState([]);
  const [anneesList, setAnneesList] = useState([]);

  // --- STATES DYAL L-MODAL W L-FORMULAIRE D'AJOUT ---
  const [isOpen, setIsOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [ecole, setEcole] = useState('');
  const [matiere, setMatiere] = useState('');
  const [chapitre, setChapitre] = useState('');
  const [chapitresDisponibles, setChapitresDisponibles] = useState([]);
  const [annee, setAnnee] = useState('');
  const [dureeMnutes, setDureeMnutes] = useState('');
  const [nombreQuestions, setNombreQuestions] = useState('');
  const [publie, setPublie] = useState(false);
  const [file, setFile] = useState(null);
  const [htmlFile, setHtmlFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const MATIERES = ['Mathématiques', 'Physique-Chimie', 'SVT'];
  const CHAPITRES_PAR_MATIERE = {
    'Mathématiques': ['Suites numériques', 'Limites et continuité', 'Dérivation', 'Intégration', 'Fonctions logarithmiques et exponentielles', 'Probabilités'],
    'Physique-Chimie': ['Mécanique', 'Électricité', 'Ondes', 'Transformations chimiques', 'Cinétique chimique'],
    'SVT': ['Génétique', 'Immunologie', 'Reproduction', 'Géologie', 'Écologie']
  };

  // Charger les chapitres dynamiques quand la matière change
  const handleMatiereChange = async (mat) => {
    setMatiere(mat);
    setChapitre('');
    if (!mat) { setChapitresDisponibles([]); return; }
    // Chapitres par défaut
    const defauts = CHAPITRES_PAR_MATIERE[mat] || [];
    // Enrichir avec les chapitres existants en base
    try {
      const res = await axios.get(`http://localhost:8081/api/concours-blancs/chapitres/all?matiere=${encodeURIComponent(mat)}`);
      const existants = Array.isArray(res.data) ? res.data : [];
      const all = [...new Set([...defauts, ...existants])];
      setChapitresDisponibles(all);
    } catch (e) {
      setChapitresDisponibles(defauts);
    }
  };

  // --- STATES UPLOAD HTML POUR CONCOURS EXISTANT ---
  const [uploadHtmlModalOpen, setUploadHtmlModalOpen] = useState(false);
  const [concoursForHtml, setConcoursForHtml] = useState(null);
  const [standaloneHtmlFile, setStandaloneHtmlFile] = useState(null);
  const [uploadingHtml, setUploadingHtml] = useState(false);

  // --- STATES APERÇU HTML ---
  const [previewHtmlModalOpen, setPreviewHtmlModalOpen] = useState(false);
  const [previewHtmlItem, setPreviewHtmlItem] = useState(null);

  // --- STATES GESTION QCM ---
  const [qcmModalOpen, setQcmModalOpen] = useState(false);
  const [qcmCurrentConcours, setQcmCurrentConcours] = useState(null);
  const [qcmQuestions, setQcmQuestions] = useState([]);
  const [qcmLoading, setQcmLoading] = useState(false);
  const [qcmSaving, setQcmSaving] = useState(false);
  const [qcmStats, setQcmStats] = useState({});

  // 1. Jbd les données men Backend (GET)
  const fetchConcours = async () => {
    try {
      const response = await axios.get('http://localhost:8081/api/concours-blancs', {
        withCredentials: true
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setConcoursList(data);
      setFilteredList(data);

      // Extract unique values
      setEcolesList([...new Set(data.map(item => item.ecole).filter(Boolean))]);
      setMatieresList([...new Set(data.map(item => item.matiere).filter(Boolean))]);
      setChapitresList([...new Set(data.map(item => item.chapitre).filter(Boolean))]);
      setAnneesList([...new Set(data.map(item => item.annee).filter(Boolean))].sort((a, b) => b - a));

      // Charger les stats QCM
      const statsObj = {};
      await Promise.all(data.map(async (cb) => {
        try {
          const s = await axios.get(`http://localhost:8081/api/qcm/concours-blanc/${cb.id}/stats`, { withCredentials: true });
          statsObj[cb.id] = s.data;
        } catch (e) {}
      }));
      setQcmStats(statsObj);

    } catch (error) {
      console.error("Erreur f jbd l-concours:", error);
    }
  };

  useEffect(() => {
    fetchConcours();
  }, []);

  // 2. Système dyal l-Filtre
  useEffect(() => {
    let result = concoursList;
    if (searchTitre) result = result.filter(item => item.titre?.toLowerCase().includes(searchTitre.toLowerCase()));
    if (selectedEcole) result = result.filter(item => item.ecole === selectedEcole);
    if (selectedMatiere) result = result.filter(item => item.matiere === selectedMatiere);
    if (selectedChapitre) result = result.filter(item => item.chapitre === selectedChapitre);
    if (selectedAnnee) result = result.filter(item => String(item.annee) === String(selectedAnnee));
    setFilteredList(result);
  }, [searchTitre, selectedEcole, selectedMatiere, selectedChapitre, selectedAnnee, concoursList]);

  // 3. Fonction d'Ajout (POST)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!htmlFile) {
      alert("Veuillez sélectionner un fichier HTML.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('titre', titre);
    if (description) formData.append('description', description);
    if (ecole) formData.append('ecole', ecole);
    formData.append('matiere', matiere);
    if (chapitre) formData.append('chapitre', chapitre);
    if (annee) formData.append('annee', annee);
    if (dureeMnutes) formData.append('dureeMnutes', dureeMnutes);
    if (nombreQuestions) formData.append('nombreQuestions', nombreQuestions);
    formData.append('publie', 'true');
    formData.append('htmlFile', htmlFile);
    formData.append('file', htmlFile);

    try {
      await axios.post('http://localhost:8081/api/concours-blancs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      alert('Concours Blanc HTML ajouté avec succès ! 🎉');
      setIsOpen(false);
      fetchConcours();

      // Vider les inputs
      setTitre('');
      setDescription('');
      setEcole('');
      setMatiere('');
      setChapitre('');
      setChapitresDisponibles([]);
      setAnnee('');
      setDureeMnutes('');
      setNombreQuestions('');
      setPublie(false);
      setFile(null);
      setHtmlFile(null);
    } catch (error) {
      console.error("Erreur f l'ajout:", error);
      alert("Erreur lors de l'enregistrement !");
    } finally {
      setLoading(false);
    }
  };

  // 3.bis Ajouter un fichier HTML à un concours existant
  const handleUploadHtmlSubmit = async (e) => {
    e.preventDefault();
    if (!concoursForHtml || !standaloneHtmlFile) {
      alert("Veuillez sélectionner un fichier HTML.");
      return;
    }
    setUploadingHtml(true);
    const formData = new FormData();
    formData.append('file', standaloneHtmlFile);

    try {
      await axios.post(`http://localhost:8081/api/concours-blancs/${concoursForHtml.id}/upload-html`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      alert('Fichier HTML ajouté avec succès au concours blanc ! 🎉');
      setUploadHtmlModalOpen(false);
      setConcoursForHtml(null);
      setStandaloneHtmlFile(null);
      fetchConcours();
    } catch (err) {
      console.error("Erreur upload HTML:", err);
      alert("Erreur lors de l'envoi du fichier HTML.");
    } finally {
      setUploadingHtml(false);
    }
  };

  // 4. Supprimer un concours blanc
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce concours blanc ?")) return;
    try {
      await axios.delete(`http://localhost:8081/api/concours-blancs/${id}`, { withCredentials: true });
      alert("Concours blanc supprimé avec succès ! 🗑️");
      fetchConcours();
    } catch (err) {
      alert("Erreur lors de la suppression !");
    }
  };

  // 4bis. Basculer publication
  const handleTogglePublie = async (item) => {
    try {
      await axios.patch(`http://localhost:8081/api/concours-blancs/${item.id}/toggle-publie`, {}, { withCredentials: true });
      fetchConcours();
    } catch (err) {
      alert("Erreur lors du changement de statut.");
    }
  };

  // 5. Gestion QCM
  const handleOpenQcmManager = async (cb) => {
    setQcmCurrentConcours(cb);
    setQcmModalOpen(true);
    setQcmLoading(true);
    try {
      const res = await axios.get(`http://localhost:8081/api/qcm/concours-blanc/${cb.id}`, { withCredentials: true });
      setQcmQuestions(res.data.questions || []);
    } catch (err) {
      console.error("Erreur chargement questions QCM:", err);
      alert("Erreur lors du chargement des questions QCM.");
    } finally {
      setQcmLoading(false);
    }
  };

  const handleForceExtractQcm = async () => {
    if (!qcmCurrentConcours) return;
    if (!window.confirm("Voulez-vous relancer l'extraction automatique des questions depuis le PDF ?")) return;
    setQcmLoading(true);
    try {
      const res = await axios.post(`http://localhost:8081/api/qcm/concours-blanc/${qcmCurrentConcours.id}/extract`, {}, { withCredentials: true });
      alert(res.data.message || "Extraction terminée !");
      const qRes = await axios.get(`http://localhost:8081/api/qcm/concours-blanc/${qcmCurrentConcours.id}`, { withCredentials: true });
      setQcmQuestions(qRes.data.questions || []);
      fetchConcours();
    } catch (err) {
      console.error("Erreur extraction QCM:", err);
      alert("Erreur lors de l'extraction : " + (err.response?.data || err.message));
    } finally {
      setQcmLoading(false);
    }
  };

  const handleQuestionChange = (qId, field, value) => {
    setQcmQuestions(prev => prev.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };

  const handleSaveQcmCorrections = async () => {
    if (!qcmCurrentConcours) return;
    setQcmSaving(true);
    try {
      const payload = qcmQuestions.map(q => ({
        questionId: String(q.id),
        correctChoiceLabel: q.correctChoiceLabel || '',
        explanation: q.explanation || ''
      }));
      await axios.put(`http://localhost:8081/api/qcm/concours-blanc/${qcmCurrentConcours.id}/corrections-batch`, payload, { withCredentials: true });
      alert("Toutes les corrections et explications ont été enregistrées avec succès ! ✅");
      fetchConcours();
    } catch (err) {
      console.error("Erreur sauvegarde corrections:", err);
      alert("Erreur lors de la sauvegarde : " + (err.response?.data || err.message));
    } finally {
      setQcmSaving(false);
    }
  };

  const getPdfUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `http://localhost:8081/uploads/${url}`;
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      {/* Header w Boutton Ajouter */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Concours Blancs & QCM</h2>
          <p className="text-sm text-gray-500 mt-1">Extraction automatique des questions et gestion des corrigés</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition shadow font-medium flex items-center gap-2"
        >
          <span>+</span> Ajouter Concours Blanc
        </button>
      </div>

      {/* --- SECTION DYAL LES FILTRES --- */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
        {/* Recherche par Titre */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Recherche par Titre</label>
          <input
            type="text"
            placeholder="Taper un titre..."
            value={searchTitre}
            onChange={(e) => setSearchTitre(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Select École */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">École</label>
          <select
            value={selectedEcole}
            onChange={(e) => setSelectedEcole(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Toutes les écoles</option>
            {ecolesList.map((ec, index) => (
              <option key={index} value={ec}>{ec}</option>
            ))}
          </select>
        </div>

        {/* Select Matière */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Matière</label>
          <select
            value={selectedMatiere}
            onChange={(e) => setSelectedMatiere(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Toutes les matières</option>
            {matieresList.map((mat, index) => (
              <option key={index} value={mat}>{mat}</option>
            ))}
          </select>
        </div>

        {/* Select Année */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Année</label>
          <select
            value={selectedAnnee}
            onChange={(e) => setSelectedAnnee(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Toutes les années</option>
            {anneesList.map((ann, index) => (
              <option key={index} value={ann}>{ann}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <div className="flex items-end">
          <button
            onClick={() => { setSearchTitre(''); setSelectedEcole(''); setSelectedMatiere(''); setSelectedChapitre(''); setSelectedAnnee(''); }}
            className="w-full bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 transition text-sm font-medium"
            title="Réinitialiser les filtres"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* --- TABLEAU --- */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Titre / Chapitre</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matière</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Durée</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Questions QCM</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fichier</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredList.length > 0 ? (
              filteredList.map((item) => {
                const stats = qcmStats[item.id];
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm">
                      <div className="font-bold text-gray-900">{item.titre}</div>
                      {item.chapitre && <div className="text-xs text-gray-500 mt-0.5">📖 {item.chapitre}</div>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-semibold">{item.matiere}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 font-medium">
                      {item.dureeMnutes ? `⏱️ ${item.dureeMnutes} min` : '-'}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <button
                        onClick={() => handleTogglePublie(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer border-0 ${
                          item.publie ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={item.publie ? 'Cliquer pour dépublier' : 'Cliquer pour publier'}
                      >
                        {item.publie ? '✅ Publié' : '🔒 Brouillon'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {stats && stats.totalQuestions > 0 ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          stats.allCorrected ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          ⚡ {stats.totalQuestions} ({stats.correctedQuestions} corrigés)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                          {item.htmlUrl ? '🌐 HTML' : '📄 En attente'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <div className="flex flex-col gap-1.5">
                        {item.pdfUrl && (
                          <a href={getPdfUrl(item.pdfUrl)} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline font-semibold flex items-center gap-1 text-xs">
                            📄 PDF
                          </a>
                        )}
                        {item.htmlUrl && (
                          <button
                            onClick={() => { setPreviewHtmlItem(item); setPreviewHtmlModalOpen(true); }}
                            className="text-blue-600 hover:underline font-semibold flex items-center gap-1 text-xs text-left"
                          >
                            🌐 HTML (Voir)
                          </button>
                        )}
                        {!item.pdfUrl && !item.htmlUrl && (
                          <span className="text-gray-400 text-xs">Aucun fichier</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-center">
                      <div className="flex justify-center items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleOpenQcmManager(item)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded transition shadow-sm"
                        >
                          🎯 QCM
                        </button>
                        <button
                          onClick={() => { setConcoursForHtml(item); setUploadHtmlModalOpen(true); }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded transition shadow-sm"
                        >
                          🌐 {item.htmlUrl ? 'Modifier HTML' : '+ HTML'}
                        </button>
                        {item.htmlUrl && (
                          <button
                            onClick={() => { setPreviewHtmlItem(item); setPreviewHtmlModalOpen(true); }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded transition shadow-sm"
                          >
                            👁️ Voir
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1.5 border border-red-200 rounded hover:bg-red-50 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                  Aucun concours blanc trouvé avec ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL D'AJOUT --- */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold text-gray-800">Ajouter un Concours Blanc</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du QCM *</label>
                <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} required
                  placeholder="Ex: QCM Suites numériques 01"
                  className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Matière (select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
                <select value={matiere} onChange={(e) => handleMatiereChange(e.target.value)} required
                  className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">-- Choisir une matière --</option>
                  {MATIERES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Chapitre (select dynamique + saisie libre) */}
              {matiere && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chapitre</label>
                  <select value={chapitre} onChange={(e) => setChapitre(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">-- Choisir ou saisir un chapitre --</option>
                    {chapitresDisponibles.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                  </select>
                  <input type="text" value={chapitre} onChange={(e) => setChapitre(e.target.value)}
                    placeholder="Ou saisir un nouveau chapitre..."
                    className="w-full mt-1 border border-dashed border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={2} placeholder="Courte description du QCM..."
                  className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Durée & Questions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">⏱️ Durée (minutes)</label>
                  <input type="number" value={dureeMnutes} onChange={(e) => setDureeMnutes(e.target.value)}
                    placeholder="Ex: 30" min="1"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">❓ Nombre de questions</label>
                  <input type="number" value={nombreQuestions} onChange={(e) => setNombreQuestions(e.target.value)}
                    placeholder="Ex: 20" min="1"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Fichier HTML */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🌐 Fichier HTML interactif *</label>
                <input type="file" accept=".html,.htm,text/html" onChange={(e) => setHtmlFile(e.target.files[0])} required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <small className="text-gray-500 block mt-1 text-xs">💡 Fichier HTML complet (QCM interactif, styles, timer et corrigé).</small>
              </div>

              {/* Publié */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" id="publieCheck" checked={publie} onChange={(e) => setPublie(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="publieCheck" className="text-sm font-medium text-gray-700 cursor-pointer">
                  ✅ Publier immédiatement (visible pour les clients)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsOpen(false)} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">Annuler</button>
                <button type="submit" disabled={loading} className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300 text-sm font-medium">
                  {loading ? 'Enregistrement...' : '💾 Enregistrer le QCM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL GESTION QCM ET CORRIGÉ (ADMIN) --- */}
      {qcmModalOpen && qcmCurrentConcours && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-800">🎯 Gestion du QCM & Corrigés</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>{qcmCurrentConcours.titre}</strong>
                  {qcmCurrentConcours.ecole ? ` • ${qcmCurrentConcours.ecole}` : ''}
                  {` • ${qcmCurrentConcours.matiere}`}
                  {qcmCurrentConcours.annee ? ` (${qcmCurrentConcours.annee})` : ''}
                  {` — ${qcmQuestions.length} question(s) détectée(s)`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleForceExtractQcm}
                  disabled={qcmLoading}
                  className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-100 transition"
                  title="Relancer l'extraction automatique depuis le fichier PDF"
                >
                  🔄 Ré-extraire PDF
                </button>
                <button onClick={() => setQcmModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
              </div>
            </div>

            {qcmLoading ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-3xl mb-2">⏳</div>
                <p className="font-semibold text-sm">Chargement et analyse des questions QCM...</p>
              </div>
            ) : qcmQuestions.length === 0 ? (
              <div className="text-center py-12 px-4 bg-gray-50 rounded-lg my-4 border border-dashed border-gray-300">
                <div className="text-4xl mb-2">📄</div>
                <h4 className="font-bold text-gray-800 mb-1">Aucune question QCM détectée</h4>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  Le PDF ne semble pas contenir de questions au format QCM standard (Q1, Choix A, B, C, D...).
                </p>
                <button
                  onClick={handleForceExtractQcm}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700"
                >
                  🔄 Relancer l'extraction automatique
                </button>
              </div>
            ) : (
              <div className="space-y-4 my-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm">
                  💡 <strong>Instructions Admin :</strong> Si le corrigé n'a pas été détecté automatiquement dans le document, sélectionnez manuellement la <strong>bonne réponse</strong> (A, B, C, D) et rédigez une <strong>explication détaillée</strong>.
                </div>

                {qcmQuestions.map((q, idx) => {
                  const hasCorrection = Boolean(q.correctChoiceLabel && q.correctChoiceLabel.trim());
                  return (
                    <div key={q.id || idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="bg-gray-800 text-white font-bold text-xs px-2.5 py-1 rounded-full">
                          Question {q.questionNumber || idx + 1}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          hasCorrection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {hasCorrection ? `✅ Bonne réponse : ${q.correctChoiceLabel}` : '⚠️ Corrigé absent'}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-3 rounded mb-3 leading-relaxed">
                        {q.questionText}
                      </p>

                      <div className="space-y-1.5 mb-3">
                        {(q.choices || []).map((choice, cIdx) => {
                          const isCorrect = q.correctChoiceLabel === choice.choiceLabel;
                          return (
                            <div
                              key={choice.id || cIdx}
                              className={`flex items-center gap-2.5 p-2 rounded border text-sm ${
                                isCorrect ? 'bg-green-50 border-green-300 font-semibold text-green-900' : 'border-gray-200 text-gray-700'
                              }`}
                            >
                              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                                isCorrect ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {choice.choiceLabel}
                              </span>
                              <span>{choice.choiceText}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-gray-50 p-3 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Bonne réponse :
                          </label>
                          <select
                            value={q.correctChoiceLabel || ''}
                            onChange={(e) => handleQuestionChange(q.id, 'correctChoiceLabel', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-white font-bold text-gray-800 outline-none"
                          >
                            <option value="">-- Non définie --</option>
                            {(q.choices || []).map((c, cIdx) => (
                              <option key={cIdx} value={c.choiceLabel}>Option {c.choiceLabel}</option>
                            ))}
                            {(!q.choices || q.choices.length === 0) && (
                              <>
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Explication détaillée de la correction :
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ex: Formule utilisée, démonstration ou rappel de cours..."
                            value={q.explanation || ''}
                            onChange={(e) => handleQuestionChange(q.id, 'explanation', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setQcmModalOpen(false)}
                className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium"
              >
                Fermer
              </button>
              {qcmQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveQcmCorrections}
                  disabled={qcmSaving}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md text-sm font-bold flex items-center gap-2"
                >
                  {qcmSaving ? 'Enregistrement...' : '💾 Enregistrer toutes les corrections'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL UPLOAD FICHIER HTML POUR CONCOURS EXISTANT --- */}
      {uploadHtmlModalOpen && concoursForHtml && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">Ajouter un Fichier HTML</h3>
              <button onClick={() => { setUploadHtmlModalOpen(false); setConcoursForHtml(null); }} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleUploadHtmlSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                <strong>Concours :</strong> {concoursForHtml.titre} ({concoursForHtml.matiere})
                {concoursForHtml.htmlUrl && (
                  <div className="mt-1 text-emerald-700 font-semibold">
                    ✓ Un fichier HTML existe déjà. Téléverser un nouveau fichier le remplacera.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sélectionner le fichier HTML</label>
                <input
                  type="file"
                  accept=".html,.htm,text/html"
                  onChange={(e) => setStandaloneHtmlFile(e.target.files[0])}
                  required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <small className="text-gray-500 block mt-1 text-xs">
                  Formats acceptés : .html, .htm (avec MathJax, styles, scripts...).
                </small>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setUploadHtmlModalOpen(false); setConcoursForHtml(null); }}
                  className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploadingHtml}
                  className="bg-emerald-600 text-white px-5 py-2 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300 text-sm font-medium"
                >
                  {uploadingHtml ? 'Téléversement...' : 'Téléverser le HTML'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL APERÇU HTML --- */}
      {previewHtmlModalOpen && previewHtmlItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span>🌐</span> {previewHtmlItem.titre}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {previewHtmlItem.matiere} {previewHtmlItem.ecole ? `• ${previewHtmlItem.ecole}` : ''} {previewHtmlItem.annee ? `(${previewHtmlItem.annee})` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={getPdfUrl(previewHtmlItem.htmlUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1"
                >
                  Plein écran ↗
                </a>
                <button
                  onClick={() => { setPreviewHtmlModalOpen(false); setPreviewHtmlItem(null); }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white p-2 overflow-hidden">
              <iframe
                src={getPdfUrl(previewHtmlItem.htmlUrl)}
                title={previewHtmlItem.titre}
                className="w-full h-[76vh] border-0 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
