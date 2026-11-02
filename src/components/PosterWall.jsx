import React from 'react';
import { ANIME_IMAGES } from '../data/wordImages';

// Fond du site : mur d'affiches de tous les animés de la base, mélangées une
// fois par visite (le mur ne change donc pas d'un écran à l'autre). Trois fois
// la liste pour remplir les grands écrans. Les pages statiques (règles, à
// propos...) affichent le même mur via public/poster-wall.js.
function shuffledPosters() {
  const list = Object.values(ANIME_IMAGES);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return [...list, ...list, ...list];
}

const POSTERS = shuffledPosters();

export default function PosterWall() {
  return (
    <div className="ou-home-wall" aria-hidden="true">
      <div className="ou-home-wall-grid">
        {POSTERS.map((src, i) => <img key={i} src={src} alt="" draggable="false" />)}
      </div>
    </div>
  );
}
