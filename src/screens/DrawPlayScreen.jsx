import React, { useEffect, useState } from 'react';
import DrawingCanvas, { CHALK_COLORS, strokesOf } from '../components/DrawingCanvas';
import { fresqueTurn, neighbours } from '../utils/drawGame';

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Toolbar({ color, setColor, width, setWidth, onUndo }) {
  return (
    <div className="ou-draw-toolbar">
      <div className="ou-draw-colors">
        {CHALK_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`ou-draw-color${c === color ? ' ou-draw-color--on' : ''}`}
            style={{ background: c }}
            aria-label={`Couleur ${c}`}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <div className="ou-draw-tools">
        <button type="button" className={`ou-draw-tool${width === 5 ? ' ou-draw-tool--on' : ''}`} onClick={() => setWidth(5)}>Fin</button>
        <button type="button" className={`ou-draw-tool${width === 14 ? ' ou-draw-tool--on' : ''}`} onClick={() => setWidth(14)}>Épais</button>
        {onUndo && <button type="button" className="ou-draw-tool" onClick={onUndo}>↶ Annuler</button>}
      </div>
    </div>
  );
}

function WordReminder({ role }) {
  if (!role) return null;
  return (
    <div className="rule-reminder">
      <span className="rule-reminder-label">Ton mot</span>
      <span className="rule-reminder-text">{role.role === 'mrwhite' ? 'Aucun (Mr. White)' : role.word}</span>
    </div>
  );
}

export default function DrawPlayScreen({
  room, playerId, isHost, onSlateStroke, onUndo, onFresqueStroke, onSkipTurn, onPeek, onEndDrawing,
}) {
  const game = room.game;
  const settings = room.settings || {};
  const players = room.players || {};
  const now = useNow();
  const [color, setColor] = useState(CHALK_COLORS[0]);
  const [width, setWidth] = useState(5);
  const [sentTurn, setSentTurn] = useState(-1);
  const isAlive = Boolean(game.alive[playerId]);
  const myRole = game.roles[playerId];
  const remaining = game.deadline ? Math.max(0, Math.ceil((game.deadline - now) / 1000)) : null;
  const name = (id) => (players[id] ? players[id].name : '?');

  const timer = remaining !== null && (
    <div className={`clue-timer${remaining <= 10 ? ' clue-timer--low' : ''}`}>{remaining}s</div>
  );

  // ---------- Fresque commune ----------
  if (settings.mode === 'fresque') {
    const laps = settings.laps || 2;
    const turn = fresqueTurn(game, laps);
    const isMyTurn = turn.currentId === playerId && sentTurn !== (game.turn || 0);
    const order = (game.order || []).filter((id) => game.alive[id]);

    function handleStroke(stroke) {
      setSentTurn(game.turn || 0);
      onFresqueStroke(stroke);
    }

    return (
      <div className="screen">
        <p className="filter-eyebrow">Fresque commune · tour de table {Math.min(turn.lap, laps)}/{laps}</p>
        <h2 className="screen-title">{isMyTurn ? 'À toi : un seul trait !' : `${name(turn.currentId)} dessine…`}</h2>
        {isAlive && <WordReminder role={myRole} />}
        {timer}

        <DrawingCanvas strokes={strokesOf(game.fresque)} editable={isMyTurn} color={color} width={width} onStroke={handleStroke} />
        {isMyTurn && <Toolbar color={color} setColor={setColor} width={width} setWidth={setWidth} />}
        {isMyTurn && <p className="setup-hint" style={{ marginTop: 10 }}>Lève le doigt (ou la souris) et ton trait est envoyé : pas de retouche !</p>}

        <div className="ou-draw-order">
          {order.map((id, i) => (
            <span key={id} className={`ou-draw-order-chip${id === turn.currentId ? ' ou-draw-order-chip--on' : ''}`}>
              {i + 1}. {name(id)}
            </span>
          ))}
        </div>

        {isHost && (
          <button type="button" className="skip-turn-btn" onClick={onSkipTurn}>
            Passer le tour de {name(turn.currentId)} (joueur absent)
          </button>
        )}
      </div>
    );
  }

  // ---------- Duel d'ardoises ----------
  const slates = game.slates || {};
  const myPeek = (game.peeks || {})[playerId];
  const peekActive = myPeek && myPeek.until > now;
  const isMrWhite = myRole && myRole.role === 'mrwhite' && isAlive;
  const myNeighbours = isMrWhite ? neighbours(game, playerId) : [];

  return (
    <div className="screen">
      <p className="filter-eyebrow">Duel d'ardoises · dessine en secret</p>
      <h2 className="screen-title">À tes pinceaux !</h2>
      {isAlive && <WordReminder role={myRole} />}
      {timer}

      {isAlive ? (
        <>
          <DrawingCanvas strokes={strokesOf(slates[playerId])} editable color={color} width={width} onStroke={onSlateStroke} />
          <Toolbar color={color} setColor={setColor} width={width} setWidth={setWidth} onUndo={onUndo} />
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>Tu es éliminé : les ardoises seront dévoilées au vote.</div>
      )}

      {isMrWhite && (
        <div className="ou-peek">
          <p className="ou-peek-title">Pass'Œil · 3 secondes sur l'ardoise d'un voisin</p>
          {myPeek ? (
            !peekActive && <p className="setup-hint" style={{ margin: 0 }}>Pass'Œil déjà utilisé pour cette manche.</p>
          ) : (
            <div className="ou-peek-buttons">
              {myNeighbours.map((id) => (
                <button key={id} type="button" className="btn btn-outline" onClick={() => onPeek(id)}>
                  👁 Regarder {name(id)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {peekActive && (
        <div className="ou-peek-overlay" role="dialog" aria-label="Pass'Œil">
          <div className="ou-peek-overlay-inner">
            <p className="ou-peek-title">Pass'Œil : ardoise de {name(myPeek.target)} · {Math.ceil((myPeek.until - now) / 1000)} s</p>
            <DrawingCanvas strokes={strokesOf(slates[myPeek.target])} />
          </div>
        </div>
      )}

      {isHost && (
        <button type="button" className="skip-turn-btn" onClick={onEndDrawing}>
          Terminer le dessin maintenant
        </button>
      )}
    </div>
  );
}
