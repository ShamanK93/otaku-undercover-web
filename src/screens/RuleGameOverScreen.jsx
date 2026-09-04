import React from 'react';
import PlayerAvatar from '../components/PlayerAvatar';
import PrimaryButton from '../components/PrimaryButton';

export default function RuleGameOverScreen({ room, isHost, onReplay, onBackToLobby }) {
  const players = room.players || {};
  const rules = room.rule.rules || {};
  const revealed = room.rule.revealed || {};

  return (
    <div className="screen">
      <h2 className="screen-title" style={{ marginTop: 20, textAlign: 'center' }}>Les règles étaient...</h2>

      <div className="screen-list" style={{ marginBottom: 16 }}>
        {Object.keys(players).map((id) => (
          <div key={id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <PlayerAvatar name={players[id]?.name} size={32} />
              <span style={{ fontWeight: 700 }}>{players[id]?.name}</span>
              {revealed[id] && <span className="reward-pill" style={{ color: 'var(--color-success)' }}>devinée</span>}
            </div>
            <p style={{ color: 'var(--color-muted)', margin: 0 }}>« {rules[id] || '—'} »</p>
          </div>
        ))}
      </div>

      {isHost ? (
        <>
          <PrimaryButton title="Rejouer (mêmes joueurs)" onClick={onReplay} style={{ marginBottom: 12 }} />
          <PrimaryButton title="Retour au salon" variant="secondary" onClick={onBackToLobby} />
        </>
      ) : (
        <p className="lobby-waiting">En attente que l'hôte relance une manche...</p>
      )}
    </div>
  );
}
