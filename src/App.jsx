import React, { useState, useEffect, useCallback, useRef } from 'react';

import HomeScreen from './screens/HomeScreen';
import CreateRoomScreen from './screens/CreateRoomScreen';
import JoinRoomScreen from './screens/JoinRoomScreen';
import LobbyScreen from './screens/LobbyScreen';
import AnimeSelectionScreen from './screens/AnimeSelectionScreen';
import RoleRevealScreen from './screens/RoleRevealScreen';
import ClueOrderScreen from './screens/ClueOrderScreen';
import VoteScreen from './screens/VoteScreen';
import EliminationScreen from './screens/EliminationScreen';
import GameOverScreen from './screens/GameOverScreen';
import AdSlot from './components/AdSlot';

import { ANIME_LIST } from './data/animeDatabase';
import { firebaseReady } from './firebase';
import {
  getOrCreatePlayerId,
  getSavedName,
  createRoom,
  joinRoom,
  subscribeRoom,
  leaveRoom,
  setSelectedAnime,
  setSelectedTypes,
  setSelectedDifficulties,
  setSettings,
  startGame,
  markReady,
  startCluePhase,
  submitClue,
  forceSkipClueTurn,
  proceedToVote,
  castVote,
  finalizeVote,
  submitMrWhiteGuess,
  continueAfterElimination,
  replayRoom,
  backToLobby,
} from './utils/room';

function PageDivider({ label }) {
  return (
    <div className="page-divider">
      <span>{label}</span>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('home'); // home | create | join
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [code, setCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [showAnimeSelect, setShowAnimeSelect] = useState(false);
  const [draftAnimeIds, setDraftAnimeIds] = useState([]);
  const [draftTypes, setDraftTypes] = useState([]);
  const [draftDifficulties, setDraftDifficulties] = useState([]);

  const playerId = getOrCreatePlayerId();
  const unsubRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const salon = params.get('salon');
    if (salon) setView('join');
  }, []);

  const connectToRoom = useCallback((roomCode) => {
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = subscribeRoom(roomCode, (data) => {
      setRoom(data);
      if (!data) {
        // Le salon a été fermé / n'existe plus.
        setCode(null);
        setView('home');
      }
    });
    setCode(roomCode);
  }, []);

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  async function handleCreate(name) {
    setBusy(true);
    setError(null);
    try {
      const { code: newCode } = await createRoom(name);
      connectToRoom(newCode);
    } catch (e) {
      setError(e.message || 'Impossible de créer le salon.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(joinCode, name) {
    setBusy(true);
    setError(null);
    try {
      const { code: joinedCode } = await joinRoom(joinCode, name);
      connectToRoom(joinedCode);
    } catch (e) {
      setError(e.message || 'Impossible de rejoindre ce salon.');
    } finally {
      setBusy(false);
    }
  }

  function handleLeave() {
    if (unsubRef.current) unsubRef.current();
    if (code) leaveRoom(code, playerId);
    setCode(null);
    setRoom(null);
    setShowAnimeSelect(false);
    setView('home');
  }

  const ALL_TYPE_IDS = ['personnage', 'titre', 'lieu', 'groupe', 'evenement', 'objet', 'pouvoir'];
  const ALL_DIFFICULTY_IDS = ['facile', 'moyen', 'difficile'];

  function openAnimeSelect() {
    setDraftAnimeIds(Object.keys(room.selectedAnimeIds || {}));
    const existingTypes = Object.keys(room.selectedTypes || {});
    const existingDifficulties = Object.keys(room.selectedDifficulties || {});
    setDraftTypes(existingTypes.length > 0 ? existingTypes : ALL_TYPE_IDS);
    setDraftDifficulties(existingDifficulties.length > 0 ? existingDifficulties : ALL_DIFFICULTY_IDS);
    setShowAnimeSelect(true);
  }

  async function confirmAnimeSelect() {
    await Promise.all([
      setSelectedAnime(code, draftAnimeIds),
      setSelectedTypes(code, draftTypes),
      setSelectedDifficulties(code, draftDifficulties),
    ]);
    setShowAnimeSelect(false);
  }

  if (!firebaseReady) {
    return (
      <div className="page-shell">
        <div className="main-col main-col--hub">
          <div className="hub">
            <div className="card" style={{ maxWidth: 560, margin: '60px auto' }}>
              <h2 className="panel-title" style={{ marginBottom: 12 }}>Configuration requise</h2>
              <p style={{ color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Le mode en ligne a besoin d'un projet Firebase gratuit pour synchroniser les
                salons en temps réel. Copie <code>.env.example</code> en <code>.env</code>,
                renseigne tes clés de projet Firebase, puis relance le site. Voir le README,
                section « Mode en ligne ».
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isHost = room && room.hostId === playerId;
  const isHome = !code && view === 'home';

  // Une fois tous les joueurs prêts sur l'écran de révélation, l'hôte fait
  // automatiquement passer le salon à l'étape des indices.
  useEffect(() => {
    if (!room || !isHost || room.phase !== 'reveal' || !room.game) return;
    const ids = Object.keys(room.players || {});
    const ready = room.game.ready || {};
    const allReady = ids.length > 0 && ids.every((id) => ready[id]);
    if (allReady) {
      startCluePhase(code, room);
    }
  }, [room, isHost, code]);

  return (
    <div className="page-shell">
      <div className="page-row">
        <div className="ad-rail">
          <AdSlot variant="rail" />
        </div>

        <div className={isHome ? 'main-col main-col--hub' : 'main-col'}>
        {!code && view === 'home' && (
          <HomeScreen onCreate={() => setView('create')} onJoin={() => setView('join')} />
        )}

        {!code && view === 'create' && (
          <div className="game-panel">
            <CreateRoomScreen
              defaultName={getSavedName()}
              onBack={() => setView('home')}
              onCreate={handleCreate}
              creating={busy}
              error={error}
            />
            <PageDivider label="OTAKU UNDERCOVER" />
          </div>
        )}

        {!code && view === 'join' && (
          <div className="game-panel">
            <JoinRoomScreen
              defaultName={getSavedName()}
              defaultCode={new URLSearchParams(window.location.search).get('salon') || ''}
              onBack={() => setView('home')}
              onJoin={handleJoin}
              joining={busy}
              error={error}
            />
            <PageDivider label="OTAKU UNDERCOVER" />
          </div>
        )}

        {code && !room && (
          <div className="game-panel">
            <div className="screen screen-centered">
              <p style={{ textAlign: 'center', color: 'var(--color-muted)' }}>Connexion au salon...</p>
            </div>
          </div>
        )}

        {code && room && (
          <div className="game-panel">
            {room.phase === 'lobby' && showAnimeSelect && (
              <AnimeSelectionScreen
                selectedIds={draftAnimeIds}
                setSelectedIds={setDraftAnimeIds}
                selectedTypes={draftTypes}
                setSelectedTypes={setDraftTypes}
                selectedDifficulties={draftDifficulties}
                setSelectedDifficulties={setDraftDifficulties}
                onBack={() => setShowAnimeSelect(false)}
                onNext={confirmAnimeSelect}
              />
            )}

            {room.phase === 'lobby' && !showAnimeSelect && (
              <LobbyScreen
                code={code}
                room={room}
                playerId={playerId}
                isHost={isHost}
                onOpenAnimeSelect={openAnimeSelect}
                onChangeSettings={(next) => setSettings(code, next)}
                onStart={() => startGame(code, room, ANIME_LIST)}
                onLeave={handleLeave}
              />
            )}

            {room.phase === 'reveal' && room.game && (
              <RoleRevealScreen room={room} playerId={playerId} onReady={() => markReady(code, playerId)} />
            )}

            {room.phase === 'clues' && room.game && (
              <ClueOrderScreen
                room={room}
                playerId={playerId}
                isHost={isHost}
                onSubmitClue={(text) => submitClue(code, room, playerId, text)}
                onForceSkip={() => forceSkipClueTurn(code, room)}
                onNewRound={() => startCluePhase(code, room)}
                onProceedVote={() => proceedToVote(code)}
              />
            )}

            {room.phase === 'vote' && room.game && (
              <VoteScreen
                room={room}
                playerId={playerId}
                isHost={isHost}
                onCastVote={(targetId) => castVote(code, playerId, targetId)}
                onFinalize={() => finalizeVote(code, room)}
              />
            )}

            {room.phase === 'elimination' && room.game && (
              <EliminationScreen
                room={room}
                playerId={playerId}
                isHost={isHost}
                onMrWhiteGuess={(correct) => submitMrWhiteGuess(code, room, correct)}
                onContinue={() => continueAfterElimination(code, room)}
              />
            )}

            {room.phase === 'gameover' && room.game && (
              <GameOverScreen
                room={room}
                isHost={isHost}
                onReplay={() => replayRoom(code, room, ANIME_LIST)}
                onBackToLobby={() => backToLobby(code)}
              />
            )}
            <PageDivider label="OTAKU UNDERCOVER" />
          </div>
        )}

        <div className="mobile-ad-banner">
          <AdSlot variant="banner" />
        </div>
      </div>

      <div className="ad-rail">
        <AdSlot variant="rail" />
      </div>
      </div>

      <footer className="site-footer">
        Otaku Undercover — crée un salon et joue en ligne avec tes amis.
      </footer>
    </div>
  );
}
