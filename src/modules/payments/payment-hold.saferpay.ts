import {
  SaferpayApiError,
  type PaymentPageAssertResponse,
} from './saferpay.client';
import type { AssertSnapshot } from './payment-hold.policy';

/**
 * TRANSACTION_ALREADY_CAPTURED znači da je Capture već zabilježen.
 * Službeno: transakcija se može captureati samo jednom.
 */
export function isTransactionAlreadyCaptured(err: unknown): boolean {
  if (
    err instanceof SaferpayApiError &&
    err.body?.ErrorName === 'TRANSACTION_ALREADY_CAPTURED'
  ) {
    return true;
  }
  return err instanceof Error && err.message.includes('TRANSACTION_ALREADY_CAPTURED');
}

/**
 * Nema potvrđenog ishoda Capturea. RequestId nije idempotency ključ
 * (Error Handling: služi samo za dijagnostiku), pa se zaključavanje
 * ne smije pustiti dok Saferpay processing timeout (100 s) ne prođe.
 */
export function captureOutcomeUnknown(err: unknown): boolean {
  if (isTransactionAlreadyCaptured(err)) return false;
  if (!(err instanceof SaferpayApiError)) return true;
  const name = err.body?.ErrorName ?? '';
  if (!name || err.status >= 500) return true;
  return (
    name === 'COMMUNICATION_TIMEOUT' ||
    name === 'COMMUNICATION_FAILED' ||
    name === 'INTERNAL_ERROR'
  );
}

export function snapshotFromSaferpayError(err: unknown): AssertSnapshot {
  if (err instanceof SaferpayApiError) {
    return {
      kind: 'error',
      httpStatus: err.status,
      errorName: err.body?.ErrorName ?? null,
      transactionId: err.body?.TransactionId ?? null,
    };
  }
  return { kind: 'unreachable' };
}

export function snapshotFromAssertBody(body: PaymentPageAssertResponse): AssertSnapshot {
  const status = (body.Transaction?.Status ?? '').toUpperCase();
  const id = body.Transaction?.Id ?? null;
  if (status === 'CANCELED' || status === 'CANCELLED') {
    return {
      kind: 'error',
      httpStatus: 200,
      errorName: 'TRANSACTION_ABORTED',
      transactionId: id,
    };
  }
  if (status === 'AUTHORIZED' && id) return { kind: 'authorized', transactionId: id };
  if (status === 'CAPTURED' && id) {
    return {
      kind: 'captured',
      transactionId: id,
      captureId: body.Transaction?.CaptureId ?? null,
    };
  }
  if (!id) {
    return {
      kind: 'error',
      httpStatus: 200,
      errorName: 'TRANSACTION_NOT_STARTED',
      transactionId: null,
    };
  }
  return { kind: 'pending', transactionId: id, status: status || 'UNKNOWN' };
}
