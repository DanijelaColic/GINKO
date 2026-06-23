/** Offset za sticky navbar (odgovara scroll-mt-28) */
export const STICKY_NAV_OFFSET = 112;

export function scrollToElement(el: HTMLElement, offset = STICKY_NAV_OFFSET) {
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function scrollToSectionId(id: string, offset = STICKY_NAV_OFFSET) {
  const el = document.getElementById(id);
  if (el) scrollToElement(el, offset);
}
