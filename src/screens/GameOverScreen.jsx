import React from 'react';
import PlayerAvatar from '../components/PlayerAvatar';
import PrimaryButton from '../components/PrimaryButton';

const WINNER_INFO = {
  civils: { title: 'Les Civils gagnent', color: 'var(--color-success)', icon: '🧑‍🤝‍🧑' },
  intrus: { title: 'Les Intrus gagnent', color: 'var(--color-primary)', icon: '👁️' },
  mrwhite: { title: 'Mr. White gagne', color: 'var(--color-secondary)', icon: '❓' },
};

const ROLE_LABELS = {
  civil: 'Civil',
  undercover: 'Undercover',
  mrwhite: 'Mr. White',
};

export default function GameOverScreen({ room, isHost, onReplay, onBackToLobby }) {
  const info = WINNER_INFO[room.game.winner];
  const players = room.players || {};
  const roles = room.game.roles || {};

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 8 }}>
        <span style={{ fontSize: 26 }}>{info.icon}</span>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: info.color }}>{info.title}</h2>
      </div>

      <div className="card">
        <p style={{ color: 'var(--color-secondary)', fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>{room.game.anime}</p>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 8, marginBottom: 2 }}>Mot des civils</p>
        <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{room.game.civilWord}</p>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 8, marginBottom: 2 }}>Mot des undercovers</p>
        <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{room.game.undercoverWord}</p>
      </div>

      <div className="screen-list" style={{ marginBottom: 12 }}>
        {Object.keys(players).map((id) => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <PlayerAvatar name={players[id]?.name} size={32} />
            <span style={{ color: 'var(--color-muted)', fontSize: 14 }}>
              {players[id]?.name} — {ROLE_LABELS[roles[id]?.role]}
            </span>
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
