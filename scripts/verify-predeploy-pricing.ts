/**
 * Jednokratna provjera prije deploya — samo čitanje (price_period_details / calendar).
 * npx tsx --env-file=.env.local scripts/verify-predeploy-pricing.ts
 */
import { parseLocalDate } from '../src/modules/booking/dates';
import { calculateDeposit, DEPOSIT_PERCENT } from '../src/modules/booking/booking.config';
import { evaluateQuotedPrice } from '../src/modules/booking/quoted-price';
import { resolveBookingPrice } from '../src/modules/booking/resolve-booking-price';
import { getRoomBySlug } from '../src/modules/rooms/room.repository';
import { getAvailabilitySlugsForRoom } from '../src/modules/booking/availability.service';
import {
  getMyRentObjectId,
  getRoomSlugsForObjectId,
  isMyRentConfigured,
} from '../src/modules/myrent/myrent.config';
import { fetchMyRentPricePeriodDetails } from '../src/modules/myrent/myrent.price-period';
import { fetchMyRentCalendar } from '../src/modules/myrent/myrent.calendar';

process.env.MYRENT_PRICING_ENABLED = 'true';
process.env.MYRENT_PRICING_MOCK = 'false';

const STAY_CANDIDATES = [
  { checkIn: '2026-06-10', checkOut: '2026-06-13' }, // 3 nights
  { checkIn: '2026-07-08', checkOut: '2026-07-11' },
  { checkIn: '2026-08-12', checkOut: '2026-08-15' },
];

async function pickWorkingStay(): Promise<{
  checkIn: string;
  checkOut: string;
  nights: number;
}> {
  const room = getRoomBySlug('ginko-1');
  if (!room) throw new Error('ginko-1 missing');

  for (const c of STAY_CANDIDATES) {
    try {
      await resolveBookingPrice({
        room,
        checkIn: parseLocalDate(c.checkIn),
        checkOut: parseLocalDate(c.checkOut),
        adults: 2,
        children: 0,
      });
      const nights =
        (parseLocalDate(c.checkOut).getTime() -
          parseLocalDate(c.checkIn).getTime()) /
        (24 * 60 * 60 * 1000);
      return { ...c, nights };
    } catch {
      // try next
    }
  }
  throw new Error('Nijedan kandidat termina nije prošao quote');
}

function printDepositCheck(label: string, total: number, deposit: number) {
  const expected = calculateDeposit(total);
  const pct = Math.round(DEPOSIT_PERCENT * 100);
  const ok = deposit === expected;
  console.log(
    `  [deposit] ${label}: total=${total} €, deposit=${deposit} € (oček. ${pct}% = ${expected} €) ${ok ? 'OK' : 'MISMATCH'}`,
  );
  return ok;
}

async function main() {
  console.log('--- Konfiguracija ---');
  console.log('MyRent configured:', isMyRentConfigured());
  console.log('SPA object slugs:', getRoomSlugsForObjectId(7460).sort());
  console.log('spa-1 availability slugs:', getAvailabilitySlugsForRoom('ginko-spa-1').sort());
  console.log('spa-2 availability slugs:', getAvailabilitySlugsForRoom('ginko-spa-2').sort());
  console.log('spa-1 objectId:', getMyRentObjectId('ginko-spa-1'));
  console.log('spa-2 objectId:', getMyRentObjectId('ginko-spa-2'));

  const spa1 = getRoomBySlug('ginko-spa-1');
  const room1 = getRoomBySlug('ginko-1');
  const wellness = getRoomBySlug('ginko-spa-2');
  if (!spa1 || !room1 || !wellness) throw new Error('rooms missing');

  console.log('\n--- Apartman ginko-spa-1 (legacy 90 €) ---');
  for (const nights of [1, 2, 3] as const) {
    const checkIn = parseLocalDate('2027-05-10');
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    const res = await resolveBookingPrice({
      room: spa1,
      checkIn,
      checkOut,
      adults: 2,
    });
    const perNight = res.breakdown.totalPrice / nights;
    console.log(
      `  ${nights} noć(i): source=${res.source}, total=${res.breakdown.totalPrice} €, ${perNight} €/noć`,
    );
    printDepositCheck(`${nights}n`, res.breakdown.totalPrice, res.breakdown.deposit);
    if (perNight !== 90) {
      console.error('  FAIL: očekivano 90 €/noć');
      process.exitCode = 1;
    }
  }

  if (!isMyRentConfigured()) {
    console.log('\n⚠ MyRent env nije postavljen — preskačem live API.');
    return;
  }

  const stay = await pickWorkingStay();
  console.log(`\n--- MyRent Website (A) live — termin ${stay.checkIn} → ${stay.checkOut} (${stay.nights} noći) ---`);

  const g1Obj = getMyRentObjectId('ginko-1')!;
  const spa2Obj = getMyRentObjectId('ginko-spa-2')!;

  const [periodG1, periodWellness] = await Promise.all([
    fetchMyRentPricePeriodDetails({
      objectId: g1Obj,
      dateFrom: stay.checkIn,
      dateUntil: stay.checkOut,
      adults: 2,
      children: 0,
    }),
    fetchMyRentPricePeriodDetails({
      objectId: spa2Obj,
      dateFrom: stay.checkIn,
      dateUntil: stay.checkOut,
      adults: 2,
      children: 0,
    }),
  ]);

  console.log(`  Ginko 1 (object ${g1Obj}) API accommodationTotal: ${periodG1.accommodationTotal} €`);
  console.log(
    `    nightly:`,
    periodG1.nights.map((n) => `${n.day}=${n.price}`).join(', '),
  );
  console.log(
    `  Wellness (object ${spa2Obj}) API accommodationTotal: ${periodWellness.accommodationTotal} €`,
  );
  console.log(
    `    nightly:`,
    periodWellness.nights.map((n) => `${n.day}=${n.price}`).join(', '),
  );

  const [quoteG1, quoteWellness] = await Promise.all([
    resolveBookingPrice({
      room: room1,
      checkIn: parseLocalDate(stay.checkIn),
      checkOut: parseLocalDate(stay.checkOut),
      adults: 2,
    }),
    resolveBookingPrice({
      room: wellness,
      checkIn: parseLocalDate(stay.checkIn),
      checkOut: parseLocalDate(stay.checkOut),
      adults: 2,
    }),
  ]);

  console.log(
    `  resolveBookingPrice ginko-1: source=${quoteG1.source}, total=${quoteG1.breakdown.totalPrice} €`,
  );
  console.log(
    `  resolveBookingPrice spa-2: source=${quoteWellness.source}, total=${quoteWellness.breakdown.totalPrice} €`,
  );

  const apiVsResolveG1 =
    quoteG1.breakdown.totalPrice === periodG1.accommodationTotal;
  const apiVsResolveSpa =
    quoteWellness.breakdown.totalPrice === periodWellness.accommodationTotal;
  console.log(`  API === resolve ginko-1: ${apiVsResolveG1 ? 'OK' : 'MISMATCH'}`);
  console.log(`  API === resolve spa-2: ${apiVsResolveSpa ? 'OK' : 'MISMATCH'}`);

  // Wellness +40: usporedba s raw API (surcharge bi značio total > API)
  if (quoteWellness.breakdown.totalPrice > periodWellness.accommodationTotal) {
    console.error(
      `  FAIL: wellness total ${quoteWellness.breakdown.totalPrice} > API ${periodWellness.accommodationTotal} (moguća surcharge)`,
    );
    process.exitCode = 1;
  } else {
    console.log('  Wellness bez Ginko surcharge (total ≤ API smještaj): OK');
  }

  printDepositCheck('ginko-1', quoteG1.breakdown.totalPrice, quoteG1.breakdown.deposit);
  printDepositCheck('spa-2', quoteWellness.breakdown.totalPrice, quoteWellness.breakdown.deposit);

  const quoteAgainG1 = await resolveBookingPrice({
    room: room1,
    checkIn: parseLocalDate(stay.checkIn),
    checkOut: parseLocalDate(stay.checkOut),
    adults: 2,
  });
  const match = evaluateQuotedPrice({
    quoted: {
      totalPrice: quoteG1.breakdown.totalPrice,
      deposit: quoteG1.breakdown.deposit,
    },
    server: quoteAgainG1.breakdown,
  });
  console.log(`  evaluateQuotedPrice (display → create): ${match}`);

  console.log('\n--- Kalendar object 7460 (dijeljena dostupnost) ---');
  const calFrom = stay.checkIn;
  const calUntil = stay.checkOut;
  const cal1 = await fetchMyRentCalendar({
    objectId: 7460,
    roomSlug: 'ginko-spa-1',
    dateFrom: calFrom,
    dateUntil: calUntil,
  });
  const cal2 = await fetchMyRentCalendar({
    objectId: 7460,
    roomSlug: 'ginko-spa-2',
    dateFrom: calFrom,
    dateUntil: calUntil,
  });
  const occ1 = cal1.occupied.map((d) => d.day).sort().join(',');
  const occ2 = cal2.occupied.map((d) => d.day).sort().join(',');
  console.log(`  spa-1 occupied: ${occ1 || '(none)'}`);
  console.log(`  spa-2 occupied: ${occ2 || '(none)'}`);
  console.log(`  occupied sets equal: ${occ1 === occ2 ? 'OK' : 'MISMATCH'}`);
  if (occ1 !== occ2) process.exitCode = 1;
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});