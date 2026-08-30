import React, { useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';

export default function JoinRoomScreen({ defaultName, defaultCode, onBack, onJoin, joining, error }) {
  const [name, setName] = useState(defaultName || '');
  const [code, setCode] = useState(defaultCode || '');

  const valid = name.trim().length > 0 && code.trim().length >= 4;

  return (
    <div className="screen screen-centered">
      <button type="button" className="back-link" onClick={onBack}>← Retour</button>
      <h2 className="screen-title">Rejoindre un salon</h2>
      <p className="screen-subtitle">Entre le code que ton hôte t'a partagé, et ton pseudo.</p>

      <input
        type="text"
        className="text-input"
        style={{ width: '100%', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', fontWeight: 800 }}
        placeholder="CODE DU SALON"
        value={code}
        maxLength={5}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      <input
        type="text"
        className="text-input"
        style={{ width: '100%', marginBottom: 16 }}
        placeholder="Ton pseudo"
        value={name}
        maxLength={20}
        onChange={(e) => setName(e.target.value)}
      />

      {error && <p style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: 12 }}>{error}</p>}

      <PrimaryButton
        title={joining ? 'Connexion...' : 'Rejoindre'}
        disabled={!valid || joining}
        onClick={() => onJoin(code.trim(), name.trim())}
      />
    </div>
  );
}
