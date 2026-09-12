import React from 'react';

const CHAPTERS = [
  {
    id: 'undercover',
    number: '01',
    accent: 'pink',
    title: "DEVINE QUI EST L'INTRUS",
    desc: 'Gère un salon, invite tes potes avec un code, chacun sur son écran.',
    minPlayers: 3,
  },
  {
    id: 'rule',
    number: '02',
    accent: 'grey',
    title: 'DEVINE LA RÈGLE',
    desc: 'Chacun choisit une règle secrète. Propose des personnages ou tente de percer la règle des autres.',
    minPlayers: 2,
  },
  {
    id: 'team',
    number: '03',
    accent: 'purple',
    title: 'CONSTRUIS TA TEAM',
    desc: '20¥ de budget, des enchères à tour de rôle. Recrute 5 personnages, à 2 joueurs ou plus.',
    minPlayers: 2,
  },
];

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconKey() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="4" />
      <path d="M10.5 12.5L20 3" />
      <path d="M16 7l3 3" />
      <path d="M13 4l3 3" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 16 0v1" />
    </svg>
  );
}

function ChapterRow({ chapter, onCreate, onJoin }) {
  return (
    <div className={`chapter-row chapter-row--${chapter.accent}`}>
      <div className="chapter-row-thumb" aria-hidden="true" />
      <div className="chapter-row-body">
        <span className="chapter-row-number">Chapitre {chapter.number}</span>
        <h2 className="chapter-row-title">{chapter.title}</h2>
        <p className="chapter-row-desc">{chapter.desc}</p>
        <span className="chapter-row-meta">
          <IconUser /> min. {chapter.minPlayers} joueur{chapter.minPlayers > 1 ? 's' : ''}
        </span>
      </div>
      <div className="chapter-row-actions">
        <button type="button" className="btn btn-primary chapter-row-btn" onClick={() => onCreate(chapter.id)}>
          + Créer un salon
        </button>
        <button type="button" className="btn btn-outline chapter-row-btn" onClick={() => onJoin(chapter.id)}>
          <IconKey /> Rejoindre un salon
        </button>
      </div>
    </div>
  );
}

export default function HomeScreen({ onCreate, onJoin }) {
  return (
    <div className="hub-layout">
      <aside className="hub-sidebar">
        <div className="hub-sidebar-brand">OTAKUDLE</div>
        <nav className="hub-sidebar-nav">
          <span className="sidebar-link sidebar-link--active"><IconHome /> Accueil</span>
          <a className="sidebar-link" href="/regles.html"><IconBook /> Règles</a>
          <a className="sidebar-link" href="/a-propos.html"><IconInfo /> À propos</a>
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
              <p className="hub-banner-eyebrow">UN JEU. DES ANIMES. UNE SEULE <em>VÉRITÉ</em>.</p>
              <h1 className="hub-banner-title">CHAPITRES</h1>
              <p className="hub-banner-sub">
                Choisis un mode de jeu, crée un salon et invite tes amis à
                jouer avec toi, chacun sur son propre écran.
              </p>
            </div>
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
