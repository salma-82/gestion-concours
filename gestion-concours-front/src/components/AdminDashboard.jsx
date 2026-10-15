import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoImg from '../assets/logo.png';

const BAC_MATIERES_CONFIG = {
  'Mathématiques': [
    'Limites et Continuité',
    'Dérivation et Étude de Fonctions',
    'Suites Numériques',
    'Fonctions Logarithmes (ln)',
    'Fonctions Exponentielles (exp)',
    'Nombres Complexes',
    'Calcul Intégral & Primitives',
    'Équations Différentielles',
    'Probabilités & Dénombrement',
    'Géométrie dans l\'Espace',
    'Arithmétique (SM)'
  ],
  'Physique-Chimie': [
    'Ondes Mécaniques Progressives',
    'Ondes Lumineuses',
    'Transformations Nucléaires',
    'Circuit RC (Condensateur)',
    'Circuit RL (Bobine)',
    'Oscillations Libres RLC',
    'Modulation d\'Amplitude',
    'Lois de Newton',
    'Mouvement des Satellites & Projectiles',
    'Rotations & Oscillateurs Mécaniques',
    'Aspect Énergétique',
    'Réactions Acido-Basiques & Dosage',
    'Évolution Spontanée / Pile & Électrolyse',
    'Chimie Organique / Estérification'
  ],
  'SVT': [
    'Consommation de la Matière Organique & Flux d\'Énergie',
    'Rôle du Muscle Squelettique dans la Conversion d\'Énergie',
    'Information Génétique & Mécanisme de Transmission',
    'Génétique Humaine & Génétique des Populations',
    'Immunologie (Soi, Non-Soi, Réponse Immunitaire)',
    'Dysfonctionnements du Système Immunitaire',
    'Phénomènes Géologiques & Chaînes de Montagnes'
  ],
  'Philosophie': [
    'La Condition Humaine (Le Sujet / La Conscience)',
    'La Personne & L\'Identité',
    'La Connaissance (Théorie & Expérience)',
    'La Vérité & Démonstration',
    'La Politique (L\'État & Pouvoir)',
    'La Justice et le Droit',
    'Le Devoir & La Liberté',
    'Méthodologie & Dissertation'
  ],
  'Anglais': [
    'Gifts of Youth',
    'Cultural Issues and Values',
    'Women and Power',
    'Advances in Science and Technology',
    'Brain Drain',
    'Educational Systems',
    'Cultural Diversity',
    'Humour',
    'Sustainable Development',
    'International Organisations',
    'Reading Comprehension & Writing Skills'
  ]
};

const getBacChapitresList = (matiere) => {
  if (!matiere) {
    return [
      ...BAC_MATIERES_CONFIG['Mathématiques'],
      ...BAC_MATIERES_CONFIG['Physique-Chimie'],
      ...BAC_MATIERES_CONFIG['SVT'],
      ...(BAC_MATIERES_CONFIG['Philosophie'] || []),
      ...(BAC_MATIERES_CONFIG['Anglais'] || [])
    ];
  }
  const m = matiere.toLowerCase();
  if (m.includes('math')) return BAC_MATIERES_CONFIG['Mathématiques'];
  if (m.includes('phys')) return BAC_MATIERES_CONFIG['Physique-Chimie'];
  if (m.includes('svt')) return BAC_MATIERES_CONFIG['SVT'];
  if (m.includes('philo')) return BAC_MATIERES_CONFIG['Philosophie'];
  if (m.includes('ang') || m.includes('eng')) return BAC_MATIERES_CONFIG['Anglais'];
  return [];
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // --- STATE DYAL LES ONGLETS (Tabs) ---
  const [activeTab, setActiveTab] = useState('concours'); // 'demandes', 'users', 'realConcours', 'resumes', 'concours'
  const [hoveredTab, setHoveredTab] = useState(null);

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
  const [isEditRealConcoursModalOpen, setIsEditRealConcoursModalOpen] = useState(false);
  const [editingRealConcoursId, setEditingRealConcoursId] = useState(null);
  const [previewRealConcoursHtml, setPreviewRealConcoursHtml] = useState(null);
  const [realTitre, setRealTitre] = useState('');
  const [realEcole, setRealEcole] = useState('');
  const [realMatiere, setRealMatiere] = useState('');
  const [realAnnee, setRealAnnee] = useState('');
  const [realFileSujet, setRealFileSujet] = useState(null);
  const [realFileCorrection, setRealFileCorrection] = useState(null);
  const [loadingRealCon, setLoadingRealCon] = useState(false);
  const [loadingEditRealCon, setLoadingEditRealCon] = useState(false);

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
  const [resMatiere, setResMatiere] = useState('Mathématiques');
  const [resChapitre, setResChapitre] = useState('');
  const [resFile, setResFile] = useState(null);
  const [loadingRes, setLoadingRes] = useState(false);
  const [previewResume, setPreviewResume] = useState(null);
  const [previewPageIdx, setPreviewPageIdx] = useState(0);

  // States pour la modification d'un Résumé / Astuce
  const [isEditResumeModalOpen, setIsEditResumeModalOpen] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState(null);
  const [editResTitre, setEditResTitre] = useState('');
  const [editResMatiere, setEditResMatiere] = useState('Mathématiques');
  const [editResChapitre, setEditResChapitre] = useState('');
  const [editResFile, setEditResFile] = useState(null);
  const [loadingEditRes, setLoadingEditRes] = useState(false);

  // ==================== STATES DYAL COURS_BAC (TABLE COURS_BAC) ====================
  const [coursBacList, setCoursBacList] = useState([]);
  const [filteredCoursBac, setFilteredCoursBac] = useState([]);
  const [searchCoursTitre, setSearchCoursTitre] = useState('');
  const [selectedCoursMatiere, setSelectedCoursMatiere] = useState('');
  const [selectedCoursChapitre, setSelectedCoursChapitre] = useState('');
  const [coursMatieresList, setCoursMatieresList] = useState([]);
  const [coursChapitresList, setCoursChapitresList] = useState([]);

  const [isCoursModalOpen, setIsCoursModalOpen] = useState(false);
  const [coursTitre, setCoursTitre] = useState('');
  const [coursMatiere, setCoursMatiere] = useState('Mathématiques');
  const [coursChapitre, setCoursChapitre] = useState('');
  const [coursHtmlFile, setCoursHtmlFile] = useState(null);
  const [loadingCours, setLoadingCours] = useState(false);
  const [previewCoursHtml, setPreviewCoursHtml] = useState(null);

  const [isEditCoursModalOpen, setIsEditCoursModalOpen] = useState(false);
  const [editingCoursId, setEditingCoursId] = useState(null);
  const [editCoursTitre, setEditCoursTitre] = useState('');
  const [editCoursMatiere, setEditCoursMatiere] = useState('Mathématiques');
  const [editCoursChapitre, setEditCoursChapitre] = useState('');
  const [editCoursHtmlFile, setEditCoursHtmlFile] = useState(null);
  const [loadingEditCours, setLoadingEditCours] = useState(false);


  // ==================== STATES DYAL CONCOURS BLANCS ====================
  const [concoursList, setConcoursList] = useState([]);
  const [filteredConcours, setFilteredConcours] = useState([]);
  
  const [searchConTitre, setSearchConTitre] = useState('');
  const [selectedConMatiere, setSelectedConMatiere] = useState('');
  const [selectedConChapitre, setSelectedConChapitre] = useState('');
  const [selectedConEcole, setSelectedConEcole] = useState('');
  const [selectedConAnnee, setSelectedConAnnee] = useState('');
  const [conMatieresList, setConMatieresList] = useState([]);
  const [conChapitresList, setConChapitresList] = useState([]);
  const [conEcolesList, setConEcolesList] = useState([]);
  const [conAnneesList, setConAnneesList] = useState([]);

  const [isConcoursModalOpen, setIsConcoursModalOpen] = useState(false);
  const [conTitre, setConTitre] = useState('');
  const [conEcole, setConEcole] = useState('');
  const [conMatiere, setConMatiere] = useState('');
  const [conChapitre, setConChapitre] = useState('');
  const [conAnnee, setConAnnee] = useState('');
  const [conFile, setConFile] = useState(null);
  const [conHtmlFile, setConHtmlFile] = useState(null);
  const [loadingCon, setLoadingCon] = useState(false);

  // States pour l'ajout direct de fichier HTML et Aperçu HTML Concours Blanc
  const [uploadHtmlModalOpen, setUploadHtmlModalOpen] = useState(false);
  const [concoursForHtml, setConcoursForHtml] = useState(null);
  const [standaloneHtmlFile, setStandaloneHtmlFile] = useState(null);
  const [uploadingHtml, setUploadingHtml] = useState(false);
  const [previewConcoursHtml, setPreviewConcoursHtml] = useState(null);

  // States pour la gestion QCM (Admin)
  const [qcmModalOpen, setQcmModalOpen] = useState(false);
  const [qcmCurrentConcours, setQcmCurrentConcours] = useState(null);
  const [qcmQuestions, setQcmQuestions] = useState([]);
  const [qcmLoading, setQcmLoading] = useState(false);
  const [qcmSaving, setQcmSaving] = useState(false);
  const [qcmStats, setQcmStats] = useState({});

  // ==================== STATES DYAL EXAMENS NATIONAUX ====================
  const [examensList, setExamensList] = useState([]);
  const [filteredExamens, setFilteredExamens] = useState([]);

  const [searchExamTitre, setSearchExamTitre] = useState('');
  const [selectedExamMatiere, setSelectedExamMatiere] = useState('');
  const [selectedExamAnnee, setSelectedExamAnnee] = useState('');
  const [selectedExamOption, setSelectedExamOption] = useState('');
  const [selectedExamSession, setSelectedExamSession] = useState('');
  const [examMatieresList, setExamMatieresList] = useState([]);
  const [examAnneesList, setExamAnneesList] = useState([]);
  const [examOptionsList, setExamOptionsList] = useState([]);

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [examTitre, setExamTitre] = useState('');
  const [examMatiere, setExamMatiere] = useState('');
  const [examOption, setExamOption] = useState('Sciences Mathématiques A');
  const [examSession, setExamSession] = useState('Normale');
  const [examAnnee, setExamAnnee] = useState('2024');
  const [examFileSujet, setExamFileSujet] = useState(null);
  const [examFileCorrection, setExamFileCorrection] = useState(null);
  const [loadingExam, setLoadingExam] = useState(false);

  // --- FETCH DATA ---
  const fetchDemandes = async () => {
    try {
      const res = await axios.get('http://localhost:8081/api/admin/demandes-inscription', { withCredentials: true });
      setDemandesList(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Erreur demandes:", err); }
  };

  const fetchUsers = async () => {
    try {
      setUsersError('');
      const res = await axios.get('http://localhost:8081/api/admin/users', { withCredentials: true });
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
      const res = await axios.get('http://localhost:8081/api/concours', { withCredentials: true });
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
      const res = await axios.get('http://localhost:8081/api/resumes', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      setResumesList(data);
      setFilteredResumes(data);
      const existingMats = data.map(item => item.matiere).filter(Boolean);
      setResMatieresList([...new Set(['Mathématiques', 'Physique-Chimie', 'SVT', ...existingMats])]);
      const existingChaps = data.map(item => item.chapitre).filter(Boolean);
      setResChapitresList([...new Set(existingChaps)]);
    } catch (err) { console.error("Erreur resumes:", err); }
  };

  const fetchConcours = async () => {
    try {
      const res = await axios.get('http://localhost:8081/api/concours-blancs', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      setConcoursList(data);
      setFilteredConcours(data);
      setConMatieresList([...new Set(data.map(item => item.matiere).filter(Boolean))]);
      setConChapitresList([...new Set(data.map(item => item.chapitre).filter(Boolean))]);
      setConEcolesList([...new Set(data.map(item => item.ecole).filter(Boolean))]);
      setConAnneesList([...new Set(data.map(item => item.annee).filter(Boolean))].sort((a, b) => b - a));

      // Charger les stats QCM pour chaque concours blanc
      const statsMap = {};
      await Promise.all(data.map(async (cb) => {
        try {
          const sRes = await axios.get(`http://localhost:8081/api/qcm/concours-blanc/${cb.id}/stats`, { withCredentials: true });
          statsMap[cb.id] = sRes.data;
        } catch (sErr) {}
      }));
      setQcmStats(statsMap);
    } catch (err) { console.error("Erreur concours:", err); }
  };

  const fetchExamens = async () => {
    try {
      const res = await axios.get('http://localhost:8081/api/examens-nationaux', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      setExamensList(data);
      setFilteredExamens(data);
      setExamMatieresList([...new Set(data.map(item => item.matiere).filter(Boolean))]);
      setExamAnneesList([...new Set(data.map(item => item.annee).filter(Boolean))].sort((a, b) => b - a));
      setExamOptionsList([...new Set(data.map(item => item.optionBac).filter(Boolean))]);
    } catch (err) { console.error("Erreur examens:", err); }
  };

  const fetchCoursBac = async () => {
    try {
      const res = await axios.get('http://localhost:8081/api/cours-bac', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : [];
      setCoursBacList(data);
      setFilteredCoursBac(data);
      const existingMats = data.map(item => item.matiere).filter(Boolean);
      setCoursMatieresList([...new Set(['Mathématiques', 'Physique-Chimie', 'SVT', 'Philosophie', 'Anglais', ...existingMats])]);
      const existingChaps = data.map(item => item.chapitre).filter(Boolean);
      setCoursChapitresList([...new Set(existingChaps)]);
    } catch (err) { console.error("Erreur cours bac:", err); }
  };

  useEffect(() => {
    fetchDemandes();
    fetchUsers();
    fetchRealConcours();
    fetchResumes();
    fetchCoursBac();
    fetchConcours();
    fetchExamens();
  }, []);

  // --- ACTIONS: ACCEPTER / REFUSER ---
  const handleAccepter = async (id) => {
    try {
      await axios.post(`http://localhost:8081/api/admin/accepter/${id}`, {}, { withCredentials: true });
      alert("Utilisateur accepté et ajouté au système avec succès ! ✅");
      fetchDemandes();
      fetchUsers();
    } catch (err) {
      alert("Erreur lors de l'acceptation !");
    }
  };

  const handleRefuser = async (id) => {
    try {
      await axios.delete(`http://localhost:8081/api/admin/refuser/${id}`, { withCredentials: true });
      alert("Demande refusée ❌");
      fetchDemandes();
    } catch (err) {
      alert("Erreur lors du refus !");
    }
  };

  // --- ACTIONS CONCOURS (REELS): AJOUT / MODIFICATION / SUPPRESSION (HTML) ---
  const handleRealConcoursSubmit = async (e) => {
    e.preventDefault();
    setLoadingRealCon(true);
    const formData = new FormData();
    formData.append('titre', realTitre);
    formData.append('ecole', realEcole);
    formData.append('matiere', realMatiere);
    formData.append('annee', realAnnee);
    if (realFileSujet) {
      formData.append('fileHtml', realFileSujet);
      formData.append('fileSujet', realFileSujet);
    }
    if (realFileCorrection) {
      formData.append('fileHtmlCorrection', realFileCorrection);
      formData.append('fileCorrection', realFileCorrection);
    }

    try {
      await axios.post('http://localhost:8081/api/concours', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      alert('Concours HTML ajouté avec succès ! 🎉');
      setIsRealConcoursModalOpen(false);
      fetchRealConcours();
      setRealTitre(''); setRealEcole(''); setRealMatiere(''); setRealAnnee(''); setRealFileSujet(null); setRealFileCorrection(null);
    } catch (err) {
      alert("Erreur lors de l'ajout du concours!");
    } finally { setLoadingRealCon(false); }
  };

  const handleOpenEditRealConcours = (item) => {
    setEditingRealConcoursId(item.id);
    setRealTitre(item.titre || '');
    setRealEcole(item.ecole || '');
    setRealMatiere(item.matiere || '');
    setRealAnnee(item.annee || '');
    setRealFileSujet(null);
    setRealFileCorrection(null);
    setIsEditRealConcoursModalOpen(true);
  };

  const handleEditRealConcoursSubmit = async (e) => {
    e.preventDefault();
    setLoadingEditRealCon(true);
    const formData = new FormData();
    formData.append('titre', realTitre);
    formData.append('ecole', realEcole);
    formData.append('matiere', realMatiere);
    formData.append('annee', realAnnee);
    if (realFileSujet) {
      formData.append('fileHtml', realFileSujet);
      formData.append('fileSujet', realFileSujet);
    }
    if (realFileCorrection) {
      formData.append('fileHtmlCorrection', realFileCorrection);
      formData.append('fileCorrection', realFileCorrection);
    }

    try {
      await axios.put(`http://localhost:8081/api/concours/${editingRealConcoursId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      alert('Concours HTML mis à jour avec succès ! ✅');
      setIsEditRealConcoursModalOpen(false);
      fetchRealConcours();
      setRealTitre(''); setRealEcole(''); setRealMatiere(''); setRealAnnee(''); setRealFileSujet(null); setRealFileCorrection(null);
    } catch (err) {
      alert("Erreur lors de la mise à jour du concours !");
    } finally { setLoadingEditRealCon(false); }
  };

  const handleDeleteRealConcours = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce concours ?")) return;
    try {
      await axios.delete(`http://localhost:8081/api/concours/${id}`, { withCredentials: true });
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

  // --- FILTRES RESUMES & ASTUCES ---
  useEffect(() => {
    let result = resumesList;
    if (searchResTitre) {
      const q = searchResTitre.toLowerCase();
      result = result.filter(item => 
        (item.titre && item.titre.toLowerCase().includes(q)) ||
        (item.chapitre && item.chapitre.toLowerCase().includes(q)) ||
        (item.matiere && item.matiere.toLowerCase().includes(q))
      );
    }
    if (selectedResMatiere) {
      result = result.filter(item => {
        if (!item.matiere) return false;
        const m = item.matiere.toLowerCase();
        const sel = selectedResMatiere.toLowerCase();
        if (sel.includes('math')) return m.includes('math');
        if (sel.includes('phys')) return m.includes('phys');
        if (sel.includes('svt')) return m.includes('svt');
        return m === sel;
      });
    }
    if (selectedResChapitre) {
      result = result.filter(item => item.chapitre?.toLowerCase() === selectedResChapitre.toLowerCase());
    }
    setFilteredResumes(result);
  }, [searchResTitre, selectedResMatiere, selectedResChapitre, resumesList]);

  // --- FILTRES CONCOURS BLANCS ---
  useEffect(() => {
    let result = concoursList;
    if (searchConTitre) result = result.filter(item => item.titre?.toLowerCase().includes(searchConTitre.toLowerCase()));
    if (selectedConMatiere) result = result.filter(item => item.matiere === selectedConMatiere);
    if (selectedConChapitre) result = result.filter(item => item.chapitre === selectedConChapitre);
    if (selectedConEcole) result = result.filter(item => item.ecole === selectedConEcole);
    if (selectedConAnnee) result = result.filter(item => String(item.annee) === String(selectedConAnnee));
    setFilteredConcours(result);
  }, [searchConTitre, selectedConMatiere, selectedConChapitre, selectedConEcole, selectedConAnnee, concoursList]);

  // --- FILTRES EXAMENS NATIONAUX (PAR MATIERE ET ANNEE) ---
  useEffect(() => {
    let result = examensList;
    if (searchExamTitre) result = result.filter(item => item.titre?.toLowerCase().includes(searchExamTitre.toLowerCase()));
    if (selectedExamMatiere) result = result.filter(item => item.matiere === selectedExamMatiere);
    if (selectedExamAnnee) result = result.filter(item => String(item.annee) === String(selectedExamAnnee));
    if (selectedExamOption) result = result.filter(item => item.optionBac === selectedExamOption);
    if (selectedExamSession) result = result.filter(item => item.session === selectedExamSession);
    setFilteredExamens(result);
  }, [searchExamTitre, selectedExamMatiere, selectedExamAnnee, selectedExamOption, selectedExamSession, examensList]);

  // --- FILTRES TABLE COURS_BAC ---
  useEffect(() => {
    let result = coursBacList;
    if (searchCoursTitre) {
      const q = searchCoursTitre.toLowerCase();
      result = result.filter(item => 
        (item.titre && item.titre.toLowerCase().includes(q)) ||
        (item.chapitre && item.chapitre.toLowerCase().includes(q)) ||
        (item.matiere && item.matiere.toLowerCase().includes(q))
      );
    }
    if (selectedCoursMatiere) {
      result = result.filter(item => {
        if (!item.matiere) return false;
        const m = item.matiere.toLowerCase();
        const sel = selectedCoursMatiere.toLowerCase();
        if (sel.includes('math')) return m.includes('math');
        if (sel.includes('phys')) return m.includes('phys');
        if (sel.includes('svt')) return m.includes('svt');
        if (sel.includes('philo')) return m.includes('philo');
        if (sel.includes('ang') || sel.includes('eng')) return m.includes('ang') || m.includes('eng');
        return m === sel;
      });
    }
    if (selectedCoursChapitre) {
      result = result.filter(item => item.chapitre?.toLowerCase() === selectedCoursChapitre.toLowerCase());
    }
    setFilteredCoursBac(result);
  }, [searchCoursTitre, selectedCoursMatiere, selectedCoursChapitre, coursBacList]);

  // --- ACTIONS TABLE COURS_BAC (AJOUT, MODIFICATION, SUPPRESSION) ---
  const handleCoursBacSubmit = async (e) => {
    e.preventDefault();
    if (!coursHtmlFile) {
      alert("Veuillez sélectionner un fichier HTML pour le cours BAC.");
      return;
    }
    setLoadingCours(true);
    const formData = new FormData();
    formData.append('titre', coursTitre);
    formData.append('matiere', coursMatiere);
    formData.append('chapitre', coursChapitre);
    formData.append('file', coursHtmlFile);

    try {
      await axios.post('http://localhost:8081/api/cours-bac', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      alert('Cours BAC HTML enregistré avec succès dans la table COURS_BAC ! 🎉');
      setIsCoursModalOpen(false);
      fetchCoursBac();
      setCoursTitre(''); setCoursMatiere('Mathématiques'); setCoursChapitre(''); setCoursHtmlFile(null);
    } catch (err) {
      alert("Erreur lors de l'ajout du cours BAC !");
    } finally { setLoadingCours(false); }
  };

  const handleOpenEditCours = (item) => {
    setEditingCoursId(item.id);
    setEditCoursTitre(item.titre || '');
    setEditCoursMatiere(item.matiere || 'Mathématiques');
    setEditCoursChapitre(item.chapitre || '');
    setEditCoursHtmlFile(null);
    setIsEditCoursModalOpen(true);
  };

  const handleEditCoursSubmit = async (e) => {
    e.preventDefault();
    setLoadingEditCours(true);
    const formData = new FormData();
    formData.append('titre', editCoursTitre);
    formData.append('matiere', editCoursMatiere);
    formData.append('chapitre', editCoursChapitre);
    if (editCoursHtmlFile) {
      formData.append('file', editCoursHtmlFile);
    }

    try {
      await axios.put(`http://localhost:8081/api/cours-bac/${editingCoursId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      alert('Cours BAC mis à jour avec succès dans la table COURS_BAC ! ✅');
      setIsEditCoursModalOpen(false);
      setEditingCoursId(null);
      fetchCoursBac();
    } catch (err) {
      alert("Erreur lors de la modification du cours BAC !");
    } finally { setLoadingEditCours(false); }
  };

  const handleDeleteCoursBac = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce cours BAC de la table COURS_BAC ?")) return;
    try {
      await axios.delete(`http://localhost:8081/api/cours-bac/${id}`, { withCredentials: true });
      alert("Cours BAC supprimé avec succès ! 🗑️");
      fetchCoursBac();
    } catch (err) {
      alert("Erreur lors de la suppression du cours BAC !");
    }
  };

  // --- SUBMIT RESUME & ASTUCE ---
  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    if (!resFile) {
      alert("Veuillez sélectionner un fichier HTML (ou PDF) pour le résumé / astuce.");
      return;
    }
    setLoadingRes(true);
    const formData = new FormData();
    formData.append('titre', resTitre);
    formData.append('matiere', resMatiere);
    formData.append('chapitre', resChapitre);
    formData.append('file', resFile);

    try {
      await axios.post('http://localhost:8081/api/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      alert('Résumé / Astuce ajouté avec succès ! 🎉');
      setIsResumeModalOpen(false);
      fetchResumes();
      setResTitre(''); setResMatiere('Mathématiques'); setResChapitre(''); setResFile(null);
    } catch (err) {
      alert("Erreur lors de l'ajout du résumé !");
    } finally { setLoadingRes(false); }
  };

  const handleOpenEditResume = (item) => {
    setEditingResumeId(item.id);
    setEditResTitre(item.titre || '');
    setEditResMatiere(item.matiere || 'Mathématiques');
    setEditResChapitre(item.chapitre || '');
    setEditResFile(null);
    setIsEditResumeModalOpen(true);
  };

  const handleEditResumeSubmit = async (e) => {
    e.preventDefault();
    setLoadingEditRes(true);
    const formData = new FormData();
    formData.append('titre', editResTitre);
    formData.append('matiere', editResMatiere);
    formData.append('chapitre', editResChapitre);
    if (editResFile) {
      formData.append('file', editResFile);
    }

    try {
      await axios.put(`http://localhost:8081/api/resumes/${editingResumeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      alert('Résumé / Astuce mis à jour avec succès ! ✅');
      setIsEditResumeModalOpen(false);
      setEditingResumeId(null);
      fetchResumes();
    } catch (err) {
      alert("Erreur lors de la mise à jour du résumé !");
    } finally { setLoadingEditRes(false); }
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce résumé / cette astuce ?")) return;
    try {
      await axios.delete(`http://localhost:8081/api/resumes/${id}`, { withCredentials: true });
      alert("Résumé / Astuce supprimé avec succès ! 🗑️");
      fetchResumes();
    } catch (err) {
      alert("Erreur lors de la suppression du résumé !");
    }
  };


  // --- SUBMIT CONCOURS BLANC (HTML UNIQUEMENT) ---
  const handleConcoursSubmit = async (e) => {
    e.preventDefault();
    if (!conHtmlFile) {
      alert("Veuillez sélectionner un fichier HTML.");
      return;
    }
    setLoadingCon(true);
    const formData = new FormData();
    formData.append('titre', conTitre);
    if (conEcole) formData.append('ecole', conEcole);
    formData.append('matiere', conMatiere);
    if (conChapitre) formData.append('chapitre', conChapitre);
    if (conAnnee) formData.append('annee', conAnnee);
    formData.append('publie', 'true');
    formData.append('htmlFile', conHtmlFile);
    formData.append('file', conHtmlFile);

    try {
      await axios.post('http://localhost:8081/api/concours-blancs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      alert('Concours Blanc HTML ajouté avec succès ! 🎉');
      setIsConcoursModalOpen(false);
      fetchConcours();
      setConTitre(''); setConEcole(''); setConMatiere(''); setConChapitre(''); setConAnnee(''); setConFile(null); setConHtmlFile(null);
    } catch (err) {
      alert("Erreur lors de l'ajout du concours blanc !");
    } finally { setLoadingCon(false); }
  };

  // --- UPLOAD HTML DIRECT POUR CONCOURS BLANC EXISTANT ---
  const handleUploadHtmlConcoursSubmit = async (e) => {
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
      console.error("Erreur upload HTML concours:", err);
      alert("Erreur lors du téléversement du fichier HTML.");
    } finally {
      setUploadingHtml(false);
    }
  };

  const handleDeleteConcoursBlanc = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce concours blanc ?")) return;
    try {
      await axios.delete(`http://localhost:8081/api/concours-blancs/${id}`, { withCredentials: true });
      alert("Concours blanc supprimé avec succès ! 🗑️");
      fetchConcours();
    } catch (err) {
      alert("Erreur lors de la suppression du concours blanc !");
    }
  };

  // --- GESTION DU QCM (ADMIN) ---
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
    if (!window.confirm("Voulez-vous relancer l'extraction automatique des questions depuis le PDF ? Cela mettra à jour la liste des questions.")) return;
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

  // --- ACTIONS EXAMENS NATIONAUX: AJOUT / MODIFICATION / SUPPRESSION ---
  const handleExamSubmit = async (e) => {
    e.preventDefault();
    setLoadingExam(true);
    const formData = new FormData();
    formData.append('titre', examTitre);
    formData.append('matiere', examMatiere);
    formData.append('optionBac', examOption);
    formData.append('session', examSession);
    formData.append('annee', examAnnee);
    if (examFileSujet) formData.append('fileSujet', examFileSujet);
    if (examFileCorrection) formData.append('fileCorrection', examFileCorrection);

    try {
      if (editingExamId) {
        await axios.put(`http://localhost:8081/api/examens-nationaux/${editingExamId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
        alert('Examen National modifié avec succès ! ✏️');
      } else {
        await axios.post('http://localhost:8081/api/examens-nationaux', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
        alert('Examen National ajouté avec succès ! 🎓');
      }
      setIsExamModalOpen(false);
      setEditingExamId(null);
      fetchExamens();
      setExamTitre(''); setExamMatiere(''); setExamOption('Sciences Mathématiques A'); setExamSession('Normale'); setExamAnnee('2024'); setExamFileSujet(null); setExamFileCorrection(null);
    } catch (err) {
      alert("Erreur lors de l'enregistrement de l'examen national !");
    } finally { setLoadingExam(false); }
  };

  const handleEditExam = (exam) => {
    setEditingExamId(exam.id);
    setExamTitre(exam.titre || '');
    setExamMatiere(exam.matiere || '');
    setExamOption(exam.optionBac || 'Sciences Mathématiques A');
    setExamSession(exam.session || 'Normale');
    setExamAnnee(exam.annee ? String(exam.annee) : '2024');
    setExamFileSujet(null);
    setExamFileCorrection(null);
    setIsExamModalOpen(true);
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet examen national ?")) return;
    try {
      await axios.delete(`http://localhost:8081/api/examens-nationaux/${id}`, { withCredentials: true });
      alert("Examen national supprimé avec succès ! 🗑️");
      fetchExamens();
    } catch (err) {
      alert("Erreur lors de la suppression de l'examen !");
    }
  };

  const getPdfUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('localhost:8080')) return url.replace('localhost:8080', 'localhost:8081');
      return url;
    }
    return `http://localhost:8081/uploads/${url}`;
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

  // ======================== INLINE STYLES ========================
  const COLORS = {
    darkBlue: '#0B1437',
    activeBlue: '#1B3A8A',
    accentBlue: '#2563EB',
    lightBg: '#F1F5F9',
    white: '#FFFFFF',
    textDark: '#1E293B',
    textMid: '#475569',
    textLight: '#94A3B8',
    border: '#E2E8F0',
    green: '#10B981',
    greenDark: '#059669',
    red: '#EF4444',
    redDark: '#DC2626',
    hoverLight: 'rgba(255,255,255,0.08)',
  };

  const styles = {
    wrapper: {
      display: 'flex',
      minHeight: '100vh',
      background: COLORS.lightBg,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    },
    sidebar: {
      width: '270px',
      minWidth: '270px',
      background: COLORS.darkBlue,
      color: COLORS.white,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      zIndex: 30,
      boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
    },
    sidebarHeader: {
      padding: '32px 28px 24px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    },
    sidebarTitle: {
      fontSize: '24px',
      fontWeight: 800,
      margin: 0,
      letterSpacing: '-0.5px',
      color: COLORS.white,
    },
    sidebarTitleAccent: {
      color: '#60A5FA',
    },
    sidebarSubtitle: {
      fontSize: '13px',
      color: '#94A3B8',
      marginTop: '6px',
      fontWeight: 500,
    },
    sidebarNav: {
      flex: 1,
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      overflowY: 'auto',
    },
    navBtn: (isActive, isHovered) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '14px 16px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      transition: 'all 0.2s ease',
      background: isActive ? COLORS.activeBlue : (isHovered ? COLORS.hoverLight : 'transparent'),
      color: isActive ? COLORS.white : (isHovered ? COLORS.white : '#CBD5E1'),
      boxShadow: isActive ? '0 4px 12px rgba(27,58,138,0.4)' : 'none',
      textAlign: 'left',
    }),
    navLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    badge: (variant) => ({
      fontSize: '11px',
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: '20px',
      lineHeight: '1.4',
      ...(variant === 'red' ? {
        background: '#EF4444',
        color: COLORS.white,
      } : {
        background: 'rgba(255,255,255,0.12)',
        color: '#CBD5E1',
      }),
    }),
    main: {
      marginLeft: '270px',
      flex: 1,
      padding: '36px 40px',
      minHeight: '100vh',
    },
    card: {
      background: COLORS.white,
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      border: `1px solid ${COLORS.border}`,
    },
    cardTitle: {
      fontSize: '22px',
      fontWeight: 700,
      color: COLORS.textDark,
      margin: '0 0 24px 0',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
    },
    th: {
      padding: '14px 20px',
      textAlign: 'left',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color: COLORS.textLight,
      background: '#F8FAFC',
      borderBottom: `1px solid ${COLORS.border}`,
    },
    thCenter: {
      padding: '14px 20px',
      textAlign: 'center',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color: COLORS.textLight,
      background: '#F8FAFC',
      borderBottom: `1px solid ${COLORS.border}`,
    },
    td: {
      padding: '14px 20px',
      fontSize: '14px',
      color: COLORS.textMid,
      borderBottom: `1px solid ${COLORS.border}`,
    },
    tdBold: {
      padding: '14px 20px',
      fontSize: '14px',
      fontWeight: 600,
      color: COLORS.textDark,
      borderBottom: `1px solid ${COLORS.border}`,
    },
    tdCenter: {
      padding: '14px 20px',
      fontSize: '14px',
      textAlign: 'center',
      borderBottom: `1px solid ${COLORS.border}`,
    },
    btnGreen: {
      background: COLORS.green,
      color: COLORS.white,
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      marginRight: '8px',
      transition: 'background 0.2s',
    },
    btnRed: {
      background: COLORS.red,
      color: COLORS.white,
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    btnRedOutline: {
      background: 'transparent',
      color: COLORS.red,
      border: `1.5px solid ${COLORS.red}`,
      padding: '7px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    btnPrimary: {
      background: COLORS.accentBlue,
      color: COLORS.white,
      border: 'none',
      padding: '10px 20px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background 0.2s',
      boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px',
    },
    filterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      alignItems: 'flex-end',
      padding: '20px',
      background: '#F8FAFC',
      borderRadius: '12px',
      border: `1px solid ${COLORS.border}`,
      marginBottom: '24px',
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      flex: '1 1 180px',
      minWidth: '160px',
    },
    filterLabel: {
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      color: COLORS.textLight,
    },
    input: {
      padding: '9px 14px',
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: '8px',
      fontSize: '13px',
      outline: 'none',
      transition: 'border-color 0.2s',
      background: COLORS.white,
      color: COLORS.textDark,
      width: '100%',
      boxSizing: 'border-box',
    },
    select: {
      padding: '9px 14px',
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: '8px',
      fontSize: '13px',
      outline: 'none',
      background: COLORS.white,
      color: COLORS.textMid,
      cursor: 'pointer',
      width: '100%',
      boxSizing: 'border-box',
    },
    btnReset: {
      background: COLORS.white,
      color: COLORS.textMid,
      border: `1.5px solid ${COLORS.border}`,
      padding: '9px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      alignSelf: 'flex-end',
    },
    linkBlue: {
      color: COLORS.accentBlue,
      textDecoration: 'none',
      fontWeight: 600,
      fontSize: '13px',
    },
    linkGreen: {
      color: COLORS.green,
      textDecoration: 'none',
      fontWeight: 600,
      fontSize: '13px',
    },
    emptyRow: {
      padding: '40px 20px',
      textAlign: 'center',
      color: COLORS.textLight,
      fontSize: '14px',
      fontWeight: 500,
      borderBottom: 'none',
    },
    tagRole: (role) => ({
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 700,
      ...(role === 'ADMIN' ? {
        background: '#EDE9FE',
        color: '#7C3AED',
      } : {
        background: '#DBEAFE',
        color: '#2563EB',
      }),
    }),
    tagStatus: (active) => ({
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 700,
      ...(active ? {
        background: '#D1FAE5',
        color: '#059669',
      } : {
        background: '#FEE2E2',
        color: '#DC2626',
      }),
    }),
    tagEcole: {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 700,
      background: '#F1F5F9',
      color: COLORS.textMid,
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(11,20,55,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    },
    modalBox: {
      background: COLORS.white,
      borderRadius: '16px',
      padding: '32px',
      width: '100%',
      maxWidth: '440px',
      boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 700,
      color: COLORS.textDark,
      margin: 0,
    },
    modalClose: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      color: COLORS.textLight,
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '6px',
      lineHeight: 1,
    },
    formGroup: {
      marginBottom: '16px',
    },
    formLabel: {
      display: 'block',
      fontSize: '12px',
      fontWeight: 700,
      color: COLORS.textMid,
      marginBottom: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
    },
    formInput: {
      width: '100%',
      padding: '10px 14px',
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      color: COLORS.textDark,
    },
    formFile: {
      width: '100%',
      padding: '8px',
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: '8px',
      fontSize: '13px',
      boxSizing: 'border-box',
    },
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: `1px solid ${COLORS.border}`,
    },
    btnCancel: {
      background: COLORS.white,
      border: `1.5px solid ${COLORS.border}`,
      color: COLORS.textMid,
      padding: '10px 20px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    btnSubmit: {
      background: COLORS.accentBlue,
      color: COLORS.white,
      border: 'none',
      padding: '10px 20px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
    },
    errorBanner: {
      marginBottom: '20px',
      padding: '14px 20px',
      background: '#FEF2F2',
      borderLeft: '4px solid #EF4444',
      borderRadius: '0 8px 8px 0',
      color: '#DC2626',
      fontWeight: 600,
      fontSize: '14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    avatar: (name) => ({
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      background: '#DBEAFE',
      color: '#2563EB',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '14px',
      marginRight: '10px',
      flexShrink: 0,
    }),
    userCell: {
      display: 'flex',
      alignItems: 'center',
    },
  };

  // Sidebar navigation items config
  const sidebarItems = [
    { key: 'demandes', icon: '👥', label: 'Demandes', count: demandesList.length, countType: demandesList.length > 0 ? 'red' : 'default', onClick: () => setActiveTab('demandes') },
    { key: 'users', icon: '👤', label: 'Utilisateurs', count: usersList.length, countType: 'default', onClick: () => { setActiveTab('users'); fetchUsers(); } },
    { key: 'realConcours', icon: '🏆', label: 'Gestion des Concours', count: realConcoursList.length, countType: 'default', onClick: () => { setActiveTab('realConcours'); fetchRealConcours(); } },
    { key: 'examens', icon: '🎓', label: 'Examens Nationaux', count: examensList.length, countType: 'default', onClick: () => { setActiveTab('examens'); fetchExamens(); } },
    { key: 'coursBac', icon: '📖', label: 'Cours BAC (COURS_BAC)', count: coursBacList.length, countType: 'default', onClick: () => { setActiveTab('coursBac'); fetchCoursBac(); } },
    { key: 'resumes', icon: '💡', label: 'Résumés & Astuces', count: resumesList.length, countType: 'default', onClick: () => { setActiveTab('resumes'); fetchResumes(); } },
    { key: 'concours', icon: '📝', label: 'Concours Blancs', count: null, onClick: () => setActiveTab('concours') },
  ];

  return (
    <div style={styles.wrapper}>
      {/* ======================== SIDEBAR ======================== */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
            <img src={logoImg} alt="Econcour Logo" style={{ height: '50px', width: 'auto', objectFit: 'contain', filter: 'brightness(1.1)' }} />
          </div>
          <p style={{ ...styles.sidebarSubtitle, textAlign: 'center' }}>Tableau de Bord Admin</p>
        </div>

        <nav style={styles.sidebarNav}>
          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={item.onClick}
              onMouseEnter={() => setHoveredTab(item.key)}
              onMouseLeave={() => setHoveredTab(null)}
              style={styles.navBtn(activeTab === item.key, hoveredTab === item.key)}
            >
              <span style={styles.navLabel}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {item.count !== null && (
                <span style={styles.badge(item.countType)}>{item.count}</span>
              )}
            </button>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <button
              onClick={handleLogout}
              onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                background: '#EF4444',
                color: '#FFFFFF',
                transition: 'background 0.2s ease',
                boxShadow: '0 4px 6px rgba(239, 68, 68, 0.25)',
              }}
            >
              🚪 Déconnexion
            </button>
          </div>
        </nav>
      </aside>

      {/* ======================== MAIN CONTENT ======================== */}
      <main style={styles.main}>

        {/* ==================== SECTION: DEMANDES ==================== */}
        {activeTab === 'demandes' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Validation des Comptes (Demandes En Attente)</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Nom d'utilisateur</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Téléphone</th>
                  <th style={styles.thCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {demandesList.length > 0 ? (
                  demandesList.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.tdBold}>{item.id}</td>
                      <td style={styles.tdBold}>{item.username}</td>
                      <td style={styles.td}>{item.email}</td>
                      <td style={styles.td}>{item.telephone || '-'}</td>
                      <td style={styles.tdCenter}>
                        <button style={styles.btnGreen} onClick={() => handleAccepter(item.id)}>
                          ✓ Accepter
                        </button>
                        <button style={styles.btnRed} onClick={() => handleRefuser(item.id)}>
                          ✕ Refuser
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" style={styles.emptyRow}>Aucune demande d'inscription en attente.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== SECTION: UTILISATEURS ==================== */}
        {activeTab === 'users' && (
          <div style={styles.card}>
            {usersError && (
              <div style={styles.errorBanner}>
                <span>{usersError}</span>
                <button onClick={fetchUsers} style={{ ...styles.btnRed, padding: '6px 14px', fontSize: '12px', marginLeft: '12px' }}>Réessayer</button>
              </div>
            )}

            <div style={styles.headerRow}>
              <h2 style={{ ...styles.cardTitle, marginBottom: 0 }}>Liste des Utilisateurs Validés</h2>
            </div>

            {/* Filtres */}
            <div style={styles.filterBar}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Recherche</label>
                <input
                  type="text"
                  placeholder="Nom, email, rôle..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Date Début</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Date Fin</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.input} />
              </div>
              {(startDate || endDate || searchUser) && (
                <button onClick={() => { setStartDate(''); setEndDate(''); setSearchUser(''); }} style={styles.btnReset}>
                  Réinitialiser
                </button>
              )}
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Utilisateur</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Téléphone</th>
                  <th style={styles.th}>Rôle</th>
                  <th style={styles.th}>Statut</th>
                  <th style={styles.th}>Création</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.tdBold}>{item.id}</td>
                      <td style={styles.tdBold}>
                        <div style={styles.userCell}>
                          <span style={styles.avatar()}>
                            {((item.nom || item.username || item.email || '?')[0]).toUpperCase()}
                          </span>
                          {item.nom || item.username || item.email} {item.prenom ? `(${item.prenom})` : ''}
                        </div>
                      </td>
                      <td style={styles.td}>{item.email}</td>
                      <td style={styles.td}>{item.telephone || '-'}</td>
                      <td style={styles.td}>
                        <span style={styles.tagRole(item.role)}>{item.role || 'CLIENT'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.tagStatus(item.active === 1)}>{item.active === 1 ? 'Actif' : 'Inactif'}</span>
                      </td>
                      <td style={styles.td}>{formatDate(item.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" style={styles.emptyRow}>Aucun utilisateur trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== SECTION: GESTION DES CONCOURS (REELS) ==================== */}
        {activeTab === 'realConcours' && (
          <div style={styles.card}>
            <div style={styles.headerRow}>
              <div>
                <h2 style={{ ...styles.cardTitle, marginBottom: '4px' }}>🏆 Gestion des Concours (Fichiers HTML)</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Tableau de gestion des concours réels avec import et prévisualisation des fichiers HTML interactifs.
                </p>
              </div>
              <button
                onClick={() => {
                  setRealTitre('');
                  setRealEcole('');
                  setRealMatiere('');
                  setRealAnnee('');
                  setRealFileSujet(null);
                  setRealFileCorrection(null);
                  setIsRealConcoursModalOpen(true);
                }}
                style={styles.btnPrimary}
              >
                <span style={{ fontSize: '18px' }}>+</span> Ajouter un Concours (HTML)
              </button>
            </div>

            {/* Filtres */}
            <div style={styles.filterBar}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Recherche par Titre</label>
                <input type="text" placeholder="Titre..." value={searchRealTitre} onChange={(e) => setSearchRealTitre(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>École</label>
                <select value={selectedRealEcole} onChange={(e) => setSelectedRealEcole(e.target.value)} style={styles.select}>
                  <option value="">Toutes les écoles</option>
                  {realEcolesList.map((ec, idx) => <option key={idx} value={ec}>{ec}</option>)}
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Matière</label>
                <select value={selectedRealMatiere} onChange={(e) => setSelectedRealMatiere(e.target.value)} style={styles.select}>
                  <option value="">Toutes les matières</option>
                  {realMatieresList.map((mat, idx) => <option key={idx} value={mat}>{mat}</option>)}
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Année</label>
                <select value={selectedRealAnnee} onChange={(e) => setSelectedRealAnnee(e.target.value)} style={styles.select}>
                  <option value="">Toutes les années</option>
                  {realAnneesList.map((an, idx) => <option key={idx} value={an}>{an}</option>)}
                </select>
              </div>
              {(searchRealTitre || selectedRealEcole || selectedRealMatiere || selectedRealAnnee) && (
                <button onClick={() => { setSearchRealTitre(''); setSelectedRealEcole(''); setSelectedRealMatiere(''); setSelectedRealAnnee(''); }} style={styles.btnReset}>
                  Réinitialiser
                </button>
              )}
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Titre</th>
                  <th style={styles.th}>École</th>
                  <th style={styles.th}>Matière</th>
                  <th style={styles.th}>Année</th>
                  <th style={styles.th}>Fichiers HTML</th>
                  <th style={styles.thCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRealConcours.length > 0 ? (
                  filteredRealConcours.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.tdBold}>{item.id}</td>
                      <td style={styles.tdBold}>{item.titre}</td>
                      <td style={styles.td}><span style={styles.tagEcole}>{item.ecole}</span></td>
                      <td style={styles.td}>{item.matiere}</td>
                      <td style={styles.td}>{item.annee}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {/* Sujet HTML */}
                          {item.htmlUrl ? (
                            <button
                              onClick={() => setPreviewRealConcoursHtml({
                                titre: item.titre,
                                url: item.htmlUrl,
                                type: 'Sujet HTML',
                                ecole: item.ecole,
                                matiere: item.matiere,
                                annee: item.annee
                              })}
                              style={{
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: 'fit-content'
                              }}
                              title="Ouvrir l'aperçu du Sujet HTML"
                            >
                              <span>🌐</span> Sujet HTML
                            </button>
                          ) : (
                            <span style={{ color: COLORS.textLight, fontSize: '12px' }}>Sujet manquant</span>
                          )}

                          {/* Correction HTML ou fallback PDF */}
                          {item.htmlCorrectionUrl ? (
                            <button
                              onClick={() => setPreviewRealConcoursHtml({
                                titre: `${item.titre} (Correction)`,
                                url: item.htmlCorrectionUrl,
                                type: 'Correction HTML',
                                ecole: item.ecole,
                                matiere: item.matiere,
                                annee: item.annee
                              })}
                              style={{
                                background: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: 'fit-content'
                              }}
                              title="Ouvrir l'aperçu de la Correction HTML"
                            >
                              <span>✅</span> Corrigé HTML
                            </button>
                          ) : item.pdfCorrectionUrl ? (
                            <a href={getPdfUrl(item.pdfCorrectionUrl)} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>
                              ✅ Corrigé (PDF)
                            </a>
                          ) : (
                            <span style={{ color: COLORS.textLight, fontSize: '12px' }}>Corrigé manquant</span>
                          )}
                        </div>
                      </td>
                      <td style={styles.tdCenter}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEditRealConcours(item)}
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1.5px solid #2563eb',
                              padding: '7px 12px',
                              borderRadius: '8px',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Modifier
                          </button>
                          <button onClick={() => handleDeleteRealConcours(item.id)} style={styles.btnRedOutline}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" style={styles.emptyRow}>Aucun concours trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== SECTION: EXAMENS NATIONAUX ==================== */}
        {activeTab === 'examens' && (
          <div style={styles.card}>
            <div style={styles.headerRow}>
              <div>
                <h2 style={{ ...styles.cardTitle, marginBottom: '4px' }}>🎓 Gestion des Examens Nationaux (Baccalauréat)</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Ajout et gestion des sujets et corrigés PDF des examens nationaux marocains avec filtre par Année et Matière.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingExamId(null);
                  setExamTitre('');
                  setExamMatiere('');
                  setExamOption('Sciences Mathématiques A');
                  setExamSession('Normale');
                  setExamAnnee('2024');
                  setExamFileSujet(null);
                  setExamFileCorrection(null);
                  setIsExamModalOpen(true);
                }}
                style={styles.btnPrimary}
              >
                <span style={{ fontSize: '18px' }}>+</span> Ajouter un Examen National
              </button>
            </div>

            {/* FILTRE PAR ANNEE ET PAR MATIERE (+ Option & Recherche) */}
            <div style={styles.filterBar}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>🔍 Recherche par Titre</label>
                <input
                  type="text"
                  placeholder="Ex: Examen 2024, Session Normale..."
                  value={searchExamTitre}
                  onChange={(e) => setSearchExamTitre(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>📚 Matière</label>
                <select
                  value={selectedExamMatiere}
                  onChange={(e) => setSelectedExamMatiere(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Toutes les matières</option>
                  {examMatieresList.map((mat, idx) => (
                    <option key={idx} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>📅 Année</label>
                <select
                  value={selectedExamAnnee}
                  onChange={(e) => setSelectedExamAnnee(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Toutes les années</option>
                  {examAnneesList.map((an, idx) => (
                    <option key={idx} value={an}>{an}</option>
                  ))}
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>🏷️ Option / Filière</label>
                <select
                  value={selectedExamOption}
                  onChange={(e) => setSelectedExamOption(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Toutes les options</option>
                  {examOptionsList.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>⏳ Session</label>
                <select
                  value={selectedExamSession}
                  onChange={(e) => setSelectedExamSession(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Toutes les sessions</option>
                  <option value="Normale">Session Normale</option>
                  <option value="Rattrapage">Session Rattrapage</option>
                </select>
              </div>

              {(searchExamTitre || selectedExamMatiere || selectedExamAnnee || selectedExamOption || selectedExamSession) && (
                <button
                  onClick={() => {
                    setSearchExamTitre('');
                    setSelectedExamMatiere('');
                    setSelectedExamAnnee('');
                    setSelectedExamOption('');
                    setSelectedExamSession('');
                  }}
                  style={styles.btnReset}
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Tableau des Examens Nationaux */}
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Titre de l'Examen</th>
                  <th style={styles.th}>Matière</th>
                  <th style={styles.th}>Option / Branche</th>
                  <th style={styles.th}>Année & Session</th>
                  <th style={styles.th}>Fichiers PDF</th>
                  <th style={styles.thCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExamens.length > 0 ? (
                  filteredExamens.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.tdBold}>#{item.id}</td>
                      <td style={styles.tdBold}>{item.titre}</td>
                      <td style={styles.td}>
                        <span style={{
                          background: item.matiere?.toLowerCase().includes('math') ? '#dbeafe' : item.matiere?.toLowerCase().includes('phys') ? '#fef3c7' : '#dcfce7',
                          color: item.matiere?.toLowerCase().includes('math') ? '#1e40af' : item.matiere?.toLowerCase().includes('phys') ? '#92400e' : '#166534',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          {item.matiere}
                        </span>
                      </td>
                      <td style={styles.td}><span style={styles.tagEcole}>{item.optionBac || 'Générale'}</span></td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.annee}</span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: item.session === 'Rattrapage' ? '#fee2e2' : '#e0e7ff',
                            color: item.session === 'Rattrapage' ? '#991b1b' : '#3730a3'
                          }}>
                            {item.session || 'Normale'}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {item.pdfSujetUrl ? (
                            <a href={getPdfUrl(item.pdfSujetUrl)} target="_blank" rel="noreferrer" style={styles.linkBlue}>
                              📄 Sujet PDF
                            </a>
                          ) : (
                            <span style={{ color: COLORS.textLight, fontSize: '12px' }}>Sans sujet</span>
                          )}

                          {item.pdfCorrectionUrl ? (
                            <a href={getPdfUrl(item.pdfCorrectionUrl)} target="_blank" rel="noreferrer" style={styles.linkGreen}>
                              ✅ Correction PDF
                            </a>
                          ) : (
                            <span style={{ color: COLORS.textLight, fontSize: '12px' }}>Sans correction</span>
                          )}
                        </div>
                      </td>
                      <td style={styles.tdCenter}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditExam(item)}
                            style={{
                              background: '#f1f5f9',
                              color: '#1e40af',
                              border: '1px solid #cbd5e1',
                              padding: '7px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteExam(item.id)}
                            style={styles.btnRedOutline}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" style={styles.emptyRow}>Aucun examen national trouvé avec ces critères de filtre.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== SECTION: RESUMES & ASTUCES ==================== */}
        {activeTab === 'resumes' && (
          <div style={styles.card}>
            <div style={styles.headerRow}>
              <div>
                <h2 style={{ ...styles.cardTitle, marginBottom: '4px' }}>💡 Fiches Résumés & Astuces (Mathématiques, Physique-Chimie, SVT)</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Gestion, ajout et modification des fiches résumés et astuces de concours sous format interactif <strong>HTML</strong> ou PDF.
                </p>
              </div>
              <button onClick={() => { setResMatiere('Mathématiques'); setResChapitre(''); setIsResumeModalOpen(true); }} style={styles.btnPrimary}>
                <span style={{ fontSize: '18px' }}>+</span> Ajouter Résumé / Astuce (HTML)
              </button>
            </div>

            {/* Filtres par Matière et Chapitre */}
            <div style={styles.filterBar}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Recherche par Titre ou Astuce</label>
                <input 
                  type="text" 
                  placeholder="Recherche par titre, mot-clé d'astuce..." 
                  value={searchResTitre} 
                  onChange={(e) => setSearchResTitre(e.target.value)} 
                  style={styles.input} 
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Matière</label>
                <select 
                  value={selectedResMatiere} 
                  onChange={(e) => { 
                    setSelectedResMatiere(e.target.value); 
                    setSelectedResChapitre(''); 
                  }} 
                  style={styles.select}
                >
                  <option value="">Toutes les matières (Math, Physique, SVT)</option>
                  <option value="Mathématiques">📐 Mathématiques</option>
                  <option value="Physique-Chimie">⚡ Physique-Chimie</option>
                  <option value="SVT">🧬 SVT (Sciences de la Vie et de la Terre)</option>
                  {resMatieresList.filter(m => !['Mathématiques', 'Physique-Chimie', 'SVT'].includes(m)).map((mat, idx) => (
                    <option key={idx} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Chapitre</label>
                <select 
                  value={selectedResChapitre} 
                  onChange={(e) => setSelectedResChapitre(e.target.value)} 
                  style={styles.select}
                >
                  <option value="">Tous les chapitres</option>
                  {[...new Set([
                    ...getBacChapitresList(selectedResMatiere),
                    ...resChapitresList
                  ])].map((chap, idx) => (
                    <option key={idx} value={chap}>{chap}</option>
                  ))}
                </select>
              </div>
              {(searchResTitre || selectedResMatiere || selectedResChapitre) && (
                <button onClick={() => { setSearchResTitre(''); setSelectedResMatiere(''); setSelectedResChapitre(''); }} style={styles.btnReset}>
                  Réinitialiser
                </button>
              )}
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Titre du Résumé / Astuce</th>
                  <th style={styles.th}>Matière</th>
                  <th style={styles.th}>Chapitre</th>
                  <th style={styles.th}>Format Document</th>
                  <th style={styles.th}>Fichier Source</th>
                  <th style={styles.thCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResumes.length > 0 ? (
                  filteredResumes.map((item) => {
                    const pages = item.pageImages && item.pageImages.length > 0 ? item.pageImages : [];
                    const pageCount = item.totalPages || pages.length || 1;
                    const matLower = (item.matiere || '').toLowerCase();
                    return (
                      <tr key={item.id}>
                        <td style={styles.tdBold}>{item.titre}</td>
                        <td style={styles.td}>
                          {matLower.includes('math') ? (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              📐 {item.matiere}
                            </span>
                          ) : matLower.includes('phys') ? (
                            <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              ⚡ {item.matiere}
                            </span>
                          ) : matLower.includes('svt') ? (
                            <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              🧬 {item.matiere}
                            </span>
                          ) : (
                            <span style={styles.tagEcole}>{item.matiere}</span>
                          )}
                        </td>
                        <td style={styles.td}>{item.chapitre || '-'}</td>
                        <td style={styles.td}>
                          {item.fileType === 'HTML' || item.htmlUrl ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              🌐 HTML Web
                            </span>
                          ) : (
                            <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              📄 {pageCount} page{pageCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {item.htmlUrl ? (
                            <a href={getPdfUrl(item.htmlUrl)} target="_blank" rel="noreferrer" style={{ ...styles.linkBlue, color: '#16a34a', fontWeight: 600 }}>
                              🌐 Fichier HTML
                            </a>
                          ) : (
                            <a href={getPdfUrl(item.pdfUrl || item.pdf_url)} target="_blank" rel="noreferrer" style={styles.linkBlue}>
                              📄 Fichier PDF
                            </a>
                          )}
                        </td>
                        <td style={styles.tdCenter}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => { setPreviewResume(item); setPreviewPageIdx(0); }}
                              style={{
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                padding: '7px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {item.htmlUrl || item.fileType === 'HTML' ? '👁️ Aperçu HTML' : '👁️ Voir Pages'}
                            </button>
                            <button
                              onClick={() => handleOpenEditResume(item)}
                              style={{
                                background: '#f1f5f9',
                                color: '#1e40af',
                                border: '1px solid #cbd5e1',
                                padding: '7px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteResume(item.id)}
                              style={styles.btnRedOutline}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="6" style={styles.emptyRow}>Aucun résumé ou astuce trouvé avec ces filtres.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== SECTION: TABLE COURS_BAC ==================== */}
        {activeTab === 'coursBac' && (
          <div style={styles.card}>
            <div style={styles.headerRow}>
              <div>
                <h2 style={{ ...styles.cardTitle, marginBottom: '4px' }}>📖 Table COURS_BAC — Fiches HTML</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Table dédiée <code>cours_bac</code> pour les cours du BAC (Mathématiques, Physique-Chimie, SVT) avec upload de fichiers HTML et filtres par Matière et Chapitre.
                </p>
              </div>
              <button onClick={() => { setCoursMatiere('Mathématiques'); setCoursChapitre(''); setIsCoursModalOpen(true); }} style={styles.btnPrimary}>
                <span style={{ fontSize: '18px' }}>+</span> Ajouter Cours BAC (HTML)
              </button>
            </div>

            {/* Filtres par Matière et Chapitre */}
            <div style={styles.filterBar}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Recherche par Titre</label>
                <input 
                  type="text" 
                  placeholder="Recherche par titre du cours..." 
                  value={searchCoursTitre} 
                  onChange={(e) => setSearchCoursTitre(e.target.value)} 
                  style={styles.input} 
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Matière</label>
                <select 
                  value={selectedCoursMatiere} 
                  onChange={(e) => { 
                    setSelectedCoursMatiere(e.target.value); 
                    setSelectedCoursChapitre(''); 
                  }} 
                  style={styles.select}
                >
                  <option value="">Toutes les matières (Math, Physique, SVT, Philo, Anglais)</option>
                  <option value="Mathématiques">📐 Mathématiques</option>
                  <option value="Physique-Chimie">⚡ Physique-Chimie</option>
                  <option value="SVT">🧬 SVT (Sciences de la Vie et de la Terre)</option>
                  <option value="Philosophie">🏛️ Philosophie</option>
                  <option value="Anglais">🌍 Anglais (English)</option>
                  {coursMatieresList.filter(m => !['Mathématiques', 'Physique-Chimie', 'SVT', 'Philosophie', 'Anglais'].includes(m)).map((mat, idx) => (
                    <option key={idx} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Chapitre</label>
                <select 
                  value={selectedCoursChapitre} 
                  onChange={(e) => setSelectedCoursChapitre(e.target.value)} 
                  style={styles.select}
                >
                  <option value="">Tous les chapitres</option>
                  {[...new Set([
                    ...getBacChapitresList(selectedCoursMatiere),
                    ...coursChapitresList
                  ])].map((chap, idx) => (
                    <option key={idx} value={chap}>{chap}</option>
                  ))}
                </select>
              </div>
              {(searchCoursTitre || selectedCoursMatiere || selectedCoursChapitre) && (
                <button onClick={() => { setSearchCoursTitre(''); setSelectedCoursMatiere(''); setSelectedCoursChapitre(''); }} style={styles.btnReset}>
                  Réinitialiser
                </button>
              )}
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Titre du Cours</th>
                  <th style={styles.th}>Matière</th>
                  <th style={styles.th}>Chapitre</th>
                  <th style={styles.th}>Fichier HTML</th>
                  <th style={styles.thCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoursBac.length > 0 ? (
                  filteredCoursBac.map((item) => {
                    const matLower = (item.matiere || '').toLowerCase();
                    return (
                      <tr key={item.id}>
                        <td style={styles.tdBold}>#{item.id}</td>
                        <td style={styles.tdBold}>{item.titre}</td>
                        <td style={styles.td}>
                          {matLower.includes('math') ? (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              📐 {item.matiere}
                            </span>
                          ) : matLower.includes('phys') ? (
                            <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              ⚡ {item.matiere}
                            </span>
                          ) : matLower.includes('svt') ? (
                            <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              🧬 {item.matiere}
                            </span>
                          ) : matLower.includes('philo') ? (
                            <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              🏛️ {item.matiere}
                            </span>
                          ) : matLower.includes('ang') || matLower.includes('eng') ? (
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                              🌍 {item.matiere}
                            </span>
                          ) : (
                            <span style={styles.tagEcole}>{item.matiere}</span>
                          )}
                        </td>
                        <td style={styles.td}>{item.chapitre || '-'}</td>
                        <td style={styles.td}>
                          {item.htmlUrl ? (
                            <a href={getPdfUrl(item.htmlUrl)} target="_blank" rel="noreferrer" style={{ ...styles.linkBlue, color: '#16a34a', fontWeight: 600 }}>
                              🌐 Ouvrir Fichier HTML
                            </a>
                          ) : (
                            <span style={{ color: COLORS.textLight, fontSize: '12px' }}>Aucun fichier</span>
                          )}
                        </td>
                        <td style={styles.tdCenter}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {item.htmlUrl && (
                              <button
                                onClick={() => setPreviewCoursHtml(item)}
                                style={{
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '7px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                👁️ Aperçu HTML
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditCours(item)}
                              style={{
                                background: '#f1f5f9',
                                color: '#1e40af',
                                border: '1px solid #cbd5e1',
                                padding: '7px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteCoursBac(item.id)}
                              style={styles.btnRedOutline}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="6" style={styles.emptyRow}>Aucun cours BAC trouvé dans la table COURS_BAC avec ces critères.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== SECTION: CONCOURS BLANCS ==================== */}
        {activeTab === 'concours' && (
          <div style={styles.card}>
            <div style={styles.headerRow}>
              <h2 style={{ ...styles.cardTitle, marginBottom: 0 }}>Liste des Concours Blancs</h2>
              <button onClick={() => setIsConcoursModalOpen(true)} style={styles.btnPrimary}>
                <span style={{ fontSize: '18px' }}>+</span> Ajouter Concours Blanc
              </button>
            </div>

            {/* Filtres */}
            <div style={styles.filterBar}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Recherche par Titre</label>
                <input type="text" placeholder="Titre du concours..." value={searchConTitre} onChange={(e) => setSearchConTitre(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>École</label>
                <select value={selectedConEcole} onChange={(e) => setSelectedConEcole(e.target.value)} style={styles.select}>
                  <option value="">Toutes les écoles</option>
                  {conEcolesList.map((ecole, idx) => <option key={idx} value={ecole}>{ecole}</option>)}
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Matière</label>
                <select value={selectedConMatiere} onChange={(e) => setSelectedConMatiere(e.target.value)} style={styles.select}>
                  <option value="">Toutes les matières</option>
                  {conMatieresList.map((mat, idx) => <option key={idx} value={mat}>{mat}</option>)}
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Année</label>
                <select value={selectedConAnnee} onChange={(e) => setSelectedConAnnee(e.target.value)} style={styles.select}>
                  <option value="">Toutes les années</option>
                  {conAnneesList.map((ann, idx) => <option key={idx} value={ann}>{ann}</option>)}
                </select>
              </div>
              {(searchConTitre || selectedConMatiere || selectedConChapitre || selectedConEcole || selectedConAnnee) && (
                <button onClick={() => { setSearchConTitre(''); setSelectedConMatiere(''); setSelectedConChapitre(''); setSelectedConEcole(''); setSelectedConAnnee(''); }} style={styles.btnReset}>
                  Réinitialiser
                </button>
              )}
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Titre</th>
                  <th style={styles.th}>Matière</th>
                  <th style={styles.th}>Chapitre</th>
                  <th style={styles.th}>Format</th>
                  <th style={styles.th}>Fichier HTML</th>
                  <th style={styles.thCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConcours.length > 0 ? (
                  filteredConcours.map((item) => {
                    return (
                      <tr key={item.id}>
                        <td style={styles.tdBold}>{item.titre}</td>
                        <td style={styles.td}><span style={styles.tagMatiere}>{item.matiere}</span></td>
                        <td style={styles.td}>{item.chapitre || '-'}</td>
                        <td style={styles.td}>
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                            🌐 HTML Web
                          </span>
                        </td>
                        <td style={styles.td}>
                          {item.htmlUrl ? (
                            <button
                              onClick={() => setPreviewConcoursHtml(item)}
                              style={{ ...styles.linkBlue, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontWeight: 600, color: '#16a34a' }}
                            >
                              🌐 Ouvrir HTML
                            </button>
                          ) : (
                            <span style={{ color: COLORS.textLight, fontSize: '12px' }}>Aucun fichier</span>
                          )}
                        </td>
                        <td style={styles.tdCenter}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {item.htmlUrl && (
                              <button
                                onClick={() => setPreviewConcoursHtml(item)}
                                style={{
                                  background: '#6366f1',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '7px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="Aperçu du document HTML"
                              >
                                👁️ Aperçu
                              </button>
                            )}
                            <button
                              onClick={() => { setConcoursForHtml(item); setUploadHtmlModalOpen(true); }}
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                padding: '7px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Remplacer le fichier HTML"
                            >
                              🌐 Modifier HTML
                            </button>
                            <button
                              onClick={() => handleDeleteConcoursBlanc(item.id)}
                              style={styles.btnRedOutline}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="6" style={styles.emptyRow}>Aucun concours blanc trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ======================== MODALS ======================== */}

      {/* Modal: Ajouter Concours (HTML) */}
      {isRealConcoursModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: '520px' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>🌐 Ajouter un Concours (Fichiers HTML)</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Importez les fichiers HTML du concours (sujet et corrigé interactifs).
                </p>
              </div>
              <button onClick={() => setIsRealConcoursModalOpen(false)} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleRealConcoursSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Titre du Concours *</label>
                <input type="text" placeholder="Ex: Concours ENSA 2025 - Mathématiques" value={realTitre} onChange={(e) => setRealTitre(e.target.value)} required style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>École *</label>
                <input type="text" placeholder="Ex: ENSA, ENCG, FST, ENSAM, ENA, APESA..." value={realEcole} onChange={(e) => setRealEcole(e.target.value)} required style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Matière *</label>
                <input type="text" placeholder="Ex: Mathématiques, Physique, SVT..." value={realMatiere} onChange={(e) => setRealMatiere(e.target.value)} required style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Année *</label>
                <input type="number" placeholder="Ex: 2025" value={realAnnee} onChange={(e) => setRealAnnee(e.target.value)} required style={styles.formInput} />
              </div>

              {/* Fichier HTML Sujet */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>🌐 Fichier HTML Sujet (.html, .htm)</label>
                <input 
                  type="file" 
                  accept=".html,.htm,text/html" 
                  onChange={(e) => setRealFileSujet(e.target.files[0])} 
                  style={styles.formFile} 
                />
                <small style={{ color: '#2563eb', display: 'block', marginTop: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                  📄 Document HTML interactif du sujet (MathJax, styles CSS supportés).
                </small>
              </div>

              {/* Fichier HTML Correction */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>✅ Fichier HTML Correction (.html, .htm)</label>
                <input 
                  type="file" 
                  accept=".html,.htm,text/html" 
                  onChange={(e) => setRealFileCorrection(e.target.files[0])} 
                  style={styles.formFile} 
                />
                <small style={{ color: '#16a34a', display: 'block', marginTop: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                  ✓ Corrigé détaillé et barème au format HTML.
                </small>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsRealConcoursModalOpen(false)} style={styles.btnCancel}>Annuler</button>
                <button type="submit" disabled={loadingRealCon} style={{ ...styles.btnSubmit, opacity: loadingRealCon ? 0.7 : 1 }}>
                  {loadingRealCon ? 'Enregistrement...' : 'Enregistrer le Concours HTML'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifier Concours (HTML) */}
      {isEditRealConcoursModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: '520px' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>✏️ Modifier le Concours (HTML)</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Modifiez les informations et téléversez de nouveaux fichiers HTML si nécessaire.
                </p>
              </div>
              <button onClick={() => setIsEditRealConcoursModalOpen(false)} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleEditRealConcoursSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Titre du Concours *</label>
                <input type="text" value={realTitre} onChange={(e) => setRealTitre(e.target.value)} required style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>École *</label>
                <input type="text" value={realEcole} onChange={(e) => setRealEcole(e.target.value)} required style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Matière *</label>
                <input type="text" value={realMatiere} onChange={(e) => setRealMatiere(e.target.value)} required style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Année *</label>
                <input type="number" value={realAnnee} onChange={(e) => setRealAnnee(e.target.value)} required style={styles.formInput} />
              </div>

              {/* Remplacer Sujet HTML */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>🌐 Remplacer le Fichier HTML Sujet (Optionnel)</label>
                <input 
                  type="file" 
                  accept=".html,.htm,text/html" 
                  onChange={(e) => setRealFileSujet(e.target.files[0])} 
                  style={styles.formFile} 
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: '3px', fontSize: '11px' }}>
                  Laissez vide pour conserver le sujet actuel.
                </small>
              </div>

              {/* Remplacer Correction HTML */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>✅ Remplacer le Fichier HTML Correction (Optionnel)</label>
                <input 
                  type="file" 
                  accept=".html,.htm,text/html" 
                  onChange={(e) => setRealFileCorrection(e.target.files[0])} 
                  style={styles.formFile} 
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: '3px', fontSize: '11px' }}>
                  Laissez vide pour conserver la correction actuelle.
                </small>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsEditRealConcoursModalOpen(false)} style={styles.btnCancel}>Annuler</button>
                <button type="submit" disabled={loadingEditRealCon} style={{ ...styles.btnSubmit, opacity: loadingEditRealCon ? 0.7 : 1 }}>
                  {loadingEditRealCon ? 'Mise à jour...' : 'Enregistrer les Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Aperçu Fichier HTML Concours */}
      {previewRealConcoursHtml && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: '1120px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>🌐 {previewRealConcoursHtml.titre}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {previewRealConcoursHtml.type} • {previewRealConcoursHtml.ecole} • {previewRealConcoursHtml.matiere} ({previewRealConcoursHtml.annee})
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a
                  href={getPdfUrl(previewRealConcoursHtml.url)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textDecoration: 'none', background: '#eff6ff', padding: '6px 12px', borderRadius: '6px' }}
                >
                  Plein écran ↗
                </a>
                <button onClick={() => setPreviewRealConcoursHtml(null)} style={styles.modalClose}>&times;</button>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
              <iframe
                src={getPdfUrl(previewRealConcoursHtml.url)}
                title={previewRealConcoursHtml.titre}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                style={{
                  width: '100%',
                  height: '75vh',
                  border: 'none',
                  display: 'block',
                  background: '#ffffff'
                }}
              />
            </div>

            <div style={{ ...styles.modalFooter, marginTop: '16px' }}>
              <button onClick={() => setPreviewRealConcoursHtml(null)} style={styles.btnCancel}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajouter Résumé / Astuce */}
      {isResumeModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>💡 Ajouter un Résumé / Astuce (HTML)</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Sélectionnez la matière (Mathématiques, Physique-Chimie, SVT), le chapitre et uploadez le fichier <strong>HTML</strong> (ou PDF).
                </p>
              </div>
              <button onClick={() => setIsResumeModalOpen(false)} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleResumeSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Titre du résumé ou astuce *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Astuces Calcul des Limites & Formes Indéterminées" 
                  value={resTitre} 
                  onChange={(e) => setResTitre(e.target.value)} 
                  required 
                  style={styles.formInput} 
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Matière du Concours / BAC *</label>
                <select 
                  value={resMatiere} 
                  onChange={(e) => { 
                    setResMatiere(e.target.value); 
                    setResChapitre(''); 
                  }} 
                  required 
                  style={styles.formInput}
                >
                  <option value="Mathématiques">📐 Mathématiques</option>
                  <option value="Physique-Chimie">⚡ Physique-Chimie</option>
                  <option value="SVT">🧬 SVT (Sciences de la Vie et de la Terre)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Chapitre *</label>
                <input 
                  type="text" 
                  list="add-chapitres-bac-list" 
                  placeholder="Sélectionnez ou tapez le nom du chapitre..." 
                  value={resChapitre} 
                  onChange={(e) => setResChapitre(e.target.value)} 
                  required 
                  style={styles.formInput} 
                />
                <datalist id="add-chapitres-bac-list">
                  {getBacChapitresList(resMatiere).map((ch, idx) => (
                    <option key={idx} value={ch} />
                  ))}
                  {resChapitresList.map((ch, idx) => (
                    <option key={`existing-${idx}`} value={ch} />
                  ))}
                </datalist>
                <small style={{ color: '#64748b', display: 'block', marginTop: '4px', fontSize: '11px' }}>
                  💡 Choisissez dans la liste déroulante ou tapez directement un nouveau chapitre.
                </small>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Fichier HTML du Résumé / Astuce *</label>
                <input 
                  type="file" 
                  accept=".html,.htm,.pdf,application/pdf" 
                  onChange={(e) => setResFile(e.target.files[0])} 
                  required 
                  style={styles.formFile} 
                />
                <small style={{ color: '#15803d', display: 'block', marginTop: '6px', fontSize: '12px', fontWeight: 600 }}>
                  🌐 Fichiers .html recommandés : affichage direct avec formules MathJax/KaTeX, tableaux et styles interactifs.
                </small>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsResumeModalOpen(false)} style={styles.btnCancel}>Annuler</button>
                <button type="submit" disabled={loadingRes} style={{ ...styles.btnSubmit, opacity: loadingRes ? 0.7 : 1 }}>
                  {loadingRes ? 'Enregistrement...' : 'Enregistrer le Résumé / Astuce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifier Résumé / Astuce */}
      {isEditResumeModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>✏️ Modifier le Résumé / Astuce</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Modifiez le titre, la matière, le chapitre ou remplacez le fichier source HTML.
                </p>
              </div>
              <button onClick={() => setIsEditResumeModalOpen(false)} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleEditResumeSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Titre du résumé ou astuce *</label>
                <input 
                  type="text" 
                  value={editResTitre} 
                  onChange={(e) => setEditResTitre(e.target.value)} 
                  required 
                  style={styles.formInput} 
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Matière du Concours / BAC *</label>
                <select 
                  value={editResMatiere} 
                  onChange={(e) => { 
                    setEditResMatiere(e.target.value); 
                    setEditResChapitre(''); 
                  }} 
                  required 
                  style={styles.formInput}
                >
                  <option value="Mathématiques">📐 Mathématiques</option>
                  <option value="Physique-Chimie">⚡ Physique-Chimie</option>
                  <option value="SVT">🧬 SVT (Sciences de la Vie et de la Terre)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Chapitre *</label>
                <input 
                  type="text" 
                  list="edit-chapitres-bac-list" 
                  value={editResChapitre} 
                  onChange={(e) => setEditResChapitre(e.target.value)} 
                  required 
                  style={styles.formInput} 
                />
                <datalist id="edit-chapitres-bac-list">
                  {getBacChapitresList(editResMatiere).map((ch, idx) => (
                    <option key={idx} value={ch} />
                  ))}
                  {resChapitresList.map((ch, idx) => (
                    <option key={`edit-existing-${idx}`} value={ch} />
                  ))}
                </datalist>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Remplacer le fichier HTML (Optionnel)</label>
                <input 
                  type="file" 
                  accept=".html,.htm,.pdf,application/pdf" 
                  onChange={(e) => setEditResFile(e.target.files[0])} 
                  style={styles.formFile} 
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: '4px', fontSize: '11px' }}>
                  💡 Laissez ce champ vide pour conserver le fichier HTML actuel.
                </small>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsEditResumeModalOpen(false)} style={styles.btnCancel}>Annuler</button>
                <button type="submit" disabled={loadingEditRes} style={{ ...styles.btnSubmit, opacity: loadingEditRes ? 0.7 : 1 }}>
                  {loadingEditRes ? 'Mise à jour...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Aperçu du Résumé (Admin) */}
      {previewResume && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: previewResume.htmlUrl || previewResume.fileType === 'HTML' ? '1100px' : '850px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Aperçu : {previewResume.titre}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {previewResume.matiere} • {previewResume.chapitre} {previewResume.htmlUrl ? '• Format Web HTML' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {previewResume.htmlUrl && (
                  <a 
                    href={getPdfUrl(previewResume.htmlUrl)} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textDecoration: 'none', background: '#eff6ff', padding: '6px 12px', borderRadius: '6px' }}
                  >
                    Plein écran ↗
                  </a>
                )}
                <button onClick={() => setPreviewResume(null)} style={styles.modalClose}>&times;</button>
              </div>
            </div>

            {/* Affichage spécial HTML */}
            {previewResume.htmlUrl || previewResume.fileType === 'HTML' ? (
              <div style={{ background: '#f8fafc', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <iframe
                  src={getPdfUrl(previewResume.htmlUrl)}
                  title={previewResume.titre}
                  style={{
                    width: '100%',
                    height: '72vh',
                    border: 'none',
                    display: 'block',
                    background: '#ffffff'
                  }}
                />
              </div>
            ) : previewResume.pageImages && previewResume.pageImages.length > 0 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {previewResume.pageImages.map((_, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => setPreviewPageIdx(pIdx)}
                        style={{
                          background: previewPageIdx === pIdx ? '#2563eb' : '#ffffff',
                          color: previewPageIdx === pIdx ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Page {pIdx + 1}
                      </button>
                    ))}
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                    Page {previewPageIdx + 1} sur {previewResume.pageImages.length}
                  </span>
                </div>

                <div style={{ textAlign: 'center', background: '#f1f5f9', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <img
                    src={getPdfUrl(previewResume.pageImages[previewPageIdx])}
                    alt={`Page ${previewPageIdx + 1}`}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                <p>Aucune image de page n'est encore générée pour ce document.</p>
                {previewResume.pdfUrl && (
                  <a href={getPdfUrl(previewResume.pdfUrl)} target="_blank" rel="noreferrer" style={styles.linkBlue}>
                    Consulter le fichier PDF
                  </a>
                )}
              </div>
            )}

            <div style={{ ...styles.modalFooter, marginTop: '20px' }}>
              <button onClick={() => setPreviewResume(null)} style={styles.btnCancel}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajouter Cours BAC */}
      {isCoursModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>📖 Ajouter un Cours BAC (Table COURS_BAC)</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Enregistrement dans la table <strong>cours_bac</strong> avec fichier HTML.
                </p>
              </div>
              <button onClick={() => setIsCoursModalOpen(false)} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleCoursBacSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Titre du cours *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Cours complet - Calcul des Limites & Fonctions" 
                  value={coursTitre} 
                  onChange={(e) => setCoursTitre(e.target.value)} 
                  required 
                  style={styles.formInput} 
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Matière (Math, Physique, SVT, Philo, Anglais) *</label>
                <select 
                  value={coursMatiere} 
                  onChange={(e) => { 
                    setCoursMatiere(e.target.value); 
                    setCoursChapitre(''); 
                  }} 
                  required 
                  style={styles.formInput}
                >
                  <option value="Mathématiques">📐 Mathématiques</option>
                  <option value="Physique-Chimie">⚡ Physique-Chimie</option>
                  <option value="SVT">🧬 SVT (Sciences de la Vie et de la Terre)</option>
                  <option value="Philosophie">🏛️ Philosophie</option>
                  <option value="Anglais">🌍 Anglais (English)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Chapitre *</label>
                <input 
                  type="text" 
                  list="add-cours-chapitres-list" 
                  placeholder="Sélectionnez ou tapez le nom du chapitre..." 
                  value={coursChapitre} 
                  onChange={(e) => setCoursChapitre(e.target.value)} 
                  required 
                  style={styles.formInput} 
                />
                <datalist id="add-cours-chapitres-list">
                  {getBacChapitresList(coursMatiere).map((ch, idx) => (
                    <option key={idx} value={ch} />
                  ))}
                  {coursChapitresList.map((ch, idx) => (
                    <option key={`cours-${idx}`} value={ch} />
                  ))}
                </datalist>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Upload du fichier HTML (.html, .htm) *</label>
                <input 
                  type="file" 
                  accept=".html,.htm,text/html" 
                  onChange={(e) => setCoursHtmlFile(e.target.files[0])} 
                  required 
                  style={styles.formFile} 
                />
                <small style={{ color: '#15803d', display: 'block', marginTop: '6px', fontSize: '12px', fontWeight: 600 }}>
                  🌐 Fichier HTML interactif sauvegardé dans le dossier uploads/ et lié au cours.
                </small>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsCoursModalOpen(false)} style={styles.btnCancel}>Annuler</button>
                <button type="submit" disabled={loadingCours} style={{ ...styles.btnSubmit, opacity: loadingCours ? 0.7 : 1 }}>
                  {loadingCours ? 'Enregistrement...' : 'Enregistrer dans COURS_BAC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modifier Cours BAC */}
      {isEditCoursModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>✏️ Modifier Cours BAC</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Modifiez les informations dans la table <strong>cours_bac</strong>.
                </p>
              </div>
              <button onClick={() => setIsEditCoursModalOpen(false)} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleEditCoursSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Titre du cours *</label>
                <input 
                  type="text" 
                  value={editCoursTitre} 
                  onChange={(e) => setEditCoursTitre(e.target.value)} 
                  required 
                  style={styles.formInput} 
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Matière *</label>
                <select 
                  value={editCoursMatiere} 
                  onChange={(e) => { 
                    setEditCoursMatiere(e.target.value); 
                    setEditCoursChapitre(''); 
                  }} 
                  required 
                  style={styles.formInput}
                >
                  <option value="Mathématiques">📐 Mathématiques</option>
                  <option value="Physique-Chimie">⚡ Physique-Chimie</option>
                  <option value="SVT">🧬 SVT (Sciences de la Vie et de la Terre)</option>
                  <option value="Philosophie">🏛️ Philosophie</option>
                  <option value="Anglais">🌍 Anglais (English)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Chapitre *</label>
                <input 
                  type="text" 
                  list="edit-cours-chapitres-list" 
                  value={editCoursChapitre} 
                  onChange={(e) => setEditCoursChapitre(e.target.value)} 
                  required 
                  style={styles.formInput} 
                />
                <datalist id="edit-cours-chapitres-list">
                  {getBacChapitresList(editCoursMatiere).map((ch, idx) => (
                    <option key={idx} value={ch} />
                  ))}
                  {coursChapitresList.map((ch, idx) => (
                    <option key={`edit-cours-${idx}`} value={ch} />
                  ))}
                </datalist>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Remplacer le fichier HTML (Optionnel)</label>
                <input 
                  type="file" 
                  accept=".html,.htm,text/html" 
                  onChange={(e) => setEditCoursHtmlFile(e.target.files[0])} 
                  style={styles.formFile} 
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: '4px', fontSize: '11px' }}>
                  💡 Laissez vide pour conserver le fichier HTML actuel.
                </small>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsEditCoursModalOpen(false)} style={styles.btnCancel}>Annuler</button>
                <button type="submit" disabled={loadingEditCours} style={{ ...styles.btnSubmit, opacity: loadingEditCours ? 0.7 : 1 }}>
                  {loadingEditCours ? 'Mise à jour...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Aperçu Fichier HTML Cours BAC */}
      {previewCoursHtml && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: '1100px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>📖 {previewCoursHtml.titre}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {previewCoursHtml.matiere} • {previewCoursHtml.chapitre} • Table COURS_BAC
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a
                  href={getPdfUrl(previewCoursHtml.htmlUrl)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textDecoration: 'none', background: '#eff6ff', padding: '6px 12px', borderRadius: '6px' }}
                >
                  Plein écran ↗
                </a>
                <button onClick={() => setPreviewCoursHtml(null)} style={styles.modalClose}>&times;</button>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
              <iframe
                src={getPdfUrl(previewCoursHtml.htmlUrl)}
                title={previewCoursHtml.titre}
                style={{
                  width: '100%',
                  height: '74vh',
                  border: 'none',
                  display: 'block',
                  background: '#ffffff'
                }}
              />
            </div>

            <div style={{ ...styles.modalFooter, marginTop: '16px' }}>
              <button onClick={() => setPreviewCoursHtml(null)} style={styles.btnCancel}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajouter Concours Blanc */}
      {isConcoursModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Ajouter un Concours Blanc</h3>
              <button onClick={() => setIsConcoursModalOpen(false)} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleConcoursSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Titre du concours</label>
                <input type="text" placeholder="Ex: Concours Blanc ENSA 2024" value={conTitre} onChange={(e) => setConTitre(e.target.value)} required style={styles.formInput} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Matière</label>
                <input type="text" placeholder="Ex: Mathématiques, Physique" value={conMatiere} onChange={(e) => setConMatiere(e.target.value)} required style={styles.formInput} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Chapitre</label>
                <input type="text" placeholder="Ex: Analyse, Algèbre, Probabilités" value={conChapitre} onChange={(e) => setConChapitre(e.target.value)} required style={styles.formInput} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Fichier HTML du Concours Blanc *</label>
                <input 
                  type="file" 
                  accept=".html,.htm,text/html" 
                  onChange={(e) => setConHtmlFile(e.target.files[0])} 
                  required 
                  style={styles.formFile} 
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: '4px', fontSize: '11px' }}>
                  💡 Fichier HTML complet (QCM interactif, styles, timer et corrigé).
                </small>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsConcoursModalOpen(false)} style={styles.btnCancel}>Annuler</button>
                <button type="submit" disabled={loadingCon} style={{ ...styles.btnSubmit, opacity: loadingCon ? 0.7 : 1 }}>
                  {loadingCon ? 'Enregistrement en cours...' : 'Enregistrer le Concours Blanc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Fichier HTML pour Concours Blanc Existant */}
      {uploadHtmlModalOpen && concoursForHtml && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Ajouter un Fichier HTML</h3>
              <button onClick={() => { setUploadHtmlModalOpen(false); setConcoursForHtml(null); }} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleUploadHtmlConcoursSubmit}>
              <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px', fontSize: '12px', color: '#1e40af', marginBottom: '14px' }}>
                <strong>Concours :</strong> {concoursForHtml.titre} ({concoursForHtml.matiere})
                {concoursForHtml.htmlUrl && (
                  <div style={{ marginTop: '4px', color: '#15803d', fontWeight: 600 }}>
                    ✓ Un fichier HTML existe déjà. Téléverser un nouveau fichier le remplacera.
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Sélectionner le fichier HTML</label>
                <input
                  type="file"
                  accept=".html,.htm,text/html"
                  onChange={(e) => setStandaloneHtmlFile(e.target.files[0])}
                  required
                  style={styles.formFile}
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: '4px', fontSize: '11px' }}>
                  Formats acceptés : .html, .htm (avec MathJax, styles CSS, scripts...).
                </small>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => { setUploadHtmlModalOpen(false); setConcoursForHtml(null); }} style={styles.btnCancel}>Annuler</button>
                <button type="submit" disabled={uploadingHtml} style={{ ...styles.btnSubmit, background: '#10b981', opacity: uploadingHtml ? 0.7 : 1 }}>
                  {uploadingHtml ? 'Téléversement...' : 'Téléverser le HTML'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Aperçu Fichier HTML Concours Blanc */}
      {previewConcoursHtml && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: '1100px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>🌐 {previewConcoursHtml.titre}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {previewConcoursHtml.matiere} {previewConcoursHtml.ecole ? `• ${previewConcoursHtml.ecole}` : ''} {previewConcoursHtml.annee ? `(${previewConcoursHtml.annee})` : ''} • Version Web HTML
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a
                  href={getPdfUrl(previewConcoursHtml.htmlUrl)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textDecoration: 'none', background: '#eff6ff', padding: '6px 12px', borderRadius: '6px' }}
                >
                  Plein écran ↗
                </a>
                <button onClick={() => setPreviewConcoursHtml(null)} style={styles.modalClose}>&times;</button>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
              <iframe
                src={getPdfUrl(previewConcoursHtml.htmlUrl)}
                title={previewConcoursHtml.titre}
                style={{
                  width: '100%',
                  height: '74vh',
                  border: 'none',
                  display: 'block',
                  background: '#ffffff'
                }}
              />
            </div>

            <div style={{ ...styles.modalFooter, marginTop: '16px' }}>
              <button onClick={() => setPreviewConcoursHtml(null)} style={styles.btnCancel}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gestion du QCM et Corrections (Admin) */}
      {qcmModalOpen && qcmCurrentConcours && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: '920px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ ...styles.modalHeader, alignItems: 'flex-start' }}>
              <div>
                <h3 style={styles.modalTitle}>🎯 Gestion du QCM & Corrigés</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  <strong>{qcmCurrentConcours.titre}</strong>
                  {qcmCurrentConcours.ecole ? ` • ${qcmCurrentConcours.ecole}` : ''}
                  {` • ${qcmCurrentConcours.matiere}`}
                  {qcmCurrentConcours.annee ? ` (${qcmCurrentConcours.annee})` : ''}
                  {` — ${qcmQuestions.length} question(s) détectée(s)`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleForceExtractQcm}
                  disabled={qcmLoading}
                  style={{
                    background: '#f8fafc',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Relancer l'extraction automatique depuis le fichier PDF"
                >
                  🔄 Ré-extraire PDF
                </button>
                <button onClick={() => setQcmModalOpen(false)} style={styles.modalClose}>&times;</button>
              </div>
            </div>

            {qcmLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>Chargement et analyse des questions QCM...</p>
              </div>
            ) : qcmQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '10px', margin: '16px 0', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📄</div>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px', color: '#1e293b' }}>Aucune question QCM détectée</h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Le PDF ne semble pas contenir de questions au format QCM standard reconnu automatiquement (Q1, Question 1, etc. avec choix A, B, C, D).
                </p>
                <button
                  onClick={handleForceExtractQcm}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🔄 Tenter une ré-extraction automatique
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', margin: '16px 0' }}>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#1e40af' }}>
                  💡 <strong>Instructions Admin :</strong> Définissez la <strong>bonne réponse</strong> (A, B, C, D...) pour chaque question et ajoutez une <strong>explication détaillée</strong> si le corrigé était absent. Cliquez sur <em>"Enregistrer les corrections"</em> ci-dessous pour valider.
                </div>

                {qcmQuestions.map((q, idx) => {
                  const hasCorrection = Boolean(q.correctChoiceLabel && q.correctChoiceLabel.trim());
                  return (
                    <div
                      key={q.id || idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '18px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* En-tête de la question */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            background: '#1e293b',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '12px',
                            padding: '3px 10px',
                            borderRadius: '999px'
                          }}>
                            Question {q.questionNumber || idx + 1}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: hasCorrection ? '#dcfce7' : '#fee2e2',
                            color: hasCorrection ? '#15803d' : '#b91c1c'
                          }}>
                            {hasCorrection ? `✅ Bonne réponse : ${q.correctChoiceLabel}` : '⚠️ Corrigé absent'}
                          </span>
                        </div>
                      </div>

                      {/* Énoncé de la question */}
                      <p style={{
                        margin: '0 0 14px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1e293b',
                        lineHeight: 1.5,
                        background: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: '6px'
                      }}>
                        {q.questionText}
                      </p>

                      {/* Choix de réponses */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '16px' }}>
                        {(q.choices || []).map((choice, cIdx) => {
                          const isCorrect = q.correctChoiceLabel === choice.choiceLabel;
                          return (
                            <div
                              key={choice.id || cIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                background: isCorrect ? '#f0fdf4' : '#ffffff',
                                border: `1px solid ${isCorrect ? '#86efac' : '#e2e8f0'}`,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{
                                width: '26px',
                                height: '26px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                background: isCorrect ? '#22c55e' : '#f1f5f9',
                                color: isCorrect ? '#ffffff' : '#334155',
                                fontWeight: 700,
                                fontSize: '12px'
                              }}>
                                {choice.choiceLabel}
                              </span>
                              <span style={{ fontSize: '13px', color: isCorrect ? '#14532d' : '#334155', fontWeight: isCorrect ? 600 : 400 }}>
                                {choice.choiceText}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Configuration de la correction manuelle */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '14px',
                        display: 'grid',
                        gridTemplateColumns: '200px 1fr',
                        gap: '14px',
                        alignItems: 'start'
                      }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Bonne réponse :
                          </label>
                          <select
                            value={q.correctChoiceLabel || ''}
                            onChange={(e) => handleQuestionChange(q.id, 'correctChoiceLabel', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              background: '#ffffff',
                              fontWeight: 700,
                              color: q.correctChoiceLabel ? '#15803d' : '#64748b',
                              outline: 'none'
                            }}
                          >
                            <option value="">-- Non définie --</option>
                            {(q.choices || []).map((c, cIdx) => (
                              <option key={cIdx} value={c.choiceLabel}>
                                Option {c.choiceLabel}
                              </option>
                            ))}
                            {/* Fallback au cas où aucun choix n'est mappé */}
                            {(!q.choices || q.choices.length === 0) && (
                              <>
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                                <option value="E">Option E</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Explication détaillée de la correction :
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ex: En appliquant la formule d'Euler, on obtient... / Rappel de cours sur la dérivée..."
                            value={q.explanation || ''}
                            onChange={(e) => handleQuestionChange(q.id, 'explanation', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              outline: 'none',
                              fontFamily: 'inherit',
                              boxSizing: 'border-box',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ ...styles.modalFooter, marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setQcmModalOpen(false)}
                style={styles.btnCancel}
              >
                Fermer
              </button>
              {qcmQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveQcmCorrections}
                  disabled={qcmSaving}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: qcmSaving ? 0.7 : 1
                  }}
                >
                  {qcmSaving ? 'Enregistrement...' : '💾 Enregistrer toutes les corrections'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal: Ajouter / Modifier un Examen National */}
      {isExamModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>
                  {editingExamId ? 'Modifier l\'Examen National' : 'Ajouter un Examen National'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Déposez le sujet PDF et le corrigé PDF de l'examen national.
                </p>
              </div>
              <button onClick={() => { setIsExamModalOpen(false); setEditingExamId(null); }} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleExamSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Titre de l'examen</label>
                <input
                  type="text"
                  placeholder="Ex: Examen National Mathématiques 2024"
                  value={examTitre}
                  onChange={(e) => setExamTitre(e.target.value)}
                  required
                  style={styles.formInput}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Matière</label>
                  <input
                    type="text"
                    placeholder="Ex: Mathématiques, Physique..."
                    value={examMatiere}
                    onChange={(e) => setExamMatiere(e.target.value)}
                    required
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Année</label>
                  <input
                    type="number"
                    placeholder="Ex: 2024"
                    value={examAnnee}
                    onChange={(e) => setExamAnnee(e.target.value)}
                    required
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Option / Filière</label>
                  <input
                    type="text"
                    placeholder="Ex: SM-A, SM-B, PC, SVT..."
                    value={examOption}
                    onChange={(e) => setExamOption(e.target.value)}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Session</label>
                  <select
                    value={examSession}
                    onChange={(e) => setExamSession(e.target.value)}
                    style={{ ...styles.formInput, background: '#ffffff', cursor: 'pointer' }}
                  >
                    <option value="Normale">Normale</option>
                    <option value="Rattrapage">Rattrapage</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>📄 PDF Sujet {editingExamId ? '(Laisser vide pour conserver)' : ''}</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setExamFileSujet(e.target.files[0])}
                  style={styles.formFile}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>✅ PDF Correction {editingExamId ? '(Laisser vide pour conserver)' : ''}</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setExamFileCorrection(e.target.files[0])}
                  style={styles.formFile}
                />
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => { setIsExamModalOpen(false); setEditingExamId(null); }}
                  style={styles.btnCancel}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingExam}
                  style={{ ...styles.btnSubmit, opacity: loadingExam ? 0.7 : 1 }}
                >
                  {loadingExam ? 'Enregistrement...' : editingExamId ? 'Mettre à jour' : 'Enregistrer l\'examen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
