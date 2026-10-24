import React from 'react';
import OuShell, { IconUser, IconPlus, IconKey } from '../components/OuShell';
import { CHAPTERS } from '../data/chapters';

// Illustrations dans public/images/ : fond.jpg (fond d'écran), chapitre-01.jpg,
// chapitre-02.jpg, chapitre-03.jpg (vignettes) et sidebar.jpg (optionnelle).

function ChapterCard({ chapter, onCreate, onJoin }) {
  return (
    <article className={`ou-chapter ou-chapter--${chapter.accent}`}>
      <span className="ou-chapter-tag">Chapitre {chapter.number}</span>

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
        {CHAPTERS.map((chapter) => (
          <ChapterCard key={chapter.id} chapter={chapter} onCreate={onCreate} onJoin={onJoin} />
        ))}
      </div>
    </OuShell>
  );
}
