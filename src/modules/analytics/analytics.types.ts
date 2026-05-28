export type AnalyticsEvent =
  | { name: 'search_submitted'; properties: { query: string } }
  | { name: 'room_viewed'; properties: { slug: string; name: string } }
  | { name: 'booking_started'; properties: { room_slug: string } }
  | { name: 'booking_completed'; properties: { booking_id: string; room_slug: string; total_eur: number } };

export type AnalyticsEventName = AnalyticsEvent['name'];
