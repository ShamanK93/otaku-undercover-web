import React from 'react';

export default function AnimeCheckboxRow({ title, checked, onToggle }) {
  return (
    <button
      type="button"
      className={`anime-chip${checked ? ' checked' : ''}`}
      onClick={onToggle}
    >
      {checked && <span className="chip-check">✓</span>}
      <span>{title}</span>
    </button>
  );
}
