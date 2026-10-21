import React from 'react';
import { getSavedName } from '../utils/room';

// Mise en page commune (DA MyDesign) : sidebar manga + fond d'écran + barre du haut.
// Les pages statiques (public/regles.html, public/a-propos.html) reprennent le même balisage.

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3z" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
export function IconUser({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 16 0v1" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}
export function IconKey() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 2a6.5 6.5 0 0 0-6.2 8.5L2 17.8V22h4.2v-2.2h2.2v-2.2h2.2l1.3-1.3A6.5 6.5 0 1 0 15.5 2zm1.8 6.6a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8z" />
    </svg>
  );
}
function IconTorii() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 3.5c3.5 1 7 1.3 11 1.3s7.5-.3 11-1.3V6c-1 .3-2 .5-3 .6V8h2v2h-2v11h-2.2V10H6.2v11H4V10H2V8h2V6.6c-1-.1-2-.3-3-.6zM6.2 8h11.6V6.8c-1.9.2-3.8.2-5.8.2s-3.9 0-5.8-.2z" />
    </svg>
  );
}

const NAV = [
  { id: 'home', label: 'Accueil', icon: <IconHome />, href: '/' },
  { id: 'rules', label: 'Règles', icon: <IconBook />, href: '/regles.html' },
  { id: 'missions', label: 'Missions', icon: <IconTarget />, soon: true },
  { id: 'profile', label: 'Profil', icon: <IconUser />, soon: true },
  { id: 'ranking', label: 'Classement', icon: <IconTrophy />, soon: true },
  { id: 'about', label: 'À propos', icon: <IconInfo />, href: '/a-propos.html' },
];

function SidebarLink({ item, active, onHome }) {
  const content = (
    <>
      <span className="ou-nav-icon">{item.icon}</span>
      <span>{item.label}</span>
      {item.soon && <span className="ou-nav-soon">Bientôt</span>}
    </>
  );
  if (item.soon) return <span className="ou-nav-link ou-nav-link--soon" aria-disabled="true">{content}</span>;
  const className = active ? 'ou-nav-link ou-nav-link--active' : 'ou-nav-link';
  const handleClick = item.id === 'home' && onHome
    ? (e) => { e.preventDefault(); onHome(); }
    : undefined;
  return (
    <a className={className} href={item.href} aria-current={active ? 'page' : undefined} onClick={handleClick}>
      {content}
    </a>
  );
}

// active : 'home' | 'rules' | 'about' ; onHome : retour à l'accueil sans recharger la page.
export default function OuShell({ active = 'home', onHome, children }) {
  const name = getSavedName() || 'Invité';

  return (
    <div className="ou-home">
      <aside className="ou-sidebar">
        <a className="ou-logo" href="/" onClick={onHome ? (e) => { e.preventDefault(); onHome(); } : undefined}>
          <div className="ou-logo-text">
            <span className="ou-logo-otaku">OTAKU</span>
            <span className="ou-logo-under">UNDERCOVER</span>
          </div>
          <span className="ou-logo-kanji" aria-hidden="true">オタク裏切り者</span>
        </a>

        <nav className="ou-nav">
          {NAV.map((item) => (
            <SidebarLink key={item.id} item={item} active={item.id === active} onHome={onHome} />
          ))}
        </nav>

        <div className="ou-sidebar-art" aria-hidden="true">
          <span className="ou-sidebar-art-kanji">君は誰だ？</span>
        </div>
      </aside>

      <main className="ou-main">
        <div className="ou-hero-bg" aria-hidden="true" />
        <span className="ou-side-kanji" aria-hidden="true">仲間を信じろ</span>

        <header className="ou-topbar">
          <div className="ou-user">
            <span className="ou-user-avatar">{name.charAt(0).toUpperCase()}</span>
            <span className="ou-user-name">{name}</span>
          </div>
          <span className="ou-topbar-torii" aria-hidden="true"><IconTorii /></span>
        </header>

        {children}
      </main>
    </div>
  );
}
