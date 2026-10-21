/**
 * Zajedničke (property) fotografije koje se nadodaju na galeriju svake
 * smještajne jedinice — nakon fotografija same sobe/apartmana.
 *
 * Namjerno isključeno:
 * - fotografije drugih soba / apartmana
 * - shared kupaonice (bathroom-*)
 * - SPA/jacuzzi (samo u wellness listingima)
 * - nejasne / sobne interijere u /property (npr. 20251202_*)
 * - okolica / privatni balkoni bez jasnog shared konteksta
 */

export const SHARED_PROPERTY_GALLERY_SRCS = [
  // 1. Terasa s palmama
  '/images/property/20240504_154454.jpg',
  // 2. Prostor za doručak (blagovaonica + buffet pregled)
  '/images/property/20240906_091154.jpg',
  // 3. Doručak, hrana i kava
  '/images/property/breakfast-coffee-buffet-01.webp',
  '/images/property/breakfast-cold-buffet-01.webp',
  '/images/property/20240906_085556.jpg',
  '/images/property/20240906_091257.jpg',
  '/images/property/breakfast-pastries-01.webp',
  '/images/property/breakfast-ham-cheese-01.webp',
  '/images/property/breakfast-coffee-close-01.webp',
  '/images/property/breakfast-eggs-yogurt-01.webp',
  '/images/property/20240906_091344.jpg',
  '/images/property/20241101_080530.jpg',
  '/images/property/20240906_091321.jpg',
  // 4. Restoran / ostali zajednički prostori —
  //    blagovaonica je već u #2; nema zasebne jasne restoran-only fotografije
  // 5. Ulaz u objekt
  '/images/property/exterior-entrance-01.webp',
  '/images/property/20250501_174531.jpg',
] as const;

/** Room photos first, then shared property — without duplicates. */
export function appendSharedPropertyImages(roomImages: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const src of roomImages) {
    if (seen.has(src)) continue;
    seen.add(src);
    out.push(src);
  }

  for (const src of SHARED_PROPERTY_GALLERY_SRCS) {
    if (seen.has(src)) continue;
    seen.add(src);
    out.push(src);
  }

  return out;
}
