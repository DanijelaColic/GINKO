import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  insertError: null as { code: string; message: string } | null,
  updateError: null as { code: string; message: string } | null,
}));

vi.mock('@/lib/admin-auth', () => ({
  isAdminAuthenticatedFromRequest: vi.fn(async () => true),
}));

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: db.insertError }),
        }),
      }),
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              id: '11111111-1111-4111-8111-111111111111',
              room_slug: 'ginko-1',
              check_in: '2027-04-01',
              check_out: '2027-04-04',
              status: 'confirmed',
              deposit_paid: true,
              adults: 1,
              children: 0,
            },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: null, error: db.updateError }),
          }),
        }),
      }),
    }),
  }),
}));

import { POST } from './route';
import { PATCH } from './[id]/route';

const overlap = {
  code: '23P01',
  message:
    'conflicting key value violates exclusion constraint "bookings_no_active_overlap"',
};

describe('admin booking overlap', () => {
  beforeEach(() => {
    db.insertError = null;
    db.updateError = null;
  });

  it('unos sudarene rezervacije vraća 409 prije nego što postane 500', async () => {
    db.insertError = overlap;
    const response = await POST(
      new NextRequest('http://localhost/api/admin/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          room_slug: 'ginko-1',
          check_in: '2027-05-01',
          check_out: '2027-05-03',
          guest_name: 'Admin gost',
          guest_email: 'admin-gost@example.com',
          adults: 1,
          children: 0,
          status: 'confirmed',
          deposit_paid: true,
        }),
      }),
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'datesUnavailable',
    });
  });

  it('izmjena datuma koja sudari drugi termin vraća 409', async () => {
    db.updateError = overlap;
    const response = await PATCH(
      new NextRequest(
        'http://localhost/api/admin/bookings/11111111-1111-4111-8111-111111111111',
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            check_in: '2027-04-02',
            check_out: '2027-04-06',
          }),
        },
      ),
      { params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }) },
    );
    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: string };
    expect(body.error).toMatch(/preklapa/i);
  });

  it('druga greška baze ostaje 500', async () => {
    db.insertError = { code: '23502', message: 'null value' };
    const response = await POST(
      new NextRequest('http://localhost/api/admin/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          room_slug: 'ginko-2',
          check_in: '2027-05-01',
          check_out: '2027-05-03',
          guest_name: 'Admin gost',
          guest_email: 'admin-gost@example.com',
        }),
      }),
    );
    expect(response.status).toBe(500);
  });
});
