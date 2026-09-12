import React from 'react';
import PrimaryButton from '../components/PrimaryButton';

export default function TeamGameOverScreen({ room, playerId, isHost, onVote, onReplay, onBackToLobby }) {
  const players = room.players || {};
  const playerIds = Object.keys(players);
  const teams = room.team.teams || {};
  const votes = room.team.votes || {};
  const outcome = room.team.outcome;
  const myVote = votes[playerId];
  const votesCast = Object.keys(votes).length;

  return (
    <div className="screen">
      {outcome ? (
        <>
          {outcome.type === 'winner' ? (
            <h2 className="screen-title" style={{ marginTop: 20, textAlign: 'center', color: 'var(--color-primary)' }}>
              {players[outcome.winnerId]?.name} a la meilleure team !
            </h2>
          ) : (
            <h2 className="screen-title" style={{ marginTop: 20, textAlign: 'center' }}>Égalité !</h2>
          )}
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', marginBottom: 16, fontSize: 13 }}>
            {playerIds.map((id) => `${players[id]?.name} : ${outcome.counts[id] || 0} vote${(outcome.counts[id] || 0) > 1 ? 's' : ''}`).join(' · ')}
          </p>
        </>
      ) : (
        <>
          <h2 className="screen-title" style={{ marginTop: 20, textAlign: 'center' }}>À vous de juger !</h2>
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', marginBottom: 8, fontSize: 13 }}>
            Regardez les équipes ci-dessous et votez pour la meilleure. Égalité possible.
          </p>
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', marginBottom: 16, fontSize: 12 }}>
            {votesCast} / {playerIds.length} votes reçus
          </p>
        </>
      )}

      <div className="screen-list" style={{ marginBottom: 16 }}>
        {playerIds.map((id) => (
          <div key={id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>
                {players[id]?.name} {outcome && outcome.type === 'winner' && outcome.winnerId === id && '🏆'}
              </span>
              {!outcome && (
                <button
                  type="button"
                  className={`buy-btn${myVote === id ? '' : ''}`}
                  style={myVote === id ? { background: 'var(--color-primary)' } : undefined}
                  onClick={() => onVote(id)}
                  disabled={Boolean(myVote)}
                >
                  {myVote === id ? '✓ Voté' : 'Voter pour eux'}
                </button>
              )}
            </div>
            {(teams[id] || []).map((c, i) => (
              <div key={i} style={{ color: 'var(--color-muted)', fontSize: 13, marginBottom: 2 }}>
                {c.name}
              </div>
            ))}
            {(teams[id] || []).length === 0 && <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Aucun personnage.</p>}
          </div>
        ))}
      </div>

      {!outcome && (
        <PrimaryButton
          title={myVote === 'tie' ? '✓ Égalité (voté)' : 'Voter égalité'}
          variant="secondary"
          disabled={Boolean(myVote)}
          onClick={() => onVote('tie')}
          style={{ marginBottom: 16 }}
        />
      )}

      {outcome && isHost && (
        <>
          <PrimaryButton title="Rejouer (mêmes joueurs)" onClick={onReplay} style={{ marginBottom: 12 }} />
          <PrimaryButton title="Retour au salon" variant="secondary" onClick={onBackToLobby} />
        </>
      )}
      {outcome && !isHost && (
        <p className="lobby-waiting">En attente que l'hôte relance une manche...</p>
      )}
    </div>
  );
}
