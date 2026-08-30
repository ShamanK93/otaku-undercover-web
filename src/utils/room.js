import { ref, set, update, get, onValue, off, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';
import { assignRoles, shuffle, checkWinCondition } from './gameLogic';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans caractères ambigus (0/O, 1/I...)
const PLAYER_ID_KEY = 'otaku_undercover_player_id';
const PLAYER_NAME_KEY = 'otaku_undercover_player_name';

export function getOrCreatePlayerId() {
  let id = window.localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = 'p_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
    window.localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getSavedName() {
  return window.localStorage.getItem(PLAYER_NAME_KEY) || '';
}

export function saveName(name) {
  window.localStorage.setItem(PLAYER_NAME_KEY, name);
}

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function getInviteLink(code) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('salon', code);
  return url.toString();
}

// ---------- Création / connexion au salon ----------

export async function createRoom(hostName) {
  const playerId = getOrCreatePlayerId();
  saveName(hostName);

  let code = generateRoomCode();
  // évite (rarement) une collision de code sur un salon encore actif
  for (let attempt = 0; attempt < 5; attempt++) {
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) break;
    code = generateRoomCode();
  }

  await set(ref(db, `rooms/${code}`), {
    hostId: playerId,
    phase: 'lobby',
    createdAt: serverTimestamp(),
    selectedAnimeIds: {},
    selectedTypes: {},
    selectedDifficulties: {},
    settings: { numUndercover: 1, numMrWhite: 0, clueSeconds: 30 },
    players: {
      [playerId]: { name: hostName.trim(), joinedAt: serverTimestamp() },
    },
  });

  return { code, playerId };
}

export async function joinRoom(code, name) {
  const normalized = code.trim().toUpperCase();
  const roomRef = ref(db, `rooms/${normalized}`);
  const snap = await get(roomRef);
  if (!snap.exists()) {
    throw new Error("Ce salon n'existe pas. Vérifie le code.");
  }
  const room = snap.val();
  if (room.phase !== 'lobby') {
    throw new Error('Cette partie a déjà commencé.');
  }

  const playerId = getOrCreatePlayerId();
  saveName(name);

  await update(ref(db, `rooms/${normalized}/players/${playerId}`), {
    name: name.trim(),
    joinedAt: serverTimestamp(),
  });

  return { code: normalized, playerId };
}

export function subscribeRoom(code, callback) {
  const roomRef = ref(db, `rooms/${code}`);
  const handler = (snap) => callback(snap.exists() ? snap.val() : null);
  onValue(roomRef, handler);
  return () => off(roomRef, 'value', handler);
}

export async function leaveRoom(code, playerId) {
  await set(ref(db, `rooms/${code}/players/${playerId}`), null);
}

// ---------- Configuration du salon (hôte) ----------

export async function setSelectedAnime(code, idsArray) {
  const map = {};
  idsArray.forEach((id) => {
    map[id] = true;
  });
  await set(ref(db, `rooms/${code}/selectedAnimeIds`), map);
}

export async function setSelectedTypes(code, typesArray) {
  const map = {};
  typesArray.forEach((t) => {
    map[t] = true;
  });
  await set(ref(db, `rooms/${code}/selectedTypes`), map);
}

export async function setSelectedDifficulties(code, diffArray) {
  const map = {};
  diffArray.forEach((d) => {
    map[d] = true;
  });
  await set(ref(db, `rooms/${code}/selectedDifficulties`), map);
}

export async function setSettings(code, settings) {
  await update(ref(db, `rooms/${code}/settings`), settings);
}

// ---------- Déroulé de partie ----------

export async function startGame(code, room, animeList) {
  const playerIds = Object.keys(room.players || {});
  const selectedAnimeIds = Object.keys(room.selectedAnimeIds || {});
  const selectedTypes = Object.keys(room.selectedTypes || {});
  const selectedDifficulties = Object.keys(room.selectedDifficulties || {});
  const { numUndercover, numMrWhite } = room.settings;

  const newGame = assignRoles({
    animeList,
    selectedAnimeIds,
    selectedTypes,
    selectedDifficulties,
    playerIds,
    numUndercover,
    numMrWhite,
  });

  const alive = {};
  const ready = {};
  playerIds.forEach((id) => {
    alive[id] = true;
    ready[id] = false;
  });

  await update(ref(db, `rooms/${code}`), {
    phase: 'reveal',
    game: { ...newGame, alive, ready, clues: {}, clueIndex: 0, clueDeadline: null, votes: {}, eliminatedId: null, winner: null },
  });
}

export async function markReady(code, playerId) {
  await set(ref(db, `rooms/${code}/game/ready/${playerId}`), true);
}

// Démarre (ou redémarre) un tour d'écriture d'indices : remet l'index du
// tour à zéro, vide les indices déjà écrits, incrémente le compteur de
// tour, et relance le minuteur du premier joueur.
export async function startCluePhase(code, room) {
  const clueSeconds = (room.settings && room.settings.clueSeconds) || 30;
  const nextClueRound = ((room.game && room.game.clueRound) || 0) + 1;
  await update(ref(db, `rooms/${code}`), {
    phase: 'clues',
    'game/clueIndex': 0,
    'game/clues': {},
    'game/clueRound': nextClueRound,
    'game/clueDeadline': Date.now() + clueSeconds * 1000,
  });
}

// Enregistre l'indice écrit par le joueur dont c'est le tour, puis passe au
// joueur suivant. Une fois le dernier joueur passé, le tour s'arrête (plus
// de minuteur) et attend le choix de l'hôte : nouveau tour ou vote.
// Ignoré silencieusement si ce n'est pas le tour de ce joueur.
export async function submitClue(code, room, playerId, text) {
  const order = room.game.order || [];
  const idx = room.game.clueIndex || 0;
  if (order[idx] !== playerId) return;
  await advanceClueTurn(code, room, text);
}

// Réservé à l'hôte : force le passage au tour suivant si un joueur est
// bloqué (déconnecté, ne répond plus), sans attendre la fin du minuteur.
export async function forceSkipClueTurn(code, room) {
  await advanceClueTurn(code, room, '');
}

async function advanceClueTurn(code, room, text) {
  const order = room.game.order || [];
  const idx = room.game.clueIndex || 0;
  const playerId = order[idx];
  const nextIndex = idx + 1;
  const clueSeconds = (room.settings && room.settings.clueSeconds) || 30;

  if (nextIndex >= order.length) {
    // Tour terminé : on arrête le minuteur et on attend le choix de l'hôte.
    await update(ref(db, `rooms/${code}`), {
      [`game/clues/${playerId}`]: text,
      'game/clueIndex': nextIndex,
      'game/clueDeadline': null,
    });
    return;
  }

  await update(ref(db, `rooms/${code}`), {
    [`game/clues/${playerId}`]: text,
    'game/clueIndex': nextIndex,
    'game/clueDeadline': Date.now() + clueSeconds * 1000,
  });
}

// Réservé à l'hôte, une fois le tour d'indices terminé : lance la manche de
// vote.
export async function proceedToVote(code) {
  await update(ref(db, `rooms/${code}`), { phase: 'vote', 'game/clueDeadline': null });
}

export async function castVote(code, playerId, targetId) {
  await set(ref(db, `rooms/${code}/game/votes/${playerId}`), targetId);
}

// Dépouille les votes, élimine le joueur le plus voté (égalité -> tirage
// au sort parmi les premiers) et passe à l'écran d'élimination.
export async function finalizeVote(code, room) {
  const votes = room.game.votes || {};
  const tally = {};
  Object.values(votes).forEach((targetId) => {
    tally[targetId] = (tally[targetId] || 0) + 1;
  });
  let best = [];
  let bestCount = 0;
  Object.entries(tally).forEach(([id, count]) => {
    if (count > bestCount) {
      best = [id];
      bestCount = count;
    } else if (count === bestCount) {
      best.push(id);
    }
  });
  const eliminatedId = best.length > 0 ? shuffle(best)[0] : null;

  await update(ref(db, `rooms/${code}`), {
    phase: 'elimination',
    'game/eliminatedId': eliminatedId,
  });
}

export async function submitMrWhiteGuess(code, room, correct) {
  if (correct) {
    await update(ref(db, `rooms/${code}`), {
      phase: 'gameover',
      'game/winner': 'mrwhite',
    });
    return;
  }
  await continueAfterElimination(code, room);
}

// À appeler par l'hôte après l'écran d'élimination (ou directement si ce
// n'était pas Mr. White / que sa tentative a échoué).
export async function continueAfterElimination(code, room) {
  const eliminatedId = room.game.eliminatedId;
  const nextAlive = { ...room.game.alive, [eliminatedId]: false };
  const result = checkWinCondition(room.game.roles, nextAlive);
  const aliveIds = Object.keys(nextAlive).filter((id) => nextAlive[id]);

  if (result) {
    await update(ref(db, `rooms/${code}`), {
      phase: 'gameover',
      'game/alive': nextAlive,
      'game/winner': result,
    });
    return;
  }

  const clueSeconds = (room.settings && room.settings.clueSeconds) || 30;
  await update(ref(db, `rooms/${code}`), {
    phase: 'clues',
    'game/alive': nextAlive,
    'game/round': room.game.round + 1,
    'game/order': shuffle(aliveIds),
    'game/votes': {},
    'game/eliminatedId': null,
    'game/clueIndex': 0,
    'game/clues': {},
    'game/clueRound': 1,
    'game/clueDeadline': Date.now() + clueSeconds * 1000,
  });
}

// Relance une manche avec les mêmes joueurs et les mêmes réglages.
export async function replayRoom(code, room, animeList) {
  await startGame(code, room, animeList);
}

// Retour au salon pour reconfigurer (mêmes joueurs, on garde les réglages).
export async function backToLobby(code) {
  await update(ref(db, `rooms/${code}`), { phase: 'lobby', game: null });
}
