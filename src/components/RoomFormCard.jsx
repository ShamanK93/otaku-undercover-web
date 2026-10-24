import React from 'react';

// Carte de formulaire (Créer / Rejoindre) dans la DA des cartes chapitre.
// chapter : mode choisi sur l'accueil, ou null (ex. arrivée via un lien d'invitation).
export default function RoomFormCard({ chapter, eyebrow, title, subtitle, onBack, children }) {
  const accent = chapter ? chapter.accent : 'grey';

  return (
    <>
      <button type="button" className="ou-back" onClick={onBack}>← Retour aux chapitres</button>

      <section className="ou-hero ou-hero--compact">
        <p className="ou-hero-eyebrow">{eyebrow}</p>
        <h1 className="ou-hero-title">{title}</h1>
        <p className="ou-hero-sub">{subtitle}</p>
      </section>

      <article className={`ou-form-card ou-accent--${accent}`}>
        <span className="ou-chapter-tag">{chapter ? `Chapitre ${chapter.number}` : 'Salon privé'}</span>
        {chapter && (
          <div className="ou-form-banner" aria-hidden="true">
            <span className="ou-form-banner-title">{chapter.title}</span>
          </div>
        )}
        <div className="ou-form-body">{children}</div>
      </article>
    </>
  );
}
