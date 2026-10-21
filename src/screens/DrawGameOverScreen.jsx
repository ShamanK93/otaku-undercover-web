import React from 'react';
import PrimaryButton from '../components/PrimaryButton';
import PlayerAvatar from '../components/PlayerAvatar';
import { DRAW_ROLE_LABELS } from './DrawResultScreen';

const WINNER_TEXT = {
  civils: 'Les citoyens gagnent !',
  intrus: 'Les imposteurs gagnent !',
  mrwhite: 'Mr. White gagne seul !',
};

export default function DrawGameOverScreen({ room, isHost, onReplay, onBackToLobby }) {
  const game = room.game;
  const players = room.players || {};

  return (
    <div className="screen">
      <p className="filter-eyebrow">Fin de partie · {game.round} manche{game.round > 1 ? 's' : ''}</p>
      <h2 className="screen-title">{WINNER_TEXT[game.winner] || 'Partie terminée'}</h2>
      <p className="screen-subtitle">
        Dernier mot des citoyens : <strong>{game.civilWord}</strong> · mot de l'undercover : <strong>{game.undercoverWord}</strong>
      </p>

      <div className="lobby-players">
        {Object.keys(game.roles).map((id) => (
          <div key={id} className="lobby-player-row" style={{ opacity: game.alive[id] ? 1 : 0.55 }}>
            <PlayerAvatar name={players[id] ? players[id].name : '?'} size={36} />
            <span style={{ flex: 1 }}>{players[id] ? players[id].name : '?'}</span>
            <span className={game.roles[id].role === 'civil' ? 'you-tag' : 'host-tag'}>{DRAW_ROLE_LABELS[game.roles[id].role]}</span>
          </div>
        ))}
      </div>

      {isHost ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <PrimaryButton title="Rejouer" onClick={onReplay} />
          <PrimaryButton title="Retour au salon" variant="secondary" onClick={onBackToLobby} />
        </div>
      ) : (
        <p className="lobby-waiting">En attente de l'hôte...</p>
      )}
    </div>
  );
}
