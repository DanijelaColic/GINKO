const LOCALE = 'hr-HR';

export function formatReviewRating(value: number) {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatReviewCountLabel(count: number) {
  if (count === 1) return '1 recenzija';
  if (count >= 2 && count <= 4) return `${count} recenzije`;
  return `${count} recenzija`;
}

export function getRatingLabel(rating: number) {
  if (rating >= 4.8) return 'Izvrsno';
  if (rating >= 4.5) return 'Vrlo dobro';
  if (rating >= 4.0) return 'Dobro';
  if (rating >= 3.0) return 'U redu';
  return 'Prosječno';
}
