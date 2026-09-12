import React from 'react';
import HoldToRevealButton from '../components/HoldToRevealButton';

export default function RoleRevealScreen({ room, playerId, onReady }) {
  const myRole = room.game.roles[playerId];
  const ready = room.game.ready || {};
  const players = room.players || {};
  const totalCount = Object.keys(players).length;
  const readyCount = Object.values(ready).filter(Boolean).length;
  const iAmReady = Boolean(ready[playerId]);

  const secretLabel =
    myRole.role === 'mrwhite' ? "Tu es Mr. White (tu n'as pas de mot)" : myRole.word;

  return (
    <div className="screen screen-centered">
      <p style={{ color: 'var(--color-muted)', textAlign: 'center' }}>Ton rôle secret</p>
      <p style={{ color: 'var(--color-secondary)', fontSize: 14, textAlign: 'center', margin: '4px 0 24px', fontWeight: 600 }}>
        {room.game.anime}
      </p>

      {!iAmReady ? (
        <>
          <div style={{ marginBottom: 24 }}>
            <HoldToRevealButton secretLabel={secretLabel} />
          </div>
          <button type="button" className="btn btn-primary" onClick={onReady}>
            C'est vu, je suis prêt
          </button>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 8 }}>✅ Tu es prêt.</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
            En attente des autres joueurs... ({readyCount}/{totalCount})
          </p>
        </div>
      )}
    </div>
  );
}
