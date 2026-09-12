import React from 'react';
import PlayerAvatar from '../components/PlayerAvatar';
import PrimaryButton from '../components/PrimaryButton';

export default function RuleGameOverScreen({ room, isHost, onReplay, onBackToLobby }) {
  const players = room.players || {};
  const rules = room.rule.rules || {};
  const revealed = room.rule.revealed || {};
  const outcome = room.rule.outcome;

  return (
    <div className="screen">
      {outcome && outcome.type === 'winner' && (
        <h2 className="screen-title" style={{ marginTop: 20, textAlign: 'center', color: 'var(--color-primary)' }}>
          {players[outcome.winnerId]?.name} garde sa règle secrète !
        </h2>
      )}
      {outcome && outcome.type === 'tie' && (
        <h2 className="screen-title" style={{ marginTop: 20, textAlign: 'center' }}>Égalité !</h2>
      )}
      {!outcome && (
        <h2 className="screen-title" style={{ marginTop: 20, textAlign: 'center' }}>Partie terminée</h2>
      )}

      <p style={{ color: 'var(--color-muted)', textAlign: 'center', marginBottom: 20 }}>Les règles étaient...</p>

      <div className="screen-list" style={{ marginBottom: 16 }}>
        {Object.keys(players).map((id) => (
          <div key={id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <PlayerAvatar name={players[id]?.name} size={32} />
              <span style={{ fontWeight: 700 }}>{players[id]?.name}</span>
              {outcome && outcome.type === 'winner' && outcome.winnerId === id && (
                <span className="reward-pill" style={{ color: 'var(--color-primary)' }}>🏆 vainqueur</span>
              )}
              {revealed[id] && (!outcome || outcome.winnerId !== id) && (
                <span className="reward-pill" style={{ color: 'var(--color-danger)' }}>démasqué</span>
              )}
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
