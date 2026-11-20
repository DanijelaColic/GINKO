import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookingForMyRentSync } from './myrent.booking-payload';
import * as paymentSyncConfig from './myrent.payment-sync-config';
import { MYRENT_TEST_PAYMENT_SYNC_CONFIRM_TOKEN } from './myrent.payment-sync-config';
import {
  buildMyRentPaymentAddRequestBody,
  parseMyRentPaymentAddResponse,
} from './myrent.payment-transport';
import * as paymentTransport from './myrent.payment-transport';
import {
  createMemoryMyRentPaymentSyncStore,
  setMyRentPaymentSyncStoreForTests,
} from './myrent.payment-sync-store';
import {
  ensureMyRentDepositPaymentSync,
  isMyRentPaymentSyncBlocked,
} from './myrent.payment-sync';
import * as rentDepositRead from './myrent.rent-deposit-read';

function sampleBooking(
  overrides: Partial<BookingForMyRentSync> = {},
): BookingForMyRentSync {
  return {
    id: 'c9699632-a6b0-4d86-b861-671c64a88f79',
    room_slug: 'ginko-1',
    check_in: '2027-01-13',
    check_out: '2027-01-14',
    guest_name: 'Test Guest',
    guest_email: 'test@example.com',
    guest_phone: null,
    adults: 2,
    children: 0,
    total_price: 60,
    deposit: 30,
    deposit_paid: true,
    include_wellness: false,
    notes: null,
    status: 'confirmed',
    ...overrides,
  };
}

describe('buildMyRentPaymentAddRequestBody', () => {
  it('mapira depozit 30 € na rent 2521022 i method ID iz env', () => {
    const body = buildMyRentPaymentAddRequestBody({
      myrentRentId: '2521022',
      depositAmount: 30,
      paymentMethodId: 122675,
    });
    expect(body).toEqual({
      rent_id: 2521022,
      price: 30,
      payment_method_id: 122675,
      currency_id: 2,
      exchange: 1,
      direction: 1,
      paid: 'Y',
      price_with_tax: 'Y',
    });
  });
});

describe('parseMyRentPaymentAddResponse', () => {
  it('prihvaća string ok', () => {
    expect(parseMyRentPaymentAddResponse('ok').ok).toBe(true);
  });
  it('prazan objekt je nejasan', () => {
    expect(parseMyRentPaymentAddResponse({}).unambiguous).toBe(false);
  });
});

describe('ensureMyRentDepositPaymentSync', () => {
  let transportSpy: ReturnType<typeof vi.spyOn>;
  let advanceSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setMyRentPaymentSyncStoreForTests(createMemoryMyRentPaymentSyncStore());
    vi.restoreAllMocks();
    transportSpy = vi.spyOn(paymentTransport, 'transportMyRentPaymentAdd');
    advanceSpy = vi.spyOn(rentDepositRead, 'fetchMyRentAdvancePaidFlag');
    delete process.env.MYRENT_PAYMENT_SYNC_ENABLED;
    delete process.env.MYRENT_PAYMENT_METHOD_SAFERPAY_ID;
    delete process.env.MYRENT_PAYMENT_SYNC_ON_SAFERPAY_TEST;
    delete process.env.MYRENT_TEST_PAYMENT_SYNC_CONFIRM;
    delete process.env.MYRENT_PRODUCTION_PAYMENT_SYNC_CONFIRM;
    advanceSpy.mockResolvedValue('N');
  });

  afterEach(() => {
    setMyRentPaymentSyncStoreForTests(null);
  });

  it('default: skipped_disabled bez HTTP', async () => {
    process.env.MYRENT_PAYMENT_METHOD_SAFERPAY_ID = '122675';
    const result = await ensureMyRentDepositPaymentSync({
      booking: sampleBooking(),
      myrentRentId: '2521022',
    });
    expect(result?.record.status).toBe('skipped_disabled');
    expect(transportSpy).not.toHaveBeenCalled();
  });

  it('uncertain nakon nejasnog odgovora — bez drugog pokušaja', async () => {
    process.env.MYRENT_PAYMENT_SYNC_ENABLED = 'true';
    process.env.MYRENT_PAYMENT_METHOD_SAFERPAY_ID = '122675';
    vi.spyOn(
      paymentSyncConfig,
      'isMyRentPaymentSyncLiveAllowedForBooking',
    ).mockReturnValue(true);

    transportSpy.mockResolvedValueOnce({
      ok: false,
      mode: 'live',
      error: 'nejasan',
      confirmedLiveSync: false,
      uncertain: true,
    });

    const first = await ensureMyRentDepositPaymentSync({
      booking: sampleBooking(),
      myrentRentId: '2521022',
    });
    expect(first?.record.status).toBe('uncertain');
    expect(transportSpy).toHaveBeenCalledTimes(1);

    const second = await ensureMyRentDepositPaymentSync({
      booking: sampleBooking(),
      myrentRentId: '2521022',
    });
    expect(isMyRentPaymentSyncBlocked({ status: 'uncertain' }).blocked).toBe(
      true,
    );
    expect(second?.record.status).toBe('uncertain');
    expect(transportSpy).toHaveBeenCalledTimes(1);
  });

  it('live_ok na uspjehu; ponovljeni webhook → skipped_duplicate', async () => {
    process.env.MYRENT_PAYMENT_SYNC_ENABLED = 'true';
    process.env.MYRENT_PAYMENT_METHOD_SAFERPAY_ID = '122675';
    vi.spyOn(
      paymentSyncConfig,
      'isMyRentPaymentSyncLiveAllowedForBooking',
    ).mockReturnValue(true);

    transportSpy.mockResolvedValue({
      ok: true,
      mode: 'live',
      error: null,
      confirmedLiveSync: true,
      uncertain: false,
    });

    const first = await ensureMyRentDepositPaymentSync({
      booking: sampleBooking(),
      myrentRentId: '2521022',
    });
    expect(first?.record.status).toBe('live_ok');
    expect(transportSpy).toHaveBeenCalledTimes(1);

    const second = await ensureMyRentDepositPaymentSync({
      booking: sampleBooking(),
      myrentRentId: '2521022',
    });
    expect(second?.record.status).toBe('skipped_duplicate');
    expect(transportSpy).toHaveBeenCalledTimes(1);
  });

  it('Saferpay TEST blokira bez MYRENT_PAYMENT_SYNC_ON_SAFERPAY_TEST', async () => {
    process.env.MYRENT_PAYMENT_SYNC_ENABLED = 'true';
    process.env.MYRENT_PAYMENT_METHOD_SAFERPAY_ID = '122675';
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'live';
    process.env.MYRENT_LIVE_SCOPE = 'test';
    process.env.MYRENT_TEST_LIVE_CONFIRM = 'I_UNDERSTAND_TEST_LIVE_MYRENT_WRITE';
    process.env.MYRENT_LIVE_INSTALL_ID = 'x';
    process.env.MYRENT_EXPECTED_INSTALL_ID = 'x';
    process.env.MYRENT_TEST_LIVE_SITE_HOSTS = 'localhost';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    process.env.SAFERPAY_BASE_URL = 'https://test.saferpay.com/api';

    const result = await ensureMyRentDepositPaymentSync({
      booking: sampleBooking(),
      myrentRentId: '2521022',
    });
    expect(result?.record.status).toBe('skipped_disabled');
    expect(result?.record.error).toBe('saferpay_test_blocked');
    expect(transportSpy).not.toHaveBeenCalled();
  });

  it('failed na jasan HTTP 4xx/5xx (bez uncertain)', async () => {
    process.env.MYRENT_PAYMENT_SYNC_ENABLED = 'true';
    process.env.MYRENT_PAYMENT_METHOD_SAFERPAY_ID = '122675';
    vi.spyOn(
      paymentSyncConfig,
      'isMyRentPaymentSyncLiveAllowedForBooking',
    ).mockReturnValue(true);
    transportSpy.mockResolvedValueOnce({
      ok: false,
      mode: 'live',
      error: 'HTTP 400',
      confirmedLiveSync: false,
      uncertain: false,
    });
    const result = await ensureMyRentDepositPaymentSync({
      booking: sampleBooking(),
      myrentRentId: '2521022',
    });
    expect(result?.record.status).toBe('failed');
    expect(result?.adminAlert).toBeNull();
  });

  it('Saferpay TEST dopušten uz test payment confirm token', async () => {
    process.env.MYRENT_PAYMENT_SYNC_ENABLED = 'true';
    process.env.MYRENT_PAYMENT_METHOD_SAFERPAY_ID = '122675';
    process.env.MYRENT_PAYMENT_SYNC_ON_SAFERPAY_TEST = 'true';
    process.env.MYRENT_TEST_PAYMENT_SYNC_CONFIRM =
      MYRENT_TEST_PAYMENT_SYNC_CONFIRM_TOKEN;
    process.env.SAFERPAY_BASE_URL = 'https://test.saferpay.com/api';
    vi.spyOn(
      paymentSyncConfig,
      'isMyRentPaymentSyncLiveAllowedForBooking',
    ).mockReturnValue(true);

    transportSpy.mockResolvedValue({
      ok: true,
      mode: 'live',
      error: null,
      confirmedLiveSync: true,
      uncertain: false,
    });

    const result = await ensureMyRentDepositPaymentSync({
      booking: sampleBooking(),
      myrentRentId: '2521022',
    });
    expect(result?.record.status).toBe('live_ok');
    expect(transportSpy).toHaveBeenCalledTimes(1);
  });
});