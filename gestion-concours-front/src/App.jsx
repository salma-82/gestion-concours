import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import AdminResumes from './components/AdminResumes';
import AdminConcoursBlanc from './components/ConcoursBlancManager'; // 1. Importi l-composant dyal Concours Blancs hna
import Register from './components/Register';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        
        {/* Route dyal l-Admin Resumes */}
        <Route path="/admin-resumes" element={<AdminResumes />} />
        {/* Page d Inscription / Demande de compte */}
        <Route path="/register" element={<Register />} />
        {/* 2. Zid la route dyal l-admin concours blancs hna */}
        <Route path="/admin-concours" element={<AdminConcoursBlanc />} />
      </Routes>
    </Router>
  );
}

export default App;