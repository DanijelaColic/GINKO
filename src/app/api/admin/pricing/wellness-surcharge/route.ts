/**
 * Admin CRUD za SPA wellness nadoplatu (€/noć).
 * GET  → { surcharge_per_night: number | null }
 * PUT  → body { surcharge_per_night: number | null }
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import {
  getSpaWellnessSurchargePerNight,
  setSpaWellnessSurchargePerNight,
} from '@/modules/myrent/myrent.spa-pricing';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const surcharge_per_night = await getSpaWellnessSurchargePerNight();
    return NextResponse.json({ surcharge_per_night });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Greška';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      surcharge_per_night?: number | null | string;
    };

    let value: number | null;
    if (
      body.surcharge_per_night === null ||
      body.surcharge_per_night === undefined ||
      body.surcharge_per_night === ''
    ) {
      value = null;
    } else {
      value = Number(body.surcharge_per_night);
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          { error: 'Nadoplata mora biti broj >= 0 ili prazno.' },
          { status: 400 },
        );
      }
    }

    const surcharge_per_night = await setSpaWellnessSurchargePerNight(value);
    return NextResponse.json({ surcharge_per_night });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Greška';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
