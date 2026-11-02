import React, { useState } from 'react';
import RoomFormCard, { AgentCard, CodenameField, RoomCodeField } from '../components/RoomFormCard';
import { IconKey } from '../components/OuShell';

export default function JoinRoomScreen({ chapter, defaultName, defaultCode, onBack, onJoin, joining, error }) {
  const [name, setName] = useState(defaultName || '');
  const [code, setCode] = useState((defaultCode || '').toUpperCase());

  const valid = name.trim().length > 0 && code.trim().length >= 4;

  function submit(e) {
    e.preventDefault();
    if (valid && !joining) onJoin(code.trim(), name.trim());
  }

  return (
    <RoomFormCard
      chapter={chapter}
      kicker={<>Ton équipe t'attend. Trouve <em>l'intrus.</em></>}
      title="Rejoindre"
      subtitle="Entre le code que ton hôte t'a partagé, puis ton nom de code."
      onBack={onBack}
    >
      <form className="ou-form" onSubmit={submit}>
        <RoomCodeField value={code} onChange={setCode} autoFocus={!defaultCode} />
        <CodenameField value={name} onChange={setName} autoFocus={!!defaultCode} />
        <AgentCard name={name} role="Agent" extra={code.length === 5 ? `Salon ${code}` : 'Salon : en attente du code'} />

        {error && <p className="ou-form-error">{error}</p>}

        <button type="submit" className="ou-btn ou-btn--create ou-btn--wide" disabled={!valid || joining}>
          <IconKey /> {joining ? 'Connexion...' : 'Rejoindre le salon'}
        </button>
      </form>
    </RoomFormCard>
  );
}
