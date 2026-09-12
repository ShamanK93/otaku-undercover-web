import React, { useMemo, useState } from 'react';
import Stepper from '../components/Stepper';
import PrimaryButton from '../components/PrimaryButton';
import PlayerAvatar from '../components/PlayerAvatar';
import { getInviteLink } from '../utils/room';
import { ANIME_LIST } from '../data/animeDatabase';
import { countMatchingPairs } from '../utils/gameLogic';

export default function LobbyScreen({
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
  const selectedTypes = Object.keys(room.selectedTypes || {});
  const selectedDifficulties = Object.keys(room.selectedDifficulties || {});
  const selectedCount = selectedAnimeIds.length;
  const { numUndercover, numMrWhite } = room.settings;
  const civils = numPlayers - numUndercover - numMrWhite;
  const recommended = Math.max(1, Math.round(numPlayers / 5));

  const availableCount = useMemo(
    () =>
      countMatchingPairs({
        animeList: ANIME_LIST,
        selectedAnimeIds,
        selectedTypes,
        selectedDifficulties,
      }),
    [selectedAnimeIds, selectedTypes, selectedDifficulties]
  );

  const canStart =
    numPlayers >= 3 &&
    civils >= 2 &&
    numUndercover >= 1 &&
    numUndercover + numMrWhite < numPlayers &&
    selectedCount > 0;

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  function handlePlayersConstraint(nextUndercover, nextMrWhite) {
    if (nextUndercover + nextMrWhite >= numPlayers) {
      onChangeSettings({
        numUndercover: Math.max(1, numPlayers - 2),
        numMrWhite: 0,
      });
    } else {
      onChangeSettings({ numUndercover: nextUndercover, numMrWhite: nextMrWhite });
    }
  }

  return (
    <div className="screen">
      <button type="button" className="back-link" onClick={onLeave}>← Quitter le salon</button>

      <p className="filter-eyebrow">Salon {code}</p>
      <h2 className="screen-title">Prêt à jouer ?</h2>

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
          <p className="filter-section-title" style={{ marginBottom: 8 }}>Dont intrus</p>
          <div className="intrus-box">{numUndercover + numMrWhite}</div>
          <p className="setup-hint">Recommandé : {recommended}</p>

          <Stepper
            label="Undercovers"
            value={numUndercover}
            min={1}
            max={Math.max(1, numPlayers - 2)}
            onChange={(v) => handlePlayersConstraint(v, numMrWhite)}
          />
          <Stepper
            label="Mr. White"
            value={numMrWhite}
            min={0}
            max={Math.max(0, numPlayers - numUndercover - 2)}
            onChange={(v) => handlePlayersConstraint(numUndercover, v)}
          />
          <Stepper
            label="Temps pour écrire l'indice (secondes)"
            value={room.settings.clueSeconds || 30}
            min={10}
            max={120}
            step={5}
            onChange={(v) => onChangeSettings({ clueSeconds: v })}
          />

          <div className="summary-row-cards">
            <button type="button" className="summary-card" onClick={onOpenAnimeSelect}>
              <span className="summary-card-label">Animés</span>
              <span className="summary-card-value">{selectedCount || 0} sélectionné{selectedCount > 1 ? 's' : ''}</span>
            </button>
            <div className="summary-card summary-card--static">
              <span className="summary-card-label">Paires disponibles</span>
              <span className="summary-card-value">{availableCount}</span>
            </div>
          </div>

          {numPlayers < 3 && (
            <p className="lobby-hint">Il faut au moins 3 joueurs pour lancer la partie.</p>
          )}
          {selectedCount === 0 && numPlayers >= 3 && (
            <p className="lobby-hint">Choisis au moins un animé avant de lancer.</p>
          )}

          <PrimaryButton title="Lancer la partie" disabled={!canStart} onClick={onStart} />
        </div>
      ) : (
        <p className="lobby-waiting">En attente que l'hôte lance la partie...</p>
      )}
    </div>
  );
}
