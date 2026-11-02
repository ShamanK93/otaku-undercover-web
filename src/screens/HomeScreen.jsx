import React, { useMemo } from 'react';
import OuShell, { IconUser, IconPlus, IconKey } from '../components/OuShell';
import { CHAPTERS } from '../data/chapters';
import { ANIME_LIST } from '../data/animeDatabase';
import { CHARACTER_IMAGES } from '../data/wordImages';

// Les cartes chapitre affichent des portraits de personnages.

const PORTRAITS_PER_CARD = 3;
const POPULAR_ANIME_COUNT = 20; // licences du début de la liste : visages connus

// Tire au hasard des portraits tous différents, PORTRAITS_PER_CARD par carte.
function pickPortraits(cardCount) {
  const pool = ANIME_LIST.slice(0, POPULAR_ANIME_COUNT).flatMap((anime) =>
    Object.entries(CHARACTER_IMAGES[anime.id] || {}).map(([name, src]) => ({ name, src })),
  );
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Array.from({ length: cardCount }, (_, c) => pool.slice(c * PORTRAITS_PER_CARD, (c + 1) * PORTRAITS_PER_CARD));
}

function ChapterCard({ chapter, portraits, onCreate, onJoin }) {
  return (
    <article className={`ou-chapter ou-chapter--${chapter.accent}`}>
      <span className="ou-chapter-tag">Chapitre {chapter.number}</span>

      <div className="ou-chapter-fan" aria-hidden="true">
        {portraits.map((p) => (
          <img key={p.src} src={p.src} alt="" title={p.name} draggable="false" />
        ))}
      </div>

      <div className="ou-chapter-body">
        <h2 className="ou-chapter-title">{chapter.title}</h2>
        <p className="ou-chapter-desc">{chapter.desc}</p>
        <span className="ou-chapter-meta">
          <IconUser size={16} /> min. {chapter.minPlayers} joueur{chapter.minPlayers > 1 ? 's' : ''}
        </span>
      </div>

      <div className="ou-chapter-actions">
        <button type="button" className="ou-btn ou-btn--create" onClick={() => onCreate(chapter.id)}>
          <IconPlus /> Créer un salon
        </button>
        <button type="button" className="ou-btn ou-btn--join" onClick={() => onJoin(chapter.id)}>
          <IconKey /> Rejoindre un salon
        </button>
      </div>

      <span className="ou-chapter-emblem" aria-hidden="true">{chapter.emblem}</span>
    </article>
  );
}

export default function HomeScreen({ onCreate, onJoin }) {
  // Nouveaux portraits à chaque arrivée sur l'accueil.
  const portraits = useMemo(() => pickPortraits(CHAPTERS.length), []);

  return (
    <OuShell active="home">
      <section className="ou-hero">
        <p className="ou-hero-eyebrow">
          Un jeu. Des animes.<br />Une seule <em>vérité.</em>
        </p>
        <h1 className="ou-hero-title">CHAPITRES</h1>
        <p className="ou-hero-sub">
          Choisis un mode de jeu, crée un salon et démasque l'intrus parmi vous,
          chacun sur son propre écran.
        </p>
      </section>

      <div className="ou-chapters">
        {CHAPTERS.map((chapter, i) => (
          <ChapterCard key={chapter.id} chapter={chapter} portraits={portraits[i]} onCreate={onCreate} onJoin={onJoin} />
        ))}
      </div>
    </OuShell>
  );
}
