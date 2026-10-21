// Modes de jeu affichés sur l'accueil et rappelés sur les écrans Créer / Rejoindre.
export const CHAPTERS = [
  {
    id: 'undercover',
    number: '01',
    accent: 'red',
    title: "DEVINE QUI EST L'INTRUS",
    desc: 'Gère un salon, invite tes potes avec un code, chacun sur son écran.',
    minPlayers: 3,
    emblem: '嘘',
  },
  {
    id: 'rule',
    number: '02',
    accent: 'grey',
    title: 'DEVINE LA RÈGLE',
    desc: 'Chacun choisit une règle secrète. Propose des personnages ou tente de percer la règle des autres.',
    minPlayers: 2,
    emblem: '謎',
  },
  {
    id: 'team',
    number: '03',
    accent: 'purple',
    title: 'CONSTRUIS TA TEAM',
    desc: '20¥ de budget, des enchères à tour de rôle. Recrute 5 personnages, à 2 joueurs ou plus.',
    minPlayers: 2,
    emblem: '呪術',
  },
  {
    id: 'drawing',
    number: '04',
    accent: 'gold',
    title: "L'IMPOSTEUR AU PINCEAU",
    desc: "Dessine ton mot sans le trahir : en duel d'ardoises ou en fresque commune, trait par trait. Démasque l'intrus au vote !",
    minPlayers: 3,
    emblem: '絵',
  },
];

export function getChapter(id) {
  return CHAPTERS.find((chapter) => chapter.id === id) || null;
}
