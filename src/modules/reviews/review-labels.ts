function intlLocale(locale: string) {
  if (locale === 'en') return 'en-GB';
  if (locale === 'cs') return 'cs-CZ';
  return 'hr-HR';
}

export function formatReviewRating(value: number, locale: string = 'hr') {
  return value.toLocaleString(intlLocale(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatReviewCountLabel(count: number, locale: string = 'hr') {
  if (locale === 'en') {
    return count === 1 ? '1 review' : `${count} reviews`;
  }
  if (locale === 'cs') {
    if (count === 1) return '1 recenze';
    if (count >= 2 && count <= 4) return `${count} recenze`;
    return `${count} recenzí`;
  }
  if (count === 1) return '1 recenzija';
  if (count >= 2 && count <= 4) return `${count} recenzije`;
  return `${count} recenzija`;
}

export function getRatingLabel(rating: number, locale: string = 'hr') {
  if (locale === 'en') {
    if (rating >= 4.8) return 'Excellent';
    if (rating >= 4.5) return 'Very good';
    if (rating >= 4.0) return 'Good';
    if (rating >= 3.0) return 'Fair';
    return 'Average';
  }
  if (locale === 'cs') {
    if (rating >= 4.8) return 'Vynikající';
    if (rating >= 4.5) return 'Velmi dobré';
    if (rating >= 4.0) return 'Dobré';
    if (rating >= 3.0) return 'V pořádku';
    return 'Průměrné';
  }
  if (rating >= 4.8) return 'Izvrsno';
  if (rating >= 4.5) return 'Vrlo dobro';
  if (rating >= 4.0) return 'Dobro';
  if (rating >= 3.0) return 'U redu';
  return 'Prosječno';
}

export function formatReviewDate(isoDate: string, locale: string = 'hr') {
  return new Date(isoDate).toLocaleDateString(intlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
