import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { insertRow } from '@/lib/supabase/db';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * POST /api/trips/:tripId/location
 * Ingests a single driver location ping during an active trip.
 *
 * Authorization is enforced by RLS (`trip_locations_insert_driver`): only the
 * authenticated driver of a STARTED/IN_PROGRESS trip can insert. The client is
 * responsible for throttling (see DriverLocationBroadcaster) so we don't flood
 * the table; the server simply validates and records.
 */

const bodySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100000).optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const { tripId } = await params;
  if (!z.string().uuid().safeParse(tripId).success) {
    return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid location payload' }, { status: 422 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await insertRow(supabase, 'trip_locations', {
    trip_id: tripId,
    driver_id: user.id,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    accuracy: parsed.data.accuracy ?? null,
    heading: parsed.data.heading ?? null,
    speed: parsed.data.speed ?? null,
  });

  if (error) {
    // RLS rejection (not the driver / trip not active) surfaces here as 403.
    return NextResponse.json({ error: 'Location update rejected' }, { status: 403 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
