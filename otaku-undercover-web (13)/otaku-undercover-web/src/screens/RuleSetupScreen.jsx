import React, { useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';

export default function RuleSetupScreen({ room, playerId, onSubmit }) {
  const [text, setText] = useState('');
  const ready = room.rule.ready || {};
  const players = room.players || {};
  const totalCount = Object.keys(players).length;
  const readyCount = Object.values(ready).filter(Boolean).length;
  const iAmReady = Boolean(ready[playerId]);

  return (
    <div className="screen screen-centered">
      <p style={{ color: 'var(--color-muted)', textAlign: 'center' }}>Ta règle secrète</p>
      <p style={{ color: 'var(--color-secondary)', fontSize: 13, textAlign: 'center', margin: '4px 0 20px', lineHeight: 1.5 }}>
        Choisis un point commun entre plusieurs personnages, connu de toi seul.
        <br />Ex. « Personnages capables de se transformer en Super Saiyan »
      </p>

      {!iAmReady ? (
        <>
          <input
            type="text"
            className="text-input"
            style={{ maxWidth: 320, margin: '0 auto 16px', display: 'block', textAlign: 'center' }}
            placeholder="Ta règle..."
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
          />
          <PrimaryButton title="Valider ma règle" disabled={text.trim().length === 0} onClick={() => onSubmit(text)} />
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 8 }}>✅ Règle enregistrée.</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
            En attente des autres joueurs... ({readyCount}/{totalCount})
          </p>
        </div>
      )}
    </div>
  );
}
