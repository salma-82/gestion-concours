import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Styles
import 'katex/dist/katex.min.css';
import './theme.css';
import { ThemeProvider } from './theme';

// Entry Point & Authentication
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';

// Admin
import AdminDashboard from './components/AdminDashboard';
import AdminResumes from './components/AdminResumes';
import AdminConcoursBlanc from './components/ConcoursBlancManager';
import AdminDemoContent from './components/AdminDemoContent';

// Client
import ClientLayout from './components/ClientLayout';
import ClientDashboard from './components/ClientDashboard';
import ClientResumes from './components/ClientResumes';
import ClientResumesPage from './components/ClientResumesPage';
import ClientCoursPage from './components/ClientCoursPage';
import ClientExamens from './components/ClientExamens';
import ClientConcoursBlanc from './components/ClientConcoursBlanc';
import ClientConcours from './components/ClientConcours';
import ClientProfile from './components/ClientProfile';
import ClientMistakesPage from './components/ClientMistakesPage';
import CompetitionCalendar from './components/CompetitionCalendar';

// PDF → HTML
import PdfToHtml from './components/PdfToHtml';
import WhatsAppButton from './components/WhatsAppButton';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}

function AppRoutes() {
  const { pathname } = useLocation();
  const showWhatsAppButton = pathname !== '/login'
    && pathname !== '/register'
    && !pathname.startsWith('/client')
    && !pathname.startsWith('/admin');

  return (
    <>
      {showWhatsAppButton && <WhatsAppButton />}
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
        <Route path="/admin-demo-content" element={<AdminDemoContent />} />


        {/* =========================
            CLIENT
        ========================= */}
        <Route element={<ClientLayout />}>
          <Route
            path="/client-dashboard"
            element={<ClientDashboard />}
          />
          <Route path="/client-erreurs" element={<ClientMistakesPage />} />
          <Route
            path="/client-calendrier"
            element={<CompetitionCalendar />}
          />
          <Route
            path="/client-profile"
            element={<ClientProfile />}
          />
          <Route
            path="/client-cours"
            element={<ClientCoursPage />}
          />
          <Route
            path="/client-resumes"
            element={<ClientResumesPage />}
          />
          <Route
            path="/client-examens"
            element={<ClientExamens />}
          />
          <Route
            path="/client-concours"
            element={<ClientConcours />}
          />
          <Route
            path="/client-concours-blanc"
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
    </>
  );
}

export default App;
