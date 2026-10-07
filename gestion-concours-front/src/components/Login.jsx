import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:8081/api/auth/login', {
        email,
        motDePasse
      });

      const user = response.data;

      // Stocker l'utilisateur f localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Redirection 3la ḥsab l-role
      if (user.role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else if (user.role === 'CLIENT') {
        navigate('/client-dashboard');
      }
    } catch (err) {
      // Ila kan l-user mazal f la liste d demandes wla l-mot de passe ğalat
      const errorMsg = err.response?.data || 'Email ou mot de passe incorrect, ou compte en attente d\'approbation !';
      setError(errorMsg);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial' }}>
      <h2>Connexion - Gestion Concours</h2>
      {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email :</label><br />
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Mot de passe :</label><br />
          <input 
            type="password" 
            value={motDePasse} 
            onChange={(e) => setMotDePasse(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Se connecter
        </button>
      </form>

      {/* Lien bach y-mshi y-sajel ila makanch 3ndo compte */}
      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px' }}>
          Mazal ma 3ndkch compte? <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Créer une demande d'inscription</Link>
        </p>
      </div>
    </div>
  );
}
