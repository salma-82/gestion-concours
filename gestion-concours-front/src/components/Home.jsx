import React, { useState } from 'react';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';

export default function Home() {
  const [view, setView] = useState('landing'); // 'landing', 'login', 'register'

  if (view === 'login' || view === 'register') {
    return (
      <AuthPage 
        initialMode={view} 
        onBackToHome={() => setView('landing')} 
      />
    );
  }

  return (
    <LandingPage 
      onNavigateToAuth={(mode) => setView(mode)} 
    />
  );
}
