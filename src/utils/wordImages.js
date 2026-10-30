// Accès aux images générées par scripts/fetch-images.mjs (affiches des animés
// et portraits des personnages). Les écrans connaissent l'animé tantôt par
// son id, tantôt par son titre : on accepte les deux.
import { ANIME_LIST } from '../data/animeDatabase';
import { CHARACTER_DATABASE } from '../data/characterDatabase';
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

// ----- Recherche de personnages (saisie libre, ex. Devine la règle) -----

function normalize(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const ALL_CHARACTERS = CHARACTER_DATABASE.flatMap((anime) =>
  anime.characters.map((name) => ({ name, animeId: anime.id, animeTitle: anime.title, key: normalize(name) })),
);

// Personnage dont le nom correspond exactement (casse et accents ignorés).
export function findCharacter(name) {
  const key = normalize(name);
  if (!key) return null;
  return ALL_CHARACTERS.find((c) => c.key === key) || null;
}

// Suggestions pour un début de saisie : d'abord les noms qui commencent par
// la saisie, puis ceux qui la contiennent ; ceux qui ont une image d'abord.
export function searchCharacters(query, limit = 6) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const scored = [];
  for (const c of ALL_CHARACTERS) {
    let score = -1;
    if (c.key.startsWith(q)) score = 0;
    else if (c.key.split(' ').some((w) => w.startsWith(q))) score = 1;
    else if (c.key.includes(q)) score = 2;
    if (score < 0) continue;
    if (!getWordImage(c.animeId, c.name)) score += 3;
    scored.push([score, c]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name));
  return scored.slice(0, limit).map(([, c]) => c);
}

// À appeler avant un « maintenir pour révéler » : l'image est déjà en cache
// quand le joueur appuie.
export function preloadWordImage(anime, word) {
  const src = getWordImage(anime, word);
  if (src) new Image().src = src;
}
