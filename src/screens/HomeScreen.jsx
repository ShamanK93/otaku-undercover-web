import React from 'react';
import logo from '../assets/logo.png';

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

      <section className="chapter-box manga-dots">
        <span className="chapter-label">Chapitre 01</span>
        <h1 className="hub-hero-title">DEVINE QUI EST L'INTRUS</h1>
        <p className="hub-hero-sub">
          Crée un salon, invite tes potes avec un code, chacun sur son écran.
        </p>
        <span className="chapter-fx">!?</span>
      </section>

      <div className="hub-actions">
        <button type="button" className="btn btn-primary hub-action-btn" onClick={onCreate}>
          + Créer un salon
        </button>
        <button type="button" className="btn btn-outline hub-action-btn" onClick={onJoin}>
          🔑 Rejoindre un salon
        </button>
      </div>

      <div className="page-divider">
        <span>ページ 01</span>
      </div>
    </div>
  );
}
