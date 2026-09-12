import React, { useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import Stepper from '../components/Stepper';
import PlayerAvatar from '../components/PlayerAvatar';
import { getInviteLink } from '../utils/room';

export default function RuleLobbyScreen({ code, room, playerId, isHost, onChangeSettings, onStart, onLeave }) {
  const [copied, setCopied] = useState(null);
  const players = Object.entries(room.players || {}).map(([id, p]) => ({ id, ...p }));
  const numPlayers = players.length;
  const canStart = numPlayers >= 2;

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="screen">
      <button type="button" className="back-link" onClick={onLeave}>← Quitter le salon</button>

      <p className="filter-eyebrow">Salon {code}</p>
      <h2 className="screen-title">Devine la règle</h2>
      <p className="screen-subtitle">Chaque joueur choisira une règle secrète une fois la partie lancée.</p>

      <div className="room-code-box">
        <div>
          <div className="room-code-label">Code du salon</div>
          <div className="room-code-value">{code}</div>
        </div>
        <button type="button" className="copy-btn" onClick={() => copy(code, 'code')}>
          {copied === 'code' ? 'Copié !' : 'Copier'}
        </button>
      </div>

      <button type="button" className="invite-link-btn" onClick={() => copy(getInviteLink(code), 'link')}>
        🔗 {copied === 'link' ? 'Lien copié !' : "Copier le lien d'invitation"}
      </button>

      <div className="players-count-display">
        <span className="players-count-number">{numPlayers}</span>
        <span className="players-count-label">joueur{numPlayers > 1 ? 's' : ''} dans le salon</span>
      </div>

      <div className="lobby-players">
        {players.map((p) => (
          <div key={p.id} className="lobby-player-row">
            <PlayerAvatar name={p.name} size={36} />
            <span>{p.name}</span>
            {p.id === room.hostId && <span className="host-tag">Hôte</span>}
            {p.id === playerId && <span className="you-tag">Toi</span>}
          </div>
        ))}
      </div>

      {isHost ? (
        <div className="lobby-host-controls">
          <Stepper
            label="Temps par action (secondes)"
            value={(room.settings && room.settings.actionSeconds) || 30}
            min={10}
            max={120}
            step={5}
            onChange={(v) => onChangeSettings({ actionSeconds: v })}
          />
          {numPlayers < 2 && (
            <p className="lobby-hint">Il faut au moins 2 joueurs pour lancer la partie.</p>
          )}
          <PrimaryButton title="Lancer la partie" disabled={!canStart} onClick={onStart} />
        </div>
      ) : (
        <p className="lobby-waiting">En attente que l'hôte lance la partie...</p>
      )}
    </div>
  );
}
