import React, { useState } from 'react';
import RoomFormCard from '../components/RoomFormCard';
import { IconKey } from '../components/OuShell';

export default function JoinRoomScreen({ chapter, defaultName, defaultCode, onBack, onJoin, joining, error }) {
  const [name, setName] = useState(defaultName || '');
  const [code, setCode] = useState(defaultCode || '');

  const valid = name.trim().length > 0 && code.trim().length >= 4;

  function submit(e) {
    e.preventDefault();
    if (valid && !joining) onJoin(code.trim(), name.trim());
  }

  return (
    <RoomFormCard
      chapter={chapter}
      eyebrow={<>Ton équipe t'attend.<br />Trouve <em>l'intrus.</em></>}
      title="REJOINDRE"
      subtitle="Entre le code que ton hôte t'a partagé, et ton pseudo."
      onBack={onBack}
    >
      <form className="ou-form" onSubmit={submit}>
        <label className="ou-field">
          <span className="ou-field-label">Code du salon</span>
          <input
            type="text"
            className="ou-input ou-input--code"
            placeholder="ABCDE"
            value={code}
            maxLength={5}
            autoFocus={!defaultCode}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </label>
        <label className="ou-field">
          <span className="ou-field-label">Ton pseudo</span>
          <input
            type="text"
            className="ou-input"
            placeholder="Ex. Naruto77"
            value={name}
            maxLength={20}
            autoFocus={!!defaultCode}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        {error && <p className="ou-form-error">{error}</p>}

        <button type="submit" className="ou-btn ou-btn--create ou-btn--wide" disabled={!valid || joining}>
          <IconKey /> {joining ? 'Connexion...' : 'Rejoindre le salon'}
        </button>
      </form>
    </RoomFormCard>
  );
}
