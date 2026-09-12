import React, { useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';

const ROLE_LABELS = {
  civil: 'Civil',
  undercover: 'Undercover',
  mrwhite: 'Mr. White',
};

export default function EliminationScreen({ room, playerId, isHost, onMrWhiteGuess, onContinue }) {
  const [guess, setGuess] = useState('');
  const eliminatedId = room.game.eliminatedId;
  const eliminatedPlayer = room.players[eliminatedId];
  const eliminatedRole = room.game.roles[eliminatedId];
  const isMrWhite = eliminatedRole.role === 'mrwhite';
  const isMe = eliminatedId === playerId;

  function submitGuess() {
    const correct = guess.trim().toLowerCase() === room.game.civilWord.trim().toLowerCase();
    onMrWhiteGuess(correct);
  }

  return (
    <div className="screen screen-centered">
      <p style={{ color: 'var(--color-muted)', fontSize: 16, textAlign: 'center' }}>Le joueur éliminé est</p>
      <h2 style={{ fontSize: 32, fontWeight: 900, textAlign: 'center', margin: '8px 0' }}>
        {eliminatedPlayer?.name}
      </h2>
      <p style={{ color: 'var(--color-primary)', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>
        {ROLE_LABELS[eliminatedRole.role]}
      </p>

      {isMrWhite && isMe && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', marginBottom: 12 }}>
            C'est toi ! Tente de deviner le mot des civils pour gagner :
          </p>
          <input
            type="text"
            className="text-input"
            style={{ width: '100%', textAlign: 'center', marginBottom: 12 }}
            placeholder="Nom du personnage..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
          />
          <PrimaryButton title="Valider la tentative" onClick={submitGuess} disabled={guess.trim().length === 0} />
        </div>
      )}

      {isMrWhite && !isMe && (
        <p className="lobby-waiting">Mr. White tente de deviner le mot des civils...</p>
      )}

      {!isMrWhite && (
        isHost ? (
          <PrimaryButton title="Continuer" onClick={onContinue} />
        ) : (
          <p className="lobby-waiting">En attente que l'hôte continue...</p>
        )
      )}
    </div>
  );
}
