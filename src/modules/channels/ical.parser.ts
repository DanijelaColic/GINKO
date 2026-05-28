// New — Phase 9. Minimal iCal (RFC 5545) parser.
// No external dependency. Handles the subset needed for booking blocks:
//   UID, DTSTART, DTEND, SUMMARY.
// Supports DATE and DATETIME values; strips TZID params; handles line folding.

import type { ParsedVEvent } from './channel.types';

// ── Line unfolding (RFC 5545 §3.1) ──────────────────────────────
// A line that begins with a SPACE or HTAB is a continuation of the previous.
function unfold(raw: string): string {
  return raw.replace(/\r?\n[ \t]/g, '');
}

// ── Extract property value (strips params, e.g. DTSTART;VALUE=DATE:...) ──
function propValue(line: string): string {
  const colon = line.indexOf(':');
  return colon >= 0 ? line.slice(colon + 1).trim() : '';
}

function propName(line: string): string {
  const colon = line.indexOf(':');
  const semi = line.indexOf(';');
  const end = semi >= 0 && semi < colon ? semi : colon;
  return end >= 0 ? line.slice(0, end).toUpperCase() : line.toUpperCase();
}

// ── Date parsing ─────────────────────────────────────────────────
// Accepts:
//   20240715           → date only
//   20240715T100000Z   → datetime UTC
//   20240715T100000    → datetime local
// Returns YYYY-MM-DD string. Invalid input returns ''.
function parseICalDate(value: string): string {
  // Strip anything after T (time portion)
  const datePart = value.split('T')[0].replace(/\D/g, '');
  if (datePart.length < 8) return '';
  const y = datePart.slice(0, 4);
  const m = datePart.slice(4, 6);
  const d = datePart.slice(6, 8);
  // Basic validity check
  const dateObj = new Date(`${y}-${m}-${d}`);
  if (isNaN(dateObj.getTime())) return '';
  return `${y}-${m}-${d}`;
}

// ── Main parser ──────────────────────────────────────────────────

export function parseICalEvents(icalText: string): ParsedVEvent[] {
  const unfolded = unfold(icalText);
  const lines = unfolded.split(/\r?\n/);

  const events: ParsedVEvent[] = [];
  let inEvent = false;
  let currentLines: string[] = [];

  for (const line of lines) {
    const upper = line.toUpperCase();

    if (upper === 'BEGIN:VEVENT') {
      inEvent = true;
      currentLines = [line];
      continue;
    }

    if (upper === 'END:VEVENT') {
      currentLines.push(line);
      const evt = extractEvent(currentLines);
      if (evt) events.push(evt);
      inEvent = false;
      currentLines = [];
      continue;
    }

    if (inEvent) {
      currentLines.push(line);
    }
  }

  return events;
}

function extractEvent(lines: string[]): ParsedVEvent | null {
  let uid = '';
  let startDate = '';
  let endDate = '';
  let summary = '';

  for (const line of lines) {
    const name = propName(line);
    const value = propValue(line);

    if (name === 'UID') {
      uid = value;
    } else if (name === 'DTSTART') {
      startDate = parseICalDate(value);
    } else if (name === 'DTEND') {
      endDate = parseICalDate(value);
    } else if (name === 'SUMMARY') {
      // Unescape iCal text escapes (\, \; \n \N)
      summary = value.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, ' ').replace(/\\\\/g, '\\');
    }
  }

  if (!uid || !startDate || !endDate) return null;
  if (endDate <= startDate) return null;

  // Truncate raw block to 2000 chars to avoid storing huge payloads
  const rawBlock = lines.join('\n').slice(0, 2000);

  return { uid, startDate, endDate, summary: summary || undefined, rawBlock };
}
