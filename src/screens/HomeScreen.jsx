import React from 'react';
import logo from '../assets/logo.png';
import mascot from '../assets/mascot.png';

export default function HomeScreen({ onCreate, onJoin }) {
  return (
    <div className="hub">
      <header className="hub-topbar">
        <div className="hub-brand">
          <img src={logo} alt="Otaku Undercover" className="hub-brand-logo" />
        </div>
        <span className="hub-kanji-badge">
          <span className="hub-kanji-badge-inner">狸</span>
        </span>
      </header>

      <section className="hub-hero manga-dots manga-speedlines">
        <div className="hub-hero-mascot-col">
          <img src={mascot} alt="" className="hub-hero-mascot-big" />
          <div className="manga-speech-bubble">
            <span>On y va ?!</span>
          </div>
        </div>

        <div className="chapter-box hub-hero-text">
          <span className="chapter-label">Chapitre 01</span>
          <h1 className="hub-hero-title">DEVINE QUI<br />EST L'INTRUS</h1>
          <p className="hub-hero-sub">
            Le party game façon Undercover, version anime, en ligne. Crée un salon, envoie le
            code ou le lien à tes potes, et démasquez les undercovers avant qu'ils ne prennent
            le dessus — chacun sur son propre écran.
          </p>
          <span className="chapter-fx">!?</span>
        </div>
      </section>

      <section className="hub-grid">
        <button type="button" className="mode-tile mode-tile--primary" onClick={onCreate}>
          <span className="mode-tile-icon">➕</span>
          <span className="mode-tile-title">Créer un salon</span>
          <span className="mode-tile-desc">Deviens l'hôte, choisis les animés et invite tes amis avec un code.</span>
        </button>
        <button type="button" className="mode-tile" onClick={onJoin}>
          <span className="mode-tile-icon">🔑</span>
          <span className="mode-tile-title">Rejoindre un salon</span>
          <span className="mode-tile-desc">Entre le code (ou clique le lien) que ton hôte t'a envoyé.</span>
        </button>
      </section>

      <div className="page-divider">
        <span>ページ 01</span>
      </div>
    </div>
  );
}
