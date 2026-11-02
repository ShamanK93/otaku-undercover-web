import React, { useState } from 'react';
import RoomFormCard, { AgentCard, CodenameField } from '../components/RoomFormCard';
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
      kicker={<>Ouvre la partie. Deviens <em>l'hôte.</em></>}
      title="Créer un salon"
      subtitle="Choisis ton nom de code. Tu recevras ensuite un code de salon à partager avec tes potes."
      onBack={onBack}
    >
      <form className="ou-form" onSubmit={submit}>
        <CodenameField value={name} onChange={setName} autoFocus />
        <AgentCard name={name} role="Hôte" extra="Rôle : hôte de la partie" />

        {error && <p className="ou-form-error">{error}</p>}

        <button type="submit" className="ou-btn ou-btn--create ou-btn--wide" disabled={disabled}>
          <IconPlus /> {creating ? 'Création du salon...' : 'Ouvrir le salon'}
        </button>
      </form>
    </RoomFormCard>
  );
}
