import React, { useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';

export default function RulePlayScreen({
  room,
  playerId,
  isHost,
  onProposeCharacter,
  onAnswerProposal,
  onStartGuess,
  onAnswerGuess,
  onEndGame,
}) {
  const players = room.players || {};
  const turnOrder = room.rule.turnOrder || [];
  const turnIndex = room.rule.turnIndex || 0;
  const currentPlayerId = turnOrder[turnIndex];
  const isMyTurn = currentPlayerId === playerId;
  const pendingPropose = room.rule.pendingPropose;
  const pendingGuess = room.rule.pendingGuess;
  const log = room.rule.log || {};
  const logOrder = room.rule.logOrder || [];

  const [mode, setMode] = useState(null); // null | 'propose' | 'guess'
  const [character, setCharacter] = useState('');
  const [guessTarget, setGuessTarget] = useState('');
  const [guessText, setGuessText] = useState('');

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

  const otherPlayerIds = Object.keys(players).filter((id) => id !== playerId);
  const iAlreadyAnsweredProposal = pendingPropose && pendingPropose.answers && pendingPropose.answers[playerId] !== undefined;

  return (
    <div className="screen">
      <p style={{ color: 'var(--color-secondary)', fontWeight: 700, marginBottom: 4 }}>Devine la règle</p>
      <h2 className="screen-title">Tour de {players[currentPlayerId]?.name}</h2>

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
      {!pendingPropose && !pendingGuess && isMyTurn && mode === null && (
        <div className="clue-turn-box" style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 12 }}>C'est ton tour, que fais-tu ?</p>
          <PrimaryButton title="Proposer un personnage" onClick={() => setMode('propose')} style={{ marginBottom: 10 }} />
          <PrimaryButton title="Deviner la règle d'un adversaire" variant="secondary" onClick={() => setMode('guess')} />
        </div>
      )}

      {!pendingPropose && !pendingGuess && isMyTurn && mode === 'propose' && (
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

      {!pendingPropose && !pendingGuess && isMyTurn && mode === 'guess' && (
        <div className="clue-turn-box" style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 10 }}>Qui vises-tu ?</p>
          <div className="screen-list" style={{ marginBottom: 12, maxHeight: 160 }}>
            {otherPlayerIds.map((id) => (
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

      {!pendingPropose && !pendingGuess && !isMyTurn && (
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
