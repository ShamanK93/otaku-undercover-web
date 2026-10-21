import React from 'react';
import HoldToRevealButton from '../components/HoldToRevealButton';

// Phase « Distribution » (et retour de distribution pendant les prolongations).
export default function DrawRevealScreen({ room, playerId, onReady }) {
  const game = room.game;
  const myRole = game.roles[playerId];
  const isAlive = Boolean(game.alive[playerId]);
  const ready = game.ready || {};
  const aliveIds = Object.keys(game.alive).filter((id) => game.alive[id]);
  const readyCount = aliveIds.filter((id) => ready[id]).length;
  const iAmReady = Boolean(ready[playerId]);

  const secretLabel =
    myRole && myRole.role === 'mrwhite'
      ? "Tu es Mr. White : tu n'as pas de mot. Observe, et sers-toi de ton Pass'Œil !"
      : myRole && myRole.word;

  return (
    <div className="screen screen-centered">
      {game.round > 1 && (
        <div className={`ou-draw-banner${game.prolongation ? ' ou-draw-banner--hot' : ''}`}>
          {game.prolongation ? 'Prolongations !' : `Manche ${game.round}`}
        </div>
      )}
      <p className="filter-eyebrow" style={{ textAlign: 'center' }}>
        {game.round > 1 ? 'Nouveau mot · même catégorie' : 'Distribution'}
      </p>
      <h2 className="screen-title" style={{ alignSelf: 'center' }}>Ton mot secret</h2>
      <p style={{ color: 'var(--color-secondary)', fontSize: 14, textAlign: 'center', margin: '0 0 22px', fontWeight: 700 }}>
        {game.anime}
      </p>

      {!isAlive ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: 0 }}>Tu as été éliminé : tu regardes la suite en spectateur.</p>
        </div>
      ) : !iAmReady ? (
        <>
          <div style={{ marginBottom: 24 }}>
            <HoldToRevealButton secretLabel={secretLabel} />
          </div>
          <button type="button" className="btn btn-primary" onClick={onReady}>
            C'est vu, à mes pinceaux !
          </button>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 8 }}>✅ Tu es prêt.</p>
          <p style={{ color: 'var(--color-muted)', fontSize: 14, margin: 0 }}>
            En attente des autres joueurs... ({readyCount}/{aliveIds.length})
          </p>
        </div>
      )}
    </div>
  );
}
