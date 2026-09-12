// Script à usage unique : lit src/data/animeDatabase.js, ajoute un champ
// `difficulty` (facile/moyen/difficile) et `type` (personnage/titre/lieu/
// groupe/evenement/objet/pouvoir) à chaque paire existante, corrige le type
// des paires qui sont en fait des techniques/pouvoirs pour les animés les
// plus connus, et ajoute quelques paires lieu/objet/evenement/groupe/pouvoir
// pour ces mêmes animés. Réécrit ensuite le fichier.
//
// Usage : node scripts/enrich-anime-data.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ANIME_LIST } from '../src/data/animeDatabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../src/data/animeDatabase.js');

function difficultyForIndex(index, total) {
  if (total <= 1) return 'moyen';
  const ratio = index / (total - 1);
  if (ratio < 0.34) return 'facile';
  if (ratio < 0.7) return 'moyen';
  return 'difficile';
}

// civil name -> { type, difficulty } — corrige les paires "technique" mal
// classées par défaut comme personnage, pour les animés les plus connus.
const TYPE_OVERRIDES = {
  naruto: {
    'Rasengan': { type: 'pouvoir', difficulty: 'moyen' },
    'Amaterasu': { type: 'pouvoir', difficulty: 'difficile' },
    'Rasenshuriken': { type: 'pouvoir', difficulty: 'difficile' },
    'Katon : Boule de feu suprême': { type: 'pouvoir', difficulty: 'facile' },
    'Chidori': { type: 'pouvoir', difficulty: 'moyen' },
    'Kamui': { type: 'pouvoir', difficulty: 'difficile' },
  },
  'one-piece': {
    'Gomu Gomu no Mi': { type: 'objet', difficulty: 'facile' },
    'Mera Mera no Mi': { type: 'objet', difficulty: 'moyen' },
    'Yami Yami no Mi': { type: 'objet', difficulty: 'moyen' },
    'Hie Hie no Mi': { type: 'objet', difficulty: 'moyen' },
  },
  'dragon-ball': {
    'Kamehameha': { type: 'pouvoir', difficulty: 'facile' },
    'Genkidama': { type: 'pouvoir', difficulty: 'moyen' },
    'Super Saiyan': { type: 'pouvoir', difficulty: 'facile' },
  },
  bleach: {
    'Getsuga Tensho': { type: 'pouvoir', difficulty: 'moyen' },
    'Bankai': { type: 'pouvoir', difficulty: 'facile' },
  },
};

// Paires supplémentaires (lieux, objets, événements, groupes, pouvoirs) pour
// les animés les plus connus uniquement.
const EXTRA_PAIRS = {
  naruto: [
    { civil: 'Konoha', undercover: 'Kirigakure', type: 'lieu', difficulty: 'facile' },
    { civil: 'Sunagakure', undercover: 'Iwagakure', type: 'lieu', difficulty: 'moyen' },
    { civil: "Examen Chunin", undercover: '4ème Grande Guerre Ninja', type: 'evenement', difficulty: 'moyen' },
    { civil: 'Akatsuki', undercover: 'Team Taka', type: 'groupe', difficulty: 'moyen' },
    { civil: 'Sharingan', undercover: 'Byakugan', type: 'pouvoir', difficulty: 'facile' },
    { civil: 'Sept Épéistes de la Brume', undercover: 'Douze Gardiens Ninja', type: 'groupe', difficulty: 'difficile' },
  ],
  'one-piece': [
    { civil: 'Grand Line', undercover: 'Nouveau Monde', type: 'lieu', difficulty: 'facile' },
    { civil: 'Water Seven', undercover: 'Alabasta', type: 'lieu', difficulty: 'moyen' },
    { civil: 'Guerre de Marineford', undercover: "Incident de God Valley", type: 'evenement', difficulty: 'moyen' },
    { civil: 'Équipage du Chapeau de Paille', undercover: 'Grande Flotte de Luffy', type: 'groupe', difficulty: 'moyen' },
    { civil: 'Marine', undercover: 'Cipher Pol', type: 'groupe', difficulty: 'moyen' },
  ],
  'attack-on-titan': [
    { civil: 'Mur Maria', undercover: 'Mur Sina', type: 'lieu', difficulty: 'facile' },
    { civil: 'Bataille de Trost', undercover: 'Chute de Shiganshina', type: 'evenement', difficulty: 'moyen' },
    { civil: 'Bataillon d\'exploration', undercover: 'Police Militaire', type: 'groupe', difficulty: 'facile' },
    { civil: 'Titan Colossal', undercover: 'Titan Cuirassé', type: 'pouvoir', difficulty: 'facile' },
  ],
  'demon-slayer': [
    { civil: 'Pourfendeurs de démons', undercover: 'Douze Lunes Démoniaques', type: 'groupe', difficulty: 'facile' },
    { civil: 'Respiration de l\'Eau', undercover: 'Respiration du Feu', type: 'pouvoir', difficulty: 'facile' },
    { civil: 'Village des forgerons', undercover: 'Manoir des Papillons', type: 'lieu', difficulty: 'moyen' },
    { civil: 'Examen Final Sélectif', undercover: 'Entraînement de l\'Enfer', type: 'evenement', difficulty: 'moyen' },
  ],
  'jujutsu-kaisen': [
    { civil: 'École Jujutsu de Tokyo', undercover: 'École Jujutsu de Kyoto', type: 'lieu', difficulty: 'facile' },
    { civil: 'Domain Expansion', undercover: 'Technique Inversée', type: 'pouvoir', difficulty: 'moyen' },
    { civil: 'Match amical Tokyo-Kyoto', undercover: 'Incident de Shibuya', type: 'evenement', difficulty: 'moyen' },
  ],
  'my-hero-academia': [
    { civil: 'Yuei', undercover: 'Shiketsu', type: 'lieu', difficulty: 'facile' },
    { civil: 'Ligue des Vilains', undercover: 'Meta Liberation Army', type: 'groupe', difficulty: 'moyen' },
    { civil: 'Examen d\'entrée', undercover: 'Festival Sportif', type: 'evenement', difficulty: 'facile' },
    { civil: 'One For All', undercover: 'All For One', type: 'pouvoir', difficulty: 'facile' },
  ],
  'dragon-ball': [
    { civil: 'Namek', undercover: 'Terre', type: 'lieu', difficulty: 'facile' },
    { civil: 'Tournoi du Pouvoir', undercover: 'Cell Games', type: 'evenement', difficulty: 'moyen' },
    { civil: 'Guerriers de l\'Espace', undercover: 'Z Fighters', type: 'groupe', difficulty: 'moyen' },
  ],
  bleach: [
    { civil: 'Seireitei', undercover: 'Hueco Mundo', type: 'lieu', difficulty: 'facile' },
    { civil: 'Treize Divisions', undercover: 'Espada', type: 'groupe', difficulty: 'moyen' },
    { civil: 'Guerre du Sang de Mille Ans', undercover: 'Sauvetage de Rukia', type: 'evenement', difficulty: 'moyen' },
  ],
  'fullmetal-alchemist': [
    { civil: 'Amestris', undercover: 'Xing', type: 'lieu', difficulty: 'facile' },
    { civil: 'Pierre philosophale', undercover: 'Porte de la Vérité', type: 'objet', difficulty: 'moyen' },
    { civil: 'Homonculus', undercover: 'État-Major Militaire', type: 'groupe', difficulty: 'moyen' },
  ],
  'death-note': [
    { civil: 'Death Note', undercover: 'Yeux de Shinigami', type: 'objet', difficulty: 'facile' },
    { civil: 'Task Force Japonaise', undercover: 'SPK', type: 'groupe', difficulty: 'moyen' },
  ],
  'hunter-x-hunter': [
    { civil: 'Examen Hunter', undercover: 'Arène céleste', type: 'evenement', difficulty: 'moyen' },
    { civil: 'Brigade Fantôme', undercover: 'Association des Hunters', type: 'groupe', difficulty: 'moyen' },
    { civil: 'Nen', undercover: 'Hatsu', type: 'pouvoir', difficulty: 'difficile' },
  ],
  'one-punch-man': [
    { civil: 'Association des Héros', undercover: 'Association des Monstres', type: 'groupe', difficulty: 'facile' },
    { civil: 'Rang S', undercover: 'Rang C', type: 'pouvoir', difficulty: 'facile' },
  ],
  'tokyo-ghoul': [
    { civil: 'CCG', undercover: 'Aogiri Tree', type: 'groupe', difficulty: 'moyen' },
    { civil: 'Café Anteiku', undercover: 'Quartier du 20ème arrondissement', type: 'lieu', difficulty: 'moyen' },
  ],
  'fairy-tail': [
    { civil: 'Guilde Fairy Tail', undercover: 'Guilde Sabertooth', type: 'groupe', difficulty: 'facile' },
    { civil: 'Jeux Magiques', undercover: 'Bataille de Fairy Tail', type: 'evenement', difficulty: 'moyen' },
  ],
  'chainsaw-man': [
    { civil: 'Bureau de Sécurité Publique', undercover: 'Église de la Tronçonneuse', type: 'groupe', difficulty: 'moyen' },
    { civil: 'Contrat démoniaque', undercover: 'Fusion Homme-Démon', type: 'pouvoir', difficulty: 'moyen' },
  ],
  'spy-x-family': [
    { civil: 'Opération Strix', undercover: 'Mission Eden', type: 'evenement', difficulty: 'moyen' },
    { civil: 'Famille Forger', undercover: 'WISE', type: 'groupe', difficulty: 'facile' },
  ],
};

const enriched = ANIME_LIST.map((anime) => {
  const overrides = TYPE_OVERRIDES[anime.id] || {};
  const total = anime.pairs.length;

  const basePairs = anime.pairs.map((pair, index) => {
    const override = overrides[pair.civil];
    return {
      civil: pair.civil,
      undercover: pair.undercover,
      type: (override && override.type) || 'personnage',
      difficulty: (override && override.difficulty) || difficultyForIndex(index, total),
    };
  });

  const extra = EXTRA_PAIRS[anime.id] || [];

  return { ...anime, pairs: [...basePairs, ...extra] };
});

function serializePair(p) {
  return `      { civil: ${JSON.stringify(p.civil)}, undercover: ${JSON.stringify(p.undercover)}, type: ${JSON.stringify(p.type)}, difficulty: ${JSON.stringify(p.difficulty)} },`;
}

function serializeAnime(a) {
  const lines = a.pairs.map(serializePair).join('\n');
  return `  {\n    id: ${JSON.stringify(a.id)},\n    title: ${JSON.stringify(a.title)},\n    pairs: [\n${lines}\n    ],\n  },`;
}

const header = `// Base de données des animés : chaque paire a un type (personnage, titre,
// lieu, groupe, evenement, objet, pouvoir) et une difficulté (facile, moyen,
// difficile) utilisés pour filtrer les duos lors de la création d'une partie.
export const ANIME_LIST = [
`;

const body = enriched.map(serializeAnime).join('\n');
const footer = `\n];\n`;

fs.writeFileSync(OUT_PATH, header + body + footer, 'utf8');

const totalPairs = enriched.reduce((sum, a) => sum + a.pairs.length, 0);
console.log(`OK : ${enriched.length} animés, ${totalPairs} paires écrites dans ${OUT_PATH}`);
