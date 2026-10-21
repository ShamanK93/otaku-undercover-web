import React from 'react';

// image : affiche de l'animé (optionnelle) ; sans elle, simple pastille texte.
export default function AnimeCheckboxRow({ title, checked, onToggle, image }) {
  return (
    <button
      type="button"
      className={`anime-chip${checked ? ' checked' : ''}${image ? ' anime-chip--poster' : ''}`}
      onClick={onToggle}
    >
      {image && <img className="anime-chip-img" src={image} alt="" loading="lazy" draggable="false" />}
      {checked && <span className="chip-check">✓</span>}
      <span className="anime-chip-title">{title}</span>
    </button>
  );
}
