import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminConcours() {
  const [concoursList, setConcoursList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  
  // --- STATES DYAL LES FILTRES ---
  const [searchTitre, setSearchTitre] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedChapitre, setSelectedChapitre] = useState('');

  // --- LISTES DYAL LES OPTIONS (BASH Y-T-EMPLIW LES SELECTS AUTOMATIQUEMENT) ---
  const [matieresList, setMatieresList] = useState([]);
  const [chapitresList, setChapitresList] = useState([]);

  // --- STATES DYAL L-MODAL W L-FORMULAIRE ---
  const [isOpen, setIsOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [matiere, setMatiere] = useState('');
  const [chapitre, setChapitre] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Jbd les données men Backend (GET)
  const fetchConcours = async () => {
    try {
      const response = await axios.get('http://localhost:8081/api/concours-blancs', {
        withCredentials: true
      });
      const data = response.data;
      setConcoursList(data);
      setFilteredList(data);

      // Extract unique matieres and chapitres for dropdowns
      const uniqueMatieres = [...new Set(data.map(item => item.matiere).filter(Boolean))];
      const uniqueChapitres = [...new Set(data.map(item => item.chapitre).filter(Boolean))];
      setMatieresList(uniqueMatieres);
      setChapitresList(uniqueChapitres);

    } catch (error) {
      console.error("Erreur f jbd l-concours:", error);
    }
  };

  useEffect(() => {
    fetchConcours();
  }, []);

  // 2. Système dyal l-Filtre (Recherche titre + Select Matière + Select Chapitre)
  useEffect(() => {
    let result = concoursList;
    
    if (searchTitre) {
      result = result.filter(item => item.titre?.toLowerCase().includes(searchTitre.toLowerCase()));
    }
    if (selectedMatiere) {
      result = result.filter(item => item.matiere === selectedMatiere);
    }
    if (selectedChapitre) {
      result = result.filter(item => item.chapitre === selectedChapitre);
    }
    
    setFilteredList(result);
  }, [searchTitre, selectedMatiere, selectedChapitre, concoursList]);

  // 3. Fonction d'Ajout (POST)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('titre', titre);
    formData.append('matiere', matiere);
    formData.append('chapitre', chapitre);
    formData.append('file', file);

    try {
      await axios.post('http://localhost:8081/api/concours-blancs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      alert('Concours Blanc ajota b najaḥ! 🎉');
      setIsOpen(false);
      fetchConcours(); // Refresh l-tableau w les options dyal les selects

      // Vider les inputs
      setTitre('');
      setMatiere('');
      setChapitre('');
      setFile(null);
    } catch (error) {
      console.error("Erreur f l'ajout:", error);
      alert("M-t-ajota-sh, chof l-console!");
    } finally {
      setLoading(false);
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
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header w Boutton Ajouter */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Concours Blancs</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow"
        >
          + Ajouter Concours Blanc
        </button>
      </div>

      {/* --- SECTION DYAL LES FILTRES (Dropdowns + Search) --- */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Recherche par Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher par Titre</label>
          <input
            type="text"
            placeholder="Taper un titre..."
            value={searchTitre}
            onChange={(e) => setSearchTitre(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Select Matière */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par Matière</label>
          <select
            value={selectedMatiere}
            onChange={(e) => setSelectedMatiere(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 bg-white outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Toutes les matières</option>
            {matieresList.map((mat, index) => (
              <option key={index} value={mat}>{mat}</option>
            ))}
          </select>
        </div>

        {/* Select Chapitre + Reset */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par Chapitre</label>
            <select
              value={selectedChapitre}
              onChange={(e) => setSelectedChapitre(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 bg-white outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Tous les chapitres</option>
              {chapitresList.map((chap, index) => (
                <option key={index} value={chap}>{chap}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setSearchTitre(''); setSelectedMatiere(''); setSelectedChapitre(''); }}
            className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 transition h-[42px]"
            title="Réinitialiser les filtres"
          >
            Reset
          </button>
        </div>
      </div>

      {/* --- TABLEAU --- */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Titre</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matière</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Chapitre</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PDF</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredList.length > 0 ? (
              filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.titre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.matiere}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.chapitre}</td>
                  <td className="px-6 py-4 text-sm text-green-600">
                    {item.pdfUrl ? (
                      <a href={getPdfUrl(item.pdfUrl)} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium">
                        Télécharger / Voir PDF
                      </a>
                    ) : (
                      <span className="text-gray-400">Aucun PDF</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                  Aucun concours blanc trouvé avec ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL D'AJOUT --- */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Ajouter un Concours Blanc</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  required
                  placeholder="Ex: Concours ENSA 2025"
                  className="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                <input
                  type="text"
                  value={matiere}
                  onChange={(e) => setMatiere(e.target.value)}
                  required
                  placeholder="Ex: Mathématiques"
                  className="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chapitre</label>
                <input
                  type="text"
                  value={chapitre}
                  onChange={(e) => setChapitre(e.target.value)}
                  required
                  placeholder="Ex: Analyse"
                  className="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fichier PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsOpen(false)} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300">
                  {loading ? 'En cours...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
