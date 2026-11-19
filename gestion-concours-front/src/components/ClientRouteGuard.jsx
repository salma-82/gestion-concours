import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, ensureGoogleUserProfile } from '../firebase';

function hasLegacySession() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return false;
    if (user.provider === 'google' && (user.role === 'CLIENT' || user.onboardingDone !== false)) return true;
    if (localStorage.getItem('authToken') && user) return true;
    return String(user?.role || '').toLowerCase() === 'demo'
      && Number.isFinite(new Date(user.expiresAt).getTime())
      && new Date(user.expiresAt).getTime() > Date.now();
  } catch {
    return false;
  }
}

export default function ClientRouteGuard() {
  const location = useLocation();
  const [access, setAccess] = useState('checking');

  useEffect(() => {
    let active = true;
    const legacySession = hasLegacySession();

    if (!auth) {
      setAccess(legacySession ? 'allowed' : 'login');
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setAccess(legacySession ? 'allowed' : 'login');
        return;
      }

      try {
        const profile = await ensureGoogleUserProfile(user);
        if (active) setAccess(profile.onboardingDone === true ? 'allowed' : 'onboarding');
      } catch (err) {
        if (!active) return;
        const localUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (localUser && (localUser.email === user.email || localUser.provider === 'google')) {
          setAccess('allowed');
        } else {
          setAccess('allowed');
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (access === 'checking') {
    return <div className="auth-route-loading" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#0F2A4A', fontWeight: 700 }} role="status" aria-live="polite">Chargement de votre session…</div>;
  }
  if (access === 'login') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (access === 'onboarding') {
    return <Navigate to="/inscription" replace />;
  }
  if (access === 'network-error') {
    return <div className="auth-route-loading" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#0F2A4A', fontWeight: 700 }} role="alert">Connexion impossible, réessaie.</div>;
  }
  return <Outlet />;
}
