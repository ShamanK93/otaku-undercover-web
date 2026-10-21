import React, { useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';

export const DRAW_ROLE_LABELS = { civil: 'Citoyen', undercover: 'Undercover', mrwhite: 'Mr. White' };

// Résultat du vote : vote nul, innocent éliminé (→ prolongations) ou imposteur démasqué.
export default function DrawResultScreen({ room, playerId, isHost, onMrWhiteGuess, onContinue }) {
  const [guess, setGuess] = useState('');
  const game = room.game;
  const players = room.players || {};
  const eliminatedId = game.eliminatedId;
  const role = eliminatedId ? game.roles[eliminatedId] : null;
  const isMrWhite = role && role.role === 'mrwhite';
  const isMe = eliminatedId === playerId;
  const outcome = game.voteOutcome;

  function submitGuess() {
    onMrWhiteGuess(guess.trim().toLowerCase() === game.civilWord.trim().toLowerCase());
  }

  return (
    <div className="screen screen-centered">
      {outcome === 'nul' && (
        <>
          <div className="ou-draw-banner ou-draw-banner--hot">Vote nul !</div>
          <h2 className="screen-title" style={{ alignSelf: 'center' }}>Personne ne sort</h2>
          <p className="screen-subtitle" style={{ textAlign: 'center' }}>
            Le groupe n'a pas réussi à se mettre d'accord. La manche continue : mêmes rôles,
            dessins effacés, et un nouveau mot de la même catégorie pour tout le monde.
          </p>
        </>
      )}

      {outcome && outcome !== 'nul' && (
        <>
          <p className="filter-eyebrow" style={{ textAlign: 'center' }}>Le joueur éliminé est</p>
          <h2 className="screen-title" style={{ alignSelf: 'center' }}>{players[eliminatedId] ? players[eliminatedId].name : '?'}</h2>
          <div className={`ou-draw-banner${outcome === 'impostor' ? '' : ' ou-draw-banner--hot'}`}>
            {DRAW_ROLE_LABELS[role.role]}
          </div>
          <p className="screen-subtitle" style={{ textAlign: 'center' }}>
            {outcome === 'innocent'
              ? "Raté, c'était un innocent ! Prolongations : mêmes rôles, nouveau mot, on redessine."
              : 'Bien vu, un imposteur est démasqué !'}
          </p>
        </>
      )}

      {isMrWhite && isMe && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', marginBottom: 12 }}>Dernière chance : devine le mot des citoyens pour gagner seul !</p>
          <input
            type="text"
            className="text-input"
            style={{ width: '100%', textAlign: 'center', marginBottom: 12 }}
            placeholder="Le mot des citoyens..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
          />
          <PrimaryButton title="Valider ma réponse" onClick={submitGuess} disabled={guess.trim().length === 0} />
        </div>
      )}
      {isMrWhite && !isMe && <p className="lobby-waiting">Mr. White tente de deviner le mot des citoyens...</p>}

      {!isMrWhite && (isHost ? (
        <PrimaryButton title={outcome === 'impostor' ? 'Continuer' : 'Lancer les prolongations'} onClick={onContinue} />
      ) : (
        <p className="lobby-waiting">En attente que l'hôte continue...</p>
      ))}
    </div>
  );
}
