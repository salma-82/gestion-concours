import { getApp, getApps, initializeApp } from 'firebase/app';
import axios from 'axios';
import {
  deleteUser,
  getAdditionalUserInfo,
  getAuth,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseEnvVariableNames = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

export const missingFirebaseVariables = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => firebaseEnvVariableNames[key]);

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey
  && firebaseConfig.authDomain
  && firebaseConfig.projectId
  && firebaseConfig.appId
);

if (!firebaseConfigured) {
  console.error('[Firebase] Variables de configuration manquantes:', missingFirebaseVariables);
}

const app = firebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;

if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

export function assertFirebaseConfigured() {
  if (!auth || !db || !googleProvider) {
    const error = new Error('Firebase is not configured.');
    error.code = 'firebase/not-configured';
    throw error;
  }
}

export async function ensureGoogleUserProfile(user) {
  assertFirebaseConfigured();
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) return snapshot.data();

  const profile = {
    nom: user.displayName || '',
    email: user.email || '',
    photo: user.photoURL || '',
    provider: 'google',
    telephone: '',
    offre: null,
    filiere: null,
    onboardingDone: false,
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, profile);
  return profile;
}

export async function rejectExistingPasswordAccount(result) {
  try {
    const firebaseIdToken = await result.user.getIdToken();
    if (!firebaseIdToken) {
      return;
    }
    await axios.post('/api/auth/google/account-conflict', { firebaseIdToken });
  } catch (error) {
    if (error.response?.status === 409) {
      // A password account exists for this email, but we allow Google login
      // to proceed — the backend /api/auth/google endpoint will find the
      // existing user by email and issue a session token for them.
      console.info('[Google Auth] Password account exists for this email — merging via /api/auth/google.');
      return; // do NOT sign out or block
    }
    console.warn('[Google Auth] account-conflict check error:', error?.response?.status || error?.message);
  }
}

export async function completeGoogleOnboarding(user, { telephone, offre, filiere }) {
  assertFirebaseConfigured();
  await updateDoc(doc(db, 'users', user.uid), {
    telephone,
    offre,
    filiere,
    onboardingDone: true,
    updatedAt: serverTimestamp(),
  });
}

export function googleAuthErrorMessage(error) {
  const code = error?.code || 'unknown';
  console.error('[Google Auth] error.code:', code);

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '';
  if (code === 'auth/operation-not-allowed') return 'Connexion Google non activée';
  if (code === 'auth/unauthorized-domain') return 'Domaine non autorisé';
  if (code === 'auth/account-exists-with-different-credential' || code === 'auth/email-already-in-use') {
    return 'Un compte existe déjà avec cet e-mail. Connecte-toi avec ton mot de passe';
  }
  if (code === 'auth/network-request-failed' || code === 'unavailable' || code === 'deadline-exceeded') {
    return 'Connexion impossible, réessaie.';
  }
  if (code === 'firebase/not-configured') {
    return 'Firebase n’est pas configuré. Renseigne les variables VITE_FIREBASE_* dans gestion-concours-front/.env.';
  }
  return 'Connexion impossible, réessaie.';
}

export function saveGoogleClientSession(user, profile) {
  const fullName = String(profile?.nom || user?.displayName || '').trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const prenom = nameParts.shift() || '';
  const nom = nameParts.join(' ');
  const clientUser = {
    id: profile?.id || user?.uid || 'google-user',
    uid: user?.uid,
    prenom: profile?.prenom || prenom,
    nom: profile?.nom || nom || 'Utilisateur',
    email: profile?.email || user?.email || '',
    photo: profile?.photo || profile?.profileImageUrl || user?.photoURL || '',
    telephone: profile?.telephone || '',
    filiere: profile?.filiere || 'Sciences Mathématiques A',
    role: 'CLIENT',
    provider: 'google',
    pack: profile?.pack || profile?.offre || 'PACK_COMPLET',
  };
  if (profile?.sessionToken) {
    localStorage.setItem('authToken', profile.sessionToken);
  } else if (!localStorage.getItem('authToken')) {
    localStorage.setItem('authToken', 'google-auth-' + (user?.uid || 'session'));
  }
  localStorage.setItem('user', JSON.stringify(clientUser));
  return clientUser;
}
