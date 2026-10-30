/**
 * Jednokratni kontrolirani MyRent live upis — SAMO via lokalna skripta.
 * NE mijenja isMyRentLiveWriteAllowed() hard-gate.
 * Default: DRY-RUN. Stvarni POST zahtijeva eksplicitnu potvrdu.
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import type { BookingForMyRentSync } from './myrent.booking-payload';
import { buildMyRentRentAddPayload } from './myrent.booking-payload';
import {
  buildMyRentRentAddRequestBody,
  parseMyRentRentAddResponse,
} from './myrent.write-transport';
import { fetchMyRentCalendar } from './myrent.calendar';
import { getMyRentObjectId, isMyRentConfigured } from './myrent.config';
import {
  bookedRangesToOccupiedNights,
  occupiedDatesToBookedRanges,
} from './myrent.ranges';
import { getMyRentToken } from './myrent.auth';
import { myrentRequest } from './myrent.client';
import { isMyRentLiveWriteAllowed } from './myrent.write-config';
import { getMyRentSyncStore } from './myrent.sync-store';
import type { OneShotClaimResult, SyncStoreRow } from './myrent.sync-store';
import type { MyRentSyncRecord } from './myrent.booking-sync.types';
import { ginkoBookingNoteMarker } from './myrent.reconcile';

/** Trajni marker u last_error — claim PRIJE HTTP-a. */
export const MYRENT_ONE_SHOT_CLAIM_PREFIX = 'MYRENT_ONE_SHOT_CLAIM|';

/** Mora se točno proslijediti za stvarni write (ne dry-run). */
export const MYRENT_ONE_SHOT_LIVE_CONFIRM =
  'I_UNDERSTAND_LIVE_MYRENT_WRITE';

export type OneShotBookingRow = {
  id: string;
  room_slug: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  adults: number;
  children: number;
  total_price: number;
  deposit: number;
  deposit_paid: boolean;
  include_wellness: boolean;
  notes: string | null;
  status: string;
};

export type OneShotSafeSummary = {
  bookingId: string;
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  objectId: number;
  price: number;
  deposit: number;
  adults: number;
  children: number;
  rentSourceId: number;
  currencyId: string;
  noteMarker: string;
  dryRun: boolean;
};

export type OneShotResult = {
  ok: boolean;
  dryRun: boolean;
  aborted: boolean;
  status:
    | 'dry_run_ok'
    | 'live_ok'
    | 'uncertain'
    | 'failed'
    | 'blocked'
    | 'precheck_failed';
  message: string;
  summary: OneShotSafeSummary | null;
  myrentRentId: string | null;
};

export type OneShotDeps = {
  loadBooking: (bookingId: string) => Promise<OneShotBookingRow | null>;
  getSyncRecord: (bookingId: string) => Promise<SyncStoreRow | null>;
  /** Atomski claim — jedini način rezervacije prava na POST. */
  claimOneShotAttempt: (input: {
    bookingId: string;
    payloadErpId: string;
    objectId: number;
    claimError: string;
  }) => Promise<OneShotClaimResult>;
  saveSyncRecord: (record: MyRentSyncRecord) => Promise<void>;
  checkMyRentAvailability: (booking: OneShotBookingRow) => Promise<{
    ok: boolean;
    message: string;
  }>;
  /** Osvježi auth PRIJE claima/POST-a (bez ponavljanja write HTTP-a). */
  prepareAuthForWrite?: () => Promise<void>;
  /** Jedan POST bez auth retryja. */
  postRentAdd: (body: Record<string, unknown>) => Promise<unknown>;
  nowIso?: () => string;
  log?: (line: string) => void;
};

function logSafe(
  log: ((line: string) => void) | undefined,
  line: string,
): void {
  (log ?? console.info)(line);
}

/** Bez PII / secretata. */
export function toOneShotSafeSummary(
  booking: OneShotBookingRow,
  payload: ReturnType<typeof buildMyRentRentAddPayload>,
  dryRun: boolean,
): OneShotSafeSummary {
  return {
    bookingId: booking.id,
    roomSlug: booking.room_slug,
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    objectId: payload.object_id,
    price: payload.price,
    deposit: payload.in_advance,
    adults: payload.adults,
    children: payload.children,
    rentSourceId: payload.rent_source_id,
    currencyId: payload.currency_id,
    noteMarker: ginkoBookingNoteMarker(booking.id),
    dryRun,
  };
}

export function assertOneShotBookingEligible(booking: OneShotBookingRow): {
  ok: boolean;
  message: string;
} {
  if (booking.status === 'cancelled') {
    return { ok: false, message: 'Rezervacija je cancelled.' };
  }
  if (booking.status !== 'confirmed') {
    return {
      ok: false,
      message: `Rezervacija nije confirmed (status=${booking.status}).`,
    };
  }
  if (booking.deposit_paid !== true) {
    return { ok: false, message: 'deposit_paid mora biti true.' };
  }
  return { ok: true, message: 'OK' };
}

/**
 * Već bilo jednokratnog pokušaja / live uspjeha / uncertain → nema novog POST-a.
 */
export function isOneShotAlreadyAttempted(
  row: SyncStoreRow | MyRentSyncRecord | null,
): { attempted: boolean; reason: string | null } {
  if (!row) return { attempted: false, reason: null };
  if (row.confirmedLiveSync === true && row.myrentRentId) {
    return { attempted: true, reason: 'confirmed_live_sync' };
  }
  if (row.status === 'live_ok') {
    return { attempted: true, reason: 'status_live_ok' };
  }
  if (row.status === 'uncertain') {
    return { attempted: true, reason: 'status_uncertain' };
  }
  if (
    typeof row.error === 'string' &&
    row.error.startsWith(MYRENT_ONE_SHOT_CLAIM_PREFIX)
  ) {
    return { attempted: true, reason: 'claim_marker' };
  }
  return { attempted: false, reason: null };
}

/**
 * Zasebna autorizacija skripte — NE koristi isMyRentLiveWriteAllowed().
 */
export function isMyRentOneShotLiveAuthorized(input: {
  bookingId: string;
  explicitBookingId: string;
  liveConfirmToken: string | null | undefined;
}): { authorized: boolean; dryRun: boolean; message: string } {
  const expected = input.explicitBookingId.trim();
  const actual = input.bookingId.trim();
  if (!expected || !actual || expected !== actual) {
    return {
      authorized: false,
      dryRun: true,
      message:
        'UUID rezervacije mora točno odgovarati eksplicitno zadanom --booking-id.',
    };
  }
  const token = (input.liveConfirmToken ?? '').trim();
  if (!token) {
    return {
      authorized: true,
      dryRun: true,
      message: 'DRY-RUN (nema --confirm-live-write).',
    };
  }
  if (token !== MYRENT_ONE_SHOT_LIVE_CONFIRM) {
    return {
      authorized: false,
      dryRun: true,
      message: `Neispravan confirm token. Očekivano točno: ${MYRENT_ONE_SHOT_LIVE_CONFIRM}`,
    };
  }
  return {
    authorized: true,
    dryRun: false,
    message: 'Live write autoriziran za jedan UUID (one-shot).',
  };
}

export function buildOneShotClaimError(
  bookingId: string,
  atIso: string,
): string {
  return `${MYRENT_ONE_SHOT_CLAIM_PREFIX}${atIso}|${bookingId}`;
}

/** Claim je potvrđen u bazi tek kad je uncertain + claim marker. */
export function isConfirmedOneShotClaim(
  row: SyncStoreRow | MyRentSyncRecord | null,
): boolean {
  return (
    row != null &&
    row.status === 'uncertain' &&
    typeof row.error === 'string' &&
    row.error.startsWith(MYRENT_ONE_SHOT_CLAIM_PREFIX)
  );
}

export async function checkMyRentStayAvailableReadOnly(
  booking: OneShotBookingRow,
): Promise<{ ok: boolean; message: string }> {
  if (!isMyRentConfigured()) {
    return { ok: false, message: 'MyRent env nije konfiguriran.' };
  }
  const objectId = getMyRentObjectId(booking.room_slug);
  if (objectId == null) {
    return {
      ok: false,
      message: `Nema MyRent object_id za sobu ${booking.room_slug}.`,
    };
  }
  try {
    const calendar = await fetchMyRentCalendar({
      objectId,
      roomSlug: booking.room_slug,
      dateFrom: booking.check_in,
      dateUntil: booking.check_out,
    });
    const myrentRanges = occupiedDatesToBookedRanges(
      calendar.occupied.map((d) => d.day),
    );
    const stayNights = bookedRangesToOccupiedNights([
      { check_in: booking.check_in, check_out: booking.check_out },
    ]);
    const occupied = bookedRangesToOccupiedNights(myrentRanges);
    for (const night of stayNights) {
      if (occupied.has(night)) {
        return {
          ok: false,
          message: `MyRent: termin nije slobodan (zauzet ${night}).`,
        };
      }
    }
    return { ok: true, message: 'MyRent termin slobodan (read-only).' };
  } catch {
    return { ok: false, message: 'MyRent kalendar nije dostupan (read-only).' };
  }
}

function toBookingForSync(b: OneShotBookingRow): BookingForMyRentSync {
  return {
    id: b.id,
    room_slug: b.room_slug,
    check_in: b.check_in,
    check_out: b.check_out,
    guest_name: b.guest_name,
    guest_email: b.guest_email,
    guest_phone: b.guest_phone,
    adults: b.adults,
    children: b.children,
    total_price: b.total_price,
    deposit: b.deposit,
    deposit_paid: b.deposit_paid,
    include_wellness: b.include_wellness === true,
    notes: b.notes,
    status:
      b.status === 'cancelled'
        ? 'cancelled'
        : b.status === 'confirmed'
          ? 'confirmed'
          : 'pending',
  };
}

function isTimeoutLike(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /timeout|etimedout|econnreset|abort|network/i.test(msg);
}

/**
 * Glavni one-shot tok (testabilan s mock deps).
 */
export async function runMyRentOneShotLive(
  input: {
    bookingId: string;
    explicitBookingId: string;
    liveConfirmToken?: string | null;
  },
  deps: OneShotDeps,
): Promise<OneShotResult> {
  const log = deps.log;
  const nowIso = deps.nowIso ?? (() => new Date().toISOString());
  const bookingId = input.bookingId.trim();

  // Hard-gate produkcije mora ostati false — skripta ga ne dirati
  if (isMyRentLiveWriteAllowed()) {
    logSafe(
      log,
      '[one-shot] UPOZORENJE: globalni hard-gate je true — prekidam (neočekivano).',
    );
    return {
      ok: false,
      dryRun: true,
      aborted: true,
      status: 'blocked',
      message:
        'Globalni isMyRentLiveWriteAllowed() je true — one-shot odbijen iz sigurnosti.',
      summary: null,
      myrentRentId: null,
    };
  }

  const auth = isMyRentOneShotLiveAuthorized({
    bookingId,
    explicitBookingId: input.explicitBookingId,
    liveConfirmToken: input.liveConfirmToken,
  });
  if (!auth.authorized) {
    return {
      ok: false,
      dryRun: true,
      aborted: true,
      status: 'blocked',
      message: auth.message,
      summary: null,
      myrentRentId: null,
    };
  }

  const dryRun = auth.dryRun;
  logSafe(log, `[one-shot] ${auth.message}`);

  const booking = await deps.loadBooking(bookingId);
  if (!booking) {
    return {
      ok: false,
      dryRun,
      aborted: true,
      status: 'precheck_failed',
      message: 'Rezervacija nije pronađena.',
      summary: null,
      myrentRentId: null,
    };
  }

  const eligible = assertOneShotBookingEligible(booking);
  if (!eligible.ok) {
    return {
      ok: false,
      dryRun,
      aborted: true,
      status: 'precheck_failed',
      message: eligible.message,
      summary: null,
      myrentRentId: null,
    };
  }

  const existing = await deps.getSyncRecord(bookingId);
  const prior = isOneShotAlreadyAttempted(existing);
  if (prior.attempted) {
    return {
      ok: false,
      dryRun,
      aborted: true,
      status: 'blocked',
      message: `Ponovni upis zabranjen (${prior.reason}).`,
      summary: null,
      myrentRentId: existing?.myrentRentId ?? null,
    };
  }

  const avail = await deps.checkMyRentAvailability(booking);
  if (!avail.ok) {
    return {
      ok: false,
      dryRun,
      aborted: true,
      status: 'precheck_failed',
      message: avail.message,
      summary: null,
      myrentRentId: null,
    };
  }
  logSafe(log, `[one-shot] ${avail.message}`);

  const payload = buildMyRentRentAddPayload(toBookingForSync(booking));
  const body = buildMyRentRentAddRequestBody(payload);
  const summary = toOneShotSafeSummary(booking, payload, dryRun);
  logSafe(
    log,
    `[one-shot] payload summary: ${JSON.stringify(summary)}`,
  );

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      aborted: false,
      status: 'dry_run_ok',
      message:
        'DRY-RUN završen — nije bilo claima ni POST /user/rent_add. Za live dodaj točan --confirm-live-write.',
      summary,
      myrentRentId: null,
    };
  }

  // Auth osvježi PRIJE claima — ne troši claim ako token ne uspije.
  if (deps.prepareAuthForWrite) {
    try {
      await deps.prepareAuthForWrite();
      logSafe(log, '[one-shot] auth osvježen prije claima (bez write retryja)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'auth greška';
      return {
        ok: false,
        dryRun: false,
        aborted: true,
        status: 'failed',
        message: `Auth priprema nije uspjela — bez claima i bez POST-a. ${msg}`.slice(
          0,
          300,
        ),
        summary,
        myrentRentId: null,
      };
    }
  }

  // --- LIVE: atomski trajni claim PRIJE HTTP-a ---
  const claimAt = nowIso();
  const claimError = buildOneShotClaimError(bookingId, claimAt);
  const claim = await deps.claimOneShotAttempt({
    bookingId,
    payloadErpId: bookingId,
    objectId: payload.object_id,
    claimError,
  });

  if (!claim.claimed || !isConfirmedOneShotClaim(claim.row)) {
    logSafe(
      log,
      `[one-shot] claim odbijen (${claim.reason ?? 'unconfirmed'}) — bez POST-a`,
    );
    return {
      ok: false,
      dryRun: false,
      aborted: true,
      status: 'blocked',
      message: `Atomski claim nije potvrđen (${claim.reason ?? 'unconfirmed'}) — HTTP nije poslan.`,
      summary,
      myrentRentId: claim.row?.myrentRentId ?? null,
    };
  }
  logSafe(log, '[one-shot] atomski claim potvrđen (uncertain) prije HTTP-a');

  try {
    const raw = await deps.postRentAdd(body);
    const parsed = parseMyRentRentAddResponse(raw);
    if (!parsed.unambiguous || !parsed.rentId) {
      await deps.saveSyncRecord({
        bookingId,
        status: 'uncertain',
        myrentRentId: null,
        error:
          'MyRent odgovor bez nedvosmislenog ID-a nakon one-shot claima — bez retryja.',
        payloadErpId: bookingId,
        objectId: payload.object_id,
        attemptedAt: nowIso(),
        confirmedLiveSync: false,
      });
      return {
        ok: false,
        dryRun: false,
        aborted: false,
        status: 'uncertain',
        message:
          'Odgovor bez prepoznatljivog ID-a — uncertain, bez ponovnog slanja.',
        summary,
        myrentRentId: null,
      };
    }

    await deps.saveSyncRecord({
      bookingId,
      status: 'live_ok',
      myrentRentId: parsed.rentId,
      error: null,
      payloadErpId: bookingId,
      objectId: payload.object_id,
      attemptedAt: nowIso(),
      confirmedLiveSync: true,
    });
    logSafe(
      log,
      `[one-shot] live_ok rentId=${parsed.rentId} (bez PII)`,
    );
    return {
      ok: true,
      dryRun: false,
      aborted: false,
      status: 'live_ok',
      message: 'MyRent rent_add uspješan (one-shot).',
      summary,
      myrentRentId: parsed.rentId,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'MyRent rent_add greška';
    const safeMsg = isTimeoutLike(err)
      ? `timeout/prekida veze: ${message}`
      : message;
    await deps.saveSyncRecord({
      bookingId,
      status: 'uncertain',
      myrentRentId: null,
      error: `One-shot live greška — bez retryja. ${safeMsg}`.slice(0, 500),
      payloadErpId: bookingId,
      objectId: payload.object_id,
      attemptedAt: nowIso(),
      confirmedLiveSync: false,
    });
    return {
      ok: false,
      dryRun: false,
      aborted: false,
      status: 'uncertain',
      message: `Live pokušaj završio bez potvrde (${isTimeoutLike(err) ? 'timeout' : 'error'}) — uncertain, bez retryja.`,
      summary,
      myrentRentId: null,
    };
  }
}

export async function createDefaultOneShotDeps(): Promise<OneShotDeps> {
  const store = getMyRentSyncStore();
  return {
    async loadBooking(bookingId) {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from('bookings')
        .select(
          'id, room_slug, check_in, check_out, guest_name, guest_email, guest_phone, adults, children, total_price, deposit, deposit_paid, include_wellness, notes, status',
        )
        .eq('id', bookingId)
        .maybeSingle();
      if (error) throw error;
      return (data as OneShotBookingRow | null) ?? null;
    },
    getSyncRecord: (id) => store.get(id),
    claimOneShotAttempt: (input) => store.claimOneShotAttempt(input),
    saveSyncRecord: (record) => store.save(record),
    checkMyRentAvailability: checkMyRentStayAvailableReadOnly,
    async prepareAuthForWrite() {
      await getMyRentToken({ forceRefresh: true });
    },
    async postRentAdd(body) {
      // Jedan pokušaj — bez 401/403 retryja (auth je već osvježen).
      return myrentRequest<unknown>({
        method: 'POST',
        path: '/user/rent_add',
        body,
        allowAuthRetry: false,
      });
    },
  };
}

function parseArgs(argv: string[]): {
  bookingId: string | null;
  confirm: string | null;
  help: boolean;
} {
  let bookingId: string | null = null;
  let confirm: string | null = null;
  let help = false;
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') help = true;
    else if (arg.startsWith('--booking-id=')) {
      bookingId = arg.slice('--booking-id='.length).trim();
    } else if (arg.startsWith('--confirm-live-write=')) {
      confirm = arg.slice('--confirm-live-write='.length).trim();
    }
  }
  return { bookingId, confirm, help };
}

export async function runMyRentOneShotCli(argv: string[]): Promise<number> {
  const { bookingId, confirm, help } = parseArgs(argv);
  if (help || !bookingId) {
    console.info(`Usage (default DRY-RUN):
  npx tsx --env-file=.env.local scripts/myrent-one-shot-live.ts --booking-id=<UUID>

Live (JEDAN pokušaj, trajni claim prije HTTP-a):
  npx tsx --env-file=.env.local scripts/myrent-one-shot-live.ts \\
    --booking-id=<UUID> \\
    --confirm-live-write=${MYRENT_ONE_SHOT_LIVE_CONFIRM}

Ne logira API ključeve ni PII gosta. Ne mijenja globalni hard-gate.
`);
    return help ? 0 : 2;
  }

  const deps = await createDefaultOneShotDeps();
  const result = await runMyRentOneShotLive(
    {
      bookingId,
      explicitBookingId: bookingId,
      liveConfirmToken: confirm,
    },
    deps,
  );
  console.info(
    JSON.stringify(
      {
        ok: result.ok,
        dryRun: result.dryRun,
        aborted: result.aborted,
        status: result.status,
        message: result.message,
        summary: result.summary,
        myrentRentId: result.myrentRentId,
        globalHardGateStillFalse: isMyRentLiveWriteAllowed() === false,
      },
      null,
      2,
    ),
  );
  return result.ok ? 0 : 1;
}
