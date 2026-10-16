import React from 'react';

const formatDate = (value) => {
  if (!value) return 'Non renseignée';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Non renseignée';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
};

const InfoItem = ({ label, value }) => (
  <div style={{
    padding: '18px 20px',
    background: '#ffffff',
    border: '1px solid #e5edf8',
    borderRadius: '14px',
    minWidth: 0
  }}>
    <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>{label}</div>
    <div style={{ color: '#10284d', fontSize: '15px', fontWeight: 650, overflowWrap: 'anywhere' }}>{value || 'Non renseigné'}</div>
  </div>
);

export default function ClientProfile() {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    user = {};
  }

  const firstName = typeof user.prenom === 'string' ? user.prenom.trim() : '';
  const lastName = typeof user.nom === 'string' ? user.nom.trim() : '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Profil étudiant';
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'ET';
  const isActive = user.active === 1 || user.active === true;

  return (
    <div style={{ width: '100%', minHeight: '100%', boxSizing: 'border-box', padding: '32px clamp(18px, 4vw, 48px)', color: '#10284d' }}>
      <div style={{ width: '100%', maxWidth: '1180px', margin: '0 auto' }}>
        <header style={{ marginBottom: '24px' }}>
          <div style={{ color: '#2563eb', fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Espace personnel
          </div>
          <h1 style={{ margin: 0, color: '#10284d', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Profil étudiant</h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Consultez les informations de votre compte client.</p>
        </header>

        <section style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          padding: '24px',
          background: 'linear-gradient(120deg, #ffffff 0%, #f4f8ff 100%)',
          border: '1px solid #dce8fb',
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(30, 64, 120, 0.05)',
          marginBottom: '22px'
        }}>
          <div aria-hidden="true" style={{
            width: '62px', height: '62px', borderRadius: '18px', flexShrink: 0,
            display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #2563eb, #4f8cf7)',
            color: '#ffffff', fontWeight: 800, fontSize: '20px', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.2)'
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: '0 0 5px', color: '#10284d', fontSize: '20px', fontWeight: 800, overflowWrap: 'anywhere' }}>{fullName}</h2>
            <div style={{ color: '#64748b', fontSize: '13px' }}>{user.email || 'Adresse e-mail non renseignée'}</div>
          </div>
          <span style={{
            flexShrink: 0, padding: '8px 13px', borderRadius: '999px',
            background: isActive ? '#ecfdf5' : '#eff6ff',
            border: `1px solid ${isActive ? '#bbf7d0' : '#dbeafe'}`,
            color: isActive ? '#047857' : '#2563eb', fontSize: '12px', fontWeight: 750
          }}>{isActive ? 'Compte actif' : 'Compte client'}</span>
        </section>

        <section style={{ background: '#ffffff', border: '1px solid #e5edf8', borderRadius: '20px', padding: '24px', boxShadow: '0 6px 20px rgba(30, 64, 120, 0.035)' }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ margin: 0, color: '#10284d', fontSize: '17px', fontWeight: 800 }}>Informations personnelles</h2>
            <p style={{ margin: '6px 0 0', color: '#718096', fontSize: '13px' }}>Les informations associées à votre compte.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
            <InfoItem label="Prénom" value={firstName} />
            <InfoItem label="Nom" value={lastName} />
            <InfoItem label="Adresse e-mail" value={user.email} />
            <InfoItem label="Téléphone" value={user.telephone} />
            <InfoItem label="Type de compte" value="Étudiant" />
            <InfoItem label="Membre depuis" value={formatDate(user.createdAt)} />
          </div>
        </section>
      </div>
    </div>
  );
}
