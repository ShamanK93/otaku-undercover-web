import React from 'react';
import DrawingCanvas, { strokesOf } from '../components/DrawingCanvas';
import PlayerAvatar from '../components/PlayerAvatar';
import PrimaryButton from '../components/PrimaryButton';

// Phase « Vote » : tous les dessins sont dévoilés, puis on désigne un suspect.
export default function DrawVoteScreen({ room, playerId, isHost, onCastVote, onFinalize }) {
  const game = room.game;
  const players = room.players || {};
  const votes = game.votes || {};
  const aliveIds = (game.order || []).filter((id) => game.alive[id]);
  const isAlive = Boolean(game.alive[playerId]);
  const myVote = votes[playerId];
  const isFresque = (room.settings || {}).mode === 'fresque';

  const tally = {};
  Object.values(votes).forEach((id) => {
    tally[id] = (tally[id] || 0) + 1;
  });
  const votesCast = aliveIds.filter((id) => votes[id]).length;

  return (
    <div className="screen">
      <p className="filter-eyebrow">Vote · manche {game.round}</p>
      <h2 className="screen-title">Qui tient le faux pinceau ?</h2>

      {isFresque ? (
        <DrawingCanvas strokes={strokesOf(game.fresque)} label="La fresque" />
      ) : (
        <div className="ou-gallery">
          {aliveIds.map((id) => (
            <DrawingCanvas key={id} strokes={strokesOf((game.slates || {})[id])} label={players[id] ? players[id].name : '?'} />
          ))}
        </div>
      )}

      <p className="screen-subtitle" style={{ marginTop: 18 }}>
        {isAlive ? 'Débattez, puis vote pour le joueur le plus suspect.' : 'Tu es éliminé : tu ne votes plus.'}
      </p>

      <div className="screen-list">
        {aliveIds.filter((id) => id !== playerId).map((id) => (
          <button
            type="button"
            key={id}
            className={`list-row${myVote === id ? ' selected' : ''}`}
            onClick={() => isAlive && onCastVote(id)}
            disabled={!isAlive}
          >
            <PlayerAvatar name={players[id] ? players[id].name : '?'} size={36} />
            <span style={{ flex: 1 }}>{players[id] ? players[id].name : '?'}</span>
            <span className="vote-count">{tally[id] || 0}</span>
          </button>
        ))}
      </div>

      <p className="lobby-waiting">{votesCast} / {aliveIds.length} votes reçus</p>
      {isHost ? (
        <PrimaryButton title="Valider le vote" onClick={onFinalize} disabled={votesCast === 0} />
      ) : (
        <p className="lobby-waiting">L'hôte validera le vote quand tout le monde aura voté.</p>
      )}
    </div>
  );
}
