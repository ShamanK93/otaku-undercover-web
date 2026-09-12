import React from 'react';

const CHAPTERS = [
  {
    id: 'undercover',
    number: '01',
    accent: 'pink',
    icon: '🕵️',
    title: "DEVINE QUI EST L'INTRUS",
    desc: 'Gère un salon, invite tes potes avec un code, chacun sur son écran.',
    minPlayers: 3,
  },
  {
    id: 'rule',
    number: '02',
    accent: 'grey',
    icon: '❓',
    title: 'DEVINE LA RÈGLE',
    desc: 'Chacun choisit une règle secrète. Propose des personnages ou tente de percer la règle des autres.',
    minPlayers: 2,
  },
  {
    id: 'team',
    number: '03',
    accent: 'purple',
    icon: '⚔️',
    title: 'CONSTRUIS TA TEAM',
    desc: '20¥ de budget, des enchères à tour de rôle. Recrute 5 personnages, à 2 joueurs ou plus.',
    minPlayers: 2,
  },
];

function ChapterRow({ chapter, onCreate, onJoin }) {
  return (
    <div className={`chapter-row chapter-row--${chapter.accent}`}>
      <div className="chapter-row-thumb">
        <span className="chapter-row-icon">{chapter.icon}</span>
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

        <div className="hub-banner-wrap">
          <section className="hub-banner manga-dots">
            <div className="hub-banner-text">
              <p className="hub-banner-eyebrow">UN JEU. DES ANIMES. UNE SEULE VÉRITÉ.</p>
              <h1 className="hub-banner-title">CHAPITRES</h1>
              <p className="hub-banner-sub">
                Choisis un mode de jeu, crée un salon et invite tes amis à
                jouer avec toi, chacun sur son propre écran.
              </p>
            </div>
            <svg className="hub-banner-figure" viewBox="0 0 200 240" aria-hidden="true">
              <ellipse cx="100" cy="228" rx="70" ry="10" fill="#000" opacity="0.25" />
              <path d="M40 240 L40 150 C40 90 65 55 100 55 C135 55 160 90 160 150 L160 240 Z" fill="#22202A" />
              <path d="M55 240 L55 160 C55 110 75 80 100 80 C125 80 145 110 145 160 L145 240 Z" fill="#E85D82" />
              <circle cx="100" cy="60" r="42" fill="#F5E4D7" />
              <path d="M58 55 C58 15 142 15 142 55 C142 40 120 30 100 30 C80 30 58 40 58 55 Z" fill="#22202A" />
              <rect x="60" y="55" width="80" height="18" rx="4" fill="#22202A" />
              <circle cx="82" cy="63" r="4" fill="#F5E4D7" />
              <circle cx="118" cy="63" r="4" fill="#F5E4D7" />
            </svg>
          </section>
          <div className="hub-side-strip" aria-hidden="true">
            <span>正体を暴け・秘密を守れ</span>
          </div>
        </div>

        <div className="chapter-list">
          {CHAPTERS.map((chapter) => (
            <ChapterRow key={chapter.id} chapter={chapter} onCreate={onCreate} onJoin={onJoin} />
          ))}
        </div>
      </div>
    </div>
  );
}
