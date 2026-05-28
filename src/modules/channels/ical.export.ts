// New — Phase 9. Generate iCal (.ics) content from room bookings + blocked dates.
// Produces a VCALENDAR with one VEVENT per booking/block.
// Used by the public export endpoint /api/ical/[token].

import { createServerSupabaseClient } from '@/lib/supabase';
import { rooms as staticRooms } from '@/modules/rooms/rooms.config';

/** Format a YYYY-MM-DD string as iCal DATE value: 20240715 */
function toICalDate(ymd: string): string {
  return ymd.replace(/-/g, '');
}

/** Escape iCal text: commas and semicolons must be escaped */
function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/** Fold long lines (RFC 5545: lines > 75 chars must be folded) */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, 75));
  let pos = 75;
  while (pos < line.length) {
    chunks.push(' ' + line.slice(pos, pos + 74));
    pos += 74;
  }
  return chunks.join('\r\n');
}

export async function generateRoomICalFeed(roomSlug: string): Promise<string> {
  const supabase = createServerSupabaseClient();
  const room = staticRooms.find((r) => r.slug === roomSlug);
  const roomName = room?.name ?? roomSlug;

  // Fetch confirmed + pending bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, check_in, check_out, status')
    .eq('room_slug', roomSlug)
    .in('status', ['confirmed', 'pending'])
    .order('check_in', { ascending: true });

  // Fetch manual blocks
  const { data: blocks } = await supabase
    .from('blocked_dates')
    .select('id, check_in, check_out, reason')
    .eq('room_slug', roomSlug)
    .order('check_in', { ascending: true });

  const events: string[] = [];

  // Add bookings as VEVENTs
  for (const b of bookings ?? []) {
    events.push(buildVEvent({
      uid: `booking-${b.id}@ginko-sobe`,
      dtstart: toICalDate(b.check_in),
      dtend: toICalDate(b.check_out),
      summary: 'Rezervirano',
    }));
  }

  // Add manual blocks as VEVENTs
  for (const bl of blocks ?? []) {
    events.push(buildVEvent({
      uid: `block-${bl.id}@ginko-sobe`,
      dtstart: toICalDate(bl.check_in),
      dtend: toICalDate(bl.check_out),
      summary: bl.reason ? `Blokirano: ${bl.reason}` : 'Blokirano',
    }));
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Ginko Sobe//Booking Calendar//EN`,
    foldLine(`X-WR-CALNAME:${escapeText(roomName)}`),
    'X-WR-TIMEZONE:Europe/Zagreb',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ];

  return lines.join('\r\n') + '\r\n';
}

function buildVEvent({
  uid,
  dtstart,
  dtend,
  summary,
}: {
  uid: string;
  dtstart: string;
  dtend: string;
  summary: string;
}): string {
  const lines = [
    'BEGIN:VEVENT',
    foldLine(`UID:${uid}`),
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    foldLine(`SUMMARY:${escapeText(summary)}`),
    'STATUS:CONFIRMED',
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    'END:VEVENT',
  ];
  return lines.join('\r\n');
}
