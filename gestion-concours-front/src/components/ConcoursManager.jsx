import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ConcoursManager() {
    const [concoursList, setConcoursList] = useState([]);
    
    // States dyal les filtres
    const [filterEcole, setFilterEcole] = useState('');
    const [filterMatiere, setFilterMatiere] = useState('');
    const [filterAnnee, setFilterAnnee] = useState('');

    // States dyal Formulaire Add Concours
    const [titre, setTitre] = useState('');
    const [ecole, setEcole] = useState('');
    const [matiere, setMatiere] = useState('');
    const [annee, setAnnee] = useState('');
    const [fileSujet, setFileSujet] = useState(null);
    const [fileCorrection, setFileCorrection] = useState(null);

    // Charger les concours (b l-filtre wla bla filtre)
    const fetchConcours = async () => {
        try {
            let url = 'http://localhost:8080/api/concours?';
            if (filterEcole) url += `ecole=${filterEcole}&`;
            if (filterMatiere) url += `matiere=${filterMatiere}&`;
            if (filterAnnee) url += `annee=${filterAnnee}&`;

            const response = await axios.get(url);
            setConcoursList(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des concours", error);
        }
    };

    useEffect(() => {
        fetchConcours();
    }, [filterEcole, filterMatiere, filterAnnee]);

    // Ajouter un Concours (Multipart Form Data)
    const handleAddConcours = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('titre', titre);
        formData.append('ecole', ecole);
        formData.append('matiere', matiere);
        formData.append('annee', annee);
        if (fileSujet) formData.append('fileSujet', fileSujet);
        if (fileCorrection) formData.append('fileCorrection', fileCorrection);

        try {
            await axios.post('http://localhost:8080/api/concours', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Concours t-zda b-najah!');
            // Vider le formulaire
            setTitre(''); setEcole(''); setMatiere(''); setAnnee('');
            setFileSujet(null); setFileCorrection(null);
            fetchConcours(); // Actualiser la liste
        } catch (error) {
            console.error("Erreurajout", error);
            alert('Erreur lors de l’ajout du concours.');
        }
    };

    // Supprimer un Concours
    const handleDelete = async (id) => {
        if (window.confirm("Wakha t-mshih ḥetta bessaḥ?")) {
            try {
                await axios.delete(`http://localhost:8080/api/concours/${id}`);
                fetchConcours();
            } catch (error) {
                console.error("Erreur suppression", error);
            }
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>Gestion des Concours</h2>

            {/* --- FORMULAIRE AJOUT (ADMIN) --- */}
            <form onSubmit={handleAddConcours} style={{ background: '#f4f4f4', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
                <h3>Ajouter un Concours</h3>
                <input type="text" placeholder="Titre" value={titre} onChange={e => setTitre(e.target.value)} required /><br/><br/>
                <input type="text" placeholder="École (Matalan: ENSA)" value={ecole} onChange={e => setEcole(e.target.value)} required /><br/><br/>
                <input type="text" placeholder="Matière (Matalan: Math)" value={matiere} onChange={e => setMatiere(e.target.value)} required /><br/><br/>
                <input type="number" placeholder="Année (Matalan: 2026)" value={annee} onChange={e => setAnnee(e.target.value)} required /><br/><br/>
                
                <label>PDF Sujet: </label>
                <input type="file" onChange={e => setFileSujet(e.target.files[0])} accept="application/pdf" /><br/><br/>
                
                <label>PDF Correction: </label>
                <input type="file" onChange={e => setFileCorrection(e.target.files[0])} accept="application/pdf" /><br/><br/>
                
                <button type="submit">Ajouter Concours</button>
            </form>

            {/* --- SECTION FILTRES --- */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Filtrer les Concours</h3>
                <input type="text" placeholder="Filtrer par École" value={filterEcole} onChange={e => setFilterEcole(e.target.value)} />
                <input type="text" placeholder="Filtrer par Matière" value={filterMatiere} onChange={e => setFilterMatiere(e.target.value)} style={{marginLeft: '10px'}} />
                <input type="number" placeholder="Filtrer par Année" value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)} style={{marginLeft: '10px'}} />
                <button onClick={() => { setFilterEcole(''); setFilterMatiere(''); setFilterAnnee(''); }} style={{marginLeft: '10px'}}>Réinitialiser</button>
            </div>

            {/* --- LISTE DES CONCOURS --- */}
            <h3>Liste des Concours</h3>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Titre</th>
                        <th>École</th>
                        <th>Matière</th>
                        <th>Année</th>
                        <th>Sujet</th>
                        <th>Correction</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {concoursList.map(c => (
                        <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>{c.titre}</td>
                            <td>{c.ecole}</td>
                            <td>{c.matiere}</td>
                            <td>{c.annee}</td>
                            <td>
                                {c.pdfUrl ? <a href={c.pdfUrl} target="_blank" rel="noreferrer">Voir Sujet</a> : 'Aucun'}
                            </td>
                            <td>
                                {c.pdfCorrectionUrl ? <a href={c.pdfCorrectionUrl} target="_blank" rel="noreferrer">Voir Correction</a> : 'Aucune'}
                            </td>
                            <td>
                                <button onClick={() => handleDelete(c.id)} style={{ color: 'red' }}>Supprimer</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}