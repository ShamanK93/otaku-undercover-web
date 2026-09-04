import React, { useEffect, useRef, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';

export default function RulePlayScreen({
  room,
  playerId,
  isHost,
  onProposeCharacter,
  onAnswerProposal,
  onStartGuess,
  onStartRevengeGuess,
  onAnswerGuess,
  onSkipTurn,
  onEndGame,
}) {
  const players = room.players || {};
  const turnOrder = room.rule.turnOrder || [];
  const turnIndex = room.rule.turnIndex || 0;
  const currentPlayerId = turnOrder[turnIndex];
  const isMyTurn = currentPlayerId === playerId;
  const pendingPropose = room.rule.pendingPropose;
  const pendingGuess = room.rule.pendingGuess;
  const revengePending = room.rule.revengePending;
  const log = room.rule.log || {};
  const logOrder = room.rule.logOrder || [];
  const myRule = (room.rule.rules || {})[playerId];
  const revealed = room.rule.revealed || {};

  const [mode, setMode] = useState(null); // null | 'propose' | 'guess'
  const [character, setCharacter] = useState('');
  const [guessTarget, setGuessTarget] = useState('');
  const [guessText, setGuessText] = useState('');
  const [revengeText, setRevengeText] = useState('');
  const [now, setNow] = useState(Date.now());
  const autoActed = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const deadline = room.rule.deadline;
  const remaining = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;

  const iAlreadyAnsweredProposal = pendingPropose && pendingPropose.answers && pendingPropose.answers[playerId] !== undefined;
  const iMustAnswerProposal = pendingPropose && pendingPropose.by !== playerId && !iAlreadyAnsweredProposal;
  const iMustAnswerGuess = pendingGuess && pendingGuess.target === playerId;
  const iMustDoRevenge = revengePending && revengePending.defenderId === playerId && !pendingGuess;
  const iMustAct = (isMyTurn && !pendingPropose && !pendingGuess && !revengePending) || iMustAnswerProposal || iMustAnswerGuess || iMustDoRevenge;

  // Reset l'état local et le verrou d'auto-action à chaque nouvelle échéance.
  useEffect(() => {
    autoActed.current = null;
    setMode(null);
    setCharacter('');
    setGuessTarget('');
    setGuessText('');
    setRevengeText('');
  }, [turnIndex, pendingPropose && pendingPropose.by, pendingGuess && pendingGuess.guessText, revengePending && revengePending.defenderId]);

  // Minuteur écoulé : chacun agit automatiquement pour ce qu'on attend de
  // lui (sans action par défaut possible, on passe simplement).
  useEffect(() => {
    if (remaining !== 0 || !iMustAct || autoActed.current) return;
    autoActed.current = true;
    if (iMustAnswerProposal) {
      onAnswerProposal(false);
    } else if (iMustAnswerGuess) {
      onAnswerGuess(false);
    } else if (iMustDoRevenge) {
      onStartRevengeGuess('(temps écoulé)');
    } else if (isMyTurn && !pendingPropose && !pendingGuess && !revengePending) {
      onSkipTurn();
    }
  }, [remaining, iMustAct, iMustAnswerProposal, iMustAnswerGuess, iMustDoRevenge, isMyTurn, pendingPropose, pendingGuess, revengePending, onAnswerProposal, onAnswerGuess, onStartRevengeGuess, onSkipTurn]);

  function resetLocal() {
    setMode(null);
    setCharacter('');
    setGuessTarget('');
    setGuessText('');
  }

  function submitPropose() {
    if (!character.trim()) return;
    onProposeCharacter(character);
    resetLocal();
  }

  function submitGuess() {
    if (!guessTarget || !guessText.trim()) return;
    onStartGuess(guessTarget, guessText);
    resetLocal();
  }

  function submitRevenge() {
    if (!revengeText.trim()) return;
    onStartRevengeGuess(revengeText);
    setRevengeText('');
  }

  const otherPlayerIds = Object.keys(players).filter((id) => id !== playerId);

  return (
    <div className="screen">
      {myRule && (
        <div className="rule-reminder">
          <span className="rule-reminder-label">Ta règle</span>
          <span className="rule-reminder-text">« {myRule} »</span>
        </div>
      )}

      <p style={{ color: 'var(--color-secondary)', fontWeight: 700, marginBottom: 4 }}>Devine la règle</p>
      <h2 className="screen-title">Tour de {players[currentPlayerId]?.name}</h2>

      {remaining !== null && (
        <div className={`clue-timer${remaining <= 5 ? ' clue-timer--low' : ''}`} style={{ marginBottom: 8 }}>
          {remaining}s
        </div>
      )}

      {/* Revanche à 2 joueurs : le joueur démasqué a une chance de faire égalité */}
      {revengePending && !pendingGuess && (
        <div className="clue-turn-box" style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 10 }}>
            {players[revengePending.defenderId]?.name} a été démasqué !
          </p>
          {revengePending.defenderId === playerId ? (
            <>
              <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 13, marginBottom: 10 }}>
                Dernière chance : devine la règle de {players[revengePending.attackerId]?.name} pour faire égalité.
              </p>
              <input
                type="text"
                className="text-input"
                style={{ width: '100%', textAlign: 'center', marginBottom: 12 }}
                placeholder="Ta proposition de règle..."
                value={revengeText}
                autoFocus
                onChange={(e) => setRevengeText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitRevenge()}
              />
              <PrimaryButton title="Tenter l'égalité" onClick={submitRevenge} disabled={!revengeText.trim()} />
            </>
          ) : (
            <p className="lobby-waiting">
              {players[revengePending.defenderId]?.name} tente une dernière règle pour faire égalité...
            </p>
          )}
        </div>
      )}

      {/* Une proposition de personnage est en attente de validation */}
      {pendingPropose && (
        <div className="clue-turn-box" style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 10 }}>
            {players[pendingPropose.by]?.name} propose : <span style={{ color: 'var(--color-primary)' }}>{pendingPropose.character}</span>
          </p>
          {pendingPropose.by === playerId ? (
            <p className="lobby-waiting">En attente des réponses des autres joueurs...</p>
          ) : iAlreadyAnsweredProposal ? (
            <p className="lobby-waiting">Réponse envoyée, en attente des autres...</p>
          ) : (
            <>
              <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 13, marginBottom: 12 }}>
                Ce personnage correspond-il à TA règle secrète ?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-primary" onClick={() => onAnswerProposal(true)}>Oui</button>
                <button type="button" className="btn btn-outline" onClick={() => onAnswerProposal(false)}>Non</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Une tentative de deviner une règle est en attente de réponse de la cible */}
      {pendingGuess && (
        <div className="clue-turn-box" style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 10 }}>
            {players[pendingGuess.by]?.name} pense que la règle de {players[pendingGuess.target]?.name} est :
          </p>
          <p style={{ textAlign: 'center', color: 'var(--color-primary)', marginBottom: 12 }}>« {pendingGuess.guessText} »</p>
          {pendingGuess.target === playerId ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-primary" onClick={() => onAnswerGuess(true)}>Oui, c'est ma règle</button>
              <button type="button" className="btn btn-outline" onClick={() => onAnswerGuess(false)}>Non, ce n'est pas ma règle</button>
            </div>
          ) : (
            <p className="lobby-waiting">En attente de la réponse de {players[pendingGuess.target]?.name}...</p>
          )}
        </div>
      )}

      {/* C'est mon tour, aucune action en attente : je choisis quoi faire */}
      {!pendingPropose && !pendingGuess && !revengePending && isMyTurn && mode === null && (
        <div className="clue-turn-box" style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 12 }}>C'est ton tour, que fais-tu ?</p>
          <PrimaryButton title="Proposer un personnage" onClick={() => setMode('propose')} style={{ marginBottom: 10 }} />
          <PrimaryButton title="Deviner la règle d'un adversaire" variant="secondary" onClick={() => setMode('guess')} />
        </div>
      )}

      {!pendingPropose && !pendingGuess && !revengePending && isMyTurn && mode === 'propose' && (
        <div className="clue-turn-box" style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 10 }}>Quel personnage proposes-tu ?</p>
          <input
            type="text"
            className="text-input"
            style={{ width: '100%', textAlign: 'center', marginBottom: 12 }}
            placeholder="Nom du personnage..."
            value={character}
            autoFocus
            onChange={(e) => setCharacter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitPropose()}
          />
          <PrimaryButton title="Proposer" onClick={submitPropose} disabled={!character.trim()} style={{ marginBottom: 8 }} />
          <button type="button" className="back-link" style={{ display: 'block', margin: '0 auto' }} onClick={resetLocal}>← Annuler</button>
        </div>
      )}

      {!pendingPropose && !pendingGuess && !revengePending && isMyTurn && mode === 'guess' && (
        <div className="clue-turn-box" style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 10 }}>Qui vises-tu ?</p>
          <div className="screen-list" style={{ marginBottom: 12, maxHeight: 160 }}>
            {otherPlayerIds.filter((id) => !revealed[id]).map((id) => (
              <button
                type="button"
                key={id}
                className={`list-row${guessTarget === id ? ' selected' : ''}`}
                onClick={() => setGuessTarget(id)}
              >
                {players[id]?.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="text-input"
            style={{ width: '100%', textAlign: 'center', marginBottom: 12 }}
            placeholder="Ta proposition de règle..."
            value={guessText}
            onChange={(e) => setGuessText(e.target.value)}
          />
          <PrimaryButton title="Proposer cette règle" onClick={submitGuess} disabled={!guessTarget || !guessText.trim()} style={{ marginBottom: 8 }} />
          <button type="button" className="back-link" style={{ display: 'block', margin: '0 auto' }} onClick={resetLocal}>← Annuler</button>
        </div>
      )}

      {!pendingPropose && !pendingGuess && !revengePending && !isMyTurn && (
        <p className="lobby-waiting" style={{ marginBottom: 16 }}>
          En attente du tour de {players[currentPlayerId]?.name}...
        </p>
      )}

      <p className="filter-section-title" style={{ marginBottom: 8 }}>Historique</p>
      <div className="screen-list" style={{ marginBottom: 16 }}>
        {logOrder.length === 0 && (
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Rien pour l'instant.</p>
        )}
        {[...logOrder].reverse().map((id) => {
          const entry = log[id];
          if (!entry) return null;
          if (entry.type === 'propose') {
            return (
              <div key={id} className="clue-row" style={{ display: 'block' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  {players[entry.by]?.name} propose <span style={{ color: 'var(--color-primary)' }}>{entry.character}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(entry.answers || {}).map(([pid, val]) => (
                    <span key={pid} className="reward-pill" style={{ color: val ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {players[pid]?.name} {val ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={id} className="clue-row" style={{ display: 'block' }}>
              <div>
                {players[entry.by]?.name} devine la règle de {players[entry.target]?.name} :
                « {entry.guessText} » — {entry.correct ? (
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>correct !</span>
                ) : (
                  <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>raté</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isHost && (
        <PrimaryButton title="Terminer la partie" variant="secondary" onClick={onEndGame} />
      )}
    </div>
  );
}
