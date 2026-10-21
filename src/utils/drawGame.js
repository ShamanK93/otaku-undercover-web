// Chapitre 04 — « L'Imposteur au Pinceau » : logique pure (sans Firebase),
// pour pouvoir la tester et la réutiliser depuis room.js.
import { shuffle, checkWinCondition } from './gameLogic';

function pairKey(animeId, pair) {
  return `${animeId}|${pair.civil}`;
}

// Toutes les paires { anime, pair } des animés sélectionnés qui passent les filtres.
function candidatePairs(animeList, { selectedAnimeIds, selectedTypes = [], selectedDifficulties = [] }) {
  const out = [];
  animeList
    .filter((a) => selectedAnimeIds.includes(a.id))
    .forEach((anime) => {
      anime.pairs.forEach((pair) => {
        const type = pair.type || 'personnage';
        const difficulty = pair.difficulty || 'moyen';
        if (selectedTypes.length && !selectedTypes.includes(type)) return;
        if (selectedDifficulties.length && !selectedDifficulties.includes(difficulty)) return;
        out.push({ anime, pair });
      });
    });
  return out;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function wordFor(role, pair) {
  if (role === 'civil') return pair.civil;
  if (role === 'undercover') return pair.undercover;
  return null; // Mr. White n'a jamais de mot
}

// Nouvelle partie : tire une paire, distribue les rôles.
export function buildDrawGame({ animeList, selectedAnimeIds, selectedTypes, selectedDifficulties, playerIds, numUndercover, numMrWhite }) {
  let pool = candidatePairs(animeList, { selectedAnimeIds, selectedTypes, selectedDifficulties });
  if (pool.length === 0) pool = candidatePairs(animeList, { selectedAnimeIds });
  const { anime, pair } = pickRandom(pool);

  const numCivils = playerIds.length - numUndercover - numMrWhite;
  const roleList = shuffle([
    ...Array(numCivils).fill('civil'),
    ...Array(numUndercover).fill('undercover'),
    ...Array(numMrWhite).fill('mrwhite'),
  ]);

  const roles = {};
  const alive = {};
  const ready = {};
  playerIds.forEach((id, i) => {
    roles[id] = { role: roleList[i], word: wordFor(roleList[i], pair) };
    alive[id] = true;
    ready[id] = false;
  });

  return {
    anime: anime.title,
    animeId: anime.id,
    category: pair.type || 'personnage',
    civilWord: pair.civil,
    undercoverWord: pair.undercover,
    usedPairs: [pairKey(anime.id, pair)],
    roles,
    alive,
    ready,
    order: shuffle(playerIds),
    round: 1,
    prolongation: false,
    votes: {},
    eliminatedId: null,
    voteOutcome: null,
    winner: null,
  };
}

// Prolongations : mêmes rôles, mais un NOUVEAU mot de la même catégorie
// (même animé, même type). Si la catégorie est épuisée, on élargit à
// l'animé entier, puis à toutes les paires sélectionnées.
export function rerollWords(game, animeList, filters) {
  const used = new Set(game.usedPairs || []);
  const anime = animeList.find((a) => a.id === game.animeId);
  const sameAnime = anime ? anime.pairs.map((pair) => ({ anime, pair })) : [];
  const sameCategory = sameAnime.filter(({ pair }) => (pair.type || 'personnage') === game.category);
  const fresh = (list) => list.filter(({ anime: a, pair }) => !used.has(pairKey(a.id, pair)));

  const choice =
    pickRandom(fresh(sameCategory)) ||
    pickRandom(fresh(sameAnime)) ||
    pickRandom(fresh(candidatePairs(animeList, filters))) ||
    pickRandom(sameCategory.length ? sameCategory : sameAnime);

  const { anime: chosenAnime, pair } = choice;
  const roles = {};
  Object.entries(game.roles).forEach(([id, r]) => {
    roles[id] = { role: r.role, word: wordFor(r.role, pair) };
  });

  return {
    roles,
    anime: chosenAnime.title,
    animeId: chosenAnime.id,
    category: pair.type || 'personnage',
    civilWord: pair.civil,
    undercoverWord: pair.undercover,
    usedPairs: [...used, pairKey(chosenAnime.id, pair)],
  };
}

// Dépouillement : le plus voté est éliminé ; égalité en tête ou aucun vote = vote nul.
export function tallyVotes(votes) {
  const tally = {};
  Object.values(votes || {}).forEach((targetId) => {
    tally[targetId] = (tally[targetId] || 0) + 1;
  });
  const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return { eliminatedId: null, tally };
  if (entries.length > 1 && entries[0][1] === entries[1][1]) return { eliminatedId: null, tally };
  return { eliminatedId: entries[0][0], tally };
}

// 'nul' (personne n'est éliminé), 'innocent' (un citoyen tombe) ou 'impostor'.
export function voteOutcome(game, eliminatedId) {
  if (!eliminatedId) return 'nul';
  return game.roles[eliminatedId].role === 'civil' ? 'innocent' : 'impostor';
}

// Après l'écran de résultat : soit la partie est finie, soit on part en
// prolongations (nouveau mot, dessins effacés, nouvel ordre).
export function afterVote(game, animeList, filters) {
  const alive = { ...game.alive };
  if (game.eliminatedId) alive[game.eliminatedId] = false;

  const winner = checkWinCondition(game.roles, alive);
  if (winner) return { finished: true, winner, alive };

  const aliveIds = Object.keys(alive).filter((id) => alive[id]);
  const ready = {};
  Object.keys(alive).forEach((id) => {
    ready[id] = !alive[id]; // les éliminés n'ont pas à confirmer
  });

  return {
    finished: false,
    alive,
    next: {
      ...rerollWords(game, animeList, filters),
      alive,
      ready,
      order: shuffle(aliveIds),
      round: game.round + 1,
      prolongation: game.voteOutcome !== 'impostor',
      votes: {},
      eliminatedId: null,
      voteOutcome: null,
    },
  };
}

// Fresque commune : à qui de dessiner, et est-ce le dernier trait ?
export function fresqueTurn(game, laps) {
  const order = (game.order || []).filter((id) => game.alive[id]);
  const turn = game.turn || 0;
  const total = order.length * laps;
  return {
    currentId: turn < total ? order[turn % order.length] : null,
    lap: Math.floor(turn / Math.max(1, order.length)) + 1,
    isLast: turn + 1 >= total,
    done: turn >= total,
  };
}

// Voisins d'un joueur dans l'ordre de passage (pour le Pass'Œil de Mr. White).
export function neighbours(game, playerId) {
  const order = (game.order || []).filter((id) => game.alive[id]);
  const i = order.indexOf(playerId);
  if (i === -1 || order.length < 2) return [];
  const prev = order[(i - 1 + order.length) % order.length];
  const next = order[(i + 1) % order.length];
  return prev === next ? [prev] : [prev, next];
}
