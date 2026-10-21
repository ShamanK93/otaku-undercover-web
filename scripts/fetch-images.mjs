// Télécharge une affiche par animé et une image par personnage depuis l'API
// publique de Kitsu (kitsu.io) — complétée par la page « Characters » de
// MyAnimeList pour les séries récentes que Kitsu ne renseigne plus — puis génère src/data/wordImages.js et un
// rapport scripts/images-report.md listant les correspondances douteuses
// ou manquantes à vérifier à la main.
//
// Les images sont converties en WebP (léger) et enregistrées dans
// public/images/animes/ et public/images/persos/<animeId>/. Une image déjà
// présente n'est pas re-téléchargée : on peut relancer le script sans tout
// refaire ; elle l'est si la correspondance a changé (voir images-sources.json).
// (Les versions redimensionnées de Kitsu sont abîmées, on part donc
// toujours de l'original.)
//
// Pour corriger une mauvaise image : ajoute une entrée dans OVERRIDES
// ci-dessous (nom exact Kitsu à utiliser), supprime le fichier, relance.
//
// Usage : node scripts/fetch-images.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import sharp from 'sharp';
import { ANIME_LIST } from '../src/data/animeDatabase.js';
import { CHARACTER_DATABASE } from '../src/data/characterDatabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUT_MANIFEST = path.join(ROOT, 'src/data/wordImages.js');
const OUT_REPORT = path.join(__dirname, 'images-report.md');
// Fichier -> URL d'origine, pour re-télécharger quand la correspondance change.
const SOURCES_PATH = path.join(__dirname, 'images-sources.json');
const sources = fs.existsSync(SOURCES_PATH) ? JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf8')) : {};

const API = 'https://kitsu.io/api/edge';
const MAX_ENTRIES = 3; // nombre d'œuvres Kitsu explorées par animé (suites, films...)
const MAX_PAGES = 15; // 20 personnages par page

// Recherche Kitsu à utiliser quand le titre affiché ne donne pas le bon
// résultat.
const SEARCH_OVERRIDES = {
  'dragon-ball': 'Dragon Ball Z',
  'jojo': "JoJo's Bizarre Adventure",
  'evangelion': 'Neon Genesis Evangelion',
  'tensei-slime': 'Tensei shitara Slime Datta Ken',
  'dungeon-meshi': 'Dungeon Meshi',
  'shield-hero': 'Tate no Yuusha no Nariagari',
  'parasyte': 'Kiseijuu',
  'promised-neverland': 'Yakusoku no Neverland',
  'frieren': 'Sousou no Frieren',
  'your-lie-in-april': 'Shigatsu wa Kimi no Uso',
  'seven-deadly-sins': 'Nanatsu no Taizai',
  'fire-force': 'Enen no Shouboutai',
  'kaguya-sama': 'Kaguya-sama wa Kokurasetai',
  'classroom-of-the-elite': 'Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e',
};

// Œuvre Kitsu imposée quand la recherche texte se trompe (« Kingdom »
// renvoie ThunderCats...).
const KITSU_IDS = {
  kingdom: ['6648', '7680'],
};

// Nom de personnage (tel qu'écrit dans nos données) -> nom Kitsu à chercher.
// Clé : "<animeId>|<nom>".
const OVERRIDES = {
  'dragon-ball|Freezer': 'Frieza',
  'dragon-ball|C-17': 'Android 17',
  'dragon-ball|C-18': 'Android 18',
  'dragon-ball|Trunks du futur': 'Trunks',
  'sword-art-online|Yuuki': 'Yuuki Konno',
  'tokyo-ghoul|Eto Yoshimura': 'Eto',
  'one-piece|Barbe Blanche': 'Edward Newgate',
  'attack-on-titan|Bertholdt Hoover': 'Bertolt Hoover',
  'attack-on-titan|Historia Reiss': 'Historia Reiss',
  'attack-on-titan|Pieck Finger': 'Pieck',
  'attack-on-titan|Colt Grice': 'Colt',
  'my-hero-academia|Ochaco Uraraka': 'Ochako Uraraka',
  'my-hero-academia|Hawks': 'Keigo Takami',
  'bleach|Grimmjow Jaggerjack': 'Grimmjow Jeagerjaques',
  'hunter-x-hunter|Leorio Paradinight': 'Leorio',
  'hunter-x-hunter|Machi Komacine': 'Machi',
  'fairy-tail|Sherria Blendy': 'Chelia Blendy',
  'chainsaw-man|Katana Man': 'Samurai Sword',
  'spy-x-family|Handler': 'Sylvia Sherwood',
  'black-clover|Vanessa Enoshima': 'Vanessa Enoteca',
  'black-clover|Secre Swallowtail': 'Secre',
  'code-geass|Kallen Kozuki': 'Kallen Stadtfeld',
  'cowboy-bebop|Andy von de Oniate': 'Andy',
  'jojo|Jolyne Cujoh': 'Jolyne Kujo',
  'jojo|Muhammad Avdol': 'Mohammed Avdol',
  'yu-yu-hakusho|Toguro Cadet': 'Younger Toguro',
  'yu-yu-hakusho|Toguro Aîné': 'Elder Toguro',
  'konosuba|Iris Stylish Sworddale': 'Iris',
  'soul-eater|Liz Thompson': 'Elizabeth Thompson',
  'oshi-no-ko|Aqua Hoshino': 'Aquamarine Hoshino',
  'undead-unluck|Shen Feiwang': 'Shen',
  // Kingdom : MyAnimeList utilise les noms chinois.
  'kingdom|Shin': 'Li Xin',
  'kingdom|Hyou': 'Piao',
  'kingdom|Ei Sei': 'Ying Zheng',
  'kingdom|Sei Kyou': 'Cheng Jiao',
  'kingdom|Mou Ten': 'Meng Tian',
  'kingdom|Ou Hon': 'Wang Ben',
  'kingdom|Kyou Kai': 'Lei Qiang',
  'kingdom|Ten': 'He Liao Diao',
  'kingdom|Ouki': 'Wang Qi',
  'kingdom|Hou Ken': 'Pang Nuan',
  'kingdom|Kanki': 'Huan Yi',
  'kingdom|Ou Sen': 'Wang Jian',
  'kingdom|Ri Boku': 'Li Mu',
  'kingdom|Ryo Fui': 'Buwei Lu',
  'kingdom|Mou Bu': 'Meng Wu',
  'kingdom|Ren Pa': 'Lian Po',
  'kingdom|Tou': 'Teng',
  'kingdom|Gou Hyou': 'Gong Biao',
  'kingdom|Yotanwa': 'Yang Duanhe',
  'kingdom|Bajio': 'Ba Jio',
  'kingdom|Shou Heikun': 'Changping Jun',
  'kingdom|Shou Bunkun': 'Changwen Jun',
};

// Pages MyAnimeList à utiliser directement (toutes les saisons), quand
// Kitsu ne trouve pas la bonne œuvre ou ne connaît pas les personnages.
// "manga:<id>" pour une page manga (parties sans anime).
const MAL_IDS = {
  kingdom: [12031, 17389, 40682, 50160, 53223, 61517],
  // Parties 1-2, 3, 3 (Égypte), 4, 5, 6, puis 7 (Steel Ball Run, manga)
  jojo: [14719, 20899, 26055, 31933, 37991, 48661, 'manga:1706'],
};

// Œuvres sans adaptation animée : on prend le manga.
const MEDIA_KIND = { vagabond: 'manga' };

// Image imposée quand deux personnages portent exactement le même nom.
// Clé : "<animeId>|<nom>" -> URL de l'image.
const IMAGE_URLS = {
  // Josuke de Diamond is Unbreakable (et non celui de JoJolion)
  'jojo|Josuke Higashikata': 'https://cdn.myanimelist.net/images/characters/4/314937.jpg',
};

// Mots trop génériques pour identifier une licence.
const STOP_WORDS = new Set(['the', 'of', 'no', 'wa', 'to', 'ga', 'de', 'and', 'in', 'on', 'love', 'war', 'life', 'game']);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(url, attempt = 0) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.api+json' } });
    if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    if (attempt >= 4) {
      console.warn(`  ! échec ${url} : ${e.message}`);
      return null;
    }
    await sleep(1500 * (attempt + 1));
    return api(url, attempt + 1);
  }
}

async function download(url, dest, width) {
  const key = path.relative(PUBLIC_DIR, dest).split(path.sep).join('/');
  if (fs.existsSync(dest) && sources[key] === url) return true;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      await sharp(buf).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest);
      sources[key] = url;
      return true;
    } catch (e) {
      await sleep(1000 * (attempt + 1));
    }
  }
  return false;
}

// ----- Normalisation des noms -----

function norm(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/(\w)['’-](\w)/g, '$1$2') // Jin-Woo -> jinwoo
    .replace(/oh(?![aeiou])/g, 'o') // Sohma -> soma, Gotoh -> goto
    .replace(/ou/g, 'o').replace(/uu/g, 'u').replace(/oo/g, 'o').replace(/aa/g, 'a').replace(/ii/g, 'i')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(s) {
  return norm(s).split(' ').filter(Boolean);
}

// "Pain (Nagato)" -> ["Pain (Nagato)", "Pain", "Nagato"]
function nameVariants(name) {
  const variants = [name];
  const m = name.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (m) variants.push(m[1], m[2]);
  return variants.filter((v) => v.trim());
}

// [nom, poids] : les surnoms comptent un peu moins que le vrai nom (dans
// Vagabond, Matahachi a « Sasaki Kojiro » en surnom...).
function candidateNames(ch) {
  const a = ch.attributes;
  const list = [a.canonicalName, a.name];
  if (a.names) list.push(a.names.en, a.names.en_jp);
  const out = list.filter(Boolean).map((n) => [n, 1]);
  (a.otherNames || []).filter(Boolean).forEach((n) => out.push([n, 0.9]));
  return out;
}

function scoreMatch(ourName, ch) {
  let best = 0;
  for (const v of nameVariants(ourName)) {
    const ours = tokens(v);
    if (!ours.length) continue;
    for (const [c, weight] of candidateNames(ch)) {
      const theirs = tokens(c);
      if (!theirs.length) continue;
      const setT = new Set(theirs);
      const setO = new Set(ours);
      let s = 0;
      if (ours.length === theirs.length && ours.every((t) => setT.has(t))) s = 100;
      else if (ours.every((t) => setT.has(t))) s = 80;
      else if (theirs.every((t) => setO.has(t)) && theirs.join('').length >= 4) s = 70;
      s *= weight;
      if (s > best) best = s;
    }
  }
  return best;
}

function slugify(s) {
  return norm(s).replace(/ /g, '-').slice(0, 60) || 'perso';
}

// ----- Kitsu -----

async function searchAnime(query, kind) {
  const url = `${API}/${kind}?filter%5Btext%5D=${encodeURIComponent(query)}&page%5Blimit%5D=8`
    + `&fields%5B${kind}%5D=canonicalTitle,posterImage,subtype,userCount`;
  const json = await api(url);
  return (json && json.data) || [];
}

async function loadCharacters(kitsuId, kind) {
  const out = [];
  let url = `${API}/${kind}/${kitsuId}/characters?include=character&page%5Blimit%5D=20`
    + '&fields%5BmediaCharacters%5D=role,character&fields%5Bcharacters%5D=canonicalName,name,names,otherNames,image';
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const json = await api(url);
    if (!json) break;
    const byId = new Map((json.included || []).map((c) => [c.id, c]));
    (json.data || []).forEach((mc) => {
      const rel = mc.relationships && mc.relationships.character && mc.relationships.character.data;
      const ch = rel && byId.get(rel.id);
      if (ch && ch.attributes.image) out.push({ ch, role: mc.attributes.role });
    });
    url = json.links && json.links.next;
  }
  return out;
}

// ----- MyAnimeList (secours) -----

let malQueue = Promise.resolve();
// Une page MAL à la fois, espacées de 2,5 s, pour rester discret.
function malFetch(url) {
  const job = malQueue.then(async () => {
    await sleep(2500);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (otaku-undercover image script)' } });
      return res.ok ? await res.text() : null;
    } catch (e) {
      return null;
    }
  });
  malQueue = job.catch(() => {});
  return job;
}

async function malIdOf(kitsuId, kind) {
  const json = await api(`${API}/${kind}/${kitsuId}/mappings`);
  const m = ((json && json.data) || []).find((x) => x.attributes.externalSite === `myanimelist/${kind}`);
  return m ? m.attributes.externalId : null;
}

// Liste des personnages d'une page MAL, au même format que Kitsu.
async function loadMalCharacters(malId, kind) {
  const html = await malFetch(`https://myanimelist.net/${kind}/${malId}/x/characters`);
  if (!html) return [];
  const out = [];
  html.split(/js-(?:anime|manga)-character-table/).slice(1).forEach((block, i) => {
    const img = block.match(/data-src="https:\/\/cdn\.myanimelist\.net\/r\/\d+x\d+(\/images\/characters\/[^"?]+)/);
    const name = block.match(/class="h3_character_name">([^<]+)</);
    const roll = block.match(/js-chara-roll-and-name"[^>]*>\s*([ms])_/);
    if (!img || !name) return;
    const decoded = name[1].replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
    out.push({
      ch: { id: `mal${malId}_${i}`, attributes: { canonicalName: decoded, image: { original: `https://cdn.myanimelist.net${img[1]}` } } },
      role: roll && roll[1] === 'm' ? 'main' : 'supporting',
      viaMal: true,
    });
  });
  return out;
}

// Recherche par nom, en ne gardant que les personnages qui apparaissent
// dans une œuvre de la même licence (sinon « Freezer » donne le Pokémon).
async function searchCharacter(name, franchiseKeys, entryIds) {
  const url = `${API}/characters?filter%5Bname%5D=${encodeURIComponent(name)}&page%5Blimit%5D=10`
    + '&include=mediaCharacters.media'
    + '&fields%5Bcharacters%5D=canonicalName,name,names,otherNames,image,mediaCharacters'
    + '&fields%5BmediaCharacters%5D=media&fields%5Banime%5D=canonicalTitle&fields%5Bmanga%5D=canonicalTitle';
  const json = await api(url);
  if (!json) return [];
  const inc = new Map((json.included || []).map((x) => [x.type + x.id, x]));
  return (json.data || []).filter((c) => {
    if (!c.attributes.image) return false;
    const mcs = ((c.relationships.mediaCharacters || {}).data || []).map((r) => inc.get(r.type + r.id)).filter(Boolean);
    return mcs.some((mc) => {
      const m = mc.relationships.media.data;
      if (!m) return false;
      if (m.type === 'anime' && entryIds.includes(m.id)) return true;
      const media = inc.get(m.type + m.id);
      const t = new Set(tokens(media && media.attributes.canonicalTitle));
      return franchiseKeys.some((k) => t.has(k));
    });
  }).map((ch) => ({ ch, role: 'search' }));
}

function franchiseKeysFor(anime, query, kitsuTitle) {
  const keys = new Set();
  [anime.title, query, kitsuTitle].forEach((s) => tokens(s).forEach((t) => {
    if (t.length >= 4 && !STOP_WORDS.has(t)) keys.add(t);
  }));
  return [...keys];
}

function pickImage(img, prefer) {
  if (!img) return null;
  for (const k of prefer) if (img[k]) return img[k];
  return img.original || null;
}

function bestCandidate(name, pool) {
  let best = null;
  let tie = false;
  for (const item of pool) {
    const s = scoreMatch(name, item.ch);
    if (!s) continue;
    const rank = s + (item.role === 'main' ? 5 : 0);
    if (!best || rank > best.rank) { best = { ...item, score: s, rank }; tie = false; }
    else if (rank === best.rank && item.ch.id !== best.ch.id) tie = true;
  }
  if (best) best.tie = tie;
  return best;
}

// ----- Programme principal -----

async function processAnime(anime) {
  const query = SEARCH_OVERRIDES[anime.id] || anime.title;
  const kind = MEDIA_KIND[anime.id] || 'anime';
  const forcedIds = KITSU_IDS[anime.id];
  const results = forcedIds
    ? (await Promise.all(forcedIds.map((id) => api(`${API}/${kind}/${id}?fields%5B${kind}%5D=canonicalTitle,posterImage,subtype,userCount`))))
      .filter(Boolean).map((j) => j.data)
    : (await searchAnime(query, kind)).filter((r) => r.attributes.subtype !== 'music');
  const report = { id: anime.id, title: anime.title, kitsuTitle: null, cover: null, chars: [] };

  // Affiche : première série TV trouvée (sinon premier résultat).
  const coverEntry = results.find((r) => r.attributes.subtype === (kind === 'manga' ? 'manga' : 'TV')) || results[0];
  if (coverEntry) {
    report.kitsuTitle = coverEntry.attributes.canonicalTitle;
    const url = pickImage(coverEntry.attributes.posterImage, ['large', 'original']);
    if (url) {
      const rel = `/images/animes/${anime.id}.webp`;
      if (await download(url, path.join(PUBLIC_DIR, rel), 320)) report.cover = rel;
    }
  }

  const charEntry = CHARACTER_DATABASE.find((c) => c.id === anime.id);
  const names = charEntry ? charEntry.characters : [];
  const pool = [];
  const entries = results.slice(0, MAX_ENTRIES);
  let loaded = 0;

  const resolved = new Map();
  const tryResolve = () => {
    for (const name of names) {
      if (resolved.has(name) && resolved.get(name).score === 100) continue;
      const lookup = OVERRIDES[`${anime.id}|${name}`] || name;
      const b = bestCandidate(lookup, pool);
      if (b && (!resolved.has(name) || b.rank > resolved.get(name).rank)) resolved.set(name, b);
    }
  };

  while (loaded < entries.length) {
    pool.push(...(await loadCharacters(entries[loaded].id, kind)));
    loaded++;
    tryResolve();
    if (names.every((n) => resolved.has(n) && resolved.get(n).score >= 80)) break;
  }

  for (const name of names) {
    const forced = IMAGE_URLS[`${anime.id}|${name}`];
    if (forced) {
      resolved.set(name, { ch: { id: 'forced', attributes: { canonicalName: name, image: { original: forced } } }, score: 100, rank: 1000 });
    }
  }

  // Kitsu incomplet (séries récentes) : on complète avec MyAnimeList.
  const allFound = () => names.every((n) => resolved.has(n) && resolved.get(n).score >= 80);
  const malIds = MAL_IDS[anime.id] || [];
  for (let i = 0; i < malIds.length && !allFound(); i++) {
    const [malKind, malId] = String(malIds[i]).includes(':') ? String(malIds[i]).split(':') : [kind, malIds[i]];
    pool.push(...(await loadMalCharacters(malId, malKind)));
    tryResolve();
  }
  for (let i = 0; i < entries.length && !allFound() && !malIds.length; i++) {
    const malId = await malIdOf(entries[i].id, kind);
    if (!malId) continue;
    pool.push(...(await loadMalCharacters(malId, kind)));
    tryResolve();
  }

  // Dernier recours : recherche par nom de personnage.
  const keys = franchiseKeysFor(anime, query, report.kitsuTitle);
  const entryIds = kind === 'anime' ? results.map((r) => r.id) : [];
  for (const name of names) {
    if (resolved.has(name) && resolved.get(name).score >= 80) continue;
    const lookup = OVERRIDES[`${anime.id}|${name}`] || name;
    const found = await searchCharacter(lookup, keys, entryIds);
    const b = bestCandidate(lookup, found);
    if (b && b.score >= 80 && (!resolved.has(name) || b.rank > resolved.get(name).rank)) {
      resolved.set(name, { ...b, viaSearch: true });
    }
  }

  for (const name of names) {
    const r = resolved.get(name);
    const entry = { name, image: null, kitsuName: null, score: 0, doubt: null };
    if (r) {
      entry.kitsuName = r.ch.attributes.canonicalName;
      entry.score = r.score;
      const url = pickImage(r.ch.attributes.image, ['original']);
      const rel = `/images/persos/${anime.id}/${slugify(name)}.webp`;
      if (url && (await download(url, path.join(PUBLIC_DIR, rel), 240))) entry.image = rel;
      if (r.score < 100) entry.doubt = 'nom approchant';
      if (r.tie) entry.doubt = 'plusieurs candidats';
      if (r.viaMal) entry.source = 'MAL';
      if (r.viaSearch) entry.doubt = (entry.doubt ? entry.doubt + ', ' : '') + 'trouvé hors de la série';
    }
    report.chars.push(entry);
  }

  return report;
}

async function main() {
  const reports = [];
  // `node scripts/fetch-images.mjs naruto bleach` : seulement ces animés (test).
  const only = process.argv.slice(2);
  const queue = ANIME_LIST.filter((a) => !only.length || only.includes(a.id));
  const CONCURRENCY = 3;
  async function worker() {
    while (queue.length) {
      const anime = queue.shift();
      const r = await processAnime(anime);
      const ok = r.chars.filter((c) => c.image).length;
      console.log(`${anime.title.padEnd(40)} affiche:${r.cover ? 'oui' : 'NON'}  persos ${ok}/${r.chars.length}  (Kitsu : ${r.kitsuTitle})`);
      reports.push(r);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const order = new Map(ANIME_LIST.map((a, i) => [a.id, i]));
  reports.sort((a, b) => order.get(a.id) - order.get(b.id));

  // Manifest (lancement partiel : on repart de l'existant)
  let animeImages = {};
  let characterImages = {};
  if (only.length && fs.existsSync(OUT_MANIFEST)) {
    const prev = await import(`${pathToFileURL(OUT_MANIFEST).href}?t=${Date.now()}`);
    animeImages = { ...prev.ANIME_IMAGES };
    characterImages = { ...prev.CHARACTER_IMAGES };
    reports.forEach((r) => { delete animeImages[r.id]; delete characterImages[r.id]; });
  }
  reports.forEach((r) => {
    if (r.cover) animeImages[r.id] = r.cover;
    const map = {};
    r.chars.forEach((c) => { if (c.image) map[c.name] = c.image; });
    if (Object.keys(map).length) characterImages[r.id] = map;
  });
  const manifest = `// Généré par scripts/fetch-images.mjs — ne pas modifier à la main
// (corrige plutôt OVERRIDES dans le script puis relance-le).
// Images : Kitsu (kitsu.io).
export const ANIME_IMAGES = ${JSON.stringify(animeImages, null, 2)};

export const CHARACTER_IMAGES = ${JSON.stringify(characterImages, null, 2)};
`;
  fs.writeFileSync(OUT_MANIFEST, manifest);

  // Supprime les images qui ne servent plus (nom ou correspondance changés).
  reports.forEach((r) => {
    const dir = path.join(PUBLIC_DIR, 'images/persos', r.id);
    if (!fs.existsSync(dir)) return;
    const used = new Set(Object.values(characterImages[r.id] || {}).map((rel) => path.basename(rel)));
    fs.readdirSync(dir).forEach((f) => {
      if (used.has(f)) return;
      fs.unlinkSync(path.join(dir, f));
      delete sources[`images/persos/${r.id}/${f}`];
    });
  });
  fs.writeFileSync(SOURCES_PATH, JSON.stringify(sources, null, 1));

  // Rapport
  let total = 0, found = 0;
  const lines = ['# Rapport des images', '', 'Généré par `node scripts/fetch-images.mjs`.', ''];
  const missing = [], doubtful = [], covers = [];
  reports.forEach((r) => {
    covers.push(`| ${r.title} | ${r.kitsuTitle || '—'} | ${r.cover ? 'oui' : '**NON**'} |`);
    r.chars.forEach((c) => {
      total++;
      if (c.image) found++;
      if (!c.image) missing.push(`- ${r.title} — ${c.name}`);
      else if (c.doubt) doubtful.push(`| ${r.title} | ${c.name} | ${c.kitsuName} | ${c.doubt} | \`${c.image}\` |`);
    });
  });
  lines.push(`**${found}/${total}** personnages ont une image, ${Object.keys(animeImages).length}/${reports.length} animés ont une affiche.`, '');
  lines.push(`## Images douteuses à vérifier (${doubtful.length})`, '', '| Animé | Notre nom | Nom Kitsu retenu | Raison | Fichier |', '|---|---|---|---|---|', ...doubtful, '');
  lines.push(`## Personnages sans image (${missing.length})`, '', ...missing, '');
  lines.push('## Affiches', '', '| Animé | Œuvre Kitsu retenue | Affiche |', '|---|---|---|', ...covers, '');
  fs.writeFileSync(OUT_REPORT, lines.join('\n'));

  console.log(`\nTerminé : ${found}/${total} personnages, ${Object.keys(animeImages).length}/${reports.length} affiches.`);
  console.log(`Douteux : ${doubtful.length}, manquants : ${missing.length}. Voir scripts/images-report.md`);
}

main();
