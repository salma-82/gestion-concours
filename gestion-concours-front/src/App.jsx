import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Styles
import 'katex/dist/katex.min.css';

// Entry Point & Authentication
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';

// Admin
import AdminDashboard from './components/AdminDashboard';
import AdminResumes from './components/AdminResumes';
import AdminConcoursBlanc from './components/ConcoursBlancManager';

// Client
import ClientLayout from './components/ClientLayout';
import ClientDashboard from './components/ClientDashboard';
import ClientResumes from './components/ClientResumes';
import ClientExamens from './components/ClientExamens';
import ClientConcoursBlanc from './components/ClientConcoursBlanc';

// PDF → HTML
import PdfToHtml from './components/PdfToHtml';

function App() {
  return (
    <Router>
      <Routes>

        {/* =========================
            ACCUEIL & AUTHENTIFICATION
        ========================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        {/* =========================
            ADMIN
        ========================= */}
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin-resumes"
          element={<AdminResumes />}
        />

        <Route
          path="/admin-concours"
          element={<AdminConcoursBlanc />}
        />


        {/* =========================
            CLIENT
        ========================= */}
        <Route element={<ClientLayout />}>
          <Route
            path="/client-dashboard"
            element={<ClientDashboard />}
          />
          <Route
            path="/client-resumes"
            element={<ClientResumes />}
          />
          <Route
            path="/client-examens"
            element={<ClientExamens />}
          />
          <Route
            path="/client-concours"
            element={<ClientConcoursBlanc />}
          />
        </Route>



        {/* =========================
            PDF → HTML
            Page de test
        ========================= */}
        <Route
          path="/pdf-to-html"
          element={<PdfToHtml />}
        />

      </Routes>
    </Router>
  );
}

export default App;