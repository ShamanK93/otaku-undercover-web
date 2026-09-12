// Construit src/data/characterDatabase.js à partir des duos déjà présents
// dans animeDatabase.js : extrait les noms de personnages uniques par
// animé (en ignorant les duos de type lieu/objet/groupe/évenement/pouvoir,
// qui ne sont pas des personnages jouables). Pas de valeur de puissance :
// ce sont les joueurs eux-mêmes qui jugent quelle équipe est la meilleure.
//
// Usage : node scripts/build-character-database.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ANIME_LIST } from '../src/data/animeDatabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../src/data/characterDatabase.js');

const enriched = ANIME_LIST.map((anime) => {
  const seen = new Set();
  const names = [];
  anime.pairs.forEach((pair) => {
    const type = pair.type || 'personnage';
    if (type !== 'personnage') return;
    [pair.civil, pair.undercover].forEach((name) => {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    });
  });

  return { id: anime.id, title: anime.title, characters: names };
}).filter((a) => a.characters.length >= 3);

function serializeAnime(a) {
  const lines = a.characters.map((name) => `      ${JSON.stringify(name)},`).join('\n');
  return `  {\n    id: ${JSON.stringify(a.id)},\n    title: ${JSON.stringify(a.title)},\n    characters: [\n${lines}\n    ],\n  },`;
}

const header = `// Base de personnages individuels utilisée pour le Chapitre 03 « Construis
// ta team ». Générée à partir des duos de animeDatabase.js. Pas de valeur de
// force : ce sont les joueurs qui jugent eux-mêmes quelle équipe est la
// meilleure, en fin de partie.
export const CHARACTER_DATABASE = [
`;
const body = enriched.map(serializeAnime).join('\n');
const footer = `\n];\n`;

fs.writeFileSync(OUT_PATH, header + body + footer, 'utf8');

const totalChars = enriched.reduce((sum, a) => sum + a.characters.length, 0);
console.log(`OK : ${enriched.length} animés, ${totalChars} personnages écrits dans ${OUT_PATH}`);
