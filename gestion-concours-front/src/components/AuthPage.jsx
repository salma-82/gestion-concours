import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AuthPage({ initialMode = 'login', onBackToHome }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const navigate = useNavigate();

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register States
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTelephone, setRegTelephone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8081/api/auth/login', {
        email: loginEmail,
        motDePasse: loginPassword,
      });

      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else {
        navigate('/client-dashboard');
      }
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (regPassword !== regConfirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:8081/api/auth/register', {
        username: regUsername.trim(),
        email: regEmail.trim(),
        telephone: regTelephone.trim(),
        password: regPassword,
        role: 'CLIENT'
      });
      const msg = typeof res.data === 'string' ? res.data : 'Demande d\'inscription envoyée avec succès !';
      setSuccess(msg);
      // Switch back to login after 3 seconds
      setTimeout(() => {
        setMode('login');
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Minimalist */}
      <div className="p-6">
        <button 
          onClick={onBackToHome}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <span className="mr-2">←</span> Retour à l'accueil
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button 
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${mode === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            >
              Connexion
            </button>
            <button 
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${mode === 'register' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            >
              Créer un compte
            </button>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {mode === 'login' ? 'Bon retour ! 👋' : 'Rejoignez-nous 🚀'}
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                {mode === 'login' ? 'Connectez-vous pour accéder à vos cours.' : 'Créez votre compte pour commencer la préparation.'}
              </p>
            </div>

            {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 text-center">{error}</div>}
            {success && <div className="mb-6 p-3 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-lg border border-emerald-100 text-center">{success}</div>}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adresse Email</label>
                  <input 
                    type="email" 
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm"
                    placeholder="nom@exemple.com"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Mot de passe</label>
                    <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Oublié ?</a>
                  </div>
                  <input 
                    type="password" 
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="remember" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="remember" className="text-sm text-slate-600">Se souvenir de moi</label>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-70"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom d'utilisateur</label>
                  <input type="text" required value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="Ex: amine_benali" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse Email</label>
                  <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="nom@exemple.com" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro de Téléphone</label>
                  <input type="tel" required value={regTelephone} onChange={e => setRegTelephone(e.target.value)} placeholder="06XXXXXXXX" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mot de passe</label>
                  <input type="password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmer le mot de passe</label>
                  <input type="password" required value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm" />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3.5 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-70"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
