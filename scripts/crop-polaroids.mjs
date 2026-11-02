// Découpe les 4 photos de MyDesign/appareilphoto3.png (dessinées dans des polaroïds
// inclinés) : repère le liseré noir de chaque photo, la redresse et la recadre.
// Usage : node scripts/crop-polaroids.mjs <planche-de-controle.png>
import { createRequire } from 'module';
const sharp = createRequire(process.cwd() + '/package.json')('sharp');

const SRC = 'MyDesign/appareilphoto3.png';
const OUT = process.argv[2];
const COLS = [[12, 443], [454, 885], [897, 1321], [1336, 1773]]; // colonnes de chaque polaroïd
const INSET = 11; // px retirés à l'intérieur du liseré noir

const lum = (d, i) => (d[i] + d[i + 1] + d[i + 2]) / 3;
const sat = (d, i) => Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);

// Parcourt une ligne de pixels depuis l'extérieur : fond -> cadre crème -> liseré noir de la photo.
// Renvoie la position (index dans la séquence) du premier pixel du liseré, ou -1.
function edgeAlong(get, n) {
  let seenCream = 0;
  for (let t = 0; t < n; t++) {
    const [l, s] = get(t);
    if (l > 165 && s < 70) seenCream++;
    else if (seenCream >= 6 && l < 95) {
      let dark = 0;
      for (let u = 0; u < 3 && t + u < n; u++) if (get(t + u)[0] < 110) dark++;
      if (dark >= 2) return t;
    } else if (seenCream < 6 && l < 95) seenCream = 0;
  }
  return -1;
}

function median(a) { const b = a.filter((v) => v >= 0).sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : -1; }
function fit(pts) { // moindres carrés v = a*u + b
  const n = pts.length; let su = 0, sv = 0, suu = 0, suv = 0;
  for (const [u, v] of pts) { su += u; sv += v; suu += u * u; suv += u * v; }
  const a = (n * suv - su * sv) / (n * suu - su * su);
  return { a, b: (sv - a * su) / n };
}

// Mesure les 4 bords de la photo dans une image raw (w x h)
function measure(d, w, h) {
  const at = (x, y) => { const i = (y * w + x) * 3; return [lum(d, i), sat(d, i)]; };
  const ys = [], xs = [];
  for (let y = Math.round(h * 0.3); y < h * 0.62; y += 4) ys.push(y);
  for (let x = Math.round(w * 0.25); x < w * 0.75; x += 4) xs.push(x);
  const left = ys.map((y) => [y, edgeAlong((t) => at(t, y), w)]).filter((p) => p[1] >= 0);
  const right = ys.map((y) => [y, w - 1 - edgeAlong((t) => at(w - 1 - t, y), w)]).filter((p) => p[1] < w - 1);
  const top = xs.map((x) => [x, edgeAlong((t) => at(x, t), h)]).filter((p) => p[1] >= 0);
  const bottom = xs.map((x) => [x, h - 1 - edgeAlong((t) => at(x, h - 1 - t), h)]).filter((p) => p[1] < h - 1);
  return { left, right, top, bottom };
}

const results = [];
for (let k = 0; k < COLS.length; k++) {
  const [x0, x1] = COLS[k];
  const left0 = Math.max(0, x0 - 6), width0 = Math.min(1773, x1 + 6) - left0;
  const base = sharp(SRC).extract({ left: left0, top: 0, width: width0, height: 887 }).removeAlpha();
  const r0 = await base.clone().raw().toBuffer({ resolveWithObject: true });
  const m0 = measure(r0.data, r0.info.width, r0.info.height);
  // inclinaison moyenne : bords verticaux (x en fonction de y) et horizontaux (y en fonction de x)
  const slopes = [fit(m0.left).a, fit(m0.right).a, -fit(m0.top).a, -fit(m0.bottom).a];
  const angleDeg = (median(slopes.map((s) => s)) === -1 ? 0 : slopes.sort((a, b) => a - b)[1] + slopes[2]) / 2 * 180 / Math.PI;
  // redresse puis remesure (bords maintenant droits)
  const rotated = await base.clone().rotate(angleDeg, { background: '#000000' }).raw().toBuffer({ resolveWithObject: true });
  const rw = rotated.info.width, rh = rotated.info.height;
  const m1 = measure(rotated.data, rw, rh);
  const L = median(m1.left.map((p) => p[1])), R = median(m1.right.map((p) => p[1]));
  const T = median(m1.top.map((p) => p[1])), B = median(m1.bottom.map((p) => p[1]));
  const box = { left: L + INSET, top: T + INSET, width: R - L - 2 * INSET, height: B - T - 2 * INSET };
  const file = `public/images/polaroid-0${k + 1}.jpg`;
  await sharp(rotated.data, { raw: { width: rw, height: rh, channels: 3 } }).extract(box).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  results.push({ file, angle: angleDeg.toFixed(2), box, ratio: (box.width / box.height).toFixed(3), pts: [m1.left.length, m1.right.length, m1.top.length, m1.bottom.length].join('/') });
}
console.log(JSON.stringify(results, null, 1));
const tiles = await Promise.all(results.map(async (r, i) => ({ input: await sharp(r.file).resize({ height: 300 }).toBuffer(), left: 5 + i * 250, top: 5 })));
await sharp({ create: { width: 1010, height: 310, channels: 3, background: '#888' } }).composite(tiles).png().toFile(OUT);
