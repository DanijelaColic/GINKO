import { describe, expect, it } from 'vitest';
import { formatSafeErrorMessage } from './safe-error';

describe('formatSafeErrorMessage', () => {
  it('ne vraća [object Object] za plain Supabase-like error', () => {
    const msg = formatSafeErrorMessage({
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
      details: null,
      hint: null,
    });
    expect(msg).toContain('PGRST116');
    expect(msg).toContain('JSON object requested');
    expect(msg).not.toBe('[object Object]');
  });

  it('Error s code poljem', () => {
    const err = Object.assign(new Error('update failed'), { code: '42501' });
    const msg = formatSafeErrorMessage(err);
    expect(msg).toContain('update failed');
    expect(msg).toContain('42501');
  });

  it('redaktira password/token u stringu', () => {
    const msg = formatSafeErrorMessage('auth failed password=supersecret token=abc123');
    expect(msg).not.toContain('supersecret');
    expect(msg).not.toContain('abc123');
    expect(msg).toMatch(/REDACTED/);
  });

  it('null / undefined', () => {
    expect(formatSafeErrorMessage(null)).toBe('unknown_error');
    expect(formatSafeErrorMessage(undefined)).toBe('unknown_error');
  });
});
