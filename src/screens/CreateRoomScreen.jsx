import React, { useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';

export default function CreateRoomScreen({ defaultName, onBack, onCreate, creating, error }) {
  const [name, setName] = useState(defaultName || '');

  return (
    <div className="screen screen-centered">
      <button type="button" className="back-link" onClick={onBack}>← Retour</button>
      <h2 className="screen-title">Créer un salon</h2>
      <p className="screen-subtitle">Choisis ton pseudo, tu seras l'hôte de la partie.</p>

      <input
        type="text"
        className="text-input"
        style={{ maxWidth: 260, margin: '0 auto 16px', display: 'block' }}
        placeholder="Ton pseudo"
        value={name}
        maxLength={20}
        onChange={(e) => setName(e.target.value)}
      />

      {error && <p style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: 12 }}>{error}</p>}

      <PrimaryButton
        title={creating ? 'Création du salon...' : 'Créer le salon'}
        disabled={name.trim().length === 0 || creating}
        onClick={() => onCreate(name.trim())}
      />
    </div>
  );
}
