import React, { useState } from 'react';
import RoomFormCard from '../components/RoomFormCard';
import { IconPlus } from '../components/OuShell';

export default function CreateRoomScreen({ chapter, defaultName, onBack, onCreate, creating, error }) {
  const [name, setName] = useState(defaultName || '');
  const disabled = name.trim().length === 0 || creating;

  function submit(e) {
    e.preventDefault();
    if (!disabled) onCreate(name.trim());
  }

  return (
    <RoomFormCard
      chapter={chapter}
      eyebrow={<>Ouvre la partie.<br />Deviens <em>l'hôte.</em></>}
      title="CRÉER UN SALON"
      subtitle="Choisis ton pseudo, tu seras l'hôte de la partie. Tu pourras ensuite inviter tes potes avec un code."
      onBack={onBack}
    >
      <form className="ou-form" onSubmit={submit}>
        <label className="ou-field">
          <span className="ou-field-label">Ton pseudo</span>
          <input
            type="text"
            className="ou-input"
            placeholder="Ex. Naruto77"
            value={name}
            maxLength={20}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        {error && <p className="ou-form-error">{error}</p>}

        <button type="submit" className="ou-btn ou-btn--create ou-btn--wide" disabled={disabled}>
          <IconPlus /> {creating ? 'Création du salon...' : 'Créer le salon'}
        </button>
      </form>
    </RoomFormCard>
  );
}
