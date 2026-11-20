import { describe, expect, it, vi } from 'vitest';
import type { MyRentCalendarDay } from './myrent.types';
import {
  activationIssueFor,
  calendarCoversEveryNight,
  readMyRentActivation,
  stayNights,
} from './myrent.activation-check';
import {
  PROPOSED_GUEST_STAY_UNCONFIRMED_COPY,
  buildMyRentActivationAlertText,
  dispatchMyRentActivationAlert,
  isMyRentActivationAlertEmailEnabled,
} from './myrent.activation-alert';

function day(date: string, occupied: boolean): MyRentCalendarDay {
  return {
    day: date,
    is_booked: occupied ? 'Y' : 'N',
    free: occupied ? 'N' : 'Y',
  };
}

describe('stay calendar activation', () => {
  it('broji sve noći osim dana odlaska', () => {
    expect(stayNights('2027-01-15', '2027-01-18')).toEqual([
      '2027-01-15',
      '2027-01-16',
      '2027-01-17',
    ]);
  });

  it('active=Y, ali kalendar nije blokiran na svim noćima', () => {
    const nights = stayNights('2027-01-15', '2027-01-18');
    const days = [
      day('2027-01-15', true),
      day('2027-01-16', false),
      day('2027-01-17', true),
    ];
    expect(calendarCoversEveryNight(days, nights)).toBe(false);
    expect(
      activationIssueFor({ active: 'Y', calendarBlocked: false }),
    ).toBe('calendar_open');
  });

  it('active=Y i sve noći zauzete → nema issue', () => {
    const nights = stayNights('2027-01-15', '2027-01-18');
    const days = nights.map((d) => day(d, true));
    expect(calendarCoversEveryNight(days, nights)).toBe(true);
    expect(
      activationIssueFor({ active: 'Y', calendarBlocked: true }),
    ).toBeNull();
  });

  it('active=N → not_yet_active, čak i ako je kalendar slučajno zatvoren', () => {
    expect(
      activationIssueFor({ active: 'N', calendarBlocked: true }),
    ).toBe('not_yet_active');
  });

  it('privremena API greška → check_failed, seenActiveAt ostaje prazan', async () => {
    const observed = await readMyRentActivation({
      rentGuid: 'guid',
      objectId: 16575,
      checkIn: '2027-01-15',
      checkOut: '2027-01-18',
      fetchActive: async () => {
        throw new Error('timeout');
      },
      fetchDays: async () => {
        throw new Error('timeout');
      },
    });
    expect(observed.issue).toBe('check_failed');
    expect(observed.seenActiveAt).toBeNull();
    expect(observed.calendarBlocked).toBe(false);
  });

  it('read pokriva svaku noć i ne postavlja seenActiveAt kad active nije Y', async () => {
    const fetchDays = vi.fn(async () => [
      day('2027-01-15', false),
      day('2027-01-16', false),
      day('2027-01-17', false),
    ]);
    const observed = await readMyRentActivation({
      rentGuid: 'guid',
      objectId: 16575,
      checkIn: '2027-01-15',
      checkOut: '2027-01-18',
      fetchActive: async () => 'N',
      fetchDays,
    });
    expect(fetchDays).toHaveBeenCalledWith({
      objectId: 16575,
      dateFrom: '2027-01-15',
      dateUntil: '2027-01-17',
    });
    expect(observed.seenActiveAt).toBeNull();
    expect(observed.issue).toBe('not_yet_active');
  });
});

describe('admin activation alert', () => {
  it('email je isključen i sendEmail se ne zove', async () => {
    const sendEmail = vi.fn(async () => undefined);
    const result = await dispatchMyRentActivationAlert(
      {
        bookingId: '2d99a0b3-5be4-4223-99df-345452bbeb08',
        issue: 'calendar_open',
        checkIn: '2027-01-15',
        checkOut: '2027-01-18',
      },
      { sendEmail, env: {} },
    );
    expect(isMyRentActivationAlertEmailEnabled({})).toBe(false);
    expect(result.email).toBe('skipped_disabled');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('tekst ne obećava povrat ni automatski otkaz', () => {
    const text = buildMyRentActivationAlertText({
      bookingId: 'abc',
      issue: 'not_yet_active',
      checkIn: '2027-01-15',
      checkOut: '2027-01-18',
    });
    expect(text.body).toContain('Nema automatskog otkazivanja ni povrata');
    expect(PROPOSED_GUEST_STAY_UNCONFIRMED_COPY.hr.title).toBe(
      'Depozit je naplaćen',
    );
    expect(PROPOSED_GUEST_STAY_UNCONFIRMED_COPY.hr.body).toContain(
      'nije potvrđen',
    );
  });
});
