import React, { useEffect, useRef } from 'react';

// Ardoise de dessin (Chapitre 04). Coordonnées logiques 1000 × 750, quelle
// que soit la taille affichée. Un trait = { c, w, p: [x, y, x, y, …] }.
export const W = 1000;
export const H = 750;

export const CHALK_COLORS = ['#FFFFFF', '#E0203A', '#F2C14E', '#4FD1E8', '#7BE07B', '#B497FF'];

function drawStroke(ctx, { c, w, p }) {
  if (!p || p.length < 2) return;
  ctx.strokeStyle = c;
  ctx.fillStyle = c;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (p.length === 2) {
    ctx.beginPath();
    ctx.arc(p[0], p[1], w / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length - 2; i += 2) {
    const mx = (p[i] + p[i + 2]) / 2;
    const my = (p[i + 1] + p[i + 3]) / 2;
    ctx.quadraticCurveTo(p[i], p[i + 1], mx, my);
  }
  ctx.lineTo(p[p.length - 2], p[p.length - 1]);
  ctx.stroke();
}

// strokes : traits déjà enregistrés. editable : on peut dessiner.
// onStroke(stroke) est appelé à chaque trait terminé (doigt / souris relâché).
export default function DrawingCanvas({ strokes = [], editable = false, color = '#FFFFFF', width = 6, onStroke, label }) {
  const canvasRef = useRef(null);
  const current = useRef(null);

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    strokes.forEach((s) => drawStroke(ctx, s));
    if (current.current) drawStroke(ctx, current.current);
  }

  useEffect(redraw);

  function point(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return [
      Math.round(((e.clientX - rect.left) / rect.width) * W),
      Math.round(((e.clientY - rect.top) / rect.height) * H),
    ];
  }

  function handleDown(e) {
    if (!editable) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    current.current = { c: color, w: width, p: point(e) };
    redraw();
  }

  function handleMove(e) {
    if (!current.current) return;
    const [x, y] = point(e);
    const p = current.current.p;
    const dx = x - p[p.length - 2];
    const dy = y - p[p.length - 1];
    if (dx * dx + dy * dy < 16) return; // ignore les micro-mouvements
    p.push(x, y);
    redraw();
  }

  function handleUp() {
    if (!current.current) return;
    const stroke = current.current;
    current.current = null;
    if (onStroke) onStroke(stroke);
  }

  return (
    <div className={`ou-slate${editable ? ' ou-slate--editable' : ''}`}>
      {label && <span className="ou-slate-label">{label}</span>}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      />
    </div>
  );
}

// Les traits Firebase arrivent sous forme d'objet { clé: trait } : on les remet en liste.
export function strokesOf(map) {
  return Object.values(map || {});
}
