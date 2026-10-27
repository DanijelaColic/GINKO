import { describe, expect, it } from 'vitest';
import { getAvailabilitySlugsForRoom } from './availability.service';

describe('getAvailabilitySlugsForRoom (SPA dijeljeni kalendar)', () => {
  it('ginko-spa-1 uključuje ginko-spa-2', () => {
    const slugs = getAvailabilitySlugsForRoom('ginko-spa-1').sort();
    expect(slugs).toEqual(['ginko-spa-1', 'ginko-spa-2']);
  });

  it('ginko-spa-2 uključuje ginko-spa-1', () => {
    const slugs = getAvailabilitySlugsForRoom('ginko-spa-2').sort();
    expect(slugs).toEqual(['ginko-spa-1', 'ginko-spa-2']);
  });

  it('obična soba nema SPA slugove', () => {
    const slugs = getAvailabilitySlugsForRoom('ginko-1');
    expect(slugs).toEqual(['ginko-1']);
  });
});
