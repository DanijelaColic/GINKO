/**
 * Convert actively used property JPGs → WebP (max 2000px, q≈78).
 * Keeps original JPG files untouched. Does not overwrite existing WebP
 * if already present and newer/larger than a trivial stub.
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROP = path.join(ROOT, 'public', 'images', 'property');
const HERO = path.join(ROOT, 'public', 'images', 'hero');

const MAX_W = 2000;
const QUALITY = 78;

/** Basenames (no ext) of property JPGs referenced in app code */
const PROPERTY_JPG_STEMS = [
  '20240504_154454',
  '20240906_085556',
  '20240906_091154',
  '20240906_091257',
  '20240906_091321',
  '20240906_091344',
  '20241101_080530',
  '20250405_085232',
  '20250501_174531',
  '20251202_144635',
  '20251202_144813',
  '20251228_151836',
  '20240929_072608',
];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function convertJpg(stem) {
  const jpg = path.join(PROP, `${stem}.jpg`);
  const webp = path.join(PROP, `${stem}.webp`);
  if (!(await exists(jpg))) {
    console.log(`SKIP missing jpg ${stem}.jpg`);
    return null;
  }
  const before = (await fs.stat(jpg)).size;
  if (await exists(webp)) {
    const afterExisting = (await fs.stat(webp)).size;
    // Reuse existing if already a real optimized file (< 800KB typical)
    if (afterExisting > 10_000 && afterExisting < before * 0.5) {
      console.log(
        `REUSE ${stem}.webp  ${(afterExisting / 1024).toFixed(1)} KB (jpg was ${(before / 1024).toFixed(1)} KB)`,
      );
      return { stem, before, after: afterExisting, reused: true };
    }
  }

  await sharp(jpg)
    .rotate()
    .resize({ width: MAX_W, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(webp);

  const after = (await fs.stat(webp)).size;
  const meta = await sharp(webp).metadata();
  console.log(
    `OK ${stem}.webp  ${meta.width}x${meta.height}  ${(before / 1024).toFixed(1)} → ${(after / 1024).toFixed(1)} KB`,
  );
  return { stem, before, after, reused: false };
}

async function optimizeHero() {
  const src = path.join(HERO, 'exterior-01.webp');
  const backup = path.join(HERO, 'exterior-01-full.webp');
  if (!(await exists(src))) {
    console.log('SKIP hero missing');
    return null;
  }
  // Keep original bytes under a different name (do not delete)
  if (!(await exists(backup))) {
    await fs.copyFile(src, backup);
    console.log(
      `BACKUP hero → exterior-01-full.webp (${((await fs.stat(backup)).size / 1024).toFixed(1)} KB)`,
    );
  }
  const encodeSrc = backup;
  const before = (await fs.stat(encodeSrc)).size;
  const tmp = path.join(HERO, 'exterior-01.tmp.webp');
  await sharp(encodeSrc)
    .rotate()
    .resize({ width: MAX_W, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(tmp);
  const after = (await fs.stat(tmp)).size;
  const current = (await fs.stat(src)).size;
  if (after >= current * 0.98 && after >= before * 0.5) {
    // Only skip if not meaningfully smaller than what is already served
    if (after >= current * 0.98) {
      await fs.unlink(tmp);
      console.log(
        `HERO keep current (${(current / 1024).toFixed(1)} KB; re-encode ${(after / 1024).toFixed(1)} KB from full ${(before / 1024).toFixed(1)} KB)`,
      );
      return { stem: 'exterior-01', before, after: current, skipped: true };
    }
  }
  await fs.rename(tmp, src);
  const meta = await sharp(src).metadata();
  console.log(
    `OK hero/exterior-01.webp  ${meta.width}x${meta.height}  ${(before / 1024).toFixed(1)} → ${(after / 1024).toFixed(1)} KB`,
  );
  return { stem: 'exterior-01', before, after, skipped: false };
}

const results = [];
for (const stem of PROPERTY_JPG_STEMS) {
  results.push(await convertJpg(stem));
}
results.push(await optimizeHero());

const done = results.filter(Boolean);
const jpgConv = done.filter((r) => r.stem !== 'exterior-01');
const beforeSum = jpgConv.reduce((s, r) => s + r.before, 0);
const afterSum = jpgConv.reduce((s, r) => s + r.after, 0);
console.log('\n=== SUMMARY property JPG→WebP ===');
console.log(`files: ${jpgConv.length}`);
console.log(
  `size: ${(beforeSum / 1024 / 1024).toFixed(2)} MB → ${(afterSum / 1024 / 1024).toFixed(2)} MB`,
);
const hero = done.find((r) => r.stem === 'exterior-01');
if (hero) {
  console.log(
    `hero: ${(hero.before / 1024).toFixed(1)} KB → ${(hero.after / 1024).toFixed(1)} KB`,
  );
}
