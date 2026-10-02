import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  // --- STATE DYAL LES ONGLETS (Tabs) ---
  const [activeTab, setActiveTab] = useState('demandes'); // 'demandes', 'users', 'realConcours', 'resumes', 'concours'

  // ==================== STATES DYAL DEMANDES D'INSCRIPTION ====================
  const [demandesList, setDemandesList] = useState([]);

  // ==================== STATES DYAL UTILISATEURS ====================
  const [usersList, setUsersList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usersError, setUsersError] = useState('');

  // ==================== STATES DYAL CONCOURS (REELS) ====================
  const [realConcoursList, setRealConcoursList] = useState([]);
  const [filteredRealConcours, setFilteredRealConcours] = useState([]);

  const [searchRealTitre, setSearchRealTitre] = useState('');
  const [selectedRealEcole, setSelectedRealEcole] = useState('');
  const [selectedRealMatiere, setSelectedRealMatiere] = useState('');
  const [selectedRealAnnee, setSelectedRealAnnee] = useState('');
  const [realEcolesList, setRealEcolesList] = useState([]);
  const [realMatieresList, setRealMatieresList] = useState([]);
  const [realAnneesList, setRealAnneesList] = useState([]);

  const [isRealConcoursModalOpen, setIsRealConcoursModalOpen] = useState(false);
  const [realTitre, setRealTitre] = useState('');
  const [realEcole, setRealEcole] = useState('');
  const [realMatiere, setRealMatiere] = useState('');
  const [realAnnee, setRealAnnee] = useState('');
  const [realFileSujet, setRealFileSujet] = useState(null);
  const [realFileCorrection, setRealFileCorrection] = useState(null);
  const [loadingRealCon, setLoadingRealCon] = useState(false);

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
      setDemandesList(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Erreur demandes:", err); }
  };

  const fetchUsers = async () => {
    try {
      setUsersError('');
      const res = await axios.get('http://localhost:8080/api/admin/users', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      setUsersList(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Erreur utilisateurs:", err);
      setUsersError("⚠️ Impossible de charger les utilisateurs depuis le serveur (Erreur HTTP 403 / 500). Redémarrez le serveur backend Spring Boot !");
    }
  };

  const fetchRealConcours = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/concours', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      setRealConcoursList(data);
      setFilteredRealConcours(data);
      setRealEcolesList([...new Set(data.map(item => item.ecole).filter(Boolean))]);
      setRealMatieresList([...new Set(data.map(item => item.matiere).filter(Boolean))]);
      setRealAnneesList([...new Set(data.map(item => item.annee).filter(Boolean))]);
    } catch (err) { console.error("Erreur fetch real concours:", err); }
  };

  const fetchResumes = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/resumes', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      setResumesList(data);
      setFilteredResumes(data);
      setResMatieresList([...new Set(data.map(item => item.matiere).filter(Boolean))]);
      setResChapitresList([...new Set(data.map(item => item.chapitre).filter(Boolean))]);
    } catch (err) { console.error("Erreur resumes:", err); }
  };

  const fetchConcours = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/concours-blancs', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      setConcoursList(data);
      setFilteredConcours(data);
      setConMatieresList([...new Set(data.map(item => item.matiere).filter(Boolean))]);
      setConChapitresList([...new Set(data.map(item => item.chapitre).filter(Boolean))]);
    } catch (err) { console.error("Erreur concours:", err); }
  };

  useEffect(() => {
    fetchDemandes();
    fetchUsers();
    fetchRealConcours();
    fetchResumes();
    fetchConcours();
  }, []);

  // --- ACTIONS: ACCEPTER / REFUSER ---
  const handleAccepter = async (id) => {
    try {
      await axios.post(`http://localhost:8080/api/admin/accepter/${id}`, {}, { withCredentials: true });
      alert("Utilisateur accepté et ajouté au système avec succès ! ✅");
      fetchDemandes();
      fetchUsers();
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

  // --- ACTIONS CONCOURS (REELS): AJOUT / SUPPRESSION ---
  const handleRealConcoursSubmit = async (e) => {
    e.preventDefault();
    setLoadingRealCon(true);
    const formData = new FormData();
    formData.append('titre', realTitre);
    formData.append('ecole', realEcole);
    formData.append('matiere', realMatiere);
    formData.append('annee', realAnnee);
    if (realFileSujet) formData.append('fileSujet', realFileSujet);
    if (realFileCorrection) formData.append('fileCorrection', realFileCorrection);

    try {
      await axios.post('http://localhost:8080/api/concours', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      alert('Concours ajouté avec succès ! 🎉');
      setIsRealConcoursModalOpen(false);
      fetchRealConcours();
      setRealTitre(''); setRealEcole(''); setRealMatiere(''); setRealAnnee(''); setRealFileSujet(null); setRealFileCorrection(null);
    } catch (err) {
      alert("Erreur lors de l'ajout du concours!");
    } finally { setLoadingRealCon(false); }
  };

  const handleDeleteRealConcours = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce concours ?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/concours/${id}`, { withCredentials: true });
      alert("Concours supprimé avec succès ! 🗑️");
      fetchRealConcours();
    } catch (err) {
      alert("Erreur lors de la suppression du concours!");
    }
  };

  // --- FILTRES CONCOURS (REELS) ---
  useEffect(() => {
    let result = realConcoursList;
    if (searchRealTitre) result = result.filter(item => item.titre?.toLowerCase().includes(searchRealTitre.toLowerCase()));
    if (selectedRealEcole) result = result.filter(item => item.ecole === selectedRealEcole);
    if (selectedRealMatiere) result = result.filter(item => item.matiere === selectedRealMatiere);
    if (selectedRealAnnee) result = result.filter(item => String(item.annee) === String(selectedRealAnnee));
    setFilteredRealConcours(result);
  }, [searchRealTitre, selectedRealEcole, selectedRealMatiere, selectedRealAnnee, realConcoursList]);

  // --- FILTRES UTILISATEURS PAR DATE ET RECHERCHE ---
  useEffect(() => {
    let result = usersList;
    if (searchUser) {
      const q = searchUser.toLowerCase();
      result = result.filter(u => 
        (u.nom && u.nom.toLowerCase().includes(q)) ||
        (u.prenom && u.prenom.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
      );
    }
    if (startDate) {
      result = result.filter(u => {
        if (!u.createdAt) return false;
        const uDate = String(u.createdAt).substring(0, 10);
        return uDate >= startDate;
      });
    }
    if (endDate) {
      result = result.filter(u => {
        if (!u.createdAt) return false;
        const uDate = String(u.createdAt).substring(0, 10);
        return uDate <= endDate;
      });
    }
    setFilteredUsers(result);
  }, [searchUser, startDate, endDate, usersList]);

  // --- FILTRES RESUMES ---
  useEffect(() => {
    let result = resumesList;
    if (searchResTitre) result = result.filter(item => item.titre?.toLowerCase().includes(searchResTitre.toLowerCase()));
    if (selectedResMatiere) result = result.filter(item => item.matiere === selectedResMatiere);
    if (selectedResChapitre) result = result.filter(item => item.chapitre === selectedResChapitre);
    setFilteredResumes(result);
  }, [searchResTitre, selectedResMatiere, selectedResChapitre, resumesList]);

  // --- FILTRES CONCOURS BLANCS ---
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

  const getPdfUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `http://localhost:8080/uploads/${url}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Interface Admin - Tableau de Bord</h1>

      {/* --- ONGLET NAVIGATION --- */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-300 pb-2">
        <button
          onClick={() => setActiveTab('demandes')}
          className={`px-5 py-2 font-semibold rounded-t-lg transition ${
            activeTab === 'demandes' ? 'bg-purple-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
        >
          👥 Demandes ({demandesList.length})
        </button>
        <button
          onClick={() => { setActiveTab('users'); fetchUsers(); }}
          className={`px-5 py-2 font-semibold rounded-t-lg transition ${
            activeTab === 'users' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
        >
          👤 Utilisateurs ({usersList.length})
        </button>
        <button
          onClick={() => { setActiveTab('realConcours'); fetchRealConcours(); }}
          className={`px-5 py-2 font-semibold rounded-t-lg transition ${
            activeTab === 'realConcours' ? 'bg-amber-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
        >
          🏆 Gestion des Concours ({realConcoursList.length})
        </button>
        <button
          onClick={() => setActiveTab('resumes')}
          className={`px-5 py-2 font-semibold rounded-t-lg transition ${
            activeTab === 'resumes' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
        >
          📄 Résumés
        </button>
        <button
          onClick={() => setActiveTab('concours')}
          className={`px-5 py-2 font-semibold rounded-t-lg transition ${
            activeTab === 'concours' ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
        >
          📝 Concours Blancs
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

      {/* ==================== SECTION 1: LISTE DES UTILISATEURS ==================== */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          {usersError && (
            <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 font-medium rounded shadow-sm flex justify-between items-center">
              <span>{usersError}</span>
              <button onClick={fetchUsers} className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Réessayer</button>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800">Liste des Utilisateurs Validés</h2>
            
            {/* --- FILTRES PAR DATE ET PAR NOM/EMAIL --- */}
            <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 w-full md:w-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Recherche</label>
                <input
                  type="text"
                  placeholder="Nom, email, rôle..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">📅 Date Début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">📅 Date Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {(startDate || endDate || searchUser) && (
                <div className="flex items-end">
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); setSearchUser(''); }}
                    className="bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-400 transition"
                  >
                    Réinitialiser
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom / Prénom</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date Création</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.nom || item.username || item.email} {item.prenom ? `(${item.prenom})` : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.role || 'CLIENT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.active === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.active === 1 ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-500">
                      Aucun utilisateur trouvé dans la base de données (ou filtre actif).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SECTION 2: GESTION DES CONCOURS (REELS) ==================== */}
      {activeTab === 'realConcours' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Gestion des Concours (Sujets & Corrections)</h2>
            <button
              onClick={() => setIsRealConcoursModalOpen(true)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition shadow"
            >
              + Ajouter un Concours
            </button>
          </div>

          {/* --- BARRE DE FILTRES --- */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Recherche par Titre</label>
              <input
                type="text"
                placeholder="Titre..."
                value={searchRealTitre}
                onChange={(e) => setSearchRealTitre(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">🏫 Filtrer par École</label>
              <select
                value={selectedRealEcole}
                onChange={(e) => setSelectedRealEcole(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">Toutes les écoles</option>
                {realEcolesList.map((ec, idx) => (
                  <option key={idx} value={ec}>{ec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">📚 Filtrer par Matière</label>
              <select
                value={selectedRealMatiere}
                onChange={(e) => setSelectedRealMatiere(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">Toutes les matières</option>
                {realMatieresList.map((mat, idx) => (
                  <option key={idx} value={mat}>{mat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">📅 Filtrer par Année</label>
              <select
                value={selectedRealAnnee}
                onChange={(e) => setSelectedRealAnnee(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">Toutes les années</option>
                {realAnneesList.map((an, idx) => (
                  <option key={idx} value={an}>{an}</option>
                ))}
              </select>
            </div>

            {(searchRealTitre || selectedRealEcole || selectedRealMatiere || selectedRealAnnee) && (
              <div>
                <button
                  onClick={() => { setSearchRealTitre(''); setSelectedRealEcole(''); setSelectedRealMatiere(''); setSelectedRealAnnee(''); }}
                  className="w-full bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-400 transition"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">École</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matière</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Année</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sujet PDF</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Correction PDF</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRealConcours.length > 0 ? (
                  filteredRealConcours.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.titre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.ecole}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.matiere}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{item.annee}</td>
                      <td className="px-6 py-4 text-sm text-amber-600">
                        {item.pdfUrl ? (
                          <a href={getPdfUrl(item.pdfUrl)} target="_blank" rel="noreferrer" className="hover:underline font-medium">📄 Sujet PDF</a>
                        ) : <span className="text-gray-400">Aucun</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {item.pdfCorrectionUrl ? (
                          <a href={getPdfUrl(item.pdfCorrectionUrl)} target="_blank" rel="noreferrer" className="hover:underline font-medium">✅ Correction PDF</a>
                        ) : <span className="text-gray-400">Aucune</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <button
                          onClick={() => handleDeleteRealConcours(item.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="text-center py-6 text-gray-500">Aucun concours trouvé dans la base de données.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SECTION 3: RESUMES ==================== */}
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

          {/* --- BARRE DE FILTRES POUR RESUMES --- */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Recherche par Titre</label>
              <input
                type="text"
                placeholder="Titre du résumé..."
                value={searchResTitre}
                onChange={(e) => setSearchResTitre(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">📚 Filtrer par Matière</label>
              <select
                value={selectedResMatiere}
                onChange={(e) => setSelectedResMatiere(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Toutes les matières</option>
                {resMatieresList.map((mat, idx) => (
                  <option key={idx} value={mat}>{mat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">📖 Filtrer par Chapitre</label>
              <select
                value={selectedResChapitre}
                onChange={(e) => setSelectedResChapitre(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Tous les chapitres</option>
                {resChapitresList.map((chap, idx) => (
                  <option key={idx} value={chap}>{chap}</option>
                ))}
              </select>
            </div>

            {(searchResTitre || selectedResMatiere || selectedResChapitre) && (
              <div>
                <button
                  onClick={() => { setSearchResTitre(''); setSelectedResMatiere(''); setSelectedResChapitre(''); }}
                  className="w-full bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-400 transition"
                >
                  Réinitialiser
                </button>
              </div>
            )}
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
                        <a href={getPdfUrl(item.pdfUrl || item.pdf_url)} target="_blank" rel="noreferrer" className="hover:underline font-medium">Voir PDF</a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-6 text-gray-500">Aucun résumé trouvé pour les critères sélectionnés.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SECTION 4: CONCOURS BLANCS ==================== */}
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

          {/* --- BARRE DE FILTRES POUR CONCOURS BLANCS --- */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Recherche par Titre</label>
              <input
                type="text"
                placeholder="Titre du concours..."
                value={searchConTitre}
                onChange={(e) => setSearchConTitre(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">📚 Filtrer par Matière</label>
              <select
                value={selectedConMatiere}
                onChange={(e) => setSelectedConMatiere(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Toutes les matières</option>
                {conMatieresList.map((mat, idx) => (
                  <option key={idx} value={mat}>{mat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">📖 Filtrer par Chapitre</label>
              <select
                value={selectedConChapitre}
                onChange={(e) => setSelectedConChapitre(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Tous les chapitres</option>
                {conChapitresList.map((chap, idx) => (
                  <option key={idx} value={chap}>{chap}</option>
                ))}
              </select>
            </div>

            {(searchConTitre || selectedConMatiere || selectedConChapitre) && (
              <div>
                <button
                  onClick={() => { setSearchConTitre(''); setSelectedConMatiere(''); setSelectedConChapitre(''); }}
                  className="w-full bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-400 transition"
                >
                  Réinitialiser
                </button>
              </div>
            )}
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
                        <a href={getPdfUrl(item.pdfUrl || item.pdf_url)} target="_blank" rel="noreferrer" className="hover:underline font-medium">Télécharger / Voir PDF</a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-6 text-gray-500">Aucun concours blanc trouvé pour les critères sélectionnés.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal pour Concours (Réels) */}
      {isRealConcoursModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Ajouter un Concours</h3>
              <button onClick={() => setIsRealConcoursModalOpen(false)} className="text-gray-500 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleRealConcoursSubmit} className="space-y-3">
              <input type="text" placeholder="Titre (Ex: Concours ENSA 2025)" value={realTitre} onChange={(e) => setRealTitre(e.target.value)} required className="w-full border p-2 rounded text-sm" />
              <input type="text" placeholder="École (Ex: ENSA, ENCG, FST)" value={realEcole} onChange={(e) => setRealEcole(e.target.value)} required className="w-full border p-2 rounded text-sm" />
              <input type="text" placeholder="Matière (Ex: Mathématiques)" value={realMatiere} onChange={(e) => setRealMatiere(e.target.value)} required className="w-full border p-2 rounded text-sm" />
              <input type="number" placeholder="Année (Ex: 2025)" value={realAnnee} onChange={(e) => setRealAnnee(e.target.value)} required className="w-full border p-2 rounded text-sm" />
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">📄 PDF Sujet (Optionnel)</label>
                <input type="file" accept="application/pdf" onChange={(e) => setRealFileSujet(e.target.files[0])} className="w-full border p-1 rounded text-xs" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">✅ PDF Correction (Optionnel)</label>
                <input type="file" accept="application/pdf" onChange={(e) => setRealFileCorrection(e.target.files[0])} className="w-full border p-1 rounded text-xs" />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsRealConcoursModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded text-sm">Annuler</button>
                <button type="submit" disabled={loadingRealCon} className="bg-amber-600 text-white px-4 py-2 rounded text-sm">{loadingRealCon ? 'En cours...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals pour Résumés et Concours Blancs */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Ajouter un Résumé</h3>
            <form onSubmit={handleResumeSubmit} className="space-y-3">
              <input type="text" placeholder="Titre" value={resTitre} onChange={(e) => setResTitre(e.target.value)} required className="w-full border p-2 rounded text-sm" />
              <input type="text" placeholder="Matière" value={resMatiere} onChange={(e) => setResMatiere(e.target.value)} required className="w-full border p-2 rounded text-sm" />
              <input type="text" placeholder="Chapitre" value={resChapitre} onChange={(e) => setResChapitre(e.target.value)} required className="w-full border p-2 rounded text-sm" />
              <input type="file" accept="application/pdf" onChange={(e) => setResFile(e.target.files[0])} required className="w-full border p-2 rounded text-sm" />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsResumeModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded text-sm">Annuler</button>
                <button type="submit" disabled={loadingRes} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">{loadingRes ? 'En cours...' : 'Enregistrer'}</button>
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
              <input type="text" placeholder="Titre" value={conTitre} onChange={(e) => setConTitre(e.target.value)} required className="w-full border p-2 rounded text-sm" />
              <input type="text" placeholder="Matiere" value={conMatiere} onChange={(e) => setConMatiere(e.target.value)} required className="w-full border p-2 rounded text-sm" />
              <input type="text" placeholder="Chapitre" value={conChapitre} onChange={(e) => setConChapitre(e.target.value)} required className="w-full border p-2 rounded text-sm" />
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} required className="w-full border p-2 rounded text-sm" />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsConcoursModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded text-sm">Annuler</button>
                <button type="submit" disabled={loadingCon} className="bg-green-600 text-white px-4 py-2 rounded text-sm">{loadingCon ? 'En cours...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}