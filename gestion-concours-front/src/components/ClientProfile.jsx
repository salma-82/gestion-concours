import React, { useEffect, useRef, useState } from 'react';
import './ClientProfile.css';

const formatDate = (value) => {
  if (!value) return 'Non renseignée';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Non renseignée';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
};

const ProfileIcon = ({ name, className = '' }) => {
  const paths = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" strokeWidth="2" /></>,
    phone: <path d="M6.6 2.8 9.4 2a1.7 1.7 0 0 1 2 1l1.1 3.1a1.7 1.7 0 0 1-.5 1.8L10.2 9.5a14 14 0 0 0 4.3 4.3l1.6-1.8a1.7 1.7 0 0 1 1.8-.5l3.1 1.1a1.7 1.7 0 0 1 1 2l-.8 2.8a2.2 2.2 0 0 1-2.2 1.6A17 17 0 0 1 3 5a2.2 2.2 0 0 1 1.6-2.2Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h2M14 14h2M8 17h2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
    cap: <><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c3 3 9 3 12 0v-5M22 9v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></>,
    edit: <><path d="m16 4 4 4L9 19l-5 1 1-5L16 4Z" /><path d="m14 6 4 4" fill="none" stroke="currentColor" strokeWidth="2" /></>,
    camera: <><path d="M8 5 9.5 3h5L16 5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3Z" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
  };

  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
};

const InfoItem = ({ label, value, icon, children }) => (
  <div className="client-profile__info-item">
    <span className="client-profile__info-icon"><ProfileIcon name={icon} /></span>
    <div className="client-profile__info-copy">
      <div className="client-profile__info-label">{label}</div>
      {children || <div className="client-profile__info-value">{value || 'Non renseigné'}</div>}
    </div>
  </div>
);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export default function ClientProfile() {
  const [user, setUser] = useState(readStoredUser);
  const [telephone, setTelephone] = useState(user.telephone || '');
  const [isEditingTelephone, setIsEditingTelephone] = useState(false);
  const [isSavingTelephone, setIsSavingTelephone] = useState(false);
  const [telephoneFeedback, setTelephoneFeedback] = useState(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState(null);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const photoInputRef = useRef(null);
  const photoMenuRef = useRef(null);

  useEffect(() => {
    if (!isPhotoMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!photoMenuRef.current?.contains(event.target)) setIsPhotoMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsPhotoMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isPhotoMenuOpen]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return undefined;

    let cancelled = false;
    fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((profile) => {
        if (!profile || cancelled) return;
        const updatedUser = { ...readStoredUser(), ...profile };
        setUser(updatedUser);
        setTelephone(updatedUser.telephone || '');
        localStorage.setItem('user', JSON.stringify(updatedUser));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const firstName = typeof user.prenom === 'string' ? user.prenom.trim() : '';
  const lastName = typeof user.nom === 'string' ? user.nom.trim() : '';

  const saveTelephone = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
      setTelephoneFeedback({ type: 'error', message: 'Reconnectez-vous pour modifier votre numéro.' });
      return;
    }

    setIsSavingTelephone(true);
    setTelephoneFeedback(null);
    try {
      const response = await fetch('/api/auth/profile/telephone', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ telephone: telephone.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'La modification du numéro a échoué.');

      const updatedUser = { ...user, telephone: result.telephone };
      setUser(updatedUser);
      setTelephone(result.telephone || '');
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditingTelephone(false);
      setTelephoneFeedback({ type: 'success', message: 'Numéro de téléphone mis à jour.' });
    } catch (error) {
      setTelephoneFeedback({ type: 'error', message: error.message || 'Impossible de modifier le numéro.' });
    } finally {
      setIsSavingTelephone(false);
    }
  };

  const cancelTelephoneEdit = () => {
    setTelephone(user.telephone || '');
    setIsEditingTelephone(false);
    setTelephoneFeedback(null);
  };

  const uploadProfilePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setPhotoFeedback({ type: 'error', message: 'Choisissez une image JPEG ou PNG.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoFeedback({ type: 'error', message: 'La photo ne doit pas dépasser 5 Mo.' });
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setPhotoFeedback({ type: 'error', message: 'Reconnectez-vous pour modifier votre photo.' });
      return;
    }

    setIsSavingPhoto(true);
    setPhotoFeedback(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/auth/profile/photo', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Impossible d’enregistrer la photo.');

      const updatedUser = { ...user, profileImageUrl: result.profileImageUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setPhotoFeedback({ type: 'success', message: 'Photo de profil mise à jour.' });
    } catch (error) {
      setPhotoFeedback({ type: 'error', message: error.message || 'Impossible d’enregistrer la photo.' });
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const deleteProfilePhoto = async () => {
    if (!user.profileImageUrl || !window.confirm('Supprimer votre photo de profil ?')) return;
    setIsPhotoMenuOpen(false);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setPhotoFeedback({ type: 'error', message: 'Reconnectez-vous pour supprimer votre photo.' });
      return;
    }

    setIsSavingPhoto(true);
    setPhotoFeedback(null);
    try {
      const response = await fetch('/api/auth/profile/photo', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Impossible de supprimer la photo.');

      const updatedUser = { ...user, profileImageUrl: '' };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setPhotoFeedback({ type: 'success', message: 'Photo de profil supprimée.' });
    } catch (error) {
      setPhotoFeedback({ type: 'error', message: error.message || 'Impossible de supprimer la photo.' });
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const openPhotoPicker = () => {
    setIsPhotoMenuOpen(false);
    setPhotoFeedback(null);
    photoInputRef.current?.click();
  };

  return (
    <main className="client-profile">
      <div className="client-profile__content">
        <section className="client-profile__details">
          <header className="client-profile__header">
            <div className="client-profile__avatar-wrap" ref={photoMenuRef}>
              <button
                className="client-profile__header-avatar"
                type="button"
                onClick={() => setIsPhotoMenuOpen((isOpen) => !isOpen)}
                aria-label="Options de la photo de profil"
                aria-haspopup="true"
                aria-expanded={isPhotoMenuOpen}
                disabled={isSavingPhoto}
              >
                {user.profileImageUrl
                  ? <img src={user.profileImageUrl} alt="" />
                  : <ProfileIcon name="user" />}
              </button>
              {isPhotoMenuOpen && (
                <div className="client-profile__photo-menu" role="group" aria-label="Actions de la photo">
                  <button className="client-profile__photo-menu-action" type="button" onClick={openPhotoPicker}>
                    <ProfileIcon name="camera" />
                    {user.profileImageUrl ? 'Modifier la photo' : 'Ajouter une photo'}
                  </button>
                  {user.profileImageUrl && (
                    <button className="client-profile__photo-menu-action is-danger" type="button" onClick={deleteProfilePhoto}>
                      <ProfileIcon name="trash" />
                      Supprimer la photo
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="client-profile__header-copy">
              <h1 className="client-profile__section-title">Mon Profil</h1>
              <p className="client-profile__section-description">Consultez et gérez vos informations personnelles</p>
            </div>
            <input
              ref={photoInputRef}
              className="client-profile__photo-input"
              type="file"
              accept="image/jpeg,image/png"
              onChange={uploadProfilePhoto}
              aria-label="Choisir une photo de profil"
            />
            {isSavingPhoto && <span className="client-profile__photo-saving">Mise à jour…</span>}
          </header>
          <div className="client-profile__header-rule" />
          {photoFeedback && (
            <p className={`client-profile__photo-feedback is-${photoFeedback.type}`} role={photoFeedback.type === 'error' ? 'alert' : 'status'}>
              {photoFeedback.message}
            </p>
          )}

          <div className="client-profile__info-grid">
            <InfoItem label="Prénom" value={firstName} icon="user" />
            <InfoItem label="Nom" value={lastName} icon="user" />
            <InfoItem label="Adresse E-mail" value={user.email} icon="mail" />
            <InfoItem label="Téléphone" icon="phone">
              {isEditingTelephone ? (
                <form className="client-profile__phone-form" onSubmit={saveTelephone}>
                  <input
                    autoFocus
                    className="client-profile__phone-input"
                    type="tel"
                    value={telephone}
                    onChange={(event) => setTelephone(event.target.value)}
                    placeholder="06 12 34 56 78"
                    aria-label="Numéro de téléphone"
                    required
                  />
                  <div className="client-profile__phone-actions">
                    <button className="client-profile__phone-button is-secondary" type="button" onClick={cancelTelephoneEdit} disabled={isSavingTelephone}>
                      Annuler
                    </button>
                    <button className="client-profile__phone-button is-primary" type="submit" disabled={isSavingTelephone}>
                      {isSavingTelephone ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="client-profile__phone-display">
                  <div className="client-profile__info-value">{telephone || 'Non renseigné'}</div>
                  <button
                    className="client-profile__phone-inline-edit"
                    type="button"
                    onClick={() => { setIsEditingTelephone(true); setTelephoneFeedback(null); }}
                  >
                    Modifier
                  </button>
                </div>
              )}
              {telephoneFeedback && (
                <p className={`client-profile__phone-feedback is-${telephoneFeedback.type}`} role={telephoneFeedback.type === 'error' ? 'alert' : 'status'}>
                  {telephoneFeedback.message}
                </p>
              )}
            </InfoItem>
            <InfoItem label="Membre depuis" value={formatDate(user.createdAt)} icon="calendar" />
            <InfoItem label="Type de compte" value="Étudiant" icon="cap" />
          </div>
        </section>
      </div>
    </main>
  );
}
