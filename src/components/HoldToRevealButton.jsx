import React, { useState } from 'react';

export default function HoldToRevealButton({ secretLabel }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <button
        type="button"
        className={`reveal-btn${revealed ? ' revealed' : ''}`}
        onPointerDown={() => setRevealed(true)}
        onPointerUp={() => setRevealed(false)}
        onPointerLeave={() => setRevealed(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {revealed ? secretLabel : 'Maintiens appuyé pour voir ton secret'}
      </button>
    </div>
  );
}
