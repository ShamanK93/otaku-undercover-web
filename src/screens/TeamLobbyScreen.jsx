import React, { useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import PlayerAvatar from '../components/PlayerAvatar';
import { getInviteLink } from '../utils/room';
import { CHARACTER_DATABASE } from '../data/characterDatabase';

export default function TeamLobbyScreen({
  code,
  room,
  playerId,
  isHost,
  onOpenAnimeSelect,
  onChangeSettings,
  onStart,
  onLeave,
}) {
  const [copied, setCopied] = useState(null);
  const players = Object.entries(room.players || {}).map(([id, p]) => ({ id, ...p }));
  const numPlayers = players.length;
  const selectedAnimeIds = Object.keys(room.selectedAnimeIds || {});
  const selectedCount = selectedAnimeIds.length;
  const totalCharacters = CHARACTER_DATABASE.filter((a) => selectedAnimeIds.includes(a.id)).reduce(
    (sum, a) => sum + a.characters.length,
    0
  );
  const blindMode = Boolean(room.settings && room.settings.blindMode);
  const canStart = numPlayers >= 2 && selectedCount > 0 && totalCharacters >= 10;

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
      <h2 className="screen-title">Construis ta team</h2>
      <p className="screen-subtitle">2 joueurs ou plus.</p>

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
          <button type="button" className="anime-pick-btn" onClick={onOpenAnimeSelect}>
            🎬 Univers sélectionnés : {selectedCount || 'aucun'} ({totalCharacters} personnages)
          </button>

          <div className="summary-card" style={{ marginBottom: 16 }}>
            <span className="summary-card-label">Mode aveugle</span>
            <button
              type="button"
              className={`toggle-switch${blindMode ? ' toggle-switch--on' : ''}`}
              onClick={() => onChangeSettings({ blindMode: !blindMode })}
            >
              <span className="toggle-switch-knob" />
            </button>
          </div>

          {numPlayers < 2 && (
            <p className="lobby-hint">Il faut au moins 2 joueurs pour lancer la partie.</p>
          )}
          {selectedCount === 0 && numPlayers === 2 && (
            <p className="lobby-hint">Choisis au moins un univers avant de lancer.</p>
          )}

          <PrimaryButton title="Lancer la partie" disabled={!canStart} onClick={onStart} />
        </div>
      ) : (
        <p className="lobby-waiting">En attente que l'hôte lance la partie...</p>
      )}
    </div>
  );
}
