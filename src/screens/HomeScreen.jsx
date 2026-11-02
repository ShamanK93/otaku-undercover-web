import React, { useMemo, useState } from 'react';
import OuShell, { IconUser, IconPlus, IconKey } from '../components/OuShell';
import PolaroidLineCarousel from '../components/ui/PolaroidLineCarousel';
import { CHAPTERS } from '../data/chapters';

// L'accueil présente les chapitres comme des polaroïds suspendus à un fil :
// le polaroïd au centre est le chapitre actif, ses boutons sont juste dessous.
// Visuels dans public/images/polaroid-0X.jpg (photos portrait 3:4 découpées et
// redressées depuis MyDesign/appareilphoto3.png).

// Texte écrit sur le polaroïd quand le nom du chapitre est trop long pour y tenir.
const POLAROID_LABELS = {
  undercover: 'UNDERCOVER',
  drawing: 'DRAW UNDERCOVER',
};

export default function HomeScreen({ onCreate, onJoin }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = useMemo(
    () => CHAPTERS.map((chapter) => ({
      image: `/images/polaroid-${chapter.number}.jpg`,
      title: chapter.title,
      label: POLAROID_LABELS[chapter.id],
      caption: chapter.desc,
      alt: '',
    })),
    [],
  );
  const chapter = CHAPTERS[activeIndex] || CHAPTERS[0];

  return (
    <OuShell active="home">
      <section className="ou-polaroids" aria-label="Modes de jeu">
        <PolaroidLineCarousel
          slides={slides}
          height="clamp(590px, 70vh, 690px)"
          cardWidth={260}
          shotAspect={0.75}
          sag={40}
          autoplay={5500}
          string="var(--ou-red)"
          background="transparent"
          ink="#ffffff"
          onChange={setActiveIndex}
          ariaLabel="Chapitres du jeu"
        />

        <div className="ou-polaroid-actions">
          <div className="ou-polaroid-meta">
            <span className="ou-polaroid-tag">Chapitre {chapter.number}</span>
            <span className="ou-chapter-meta">
              <IconUser size={16} /> min. {chapter.minPlayers} joueur{chapter.minPlayers > 1 ? 's' : ''}
            </span>
          </div>
          <div className="ou-polaroid-buttons">
            <button type="button" className="ou-btn ou-btn--create" onClick={() => onCreate(chapter.id)}>
              <IconPlus /> Créer un salon
            </button>
            <button type="button" className="ou-btn ou-btn--join" onClick={() => onJoin(chapter.id)}>
              <IconKey /> Rejoindre un salon
            </button>
          </div>
        </div>
      </section>
    </OuShell>
  );
}
