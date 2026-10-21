// Accès aux images générées par scripts/fetch-images.mjs (affiches des animés
// et portraits des personnages). Les écrans connaissent l'animé tantôt par
// son id, tantôt par son titre : on accepte les deux.
import { ANIME_LIST } from '../data/animeDatabase';
import { ANIME_IMAGES, CHARACTER_IMAGES } from '../data/wordImages';

const TITLE_TO_ID = Object.fromEntries(ANIME_LIST.map((a) => [a.title, a.id]));

function animeIdOf(anime) {
  if (!anime) return null;
  if (ANIME_IMAGES[anime] || CHARACTER_IMAGES[anime]) return anime;
  return TITLE_TO_ID[anime] || null;
}

export function getAnimeImage(anime) {
  const id = animeIdOf(anime);
  return (id && ANIME_IMAGES[id]) || null;
}

export function getWordImage(anime, word) {
  if (!word) return null;
  const id = animeIdOf(anime);
  if (id) return (CHARACTER_IMAGES[id] && CHARACTER_IMAGES[id][word]) || null;
  // Animé inconnu : on cherche le nom dans toutes les licences.
  for (const map of Object.values(CHARACTER_IMAGES)) {
    if (map[word]) return map[word];
  }
  return null;
}

// À appeler avant un « maintenir pour révéler » : l'image est déjà en cache
// quand le joueur appuie.
export function preloadWordImage(anime, word) {
  const src = getWordImage(anime, word);
  if (src) new Image().src = src;
}
