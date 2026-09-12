import React, { useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';

export default function TeamPlayScreen({
  room,
  playerId,
  isHost,
  onDraw,
  onSetStartingBid,
  onRaiseBid,
  onPass,
  onStealDecision,
  onEndGame,
}) {
  const players = room.players || {};
  const playerIds = Object.keys(players);
  const turnOrder = room.team.turnOrder || [];
  const turnIndex = room.team.turnIndex || 0;
  const currentPlayerId = turnOrder[turnIndex];
  const isMyTurn = currentPlayerId === playerId;
  const draw = room.team.currentDraw;
  const budgets = room.team.budgets || {};
  const teams = room.team.teams || {};
  const poolLeft = (room.team.pool || []).length;
  const log = room.team.log || {};
  const logOrder = room.team.logOrder || [];

  const [bidInput, setBidInput] = useState('');

  const isBlindHidden = draw && draw.mode === 'bid' && draw.blind && draw.drawnBy !== playerId;
  const orderedIds = [playerId, ...playerIds.filter((id) => id !== playerId)];

  function submitStartingBid() {
    const amount = parseInt(bidInput, 10);
    if (!amount || amount < 1) return;
    onSetStartingBid(amount);
    setBidInput('');
  }

  function submitRaise() {
    const amount = parseInt(bidInput, 10);
    if (!amount) return;
    onRaiseBid(amount);
    setBidInput('');
  }

  return (
    <div className="screen">
      <p style={{ color: 'var(--color-secondary)', fontWeight: 700, marginBottom: 4 }}>Construis ta team</p>
      <h2 className="screen-title">{poolLeft} personnage{poolLeft > 1 ? 's' : ''} restants</h2>

      <div className="team-panels">
        {orderedIds.map((id) => (
          <div key={id} className={`team-panel${id === currentPlayerId ? ' team-panel--active' : ''}`}>
            <div className="team-panel-head">
              <span>{players[id]?.name}{id === playerId ? ' (toi)' : ''}</span>
              <span className="reward-pill">¥{budgets[id]}</span>
            </div>
            <div className="team-roster">
              {(teams[id] || []).map((c, i) => (
                <div key={i} className="team-roster-row">
                  <span>{c.name}</span>
                </div>
              ))}
              {(teams[id] || []).length === 0 && <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Aucun personnage.</p>}
            </div>
            <div className="team-panel-power">{(teams[id] || []).length} / 5</div>
          </div>
        ))}
      </div>

      {!draw && isMyTurn && (
        <PrimaryButton title="Piocher un personnage" onClick={onDraw} style={{ marginBottom: 16 }} />
      )}
      {!draw && !isMyTurn && (
        <p className="lobby-waiting" style={{ marginBottom: 16 }}>
          En attente que {players[currentPlayerId]?.name} pioche...
        </p>
      )}

      {draw && (
        <div className="clue-turn-box" style={{ marginBottom: 16 }}>
          <p style={{ textAlign: 'center', fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
            {isBlindHidden ? '??? (personnage mystère)' : draw.character.name}
          </p>
          {!isBlindHidden && (
            <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 12, marginBottom: 14 }}>
              {draw.character.anime}
            </p>
          )}
          {isBlindHidden && (
            <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 12, marginBottom: 14 }}>
              Seul {players[draw.drawnBy]?.name} voit ce personnage.
            </p>
          )}

          {draw.mode === 'bid' && draw.highestBid === 0 && draw.drawnBy === playerId && (
            <>
              <p style={{ textAlign: 'center', marginBottom: 10 }}>Fixe ta mise de départ :</p>
              <input
                type="number"
                min={1}
                max={budgets[playerId]}
                className="text-input"
                style={{ width: '100%', textAlign: 'center', marginBottom: 12 }}
                placeholder={`1 à ${budgets[playerId]} ¥`}
                value={bidInput}
                onChange={(e) => setBidInput(e.target.value)}
              />
              <PrimaryButton title="Valider la mise" onClick={submitStartingBid} disabled={!bidInput} />
            </>
          )}

          {draw.mode === 'bid' && draw.highestBid === 0 && draw.drawnBy !== playerId && (
            <p className="lobby-waiting">{players[draw.drawnBy]?.name} fixe sa mise de départ...</p>
          )}

          {draw.mode === 'bid' && draw.highestBid > 0 && (
            <>
              <p style={{ textAlign: 'center', marginBottom: 10 }}>
                Enchère actuelle : <strong>¥{draw.highestBid}</strong> par {players[draw.highestBidder]?.name}
              </p>
              {draw.turnToAct === playerId ? (
                <>
                  <input
                    type="number"
                    min={draw.highestBid + 1}
                    max={budgets[playerId]}
                    className="text-input"
                    style={{ width: '100%', textAlign: 'center', marginBottom: 12 }}
                    placeholder={`Plus de ¥${draw.highestBid}`}
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-primary" onClick={submitRaise} disabled={!bidInput}>Surenchérir</button>
                    <button type="button" className="btn btn-outline" onClick={onPass}>Passer</button>
                  </div>
                </>
              ) : (
                <p className="lobby-waiting">
                  En attente de {draw.turnToAct ? players[draw.turnToAct]?.name : 'la résolution'}...
                </p>
              )}
            </>
          )}

          {draw.mode === 'steal' && draw.eligibleIds.includes(playerId) && !(draw.passedBy && draw.passedBy[playerId]) && (
            <>
              <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 13, marginBottom: 12 }}>
                {players[draw.drawnBy]?.name} n'a plus les moyens d'enchérir. Tu peux voler ce personnage pour ¥1.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-primary" onClick={() => onStealDecision(true)}>Voler pour ¥1</button>
                <button type="button" className="btn btn-outline" onClick={() => onStealDecision(false)}>Laisser passer</button>
              </div>
            </>
          )}
          {draw.mode === 'steal' && (!draw.eligibleIds.includes(playerId) || (draw.passedBy && draw.passedBy[playerId])) && (
            <p className="lobby-waiting">En attente de la décision des autres joueurs...</p>
          )}
        </div>
      )}

      <p className="filter-section-title" style={{ marginBottom: 8 }}>Historique</p>
      <div className="screen-list" style={{ marginBottom: 16 }}>
        {logOrder.length === 0 && <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Rien pour l'instant.</p>}
        {[...logOrder].reverse().map((id) => {
          const entry = log[id];
          if (!entry) return null;
          if (entry.type === 'win') {
            return (
              <div key={id} className="clue-row">
                {players[entry.playerId]?.name} remporte <strong>{entry.character.name}</strong> pour ¥{entry.price}
              </div>
            );
          }
          if (entry.type === 'steal') {
            return (
              <div key={id} className="clue-row">
                {players[entry.playerId]?.name} vole <strong>{entry.character.name}</strong> pour ¥1
              </div>
            );
          }
          return (
            <div key={id} className="clue-row">
              <strong>{entry.character.name}</strong> laissé de côté
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
