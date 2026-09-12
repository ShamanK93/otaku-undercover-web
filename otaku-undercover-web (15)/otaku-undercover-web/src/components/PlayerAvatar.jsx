import React from 'react';

export default function PlayerAvatar({ photo, name, size = 48 }) {
  const dim = { width: size, height: size };

  if (photo) {
    return <img src={photo} alt={name || 'joueur'} className="avatar" style={dim} />;
  }

  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div className="avatar" style={{ ...dim, fontSize: size * 0.4 }}>
      {initial}
    </div>
  );
}
