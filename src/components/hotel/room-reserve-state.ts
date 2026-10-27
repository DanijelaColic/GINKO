export type RoomReserveState = 'ready' | 'dates' | 'guests' | 'search' | 'unavailable';

export function getRoomReserveState(
  slug: string,
  hasDates: boolean,
  adults: number,
  searched: boolean,
  statuses: Record<string, { available: boolean } | null | undefined>,
): RoomReserveState {
  if (!hasDates) return 'dates';
  if (adults < 1) return 'guests';
  if (!searched) return 'search';
  // Fail-closed: nema statusa / API greška → ne tretiraj kao slobodno
  const status = statuses[slug];
  if (status == null || status.available !== true) return 'unavailable';
  return 'ready';
}
