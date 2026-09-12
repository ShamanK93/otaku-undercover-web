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

export async function createRoom(hostName, gameType = 'undercover') {
  const playerId = getOrCreatePlayerId();
  saveName(hostName);

  let code = generateRoomCode();
  // évite (rarement) une collision de code sur un salon encore actif
  for (let attempt = 0; attempt < 5; attempt++) {
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) break;
    code = generateRoomCode();
  }

  const base = {
    hostId: playerId,
    phase: 'lobby',
    gameType,
    createdAt: serverTimestamp(),
    players: {
      [playerId]: { name: hostName.trim(), joinedAt: serverTimestamp() },
    },
  };

  if (gameType === 'rule') {
    await set(ref(db, `rooms/${code}`), { ...base, settings: { actionSeconds: 30 } });
  } else if (gameType === 'team') {
    await set(ref(db, `rooms/${code}`), {
      ...base,
      selectedAnimeIds: {},
      settings: { blindMode: false },
    });
  } else {
    await set(ref(db, `rooms/${code}`), {
      ...base,
      selectedAnimeIds: {},
      selectedTypes: {},
      selectedDifficulties: {},
      settings: { numUndercover: 1, numMrWhite: 0, clueSeconds: 30 },
    });
  }

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

// ==========================================================================
// Chapitre 02 — « Devine la règle »
// ==========================================================================

function actionDeadline(room) {
  const seconds = (room.settings && room.settings.actionSeconds) || 30;
  return Date.now() + seconds * 1000;
}

// Réservé à l'hôte : lance la partie, chaque joueur va devoir écrire sa
// règle secrète.
export async function startRuleGame(code, room) {
  const playerIds = Object.keys(room.players || {});
  await update(ref(db, `rooms/${code}`), {
    phase: 'ruleSetup',
    settings: { actionSeconds: (room.settings && room.settings.actionSeconds) || 30 },
    rule: {
      rules: {},
      ready: {},
      turnOrder: shuffle(playerIds),
      turnIndex: 0,
      log: {},
      logOrder: [],
      pendingPropose: null,
      pendingGuess: null,
      revengePending: null,
      revealed: {},
      outcome: null,
      deadline: null,
    },
  });
}

export async function setRuleSettings(code, settings) {
  await update(ref(db, `rooms/${code}/settings`), settings);
}

// Enregistre la règle secrète d'un joueur.
export async function submitRule(code, playerId, ruleText) {
  await update(ref(db, `rooms/${code}`), {
    [`rule/rules/${playerId}`]: ruleText.trim(),
    [`rule/ready/${playerId}`]: true,
  });
}

// Réservé à l'hôte : une fois tout le monde prêt, démarre le premier tour.
export async function startRulePlay(code, room) {
  await update(ref(db, `rooms/${code}`), {
    phase: 'rulePlay',
    'rule/deadline': actionDeadline(room),
  });
}

// Prochain joueur dans l'ordre des tours, en sautant ceux dont la règle a
// déjà été devinée (ils sont hors-jeu).
function nextTurnIndex(room) {
  const order = room.rule.turnOrder;
  const total = order.length;
  const revealed = room.rule.revealed || {};
  let idx = room.rule.turnIndex;
  for (let i = 0; i < total; i++) {
    idx = (idx + 1) % total;
    if (!revealed[order[idx]]) return idx;
  }
  return room.rule.turnIndex;
}

function aliveIds(room) {
  const revealed = room.rule.revealed || {};
  return Object.keys(room.players || {}).filter((id) => !revealed[id]);
}

function newLogId() {
  return 'l_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Réservé à l'hôte : si un joueur laisse filer son tour (minuteur écoulé),
// passe simplement au suivant.
export async function skipTurn(code, room) {
  await update(ref(db, `rooms/${code}`), {
    'rule/turnIndex': nextTurnIndex(room),
    'rule/deadline': actionDeadline(room),
  });
}

// Le joueur dont c'est le tour propose un personnage : tous les autres
// joueurs devront ensuite dire, chacun selon sa propre règle secrète, si ce
// personnage correspond ou non.
export async function proposeCharacter(code, room, playerId, character) {
  const current = room.rule.turnOrder[room.rule.turnIndex];
  if (current !== playerId) return;
  await update(ref(db, `rooms/${code}`), {
    'rule/pendingPropose': { by: playerId, character: character.trim(), answers: {} },
    'rule/deadline': actionDeadline(room),
  });
}

// Un joueur (autre que le proposeur) répond, selon SA propre règle secrète,
// si le personnage proposé correspond ou non.
export async function answerProposal(code, room, playerId, matches) {
  const pending = room.rule.pendingPropose;
  if (!pending || playerId === pending.by) return;

  await set(ref(db, `rooms/${code}/rule/pendingPropose/answers/${playerId}`), matches);

  const players = Object.keys(room.players || {});
  const expected = players.filter((id) => id !== pending.by);
  const already = Object.keys(pending.answers || {});
  const willHaveAll = expected.every((id) => id === playerId || already.includes(id));

  if (willHaveAll) {
    const finalAnswers = { ...pending.answers, [playerId]: matches };
    const logId = newLogId();
    await update(ref(db, `rooms/${code}`), {
      [`rule/log/${logId}`]: { type: 'propose', by: pending.by, character: pending.character, answers: finalAnswers },
      'rule/logOrder': [...(room.rule.logOrder || []), logId],
      'rule/pendingPropose': null,
      'rule/turnIndex': nextTurnIndex(room),
      'rule/deadline': actionDeadline(room),
    });
  }
}

// Le joueur dont c'est le tour tente de deviner la règle d'un adversaire.
export async function startGuess(code, room, playerId, targetId, guessText) {
  const current = room.rule.turnOrder[room.rule.turnIndex];
  if (current !== playerId || playerId === targetId) return;
  await update(ref(db, `rooms/${code}`), {
    'rule/pendingGuess': { by: playerId, target: targetId, guessText: guessText.trim() },
    'rule/deadline': actionDeadline(room),
  });
}

// À 2 joueurs seulement : juste après s'être fait deviner sa règle, le
// joueur visé a une unique chance immédiate de deviner en retour la règle
// de son adversaire, pour faire égalité.
export async function startRevengeGuess(code, room, defenderId, guessText) {
  const revenge = room.rule.revengePending;
  if (!revenge || revenge.defenderId !== defenderId) return;
  await update(ref(db, `rooms/${code}`), {
    'rule/pendingGuess': { by: defenderId, target: revenge.attackerId, guessText: guessText.trim(), isRevenge: true },
    'rule/deadline': actionDeadline(room),
  });
}

// Le joueur ciblé répond honnêtement si la règle devinée correspond à la
// sienne. Gère aussi les conditions de victoire (2 joueurs avec revanche,
// 3+ joueurs avec dernier survivant).
export async function answerGuess(code, room, playerId, correct) {
  const pending = room.rule.pendingGuess;
  if (!pending || playerId !== pending.target) return;

  const totalPlayers = Object.keys(room.players || {}).length;
  const logId = newLogId();
  const logEntry = { type: 'guess', by: pending.by, target: pending.target, guessText: pending.guessText, correct };

  // Réponse à une revanche (2 joueurs) : la partie se termine ici, quoi
  // qu'il arrive.
  if (pending.isRevenge) {
    const updates = {
      [`rule/log/${logId}`]: logEntry,
      'rule/logOrder': [...(room.rule.logOrder || []), logId],
      'rule/pendingGuess': null,
      'rule/revengePending': null,
      'rule/deadline': null,
      phase: 'ruleGameOver',
    };
    if (correct) {
      updates[`rule/revealed/${pending.target}`] = true; // l'attaquant aussi démasqué
      updates['rule/outcome'] = { type: 'tie' };
    } else {
      updates['rule/outcome'] = { type: 'winner', winnerId: pending.target }; // l'attaquant l'emporte
    }
    await update(ref(db, `rooms/${code}`), updates);
    return;
  }

  // Deviné à tort : la partie continue normalement.
  if (!correct) {
    await update(ref(db, `rooms/${code}`), {
      [`rule/log/${logId}`]: logEntry,
      'rule/logOrder': [...(room.rule.logOrder || []), logId],
      'rule/pendingGuess': null,
      'rule/turnIndex': nextTurnIndex(room),
      'rule/deadline': actionDeadline(room),
    });
    return;
  }

  // Deviné juste.
  if (totalPlayers === 2) {
    // Le joueur démasqué a une chance immédiate de faire égalité.
    await update(ref(db, `rooms/${code}`), {
      [`rule/log/${logId}`]: logEntry,
      'rule/logOrder': [...(room.rule.logOrder || []), logId],
      'rule/pendingGuess': null,
      [`rule/revealed/${pending.target}`]: true,
      'rule/revengePending': { attackerId: pending.by, defenderId: pending.target },
      'rule/deadline': actionDeadline(room),
    });
    return;
  }

  // 3 joueurs ou plus : le joueur démasqué sort du jeu ; s'il ne reste
  // qu'un seul joueur avec sa règle intacte, il gagne.
  const stillAlive = aliveIds(room).filter((id) => id !== pending.target);
  const updates = {
    [`rule/log/${logId}`]: logEntry,
    'rule/logOrder': [...(room.rule.logOrder || []), logId],
    'rule/pendingGuess': null,
    [`rule/revealed/${pending.target}`]: true,
  };
  if (stillAlive.length <= 1) {
    updates.phase = 'ruleGameOver';
    updates['rule/deadline'] = null;
    updates['rule/outcome'] = stillAlive.length === 1
      ? { type: 'winner', winnerId: stillAlive[0] }
      : { type: 'tie' };
  } else {
    updates['rule/turnIndex'] = nextTurnIndex(room);
    updates['rule/deadline'] = actionDeadline(room);
  }
  await update(ref(db, `rooms/${code}`), updates);
}

// Réservé à l'hôte : termine la partie manuellement et révèle toutes les
// règles (sans vainqueur désigné).
export async function endRuleGame(code) {
  await update(ref(db, `rooms/${code}`), { phase: 'ruleGameOver', 'rule/deadline': null });
}

// Relance une nouvelle manche avec les mêmes joueurs (nouvelles règles).
export async function replayRuleGame(code, room) {
  await startRuleGame(code, room);
}

// Retour au salon (Chapitre 02).
export async function backToRuleLobby(code) {
  await update(ref(db, `rooms/${code}`), { phase: 'lobby', rule: null });
}

// ==========================================================================
// Chapitre 03 — « Construis ta team »
// ==========================================================================

const STARTING_BUDGET = 20;
const TEAM_SIZE = 5;

function buildTeamPool(characterDb, selectedAnimeIds) {
  const pool = [];
  characterDb.forEach((anime) => {
    if (!selectedAnimeIds.includes(anime.id)) return;
    anime.characters.forEach((name) => {
      pool.push({ name, anime: anime.title });
    });
  });
  return shuffle(pool);
}

// Réservé à l'hôte : lance la partie (2 joueurs ou plus).
export async function startTeamGame(code, room, characterDb) {
  const playerIds = Object.keys(room.players || {});
  const selectedAnimeIds = Object.keys(room.selectedAnimeIds || {});
  const pool = buildTeamPool(characterDb, selectedAnimeIds);

  const budgets = {};
  const teams = {};
  playerIds.forEach((id) => {
    budgets[id] = STARTING_BUDGET;
    teams[id] = [];
  });

  await update(ref(db, `rooms/${code}`), {
    phase: 'teamPlay',
    team: {
      budgets,
      teams,
      pool,
      turnOrder: shuffle(playerIds),
      turnIndex: 0,
      blindMode: Boolean(room.settings && room.settings.blindMode),
      currentDraw: null,
      log: {},
      logOrder: [],
      votes: null,
      outcome: null,
    },
  });
}

export async function setTeamSettings(code, settings) {
  await update(ref(db, `rooms/${code}/settings`), settings);
}

function teamNewLogId() {
  return 'l_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function isBankrupt(room, playerId) {
  const budget = room.team.budgets[playerId];
  const teamSize = (room.team.teams[playerId] || []).length;
  return budget <= 0 && teamSize < TEAM_SIZE;
}

// La partie doit-elle s'arrêter (équipes complètes, pioche vide, ou plus
// personne ne peut acquérir de personnage) ?
function teamGameShouldEnd(room) {
  const playerIds = Object.keys(room.players || {});
  const allFull = playerIds.every((id) => (room.team.teams[id] || []).length >= TEAM_SIZE);
  const poolEmpty = room.team.pool.length === 0;
  const allStuck = playerIds.every((id) => isBankrupt(room, id));
  return allFull || poolEmpty || allStuck;
}

function nextTeamTurnIndex(room) {
  return (room.team.turnIndex + 1) % room.team.turnOrder.length;
}

// Prochain joueur (dans l'ordre du salon) encore en lice pour cette
// enchère : ni celui qui a la meilleure offre, ni ceux qui ont déjà passé.
function nextChallenger(playerIds, passedBy, highestBidder, afterId) {
  const total = playerIds.length;
  const startIdx = playerIds.indexOf(afterId);
  for (let i = 1; i <= total; i++) {
    const candidate = playerIds[(startIdx + i) % total];
    if (candidate !== highestBidder && !passedBy[candidate]) return candidate;
  }
  return null; // plus aucun challenger : l'enchère est déjà terminée
}

// Le joueur dont c'est le tour pioche un personnage dans le pool restant.
// Si LUI-MÊME est en faillite, le personnage part directement en mode vol
// (il ne peut plus fixer de mise de départ).
export async function drawCharacter(code, room, playerId) {
  const current = room.team.turnOrder[room.team.turnIndex];
  if (current !== playerId || room.team.currentDraw || room.team.pool.length === 0) return;

  const pool = [...room.team.pool];
  const idx = Math.floor(Math.random() * pool.length);
  const character = pool[idx];
  pool.splice(idx, 1);

  const playerIds = Object.keys(room.players || {});
  const drawerBankrupt = isBankrupt(room, playerId);

  if (drawerBankrupt) {
    const eligible = playerIds.filter((id) => id !== playerId && room.team.budgets[id] >= 1);
    if (eligible.length === 0) {
      // Personne ne peut se le permettre : le personnage est perdu, on
      // enchaîne directement sur le joueur suivant.
      const logId = teamNewLogId();
      const projected = { ...room, team: { ...room.team, pool } };
      const updates = {
        [`team/log/${logId}`]: { type: 'discard', character },
        'team/logOrder': [...(room.team.logOrder || []), logId],
        'team/pool': pool,
      };
      if (teamGameShouldEnd(projected)) {
        updates.phase = 'teamGameOver';
        updates['team/votes'] = {};
      } else {
        updates['team/turnIndex'] = nextTeamTurnIndex(room);
      }
      await update(ref(db, `rooms/${code}`), updates);
      return;
    }
    await update(ref(db, `rooms/${code}`), {
      'team/pool': pool,
      'team/currentDraw': { character, drawnBy: playerId, mode: 'steal', eligibleIds: eligible, passedBy: {} },
    });
    return;
  }

  await update(ref(db, `rooms/${code}`), {
    'team/pool': pool,
    'team/currentDraw': {
      character, drawnBy: playerId, mode: 'bid',
      highestBid: 0, highestBidder: null, passedBy: {}, turnToAct: null,
      blind: Boolean(room.team.blindMode),
    },
  });
}

// Le joueur qui a pioché fixe sa mise de départ.
export async function setStartingBid(code, room, playerId, amount) {
  const draw = room.team.currentDraw;
  if (!draw || draw.mode !== 'bid' || draw.drawnBy !== playerId || draw.highestBid !== 0) return;
  const budget = room.team.budgets[playerId];
  const bid = Math.max(1, Math.min(Math.floor(amount), budget));

  const playerIds = room.team.turnOrder;
  const nextId = nextChallenger(playerIds, {}, playerId, playerId);

  const updates = {
    'team/currentDraw/highestBid': bid,
    'team/currentDraw/highestBidder': playerId,
  };
  if (nextId) {
    updates['team/currentDraw/turnToAct'] = nextId;
    await update(ref(db, `rooms/${code}`), updates);
  } else {
    // Personne d'autre ne peut enchérir (seul joueur, ou tous ruinés) :
    // le tireur remporte directement au prix de sa mise de départ.
    await resolveAuctionWin(code, room, playerId, bid, draw.character);
  }
}

async function resolveAuctionWin(code, room, winnerId, price, character) {
  const nextBudgets = { ...room.team.budgets, [winnerId]: room.team.budgets[winnerId] - price };
  const nextTeams = { ...room.team.teams, [winnerId]: [...(room.team.teams[winnerId] || []), character] };
  const logId = teamNewLogId();
  const projected = { ...room, team: { ...room.team, budgets: nextBudgets, teams: nextTeams } };

  const updates = {
    [`team/log/${logId}`]: { type: 'win', playerId: winnerId, character, price },
    'team/logOrder': [...(room.team.logOrder || []), logId],
    'team/budgets': nextBudgets,
    'team/teams': nextTeams,
    'team/currentDraw': null,
  };
  if (teamGameShouldEnd(projected)) {
    updates.phase = 'teamGameOver';
    updates['team/votes'] = {};
  } else {
    updates['team/turnIndex'] = nextTeamTurnIndex(room);
  }
  await update(ref(db, `rooms/${code}`), updates);
}

// Le joueur dont c'est le tour de répondre surenchérit.
export async function raiseBid(code, room, playerId, amount) {
  const draw = room.team.currentDraw;
  if (!draw || draw.mode !== 'bid' || draw.turnToAct !== playerId) return;
  const budget = room.team.budgets[playerId];
  const bid = Math.floor(amount);
  if (bid <= draw.highestBid || bid > budget) return;

  const nextId = nextChallenger(room.team.turnOrder, draw.passedBy || {}, playerId, playerId);

  if (nextId) {
    await update(ref(db, `rooms/${code}`), {
      'team/currentDraw/highestBid': bid,
      'team/currentDraw/highestBidder': playerId,
      'team/currentDraw/turnToAct': nextId,
    });
  } else {
    await resolveAuctionWin(code, room, playerId, bid, draw.character);
  }
}

// Le joueur dont c'est le tour de répondre laisse l'enchère aux autres.
export async function passAuction(code, room, playerId) {
  const draw = room.team.currentDraw;
  if (!draw || draw.mode !== 'bid' || draw.turnToAct !== playerId) return;

  const nextPassedBy = { ...(draw.passedBy || {}), [playerId]: true };
  const nextId = nextChallenger(room.team.turnOrder, nextPassedBy, draw.highestBidder, playerId);

  if (nextId) {
    await update(ref(db, `rooms/${code}`), {
      'team/currentDraw/passedBy': nextPassedBy,
      'team/currentDraw/turnToAct': nextId,
    });
  } else {
    await resolveAuctionWin(code, room, draw.highestBidder, draw.highestBid, draw.character);
  }
}

// Mode faillite : un des autres joueurs décide de voler le personnage
// pioché pour 1€, ou de le laisser passer.
export async function stealDecision(code, room, playerId, wantSteal) {
  const draw = room.team.currentDraw;
  if (!draw || draw.mode !== 'steal' || !draw.eligibleIds.includes(playerId)) return;

  if (wantSteal) {
    const nextBudgets = { ...room.team.budgets, [playerId]: Math.max(0, room.team.budgets[playerId] - 1) };
    const nextTeams = { ...room.team.teams, [playerId]: [...(room.team.teams[playerId] || []), draw.character] };
    const logId = teamNewLogId();
    const projected = { ...room, team: { ...room.team, budgets: nextBudgets, teams: nextTeams } };

    const updates = {
      [`team/log/${logId}`]: { type: 'steal', playerId, character: draw.character },
      'team/logOrder': [...(room.team.logOrder || []), logId],
      'team/budgets': nextBudgets,
      'team/teams': nextTeams,
      'team/currentDraw': null,
    };
    if (teamGameShouldEnd(projected)) {
      updates.phase = 'teamGameOver';
      updates['team/votes'] = {};
    } else {
      updates['team/turnIndex'] = nextTeamTurnIndex(room);
    }
    await update(ref(db, `rooms/${code}`), updates);
    return;
  }

  const nextPassedBy = { ...(draw.passedBy || {}), [playerId]: true };
  const allPassed = draw.eligibleIds.every((id) => nextPassedBy[id]);

  if (!allPassed) {
    await update(ref(db, `rooms/${code}`), { 'team/currentDraw/passedBy': nextPassedBy });
    return;
  }

  const logId = teamNewLogId();
  const updates = {
    [`team/log/${logId}`]: { type: 'discard', character: draw.character },
    'team/logOrder': [...(room.team.logOrder || []), logId],
    'team/currentDraw': null,
  };
  if (teamGameShouldEnd(room)) {
    updates.phase = 'teamGameOver';
    updates['team/votes'] = {};
  } else {
    updates['team/turnIndex'] = nextTeamTurnIndex(room);
  }
  await update(ref(db, `rooms/${code}`), updates);
}

// Réservé à l'hôte : termine la partie manuellement (passe directement au
// vote, quel que soit l'état des équipes).
export async function endTeamGame(code) {
  await update(ref(db, `rooms/${code}`), { phase: 'teamGameOver', 'team/votes': {} });
}

// Un joueur vote pour l'équipe qu'il juge la meilleure (ou 'tie' pour
// signaler une égalité à ses yeux). Une fois tout le monde voté, le
// résultat est calculé.
export async function castTeamVote(code, room, playerId, choice) {
  const playerIds = Object.keys(room.players || {});
  const nextVotes = { ...(room.team.votes || {}), [playerId]: choice };

  const updates = { [`team/votes/${playerId}`]: choice };

  const allVoted = playerIds.every((id) => nextVotes[id] !== undefined);
  if (allVoted) {
    const counts = {};
    playerIds.forEach((id) => { counts[id] = 0; });
    Object.values(nextVotes).forEach((c) => {
      if (counts[c] !== undefined) counts[c] += 1;
    });
    const maxCount = Math.max(...playerIds.map((id) => counts[id]));
    const topIds = playerIds.filter((id) => counts[id] === maxCount);
    updates['team/outcome'] =
      maxCount > 0 && topIds.length === 1
        ? { type: 'winner', winnerId: topIds[0], counts }
        : { type: 'tie', counts };
  }

  await update(ref(db, `rooms/${code}`), updates);
}

// Relance une nouvelle manche avec les mêmes joueurs.
export async function replayTeamGame(code, room, characterDb) {
  await startTeamGame(code, room, characterDb);
}

// Retour au salon (Chapitre 03).
export async function backToTeamLobby(code) {
  await update(ref(db, `rooms/${code}`), { phase: 'lobby', team: null });
}
