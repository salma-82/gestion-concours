import React from 'react';
import { LandingMascot } from './LandingPage';
import './ClientMascot.css';

export default function ClientMascot() {
  return (
    <aside className="client-mascot" aria-label="Mascotte Boma">
      <LandingMascot className="client-mascot__art" />
    </aside>
  );
}
