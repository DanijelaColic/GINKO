/**
 * MyRent payment_add transport (live HTTP, hard-gated).
 */

import { getMyRentConfig } from './myrent.config';
import { myrentRequest } from './myrent.client';
import {
  getMyRentSaferpayPaymentMethodId,
  isMyRentPaymentSyncLiveAllowedForBooking,
} from './myrent.payment-sync-config';
import type { MyRentPaymentAddPayload } from './myrent.payment-sync.types';

export type MyRentPaymentTransportResult = {
  ok: boolean;
  mode: 'mock' | 'live';
  error: string | null;
  /** true samo nakon eksplicitnog "ok" odgovora */
  confirmedLiveSync: boolean;
  uncertain: boolean;
};

function isTimeoutLikeError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /timeout|etimedout|econnreset|abort|network/i.test(msg);
}

export function buildMyRentPaymentAddRequestBody(input: {
  myrentRentId: string;
  depositAmount: number;
  paymentMethodId: number;
}): MyRentPaymentAddPayload {
  const rentId = Number(input.myrentRentId);
  const price = Math.round(Number(input.depositAmount));
  if (!Number.isFinite(rentId) || rentId <= 0) {
    throw new Error('Nevažeći MyRent rent_id za payment_add.');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Nevažeći iznos depozita za payment_add.');
  }
  return {
    rent_id: rentId,
    price,
    payment_method_id: input.paymentMethodId,
    currency_id: 2,
    exchange: 1,
    direction: 1,
    paid: 'Y',
    price_with_tax: 'Y',
  };
}

export function parseMyRentPaymentAddResponse(raw: unknown): {
  ok: boolean;
  unambiguous: boolean;
} {
  if (raw === 'ok' || raw === 'OK') {
    return { ok: true, unambiguous: true };
  }
  if (typeof raw === 'string' && raw.trim().toLowerCase() === 'ok') {
    return { ok: true, unambiguous: true };
  }
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>;
    const status = o.status ?? o.Status;
    if (status === 'ok' || status === 'OK') {
      return { ok: true, unambiguous: true };
    }
    if (Object.keys(o).length === 0) {
      return { ok: false, unambiguous: false };
    }
  }
  return { ok: false, unambiguous: false };
}

export async function executeLiveMyRentPaymentAdd(params: {
  bookingId: string;
  myrentRentId: string;
  depositAmount: number;
}): Promise<MyRentPaymentTransportResult> {
  if (!isMyRentPaymentSyncLiveAllowedForBooking(params.bookingId)) {
    return {
      ok: false,
      mode: 'live',
      error: 'MyRent payment_add nije dozvoljen (gate).',
      confirmedLiveSync: false,
      uncertain: false,
    };
  }

  const paymentMethodId = getMyRentSaferpayPaymentMethodId();
  if (paymentMethodId == null) {
    return {
      ok: false,
      mode: 'live',
      error: 'MYRENT_PAYMENT_METHOD_SAFERPAY_ID nije postavljen.',
      confirmedLiveSync: false,
      uncertain: false,
    };
  }

  const cfg = getMyRentConfig();
  const userId = Number(cfg.userId);
  if (!Number.isFinite(userId)) {
    return {
      ok: false,
      mode: 'live',
      error: 'MYRENT_USER_ID nije valjan broj.',
      confirmedLiveSync: false,
      uncertain: false,
    };
  }

  let body: MyRentPaymentAddPayload;
  try {
    body = buildMyRentPaymentAddRequestBody({
      myrentRentId: params.myrentRentId,
      depositAmount: params.depositAmount,
      paymentMethodId,
    });
  } catch (err) {
    return {
      ok: false,
      mode: 'live',
      error: err instanceof Error ? err.message : 'payment_add payload greška',
      confirmedLiveSync: false,
      uncertain: false,
    };
  }

  try {
    const raw = await myrentRequest<unknown>({
      method: 'POST',
      path: `/rents/payment_add/${userId}`,
      body: body as unknown as Record<string, unknown>,
      allowAuthRetry: false,
    });
    const parsed = parseMyRentPaymentAddResponse(raw);
    if (parsed.ok && parsed.unambiguous) {
      return {
        ok: true,
        mode: 'live',
        error: null,
        confirmedLiveSync: true,
        uncertain: false,
      };
    }
    return {
      ok: false,
      mode: 'live',
      error: 'MyRent payment_add odgovor nije nedvosmislen ok.',
      confirmedLiveSync: false,
      uncertain: true,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'MyRent payment_add greška';
    if (isTimeoutLikeError(err)) {
      return {
        ok: false,
        mode: 'live',
        error: `MyRent payment timeout — moguće da je uplata knjižena: ${message}`,
        confirmedLiveSync: false,
        uncertain: true,
      };
    }
    return {
      ok: false,
      mode: 'live',
      error: message,
      confirmedLiveSync: false,
      uncertain: true,
    };
  }
}

/** Mock — bez HTTP-a (testovi / gate zatvoren). */
export async function transportMyRentPaymentAdd(params: {
  bookingId: string;
  myrentRentId: string;
  depositAmount: number;
}): Promise<MyRentPaymentTransportResult> {
  if (isMyRentPaymentSyncLiveAllowedForBooking(params.bookingId)) {
    return executeLiveMyRentPaymentAdd(params);
  }
  return {
    ok: false,
    mode: 'mock',
    error: 'MyRent payment_add mock/disabled — nema HTTP poziva.',
    confirmedLiveSync: false,
    uncertain: false,
  };
}