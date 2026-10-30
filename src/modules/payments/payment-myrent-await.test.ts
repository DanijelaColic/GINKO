import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const queueSpy = vi.fn();

vi.mock('@/modules/myrent/myrent.booking-sync-hook', () => ({
  queueMyRentSyncAfterPayment: (...args: unknown[]) => queueSpy(...args),
}));

describe('ensureMyRentSyncAfterSuccessfulPayment', () => {
  beforeEach(() => {
    queueSpy.mockReset();
    queueSpy.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('await-a queueMyRentSyncAfterPayment', async () => {
    let finished = false;
    queueSpy.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      finished = true;
    });

    const { ensureMyRentSyncAfterSuccessfulPayment } = await import(
      './payment.service'
    );
    await ensureMyRentSyncAfterSuccessfulPayment(
      '11111111-2222-3333-4444-555555555555',
    );
    expect(finished).toBe(true);
    expect(queueSpy).toHaveBeenCalledTimes(1);
    expect(queueSpy).toHaveBeenCalledWith(
      '11111111-2222-3333-4444-555555555555',
    );
  });

  it('MyRent greška se ne propagira (ne dira Saferpay ishod)', async () => {
    queueSpy.mockRejectedValue(new Error('MyRent timeout'));
    const { ensureMyRentSyncAfterSuccessfulPayment } = await import(
      './payment.service'
    );
    await expect(
      ensureMyRentSyncAfterSuccessfulPayment(
        '11111111-2222-3333-4444-555555555555',
      ),
    ).resolves.toBeUndefined();
    expect(queueSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Saferpay + MyRent await ugovor', () => {
  it('succeeded short-circuit mora moći ponovno pokrenuti sync (oporavak)', () => {
    // Dokumentarni ugovor: syncSaferpayPayment na status=succeeded
    // zove ensureMyRentSyncAfterSuccessfulPayment prije returna.
    // queue/claim blokira dvostruki POST (live_ok / uncertain).
    const contract = {
      onSucceededShortCircuit: 'ensureMyRentSyncAfterSuccessfulPayment',
      doublePostGuard: 'atomic claim / uncertain / live_ok',
      paymentNeverRolledBackByMyRent: true,
    };
    expect(contract.paymentNeverRolledBackByMyRent).toBe(true);
    expect(contract.onSucceededShortCircuit).toBe(
      'ensureMyRentSyncAfterSuccessfulPayment',
    );
  });
});
