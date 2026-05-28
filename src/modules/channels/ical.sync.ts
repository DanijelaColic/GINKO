// New — Phase 9. Fetch remote iCal, parse VEVENTs, upsert into external_calendar_events.
// Server-side only (fetches external URLs). Called from admin sync endpoint.

import { createServerSupabaseClient } from '@/lib/supabase';
import { parseICalEvents } from './ical.parser';
import type { SyncResult } from './channel.types';

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch a remote iCal URL, parse all VEVENTs, and upsert them into
 * external_calendar_events for the given room_slug.
 * Stale events (present in DB but absent from the feed) are deleted.
 * Updates room_channel_mappings with sync status.
 */
export async function syncICalForRoom(roomSlug: string): Promise<SyncResult> {
  const supabase = createServerSupabaseClient();

  // Load mapping
  const { data: mapping, error: mapErr } = await supabase
    .from('room_channel_mappings')
    .select('id, import_ical_url, sync_enabled')
    .eq('room_slug', roomSlug)
    .single();

  if (mapErr || !mapping) {
    return { upserted: 0, removed: 0, error: 'Nema konfiguracije kanala za ovu sobu' };
  }

  if (!mapping.sync_enabled) {
    return { upserted: 0, removed: 0, error: 'Sinkronizacija je onemogućena' };
  }

  if (!mapping.import_ical_url) {
    return { upserted: 0, removed: 0, error: 'Nije postavljen URL za uvoz' };
  }

  // Fetch iCal feed
  let icalText: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(mapping.import_ical_url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    icalText = await res.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateSyncStatus(supabase, roomSlug, 'error', `Greška dohvata: ${message}`);
    return { upserted: 0, removed: 0, error: `Greška dohvata: ${message}` };
  }

  // Parse VEVENTs
  const events = parseICalEvents(icalText);

  if (events.length === 0) {
    // Could be an empty calendar or parse failure — treat as ok but note it
    await updateSyncStatus(supabase, roomSlug, 'ok', `Nema događaja (ukupno 0)`);
    return { upserted: 0, removed: 0 };
  }

  // Upsert events
  const rows = events.map((e) => ({
    room_slug: roomSlug,
    external_uid: e.uid,
    starts_on: e.startDate,
    ends_on: e.endDate,
    source: 'ical',
    summary: e.summary ?? null,
    raw_payload: e.rawBlock,
    synced_at: new Date().toISOString(),
  }));

  const { error: upsertErr } = await supabase
    .from('external_calendar_events')
    .upsert(rows, { onConflict: 'room_slug,external_uid' });

  if (upsertErr) {
    await updateSyncStatus(supabase, roomSlug, 'error', upsertErr.message);
    return { upserted: 0, removed: 0, error: upsertErr.message };
  }

  // Remove stale events (in DB for this room but not in current feed)
  const currentUids = events.map((e) => e.uid);
  const { data: stale } = await supabase
    .from('external_calendar_events')
    .select('id')
    .eq('room_slug', roomSlug)
    .not('external_uid', 'in', `(${currentUids.map((u) => `"${u.replace(/"/g, '\\"')}"`).join(',')})`);

  let removed = 0;
  if (stale && stale.length > 0) {
    const staleIds = stale.map((r) => r.id);
    const { error: delErr } = await supabase
      .from('external_calendar_events')
      .delete()
      .in('id', staleIds);
    if (!delErr) removed = staleIds.length;
  }

  await updateSyncStatus(
    supabase,
    roomSlug,
    'ok',
    `Uvezeno ${events.length} događaja, uklonjeno ${removed} starih`,
  );

  return { upserted: events.length, removed };
}

// ── Helpers ──────────────────────────────────────────────────────

async function updateSyncStatus(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  roomSlug: string,
  status: 'ok' | 'error',
  message: string,
) {
  await supabase
    .from('room_channel_mappings')
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_status: status,
      last_sync_message: message,
    })
    .eq('room_slug', roomSlug);
}

/**
 * Ensure a room_channel_mappings record exists for a room.
 * Creates one with defaults if missing.
 */
export async function ensureChannelMapping(roomSlug: string) {
  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from('room_channel_mappings')
    .select('id')
    .eq('room_slug', roomSlug)
    .single();

  if (!existing) {
    await supabase
      .from('room_channel_mappings')
      .insert({ room_slug: roomSlug });
  }
}
