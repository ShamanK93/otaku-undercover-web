import React from 'react';

// Écrans Créer / Rejoindre : « fiche d'agent ». À gauche, le polaroïd du
// chapitre choisi (même visuel que sur l'accueil) ; à droite, le dossier
// confidentiel qui contient le formulaire.
// chapter : mode choisi sur l'accueil, ou null (ex. arrivée via un lien d'invitation).

// Nom écrit sur le polaroïd quand le titre du chapitre est trop long.
const POLAROID_LABELS = {
  undercover: 'UNDERCOVER',
  drawing: 'DRAW UNDERCOVER',
};

function ChapterPolaroid({ chapter }) {
  if (!chapter) {
    return (
      <div className="ou-dossier-print ou-dossier-print--mystery" aria-hidden="true">
        <div className="ou-dossier-shot"><span className="ou-dossier-mystery">?</span></div>
        <div className="ou-dossier-note">SALON PRIVÉ</div>
        <span className="ou-dossier-peg" />
      </div>
    );
  }
  return (
    <div className="ou-dossier-print" aria-hidden="true">
      <div className="ou-dossier-shot">
        <img src={`/images/polaroid-${chapter.number}.jpg`} alt="" draggable="false" />
      </div>
      <div className="ou-dossier-note">{POLAROID_LABELS[chapter.id] || chapter.title}</div>
      <span className="ou-dossier-peg" />
    </div>
  );
}

export default function RoomFormCard({ chapter, kicker, title, subtitle, onBack, children }) {
  return (
    <div className="ou-dossier-screen">
      <button type="button" className="ou-back" onClick={onBack}>← Retour aux chapitres</button>

      <div className="ou-dossier-layout">
        <aside className="ou-dossier-side">
          <ChapterPolaroid chapter={chapter} />
          {chapter && (
            <div className="ou-dossier-mission">
              <span className="ou-dossier-mission-label">Mission</span>
              <span className="ou-dossier-mission-title">{chapter.title}</span>
              <p className="ou-dossier-mission-desc">{chapter.desc}</p>
              <span className="ou-dossier-mission-meta">min. {chapter.minPlayers} joueurs</span>
            </div>
          )}
        </aside>

        <article className="ou-dossier">
          <header className="ou-dossier-head">
            <span className="ou-dossier-ref">
              Dossier {chapter ? `N° ${chapter.number}` : 'privé'} · <b>Confidentiel</b>
            </span>
            <span className="ou-dossier-kanji" aria-hidden="true">機密</span>
          </header>
          <p className="ou-dossier-kicker">{kicker}</p>
          <h1 className="ou-dossier-title">{title}</h1>
          <p className="ou-dossier-sub">{subtitle}</p>
          <div className="ou-dossier-body">{children}</div>
        </article>
      </div>
    </div>
  );
}

// Carte d'agent remplie en direct pendant la saisie, avec son tampon de rôle.
export function AgentCard({ name, role, extra }) {
  const shown = name.trim();
  return (
    <div className={`ou-agent${shown ? ' ou-agent--ready' : ''}`}>
      <span className="ou-agent-avatar" aria-hidden="true">{shown ? shown.charAt(0).toUpperCase() : '?'}</span>
      <div className="ou-agent-info">
        <span className="ou-agent-label">Agent</span>
        <span className="ou-agent-name">{shown || '???'}</span>
        {extra && <span className="ou-agent-extra">{extra}</span>}
      </div>
      <span className="ou-agent-stamp" aria-hidden="true">{role}</span>
    </div>
  );
}

// Champ « nom de code » : grand, au pinceau, sur une ligne de signature.
export function CodenameField({ value, onChange, autoFocus }) {
  return (
    <label className="ou-codename">
      <span className="ou-codename-label">
        Ton nom de code <span className="ou-codename-hint">(ton pseudo)</span>
        <span className="ou-codename-count">{value.length}/20</span>
      </span>
      <input
        type="text"
        className="ou-codename-input"
        placeholder="Naruto77"
        value={value}
        maxLength={20}
        autoFocus={autoFocus}
        autoComplete="nickname"
        spellCheck="false"
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

// Code du salon en 5 cases. Un seul vrai champ (transparent, posé sur les
// cases) : clavier mobile, collage et effacement fonctionnent naturellement.
export function RoomCodeField({ value, onChange, autoFocus }) {
  const [focused, setFocused] = React.useState(false);
  const chars = value.split('');
  return (
    <label className="ou-roomcode">
      <span className="ou-codename-label">Code du salon</span>
      <span className="ou-roomcode-boxes">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`ou-roomcode-box${chars[i] ? ' ou-roomcode-box--filled' : ''}${focused && i === Math.min(chars.length, 4) ? ' ou-roomcode-box--active' : ''}`}
          >
            {chars[i] || ''}
          </span>
        ))}
        <input
          type="text"
          className="ou-roomcode-input"
          value={value}
          maxLength={5}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          aria-label="Code du salon (5 caractères)"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
        />
      </span>
    </label>
  );
}
