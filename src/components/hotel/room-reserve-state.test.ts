import { describe, expect, it } from 'vitest';
import { getRoomReserveState } from './room-reserve-state';

describe('getRoomReserveState fail-closed', () => {
  it('status null nakon pretrage → unavailable (ne ready)', () => {
    expect(
      getRoomReserveState('ginko-1', true, 2, true, { 'ginko-1': null }),
    ).toBe('unavailable');
  });

  it('available false → unavailable', () => {
    expect(
      getRoomReserveState('ginko-1', true, 2, true, {
        'ginko-1': { available: false },
      }),
    ).toBe('unavailable');
  });

  it('available true → ready', () => {
    expect(
      getRoomReserveState('ginko-1', true, 2, true, {
        'ginko-1': { available: true },
      }),
    ).toBe('ready');
  });
});
