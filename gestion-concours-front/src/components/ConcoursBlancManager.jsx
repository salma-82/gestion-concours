import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toBackendResourceUrl } from '../backendResourceUrl';

export default function AdminConcours() {
  const [concoursList, setConcoursList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  
  // --- STATES DYAL LES FILTRES ---
  const [searchTitre, setSearchTitre] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedChapitre, setSelectedChapitre] = useState('');

  // --- LISTES DYAL LES OPTIONS ---
  const [matieresList, setMatieresList] = useState([]);
  const [chapitresList, setChapitresList] = useState([]);

  // --- STATES DYAL L-MODAL W L-FORMULAIRE D'AJOUT ---
  const [isOpen, setIsOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [matiere, setMatiere] = useState('');
  const [chapitre, setChapitre] = useState('');
  const [chapitresDisponibles, setChapitresDisponibles] = useState([]);
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
      const res = await axios.get(`/api/concours-blancs/chapitres/all?matiere=${encodeURIComponent(mat)}`);
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

  // 1. Jbd les données men Backend (GET)
  const fetchConcours = async () => {
    try {
      const response = await axios.get('/api/concours-blancs', {
        withCredentials: true
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setConcoursList(data);
      setFilteredList(data);

      // Extract unique values
      setMatieresList([...new Set(data.map(item => item.matiere).filter(Boolean))]);
      setChapitresList([...new Set(data.map(item => item.chapitre).filter(Boolean))]);



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
    if (selectedMatiere) result = result.filter(item => item.matiere === selectedMatiere);
    if (selectedChapitre) result = result.filter(item => item.chapitre === selectedChapitre);
    setFilteredList(result);
  }, [searchTitre, selectedMatiere, selectedChapitre, concoursList]);

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
    formData.append('matiere', matiere);
    if (chapitre) formData.append('chapitre', chapitre);
    if (dureeMnutes) formData.append('dureeMnutes', dureeMnutes);
    if (nombreQuestions) formData.append('nombreQuestions', nombreQuestions);
    formData.append('publie', 'true');
    formData.append('htmlFile', htmlFile);
    formData.append('file', htmlFile);

    try {
      await axios.post('/api/concours-blancs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      alert('Concours Blanc HTML ajouté avec succès ! 🎉');
      setIsOpen(false);
      fetchConcours();

      // Vider les inputs
      setTitre('');
      setDescription('');
      setMatiere('');
      setChapitre('');
      setChapitresDisponibles([]);
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
      await axios.post(`/api/concours-blancs/${concoursForHtml.id}/upload-html`, formData, {
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
      await axios.delete(`/api/concours-blancs/${id}`, { withCredentials: true });
      alert("Concours blanc supprimé avec succès ! 🗑️");
      fetchConcours();
    } catch (err) {
      alert("Erreur lors de la suppression !");
    }
  };

  // 4bis. Basculer publication
  const handleTogglePublie = async (item) => {
    try {
      await axios.patch(`/api/concours-blancs/${item.id}/toggle-publie`, {}, { withCredentials: true });
      fetchConcours();
    } catch (err) {
      alert("Erreur lors du changement de statut.");
    }
  };

  const getPdfUrl = (url) => {
    if (!url) return '#';
    const normalizedUrl = toBackendResourceUrl(url);
    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://') || normalizedUrl.startsWith('/')) return normalizedUrl;
    return `/uploads/${normalizedUrl}`;
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      {/* Header w Boutton Ajouter */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Concours Blancs</h2>
          <p className="text-sm text-gray-500 mt-1">Importation et gestion des fichiers HTML</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition shadow font-medium flex items-center gap-2"
        >
          <span>+</span> Ajouter Concours Blanc
        </button>
      </div>

      {/* --- SECTION DYAL LES FILTRES --- */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
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

        {/* Reset */}
        <div className="flex items-end">
          <button
            onClick={() => { setSearchTitre(''); setSelectedMatiere(''); setSelectedChapitre(''); }}
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
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fichier</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredList.length > 0 ? (
              filteredList.map((item) => {
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
                      <div className="flex flex-col gap-1.5">
                        {item.htmlUrl && (
                          <button
                            onClick={() => { setPreviewHtmlItem(item); setPreviewHtmlModalOpen(true); }}
                            className="text-blue-600 hover:underline font-semibold flex items-center gap-1 text-xs text-left"
                          >
                            🌐 HTML (Voir)
                          </button>
                        )}
                        {!item.htmlUrl && (
                          <span className="text-gray-400 text-xs">Aucun fichier</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-center">
                      <div className="flex justify-center items-center gap-2 flex-wrap">
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
                  {previewHtmlItem.matiere}
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
