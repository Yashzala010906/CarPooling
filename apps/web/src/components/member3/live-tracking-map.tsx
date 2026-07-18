'use client';

import { useEffect, useState } from 'react';
import { Navigation, RadioTower, WifiOff } from 'lucide-react';

import { MapContainer } from '@carpool/ui';

import type { TripLocationRow, TripStatus } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/client';
import { isTripActive } from '@/lib/member3/lifecycle';
import { formatRelative } from '@/lib/member3/format';
import { StatusBadge } from './status-badge';

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Live tracking map. Renders the pickup/destination markers plus the driver's
 * latest position, and subscribes to Supabase Realtime INSERTs on
 * trip_locations so passengers see the driver move without polling. Cleans up
 * its channel on unmount.
 */
export function LiveTrackingMap({
  tripId,
  status,
  origin,
  destination,
  initialLocation,
}: {
  tripId: string;
  status: TripStatus;
  origin?: LatLng | null;
  destination?: LatLng | null;
  initialLocation: TripLocationRow | null;
}) {
  const [last, setLast] = useState<TripLocationRow | null>(initialLocation);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isTripActive(status)) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`trip-loc-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_locations',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => setLast(payload.new as TripLocationRow),
      )
      .subscribe((s) => setConnected(s === 'SUBSCRIBED'));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId, status]);

  const driver: LatLng | null = last ? { lat: last.latitude, lng: last.longitude } : null;
  const center = driver ?? origin ?? destination ?? null;
  const markers = [
    origin ? { ...origin, label: 'Pickup' } : null,
    destination ? { ...destination, label: 'Drop' } : null,
    driver ? { ...driver, label: 'Driver' } : null,
  ].filter(Boolean) as { lat: number; lng: number; label: string }[];

  const ended = !isTripActive(status);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {ended ? (
          <StatusBadge tone="neutral">Tracking ended</StatusBadge>
        ) : connected ? (
          <StatusBadge tone="active" dot>
            <RadioTower className="h-3.5 w-3.5" /> Live tracking active
          </StatusBadge>
        ) : (
          <StatusBadge tone="warning">
            <WifiOff className="h-3.5 w-3.5" /> Connecting…
          </StatusBadge>
        )}
        <span className="text-xs text-muted-foreground">
          {last ? `Updated ${formatRelative(last.recorded_at)}` : 'Awaiting first location…'}
        </span>
      </div>

      <MapContainer center={center ?? undefined} markers={markers} className="min-h-80" />

      {driver ? (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
          <Navigation className="h-4 w-4 text-primary" />
          <span className="font-medium">Driver position</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {driver.lat.toFixed(5)}, {driver.lng.toFixed(5)}
            {last?.speed != null ? ` · ${Math.round(last.speed)} km/h` : ''}
          </span>
        </div>
      ) : null}
    </div>
  );
}
