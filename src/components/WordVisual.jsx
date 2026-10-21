import React from 'react';
import { getAnimeImage, getWordImage } from '../utils/wordImages';

// Un mot (personnage, technique...) avec son image. Sans image connue, une
// vignette avec l'initiale prend sa place pour garder la même mise en page.
// size : 'lg' (révélation, pioche), 'md' (fin de partie), 'sm' (listes).
export default function WordVisual({ anime, word, size = 'md', caption }) {
  const src = getWordImage(anime, word);
  return (
    <figure className={`word-visual word-visual--${size}`}>
      <span className="word-visual-frame">
        {src ? (
          <img src={src} alt="" loading={size === 'sm' ? 'lazy' : 'eager'} draggable="false" />
        ) : (
          <span className="word-visual-fallback" aria-hidden="true">{(word || '?').charAt(0).toUpperCase()}</span>
        )}
      </span>
      <figcaption className="word-visual-text">
        <span className="word-visual-word">{word}</span>
        {caption && <span className="word-visual-caption">{caption}</span>}
      </figcaption>
    </figure>
  );
}

// Petite étiquette « affiche + titre » pour rappeler l'animé en cours.
export function AnimeTag({ anime }) {
  if (!anime) return null;
  const src = getAnimeImage(anime);
  return (
    <span className="anime-tag">
      {src && <img src={src} alt="" draggable="false" />}
      <span>{anime}</span>
    </span>
  );
}
