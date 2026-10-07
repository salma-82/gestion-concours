import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('demandes'); // 'demandes' wla 'concours'
  const [demandes, setDemandes] = useState([]);
  const [concoursList, setConcoursList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  // Jbd les données mli t-t-fetta la page
  useEffect(() => {
    fetchDemandes();
    fetchConcours();
  }, []);

  // 1. Jbd les demandes d'inscription
  const fetchDemandes = async () => {
    try {
      const response = await axios.get('http://localhost:8081/api/admin/demandes-inscription');
      setDemandes(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des demandes", err);
    }
  };

  // 2. Jbd Concours Blancs
  const fetchConcours = async () => {
    try {
      const response = await axios.get('http://localhost:8081/api/concours-blancs');
      setConcoursList(response.data);
    } catch (err) {
      console.error("Erreur concours", err);
    }
  };

  // 3. Fonction Accepter Demande (Hya li k-t-nql utilisateur l table USERS)
  const handleAccepter = async (id) => {
    try {
      setSuccess('');
      setError('');
      await axios.post(`http://localhost:8081/api/admin/accepter/${id}`);
      setSuccess("تم قبول المستخدم وإضافته بنجاح لجدول المستخدمين! ✅");
      fetchDemandes(); // Refresh d la table
    } catch (err) {
      setError("Erreur lors de l'acceptation.");
    }
  };

  // 4. Fonction Refuser Demande
  const handleRefuser = async (id) => {
    try {
      setSuccess('');
      setError('');
      await axios.delete(`http://localhost:8081/api/admin/refuser/${id}`);
      setSuccess("تم رفض وحذف الطلب ❌");
      fetchDemandes();
    } catch (err) {
      setError("Erreur lors du refus.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Admin Dashboard - Gestion Concours</h2>
        <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Déconnexion
        </button>
      </div>

      {success && <p style={{ color: 'green', background: '#e2f0d9', padding: '10px', borderRadius: '4px' }}>{success}</p>}
      {error && <p style={{ color: 'red', background: '#f8d7da', padding: '10px', borderRadius: '4px' }}>{error}</p>}

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('demandes')}
          style={{ padding: '10px 20px', marginRight: '10px', background: activeTab === 'demandes' ? '#007bff' : '#f8f9fa', color: activeTab === 'demandes' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Demandes d'Inscription ({demandes.length})
        </button>
        <button 
          onClick={() => setActiveTab('concours')}
          style={{ padding: '10px 20px', background: activeTab === 'concours' ? '#007bff' : '#f8f9fa', color: activeTab === 'concours' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Concours Blancs ({concoursList.length})
        </button>
      </div>

      {/* Tab 1: Demandes d'Inscription */}
      {activeTab === 'demandes' && (
        <div>
          <h3>Liste des demandes en attente d'approbation</h3>
          {demandes.length === 0 ? (
            <p>Aucuna demande d'inscription pour le moment.</p>
          ) : (
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f2f2f2' }}>
                  <th>ID</th>
                  <th>Nom d'utilisateur</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {demandes.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.username}</td>
                    <td>{d.email}</td>
                    <td>
                      <button 
                        onClick={() => handleAccepter(d.id)} 
                        style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>
                        Accepter
                      </button>
                      <button 
                        onClick={() => handleRefuser(d.id)} 
                        style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Refuser
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Concours Blancs */}
      {activeTab === 'concours' && (
        <div>
          <h3>Liste des Concours Blancs</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {concoursList.map((c) => (
              <li key={c.id} style={{ padding: '10px', borderBottom: '1px solid #ddd', marginBottom: '5px' }}>
                <strong>{c.titre}</strong> - {c.matiere} ({c.chapitre}) &nbsp;|&nbsp; 
                <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>Télécharger PDF</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
