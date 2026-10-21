import React, { useMemo, useState } from 'react';
import Stepper from '../components/Stepper';
import PrimaryButton from '../components/PrimaryButton';
import PlayerAvatar from '../components/PlayerAvatar';
import { getInviteLink } from '../utils/room';
import { ANIME_LIST } from '../data/animeDatabase';
import { countMatchingPairs } from '../utils/gameLogic';

const MODES = [
  {
    id: 'duel',
    title: "Duel d'Ardoises",
    desc: "45 s pour dessiner en secret sur ton ardoise. Mr. White a son Pass'Œil.",
  },
  {
    id: 'fresque',
    title: 'Fresque Commune',
    desc: 'Une seule ardoise qui tourne : chacun ajoute UN trait continu à son tour.',
  },
];

export default function DrawLobbyScreen({ code, room, playerId, isHost, onOpenAnimeSelect, onChangeSettings, onStart, onLeave }) {
  const [copied, setCopied] = useState(null);
  const players = Object.entries(room.players || {}).map(([id, p]) => ({ id, ...p }));
  const numPlayers = players.length;
  const settings = room.settings || {};
  const mode = settings.mode || 'duel';
  const numUndercover = settings.numUndercover ?? 1;
  const numMrWhite = settings.numMrWhite ?? 0;
  const civils = numPlayers - numUndercover - numMrWhite;
  const selectedAnimeIds = Object.keys(room.selectedAnimeIds || {});
  const selectedTypes = Object.keys(room.selectedTypes || {});
  const selectedDifficulties = Object.keys(room.selectedDifficulties || {});
  const selectedCount = selectedAnimeIds.length;

  const availableCount = useMemo(
    () => countMatchingPairs({ animeList: ANIME_LIST, selectedAnimeIds, selectedTypes, selectedDifficulties }),
    [selectedAnimeIds, selectedTypes, selectedDifficulties]
  );

  const canStart = numPlayers >= 3 && civils >= 2 && numUndercover + numMrWhite >= 1 && selectedCount > 0;

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  function setRoles(nextUndercover, nextMrWhite) {
    if (nextUndercover + nextMrWhite > Math.max(1, numPlayers - 2)) return;
    onChangeSettings({ numUndercover: nextUndercover, numMrWhite: nextMrWhite });
  }

  return (
    <div className="screen">
      <button type="button" className="back-link" onClick={onLeave}>← Quitter le salon</button>

      <p className="filter-eyebrow">Salon {code}</p>
      <h2 className="screen-title">L'Imposteur au Pinceau</h2>

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

      <p className="filter-section-title" style={{ marginBottom: 10 }}>Mode de jeu</p>
      <div className="ou-mode-picker">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`ou-mode-card${mode === m.id ? ' ou-mode-card--on' : ''}`}
            onClick={() => isHost && onChangeSettings({ mode: m.id })}
            disabled={!isHost}
          >
            <span className="ou-mode-card-title">{m.title}</span>
            <span className="ou-mode-card-desc">{m.desc}</span>
          </button>
        ))}
      </div>

      {isHost ? (
        <div className="lobby-host-controls">
          <Stepper label="Undercovers" value={numUndercover} min={0} max={Math.max(0, numPlayers - 2)} onChange={(v) => setRoles(v, numMrWhite)} />
          <Stepper label="Mr. White" value={numMrWhite} min={0} max={Math.max(0, numPlayers - 2)} onChange={(v) => setRoles(numUndercover, v)} />
          {mode === 'duel' ? (
            <Stepper label="Temps de dessin (secondes)" value={settings.drawSeconds || 45} min={20} max={120} step={5} onChange={(v) => onChangeSettings({ drawSeconds: v })} />
          ) : (
            <>
              <Stepper label="Temps par trait (secondes)" value={settings.turnSeconds || 20} min={10} max={60} step={5} onChange={(v) => onChangeSettings({ turnSeconds: v })} />
              <Stepper label="Tours de table" value={settings.laps || 2} min={1} max={5} onChange={(v) => onChangeSettings({ laps: v })} />
            </>
          )}

          <div className="summary-row-cards">
            <button type="button" className="summary-card" onClick={onOpenAnimeSelect}>
              <span className="summary-card-label">Animés</span>
              <span className="summary-card-value">{selectedCount || 0} sélectionné{selectedCount > 1 ? 's' : ''}</span>
            </button>
            <div className="summary-card summary-card--static">
              <span className="summary-card-label">Mots disponibles</span>
              <span className="summary-card-value">{availableCount}</span>
            </div>
          </div>

          {numPlayers < 3 && <p className="lobby-hint">Il faut au moins 3 joueurs pour lancer la partie.</p>}
          {numPlayers >= 3 && numUndercover + numMrWhite === 0 && <p className="lobby-hint">Il faut au moins un intrus (Undercover ou Mr. White).</p>}
          {numPlayers >= 3 && selectedCount === 0 && <p className="lobby-hint">Choisis au moins un animé avant de lancer.</p>}

          <PrimaryButton title="Lancer la partie" disabled={!canStart} onClick={onStart} />
        </div>
      ) : (
        <p className="lobby-waiting">En attente que l'hôte lance la partie...</p>
      )}
    </div>
  );
}
