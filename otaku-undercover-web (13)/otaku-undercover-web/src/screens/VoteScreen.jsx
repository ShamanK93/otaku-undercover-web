import React from 'react';
import PlayerAvatar from '../components/PlayerAvatar';
import PrimaryButton from '../components/PrimaryButton';

export default function VoteScreen({ room, playerId, isHost, onCastVote, onFinalize }) {
  const players = room.players || {};
  const alive = room.game.alive || {};
  const votes = room.game.votes || {};
  const alivePlayers = Object.keys(players).filter((id) => alive[id]);
  const myVote = votes[playerId];

  const tally = {};
  Object.values(votes).forEach((targetId) => {
    tally[targetId] = (tally[targetId] || 0) + 1;
  });

  const votesCast = Object.keys(votes).length;

  return (
    <div className="screen">
      <h2 className="screen-title">Qui élimine-t-on ?</h2>
      <p className="screen-subtitle">Discutez à voix haute, puis chacun vote sur son écran.</p>

      <div className="screen-list">
        {alivePlayers.map((id) => (
          <button
            type="button"
            key={id}
            className={`list-row${myVote === id ? ' selected' : ''}`}
            onClick={() => onCastVote(id)}
          >
            <PlayerAvatar name={players[id]?.name} size={40} />
            <span style={{ flex: 1 }}>{players[id]?.name}</span>
            <span className="vote-count">{tally[id] || 0}</span>
          </button>
        ))}
      </div>

      <p style={{ color: 'var(--color-muted)', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
        {votesCast} / {alivePlayers.length} votes reçus
      </p>

      {isHost ? (
        <PrimaryButton title="Valider l'élimination" onClick={onFinalize} disabled={votesCast === 0} />
      ) : (
        <p className="lobby-waiting">En attente que l'hôte valide le vote...</p>
      )}
    </div>
  );
}
