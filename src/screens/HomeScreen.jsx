import React from 'react';

const CHAPTERS = [
  {
    id: 'undercover',
    number: '01',
    accent: 'pink',
    symbol: '一',
    title: "DEVINE QUI EST L'INTRUS",
    desc: 'Gère un salon, invite tes potes avec un code, chacun sur son écran.',
    minPlayers: 3,
  },
  {
    id: 'rule',
    number: '02',
    accent: 'grey',
    symbol: '二',
    title: 'DEVINE LA RÈGLE',
    desc: 'Chacun choisit une règle secrète. Propose des personnages ou tente de percer la règle des autres.',
    minPlayers: 2,
  },
  {
    id: 'team',
    number: '03',
    accent: 'purple',
    symbol: '三',
    title: 'CONSTRUIS TA TEAM',
    desc: '20¥ de budget, des enchères à tour de rôle. Recrute 5 personnages, à 2 joueurs ou plus.',
    minPlayers: 2,
  },
];

function ChapterRow({ chapter, onCreate, onJoin }) {
  return (
    <div className={`chapter-row chapter-row--${chapter.accent}`}>
      <div className="chapter-row-thumb">
        <span className="chapter-row-symbol">{chapter.symbol}</span>
      </div>
      <div className="chapter-row-body">
        <span className="chapter-row-number">Chapitre {chapter.number}</span>
        <h2 className="chapter-row-title">{chapter.title}</h2>
        <p className="chapter-row-desc">{chapter.desc}</p>
        <span className="chapter-row-meta">👤 min. {chapter.minPlayers} joueur{chapter.minPlayers > 1 ? 's' : ''}</span>
      </div>
      <div className="chapter-row-actions">
        <button type="button" className="btn btn-primary chapter-row-btn" onClick={() => onCreate(chapter.id)}>
          + Créer un salon
        </button>
        <button type="button" className="btn btn-outline chapter-row-btn" onClick={() => onJoin(chapter.id)}>
          🔑 Rejoindre un salon
        </button>
      </div>
    </div>
  );
}

export default function HomeScreen({ onCreate, onJoin }) {
  return (
    <div className="hub-layout">
      <aside className="hub-sidebar">
        <div className="hub-sidebar-brand">
          OTAKU<br /><span className="hub-brand-accent">UNDERCOVER</span>
        </div>
        <nav className="hub-sidebar-nav">
          <span className="sidebar-link sidebar-link--active">🏠 Accueil</span>
          <a className="sidebar-link" href="/regles.html">📖 Règles</a>
          <a className="sidebar-link" href="/a-propos.html">ℹ️ À propos</a>
        </nav>
      </aside>

      <div className="hub-main">
        <header className="hub-topbar-v2">
          <span className="hub-kanji-badge">
            <span className="hub-kanji-badge-inner">狸</span>
          </span>
        </header>

        <section className="hub-banner manga-dots">
          <p className="hub-banner-eyebrow">UN JEU. DES ANIMES. UNE SEULE VÉRITÉ.</p>
          <h1 className="hub-banner-title">CHAPITRES</h1>
          <p className="hub-banner-sub">
            Choisis un mode de jeu, crée un salon et invite tes amis à jouer
            avec toi, chacun sur son propre écran.
          </p>
        </section>

        <div className="chapter-list">
          {CHAPTERS.map((chapter) => (
            <ChapterRow key={chapter.id} chapter={chapter} onCreate={onCreate} onJoin={onJoin} />
          ))}
        </div>
      </div>
    </div>
  );
}
