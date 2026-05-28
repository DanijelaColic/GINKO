// New — Phase 9. Public iCal export endpoint.
// URL: /api/ical/{export_token}
// Tokenized (export_token from room_channel_mappings) — not admin-guarded.
// Returns a valid .ics file with all confirmed/pending bookings + manual blocks.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateRoomICalFeed } from '@/modules/channels/ical.export';

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  if (!token || token.length < 10) {
    return new NextResponse('Not found', { status: 404 });
  }

  const supabase = createServerSupabaseClient();

  // Look up which room this token belongs to
  const { data: mapping, error } = await supabase
    .from('room_channel_mappings')
    .select('room_slug, sync_enabled')
    .eq('export_token', token)
    .single();

  if (error || !mapping) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const icsContent = await generateRoomICalFeed(mapping.room_slug);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="ginko-${mapping.room_slug}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[ical export]', err);
    return new NextResponse('Server error', { status: 500 });
  }
}
