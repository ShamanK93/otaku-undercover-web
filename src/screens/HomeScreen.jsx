import React from 'react';

export default function HomeScreen({ onCreate, onJoin }) {
  return (
    <div className="hub">
      <header className="hub-topbar">
        <div className="hub-brand-text">
          OTAKU<span className="hub-brand-accent">UNDERCOVER</span>
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
        <button type="button" className="btn btn-primary hub-action-btn" onClick={() => onCreate('undercover')}>
          + Créer un salon
        </button>
        <button type="button" className="btn btn-outline hub-action-btn" onClick={() => onJoin('undercover')}>
          🔑 Rejoindre un salon
        </button>
      </div>

      <div className="page-divider">
        <span>ページ 01</span>
      </div>

      <section className="chapter-box manga-dots" style={{ marginTop: 28 }}>
        <span className="chapter-label">Chapitre 02</span>
        <h1 className="hub-hero-title">DEVINE LA RÈGLE</h1>
        <p className="hub-hero-sub">
          Chacun choisit une règle secrète. Propose des personnages ou tente
          de percer la règle des autres.
        </p>
        <span className="chapter-fx">?!</span>
      </section>

      <div className="hub-actions">
        <button type="button" className="btn btn-primary hub-action-btn" onClick={() => onCreate('rule')}>
          + Créer un salon
        </button>
        <button type="button" className="btn btn-outline hub-action-btn" onClick={() => onJoin('rule')}>
          🔑 Rejoindre un salon
        </button>
      </div>

      <div className="page-divider">
        <span>ページ 02</span>
      </div>
    </div>
  );
}
