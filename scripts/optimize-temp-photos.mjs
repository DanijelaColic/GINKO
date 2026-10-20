/**
 * One-off: optimize approved temp-ginko-photos into public/images (WebP).
 * Does not modify temp-ginko-photos originals.
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMP = path.join(ROOT, 'temp-ginko-photos');
const OUT = path.join(ROOT, 'public', 'images');

const G1 = 'Ginko_1-20261001T155928Z-1-001/Ginko_1';
const G2 = 'Ginko_2-20261010T135907Z-1-001/Ginko_2';
const G3 = 'Ginko_3-20261010T135911Z-1-001/Ginko_3';
const G4 = 'Ginko_4-20261010T135913Z-1-001/Ginko_4';
const G5 = 'Ginko_5-20261010T135917Z-1-001/Ginko_5';
const G6 = 'Ginko_6-20261010T135921Z-1-001/Ginko_6';
const SPA = 'Ginko_SPA-20261010T135926Z-1-001/Ginko_SPA';

/** @type {{ src: string, dest: string, maxW?: number }[]} */
const ASSETS = [
  // property (no guest photo Untitled-18)
  { src: `${G1}/20260913_082440.jpg`, dest: 'property/breakfast-cold-buffet-01.webp', maxW: 2000 },
  { src: `${G1}/20260913_082618.jpg`, dest: 'property/breakfast-coffee-buffet-01.webp', maxW: 2000 },
  { src: `${G1}/Untitled-17.jpeg`, dest: 'property/breakfast-pastries-01.webp', maxW: 1600 },
  { src: `${G3}/Untitled-23.jpeg`, dest: 'property/breakfast-ham-cheese-01.webp', maxW: 1600 },
  { src: `${G4}/Untitled-1.jpeg`, dest: 'property/breakfast-coffee-close-01.webp', maxW: 1600 },
  { src: `${G1}/Untitled-12.jpeg`, dest: 'property/breakfast-eggs-yogurt-01.webp', maxW: 1600 },
  { src: `${G1}/Untitled-25.jpeg`, dest: 'property/exterior-entrance-01.webp', maxW: 2000 },

  // shared
  { src: `${G1}/Untitled-6.jpeg`, dest: 'shared/amenity-kettle-01.webp', maxW: 1600 },
  { src: `${G2}/Untitled-5.jpeg`, dest: 'shared/bathroom-sink-detail-01.webp', maxW: 1600 },
  { src: `${G1}/Untitled-8.jpeg`, dest: 'shared/bathroom-wood-shower-01.webp', maxW: 1600 },
  { src: `${G4}/PSX_20210518_104715.jpg`, dest: 'shared/bathroom-marble-01.webp', maxW: 2000 },

  // ginko-1 (approved: Untitled-4 cover + shared bathroom ref)
  { src: `${G1}/Untitled-4.jpeg`, dest: 'rooms/ginko-1/01-cover.webp', maxW: 2000 },

  // ginko-2
  { src: `${G2}/Untitled-13.jpeg`, dest: 'rooms/ginko-2/01-cover.webp', maxW: 2000 },
  { src: `${G2}/Untitled-14.jpeg`, dest: 'rooms/ginko-2/02-bedroom-angle.webp', maxW: 2000 },
  { src: `${G2}/Untitled-27.jpeg`, dest: 'rooms/ginko-2/03-bedroom-leds.webp', maxW: 2000 },
  { src: `${G2}/Untitled-19.jpeg`, dest: 'rooms/ginko-2/04-entry.webp', maxW: 2000 },

  // ginko-3
  { src: `${G3}/Untitled-3.jpeg`, dest: 'rooms/ginko-3/01-cover.webp', maxW: 2000 },
  { src: `${G3}/Untitled-2.jpeg`, dest: 'rooms/ginko-3/02-bedroom-sofa.webp', maxW: 2000 },
  { src: `${G3}/Untitled-22.jpeg`, dest: 'rooms/ginko-3/03-bedroom-closet.webp', maxW: 2000 },
  { src: `${G3}/20251202_145017.jpg`, dest: 'rooms/ginko-3/04-desk-tv.webp', maxW: 2000 },
  // Untitled-4 also used by Ginko 3 → reference ginko-1/01-cover (same bytes), no second file

  // ginko-4
  { src: `${G4}/PSX_20210518_105521.jpg`, dest: 'rooms/ginko-4/01-cover.webp', maxW: 2000 },
  { src: `${G4}/PSX_20210518_105510.jpg`, dest: 'rooms/ginko-4/02-bedroom-desk.webp', maxW: 2000 },
  { src: `${G4}/PSX_20210518_105500.jpg`, dest: 'rooms/ginko-4/03-bedroom-angle.webp', maxW: 2000 },
  { src: `${G4}/PSX_20210518_105648.jpg`, dest: 'rooms/ginko-4/04-bedroom-wardrobe.webp', maxW: 2000 },

  // ginko-5
  { src: `${G5}/PSX_20210518_104646.jpg`, dest: 'rooms/ginko-5/01-cover.webp', maxW: 2000 },
  { src: `${G5}/PSX_20210518_104756.jpg`, dest: 'rooms/ginko-5/02-bedroom.webp', maxW: 2000 },
  { src: `${G5}/PSX_20210518_104805.jpg`, dest: 'rooms/ginko-5/03-desk-amenities.webp', maxW: 2000 },
  { src: `${G5}/PSX_20210518_104839.jpg`, dest: 'rooms/ginko-5/04-entry-fridge.webp', maxW: 2000 },
  { src: `${G5}/PSX_20210518_104827.jpg`, dest: 'rooms/ginko-5/05-closet-hall.webp', maxW: 2000 },

  // ginko-6
  { src: `${G6}/PSX_20210518_160034.jpg`, dest: 'rooms/ginko-6/01-cover.webp', maxW: 2000 },
  { src: `${G6}/PSX_20210518_160048.jpg`, dest: 'rooms/ginko-6/02-desk-storage.webp', maxW: 2000 },
  { src: `${G6}/PSX_20210518_160102.jpg`, dest: 'rooms/ginko-6/03-layout-bathroom.webp', maxW: 2000 },
  { src: `${G6}/PSX_20210518_160113.jpg`, dest: 'rooms/ginko-6/04-bathroom.webp', maxW: 2000 },
  { src: `${G6}/PSX_20210518_160210.jpg`, dest: 'rooms/ginko-6/05-detail.webp', maxW: 2000 },
  { src: `${G6}/Untitled-24.jpeg`, dest: 'rooms/ginko-6/06-terrace.webp', maxW: 2000 },

  // apartment shared
  { src: `${SPA}/Untitled-12.jpeg`, dest: 'rooms/apartment/01-living.webp', maxW: 2000 },
  { src: `${SPA}/Untitled-14.jpeg`, dest: 'rooms/apartment/02-bedroom.webp', maxW: 2000 },
  { src: `${SPA}/Untitled-17.jpeg`, dest: 'rooms/apartment/03-bedroom-detail.webp', maxW: 2000 },
  { src: `${SPA}/Untitled-20.jpeg`, dest: 'rooms/apartment/04-kitchen.webp', maxW: 2000 },
  { src: `${SPA}/Untitled-26.jpeg`, dest: 'rooms/apartment/05-detail-shelf.webp', maxW: 2000 },
  { src: `${SPA}/Untitled-6.jpeg`, dest: 'rooms/apartment/06-terrace-romance.webp', maxW: 2000 },
  { src: `${SPA}/Untitled-2 (1).jpeg`, dest: 'rooms/apartment/07-welcome-cart.webp', maxW: 2000 },

  // apartment wellness (spa-2 cover = Untitled-8 first)
  { src: `${SPA}/Untitled-8.jpeg`, dest: 'rooms/apartment/wellness-01-jacuzzi-cover.webp', maxW: 2000 },
  { src: `${SPA}/Untitled-21.jpeg`, dest: 'rooms/apartment/wellness-02-sauna-jacuzzi.webp', maxW: 2000 },
  { src: `${SPA}/Untitled-29(1).jpeg`, dest: 'rooms/apartment/wellness-03-jacuzzi-night.webp', maxW: 2000 },
];

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function optimizeOne({ src, dest, maxW = 2000 }) {
  const input = path.join(TEMP, src);
  const output = path.join(OUT, dest);
  await ensureDir(output);

  const meta = await sharp(input).metadata();
  const width = meta.width || maxW;
  const targetW = Math.min(width, maxW);

  let pipeline = sharp(input).rotate();
  if (width > targetW) {
    pipeline = pipeline.resize({ width: targetW, withoutEnlargement: true });
  }

  await pipeline
    .webp({ quality: 80, effort: 4 })
    .toFile(output);

  const inStat = await fs.stat(input);
  const outStat = await fs.stat(output);
  const outMeta = await sharp(output).metadata();

  return {
    dest,
    inBytes: inStat.size,
    outBytes: outStat.size,
    inW: meta.width,
    outW: outMeta.width,
    outH: outMeta.height,
  };
}

async function main() {
  const results = [];
  let inTotal = 0;
  let outTotal = 0;

  for (const asset of ASSETS) {
    const r = await optimizeOne(asset);
    results.push(r);
    inTotal += r.inBytes;
    outTotal += r.outBytes;
    const pct = ((1 - r.outBytes / r.inBytes) * 100).toFixed(0);
    console.log(
      `OK ${r.dest}  ${r.inW}→${r.outW}px  ${(r.inBytes / 1024).toFixed(0)}→${(r.outBytes / 1024).toFixed(0)} KB (−${pct}%)`,
    );
  }

  console.log('\n=== SUMMARY ===');
  console.log(`files: ${results.length}`);
  console.log(`input:  ${(inTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`output: ${(outTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`saved:  ${(((inTotal - outTotal) / inTotal) * 100).toFixed(1)}%`);

  await fs.writeFile(
    path.join(TEMP, 'optimize-report.json'),
    JSON.stringify({ files: results.length, inTotal, outTotal, results }, null, 2),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
