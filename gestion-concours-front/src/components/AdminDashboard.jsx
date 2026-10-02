import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  // --- STATE DYAL LES ONGLETS (Tabs) ---
  const [activeTab, setActiveTab] = useState('demandes'); // 'demandes', 'resumes', wla 'concours'

  // ==================== STATES DYAL DEMANDES D'INSCRIPTION ====================
  const [demandesList, setDemandesList] = useState([]);

  // ==================== STATES DYAL RESUMES ====================
  const [resumesList, setResumesList] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  
  const [searchResTitre, setSearchResTitre] = useState('');
  const [selectedResMatiere, setSelectedResMatiere] = useState('');
  const [selectedResChapitre, setSelectedResChapitre] = useState('');
  const [resMatieresList, setResMatieresList] = useState([]);
  const [resChapitresList, setResChapitresList] = useState([]);

  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [resTitre, setResTitre] = useState('');
  const [resMatiere, setResMatiere] = useState('');
  const [resChapitre, setResChapitre] = useState('');
  const [resFile, setResFile] = useState(null);
  const [loadingRes, setLoadingRes] = useState(false);

  // ==================== STATES DYAL CONCOURS BLANCS ====================
  const [concoursList, setConcoursList] = useState([]);
  const [filteredConcours, setFilteredConcours] = useState([]);
  
  const [searchConTitre, setSearchConTitre] = useState('');
  const [selectedConMatiere, setSelectedConMatiere] = useState('');
  const [selectedConChapitre, setSelectedConChapitre] = useState('');
  const [conMatieresList, setConMatieresList] = useState([]);
  const [conChapitresList, setConChapitresList] = useState([]);

  const [isConcoursModalOpen, setIsConcoursModalOpen] = useState(false);
  const [conTitre, setConTitre] = useState('');
  const [conMatiere, setConMatiere] = useState('');
  const [conChapitre, setConChapitre] = useState('');
  const [conFile, setConFile] = useState(null);
  const [loadingCon, setLoadingCon] = useState(false);

  // --- FETCH DATA ---
  const fetchDemandes = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/admin/demandes-inscription', { withCredentials: true });
      setDemandesList(res.data);
    } catch (err) { console.error("Erreur demandes:", err); }
  };

  const fetchResumes = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/resumes', { withCredentials: true });
      const data = res.data;
      setResumesList(data);
      setFilteredResumes(data);
      setResMatieresList([...new Set(data.map(item => item.matiere).filter(Boolean))]);
      setResChapitresList([...new Set(data.map(item => item.chapitre).filter(Boolean))]);
    } catch (err) { console.error("Erreur resumes:", err); }
  };

  const fetchConcours = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/concours-blancs', { withCredentials: true });
      const data = res.data;
      setConcoursList(data);
      setFilteredConcours(data);
      setConMatieresList([...new Set(data.map(item => item.matiere).filter(Boolean))]);
      setConChapitresList([...new Set(data.map(item => item.chapitre).filter(Boolean))]);
    } catch (err) { console.error("Erreur concours:", err); }
  };

  useEffect(() => {
    fetchDemandes();
    fetchResumes();
    fetchConcours();
  }, []);

  // --- ACTIONS: ACCEPTER / REFUSER ---
  const handleAccepter = async (id) => {
    try {
      await axios.post(`http://localhost:8080/api/admin/accepter/${id}`, {}, { withCredentials: true });
      alert("Utilisateur accepté et ajouté au système avec succès ! ✅");
      fetchDemandes();
    } catch (err) {
      alert("Erreur lors de l'acceptation !");
    }
  };

  const handleRefuser = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/admin/refuser/${id}`, { withCredentials: true });
      alert("Demande refusée ❌");
      fetchDemandes();
    } catch (err) {
      alert("Erreur lors du refus !");
    }
  };

  // --- FILTRES RESUMES ---
  useEffect(() => {
    let result = resumesList;
    if (searchResTitre) result = result.filter(item => item.titre?.toLowerCase().includes(searchResTitre.toLowerCase()));
    if (selectedResMatiere) result = result.filter(item => item.matiere === selectedResMatiere);
    if (selectedResChapitre) result = result.filter(item => item.chapitre === selectedResChapitre);
    setFilteredResumes(result);
  }, [searchResTitre, selectedResMatiere, selectedResChapitre, resumesList]);

  // --- FILTRES CONCOURS ---
  useEffect(() => {
    let result = concoursList;
    if (searchConTitre) result = result.filter(item => item.titre?.toLowerCase().includes(searchConTitre.toLowerCase()));
    if (selectedConMatiere) result = result.filter(item => item.matiere === selectedConMatiere);
    if (selectedConChapitre) result = result.filter(item => item.chapitre === selectedConChapitre);
    setFilteredConcours(result);
  }, [searchConTitre, selectedConMatiere, selectedConChapitre, concoursList]);

  // --- SUBMIT RESUME ---
  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    setLoadingRes(true);
    const formData = new FormData();
    formData.append('titre', resTitre);
    formData.append('matiere', resMatiere);
    formData.append('chapitre', resChapitre);
    formData.append('file', resFile);

    try {
      await axios.post('http://localhost:8080/api/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      alert('Résumé ajota b najaḥ!');
      setIsResumeModalOpen(false);
      fetchResumes();
      setResTitre(''); setResMatiere(''); setResChapitre(''); setResFile(null);
    } catch (err) {
      alert("Erreur f l'ajout dyal résumé!");
    } finally { setLoadingRes(false); }
  };

  // --- SUBMIT CONCOURS BLANC ---
  const handleConcoursSubmit = async (e) => {
    e.preventDefault();
    setLoadingCon(true);
    const formData = new FormData();
    formData.append('titre', conTitre);
    formData.append('matiere', conMatiere);
    formData.append('chapitre', conChapitre);
    formData.append('file', conFile);

    try {
      await axios.post('http://localhost:8080/api/concours-blancs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      alert('Concours Blanc ajota b najaḥ!');
      setIsConcoursModalOpen(false);
      fetchConcours();
      setConTitre(''); setConMatiere(''); setConChapitre(''); setConFile(null);
    } catch (err) {
      alert("Erreur f l'ajout dyal concours blanc!");
    } finally { setLoadingCon(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Interface Admin - Tableau de Bord</h1>

      {/* --- ONGLET NAVIGATION --- */}
      <div className="flex space-x-4 mb-6 border-b border-gray-300 pb-2">
        <button
          onClick={() => setActiveTab('demandes')}
          className={`px-6 py-2 font-semibold rounded-t-lg transition ${
            activeTab === 'demandes' ? 'bg-purple-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
        >
          👥 Demandes d'Inscription ({demandesList.length})
        </button>
        <button
          onClick={() => setActiveTab('resumes')}
          className={`px-6 py-2 font-semibold rounded-t-lg transition ${
            activeTab === 'resumes' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
        >
          📄 Gestion des Résumés
        </button>
        <button
          onClick={() => setActiveTab('concours')}
          className={`px-6 py-2 font-semibold rounded-t-lg transition ${
            activeTab === 'concours' ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
        >
          📝 Gestion des Concours Blancs
        </button>
      </div>

      {/* ==================== SECTION 0: DEMANDES D'INSCRIPTION ==================== */}
      {activeTab === 'demandes' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Validation des Comptes (Demandes En Attente)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom d'utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {demandesList.length > 0 ? (
                  demandesList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.email}</td>
                      <td className="px-6 py-4 text-sm text-center space-x-2">
                        <button
                          onClick={() => handleAccepter(item.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRefuser(item.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                        >
                          Refuser
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-6 text-gray-500">Aucune demande d'inscription en attente.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SECTION 1: RESUMES ==================== */}
      {activeTab === 'resumes' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Liste des Résumés</h2>
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Ajouter Résumé
            </button>
          </div>
          <div className="overflow-x-auto mt-4">
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
                {filteredResumes.length > 0 ? (
                  filteredResumes.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.titre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.matiere}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.chapitre}</td>
                      <td className="px-6 py-4 text-sm text-blue-600">
                        <a href={item.pdfUrl || item.pdf_url} target="_blank" rel="noreferrer" className="hover:underline font-medium">Voir PDF</a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-6 text-gray-500">Aucun résumé trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SECTION 2: CONCOURS BLANCS ==================== */}
      {activeTab === 'concours' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Liste des Concours Blancs</h2>
            <button
              onClick={() => setIsConcoursModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              + Ajouter Concours Blanc
            </button>
          </div>
          <div className="overflow-x-auto mt-4">
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
                {filteredConcours.length > 0 ? (
                  filteredConcours.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.titre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.matiere}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.chapitre}</td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        <a href={item.pdfUrl || item.pdf_url} target="_blank" rel="noreferrer" className="hover:underline font-medium">Télécharger / Voir PDF</a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-6 text-gray-500">Aucun concours blanc trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals pour Résumés et Concours */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Ajouter un Résumé</h3>
            <form onSubmit={handleResumeSubmit} className="space-y-3">
              <input type="text" placeholder="Titre" value={resTitre} onChange={(e) => setResTitre(e.target.value)} required className="w-full border p-2 rounded" />
              <input type="text" placeholder="Matière" value={resMatiere} onChange={(e) => setResMatiere(e.target.value)} required className="w-full border p-2 rounded" />
              <input type="text" placeholder="Chapitre" value={resChapitre} onChange={(e) => setResChapitre(e.target.value)} required className="w-full border p-2 rounded" />
              <input type="file" accept="application/pdf" onChange={(e) => setResFile(e.target.files[0])} required className="w-full border p-2 rounded text-sm" />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsResumeModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Annuler</button>
                <button type="submit" disabled={loadingRes} className="bg-blue-600 text-white px-4 py-2 rounded">{loadingRes ? 'En cours...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConcoursModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Ajouter un Concours Blanc</h3>
            <form onSubmit={handleConcoursSubmit} className="space-y-3">
              <input type="text" placeholder="Titre" value={conTitre} onChange={(e) => setConTitre(e.target.value)} required className="w-full border p-2 rounded" />
              <input type="text" placeholder="Matiere" value={conMatiere} onChange={(e) => setConMatiere(e.target.value)} required className="w-full border p-2 rounded" />
              <input type="text" placeholder="Chapitre" value={conChapitre} onChange={(e) => setConChapitre(e.target.value)} required className="w-full border p-2 rounded" />
              <input type="file" accept="application/pdf" onChange={(e) => setConFile(e.target.files[0])} required className="w-full border p-2 rounded text-sm" />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsConcoursModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Annuler</button>
                <button type="submit" disabled={loadingCon} className="bg-green-600 text-white px-4 py-2 rounded">{loadingCon ? 'En cours...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}