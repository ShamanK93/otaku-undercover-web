export function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function matchesFilters(pair, selectedTypes, selectedDifficulties) {
  const type = pair.type || 'personnage';
  const difficulty = pair.difficulty || 'moyen';
  if (selectedTypes && selectedTypes.length && !selectedTypes.includes(type)) return false;
  if (selectedDifficulties && selectedDifficulties.length && !selectedDifficulties.includes(difficulty)) return false;
  return true;
}

// Liste à plat { animeTitle, pair } de toutes les paires des animés
// sélectionnés qui correspondent aux filtres de type/difficulté.
function getMatchingPairs({ animeList, selectedAnimeIds, selectedTypes, selectedDifficulties }) {
  const selectedAnime = animeList.filter((a) => selectedAnimeIds.includes(a.id));
  const flat = [];
  selectedAnime.forEach((anime) => {
    anime.pairs.forEach((pair) => {
      if (matchesFilters(pair, selectedTypes, selectedDifficulties)) {
        flat.push({ animeTitle: anime.title, pair });
      }
    });
  });
  return flat;
}

// Utilisé par l'écran de sélection pour afficher "X paires disponibles"
// en direct, selon les animés/types/difficultés cochés.
export function countMatchingPairs(args) {
  return getMatchingPairs(args).length;
}

// Construit une nouvelle partie pour un salon en ligne : à partir des
// animés + types + difficultés sélectionnés, choisit une paire au hasard
// parmi TOUTES celles qui correspondent aux filtres (et pas anime par
// anime), puis distribue aléatoirement les rôles entre les identifiants de
// joueurs du salon. Les rôles sont indexés par playerId (et non par
// position dans un tableau) pour correspondre à la structure du salon
// partagé en temps réel.
export function assignRoles({
  animeList,
  selectedAnimeIds,
  selectedTypes,
  selectedDifficulties,
  playerIds,
  numUndercover,
  numMrWhite,
}) {
  let flatPairs = getMatchingPairs({ animeList, selectedAnimeIds, selectedTypes, selectedDifficulties });

  // Filet de sécurité : si les filtres ne laissent aucune paire (ex. un
  // seul animé sélectionné sans aucune paire du type demandé), on retombe
  // sur toutes les paires des animés sélectionnés sans filtre.
  if (flatPairs.length === 0) {
    flatPairs = getMatchingPairs({ animeList, selectedAnimeIds, selectedTypes: [], selectedDifficulties: [] });
  }

  const { animeTitle, pair } = pickRandom(flatPairs);

  const n = playerIds.length;
  const numCivils = n - numUndercover - numMrWhite;

  const roleList = shuffle([
    ...Array(numCivils).fill('civil'),
    ...Array(numUndercover).fill('undercover'),
    ...Array(numMrWhite).fill('mrwhite'),
  ]);

  const roles = {};
  playerIds.forEach((id, i) => {
    const role = roleList[i];
    const word = role === 'civil' ? pair.civil : role === 'undercover' ? pair.undercover : null;
    roles[id] = { role, word };
  });

  return {
    anime: animeTitle,
    civilWord: pair.civil,
    undercoverWord: pair.undercover,
    roles,
    order: shuffle(playerIds),
    round: 1,
  };
}

// Retourne 'civils', 'intrus' ou null (partie qui continue).
// roles: { [playerId]: { role } } — aliveMap: { [playerId]: boolean }
export function checkWinCondition(roles, aliveMap) {
  const aliveIds = Object.keys(aliveMap).filter((id) => aliveMap[id]);
  const civilsAlive = aliveIds.filter((id) => roles[id].role === 'civil').length;
  const intrudersAlive = aliveIds.filter((id) => roles[id].role !== 'civil').length;

  if (intrudersAlive === 0) return 'civils';
  if (intrudersAlive >= civilsAlive) return 'intrus';
  return null;
}
