import React, { useEffect, useRef, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';

export default function ClueOrderScreen({ room, playerId, isHost, onSubmitClue, onForceSkip, onNewRound, onProceedVote }) {
  const players = room.players || {};
  const alive = room.game.alive || {};
  const order = (room.game.order || []).filter((id) => alive[id]);
  const clues = room.game.clues || {};
  const clueIndex = room.game.clueIndex || 0;
  const clueRound = room.game.clueRound || 1;
  const roundDone = clueIndex >= order.length;
  const currentPlayerId = !roundDone ? order[clueIndex] : null;
  const isMyTurn = currentPlayerId === playerId;
  const deadline = room.game.clueDeadline;

  const [text, setText] = useState('');
  const [now, setNow] = useState(Date.now());
  const autoSubmitted = useRef(false);

  useEffect(() => {
    autoSubmitted.current = false;
    setText('');
  }, [clueIndex, clueRound]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const remaining = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;

  useEffect(() => {
    if (isMyTurn && remaining === 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      onSubmitClue(text.trim());
    }
  }, [isMyTurn, remaining, text, onSubmitClue]);

  function handleSubmit() {
    if (autoSubmitted.current) return;
    autoSubmitted.current = true;
    onSubmitClue(text.trim());
  }

  return (
    <div className="screen">
      <p style={{ color: 'var(--color-secondary)', fontWeight: 700, marginBottom: 4 }}>
        Manche {room.game.round} · Tour d'indices {clueRound}
      </p>
      <h2 className="screen-title">Ordre de passage</h2>
      <p className="screen-subtitle">Chacun écrit son indice à son tour.</p>

      <div className="screen-list" style={{ marginBottom: 16 }}>
        {order.map((id, i) => {
          const submitted = clues[id];
          const isTurn = id === currentPlayerId;
          return (
            <div key={id} className={`clue-row${isTurn ? ' clue-row--active' : ''}`}>
              <span className="clue-rank">{i + 1}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{players[id]?.name}</span>
              {submitted !== undefined ? (
                <span className="clue-word">{submitted || '(rien écrit)'}</span>
              ) : isTurn ? (
                <span className="clue-status clue-status--live">en train d'écrire...</span>
              ) : (
                <span className="clue-status">en attente</span>
              )}
            </div>
          );
        })}
      </div>

      {!roundDone && isMyTurn && (
        <div className="clue-turn-box">
          <div className={`clue-timer${remaining !== null && remaining <= 5 ? ' clue-timer--low' : ''}`}>
            {remaining !== null ? `${remaining}s` : ''}
          </div>
          <p style={{ textAlign: 'center', marginBottom: 10, fontWeight: 700 }}>C'est ton tour, écris ton indice :</p>
          <input
            type="text"
            className="text-input"
            style={{ width: '100%', textAlign: 'center', marginBottom: 12 }}
            placeholder="Ton indice..."
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <PrimaryButton title="Valider mon indice" onClick={handleSubmit} />
        </div>
      )}

      {!roundDone && !isMyTurn && (
        <div className="clue-turn-box clue-turn-box--waiting">
          <div className={`clue-timer${remaining !== null && remaining <= 5 ? ' clue-timer--low' : ''}`}>
            {remaining !== null ? `${remaining}s` : ''}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
            En attente de <strong style={{ color: 'var(--color-text)' }}>{players[currentPlayerId]?.name}</strong>...
          </p>
          {isHost && (
            <button type="button" className="skip-turn-btn" onClick={onForceSkip}>
              Passer ce joueur (bloqué)
            </button>
          )}
        </div>
      )}

      {roundDone && isHost && (
        <div className="clue-turn-box">
          <p style={{ textAlign: 'center', marginBottom: 14, fontWeight: 700 }}>
            Tout le monde a écrit son indice. Et maintenant ?
          </p>
          <PrimaryButton title="Nouveau tour (tout le monde réécrit)" onClick={onNewRound} style={{ marginBottom: 10 }} />
          <PrimaryButton title="Passer au vote" variant="secondary" onClick={onProceedVote} />
        </div>
      )}

      {roundDone && !isHost && (
        <p className="lobby-waiting">En attente que l'hôte choisisse : nouveau tour ou vote...</p>
      )}
    </div>
  );
}
