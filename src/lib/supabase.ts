// Adapted from VJ/src/lib/supabase.ts + VV/src/modules/booking-admin/lib/supabase.ts
// Changes: updated error message text, kept backward-compatible env var fallback from VJ.
import { createClient } from '@supabase/supabase-js';

export function createServerSupabaseClient() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.PUBLIC_SUPABASE_URL
  )?.trim();

  const key = (
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error(
      'Nedostaju Supabase env varijable. Dodaj NEXT_PUBLIC_SUPABASE_URL i SUPABASE_SERVICE_KEY u .env.local',
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
