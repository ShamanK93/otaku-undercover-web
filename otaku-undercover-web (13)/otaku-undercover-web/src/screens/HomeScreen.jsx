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

      <p className="hub-intro">
        Otaku Undercover rassemble plusieurs party games gratuits à jouer en
        ligne avec vos amis, sans installation : créez un salon, partagez le
        code ou le lien, et lancez la partie directement depuis votre
        navigateur. Trois modes de jeu sont disponibles pour l'instant,
        chacun avec ses propres règles.
      </p>

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

      <section className="chapter-box manga-dots" style={{ marginTop: 28 }}>
        <span className="chapter-label">Chapitre 03</span>
        <h1 className="hub-hero-title">CONSTRUIS TA TEAM</h1>
        <p className="hub-hero-sub">
          20€ de budget, des enchères à tour de rôle. Recrute 5 personnages
          plus forts que ceux de ton adversaire. Se joue à 2.
        </p>
        <span className="chapter-fx">¥!</span>
      </section>

      <div className="hub-actions">
        <button type="button" className="btn btn-primary hub-action-btn" onClick={() => onCreate('team')}>
          + Créer un salon
        </button>
        <button type="button" className="btn btn-outline hub-action-btn" onClick={() => onJoin('team')}>
          🔑 Rejoindre un salon
        </button>
      </div>

      <div className="page-divider">
        <span>ページ 03</span>
      </div>
    </div>
  );
}
