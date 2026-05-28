// New — Phase 9 iCal channel sync types

export type ChannelMapping = {
  id: string;
  room_slug: string;
  import_ical_url: string | null;
  export_token: string;
  sync_enabled: boolean;
  last_synced_at: string | null;
  last_sync_status: 'ok' | 'error' | null;
  last_sync_message: string | null;
  created_at: string;
};

export type ExternalCalendarEvent = {
  id: string;
  room_slug: string;
  external_uid: string;
  starts_on: string; // YYYY-MM-DD
  ends_on: string;   // YYYY-MM-DD, exclusive (same semantics as check_out)
  source: string;
  summary: string | null;
  raw_payload: string | null;
  synced_at: string;
};

/** Minimal shape parsed from a VEVENT block */
export type ParsedVEvent = {
  uid: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD, exclusive
  summary?: string;
  rawBlock: string;
};

export type SyncResult = {
  upserted: number;
  removed: number;
  error?: string;
};
