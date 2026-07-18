'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Pause, Play } from 'lucide-react';

import { Button } from '@carpool/ui';

import { StatusBadge } from './status-badge';

type GeoState = 'idle' | 'sharing' | 'denied' | 'unavailable' | 'error';

// Throttle: at most one write every 8s, and only if moved > ~15m.
const MIN_INTERVAL_MS = 8000;
const MIN_DISTANCE_M = 15;

function haversine(a: GeolocationCoordinates, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.latitude) * Math.PI) / 180;
  const dLng = ((b.lng - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Driver-only control that shares live location during an active trip using
 * navigator.geolocation.watchPosition(). Throttles writes by time AND distance
 * to avoid flooding the DB, only POSTs while sharing, and tears down the
 * watcher on unmount. The server + RLS still enforce that only the authorised
 * driver of an active trip can persist a location.
 */
export function DriverLocationBroadcaster({ tripId }: { tripId: string }) {
  const [state, setState] = useState<GeoState>('idle');
  const [sharing, setSharing] = useState(false);
  const watchId = useRef<number | null>(null);
  const lastSent = useRef<{ at: number; lat: number; lng: number } | null>(null);

  const post = useCallback(
    async (coords: GeolocationCoordinates) => {
      try {
        await fetch(`/api/trips/${tripId}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy ?? undefined,
            heading:
              coords.heading != null && !Number.isNaN(coords.heading) ? coords.heading : undefined,
            speed:
              coords.speed != null && !Number.isNaN(coords.speed) ? coords.speed * 3.6 : undefined,
          }),
          keepalive: true,
        });
      } catch {
        // Network hiccup — the next tick will retry.
      }
    },
    [tripId],
  );

  const stop = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setSharing(false);
    setState('idle');
  }, []);

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState('unavailable');
      return;
    }
    setSharing(true);
    setState('sharing');
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const prev = lastSent.current;
        const movedEnough = !prev || haversine(pos.coords, prev) >= MIN_DISTANCE_M;
        const waitedEnough = !prev || now - prev.at >= MIN_INTERVAL_MS;
        if (movedEnough && waitedEnough) {
          lastSent.current = { at: now, lat: pos.coords.latitude, lng: pos.coords.longitude };
          void post(pos.coords);
        }
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, [post]);

  // Ensure the watcher is torn down when the component unmounts.
  useEffect(() => () => stop(), [stop]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      <MapPin className="h-4 w-4 text-primary" />
      <div className="text-sm">
        <p className="font-medium">Share my location</p>
        <p className="text-xs text-muted-foreground">
          {state === 'denied'
            ? 'Location permission denied — enable it in your browser.'
            : state === 'unavailable'
              ? 'Geolocation is not available on this device.'
              : state === 'error'
                ? 'Could not get your location. Retrying…'
                : sharing
                  ? 'Passengers can see your position live.'
                  : 'Start sharing so passengers can track you.'}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {sharing ? (
          <StatusBadge tone="active" dot>
            Sharing
          </StatusBadge>
        ) : null}
        <Button
          size="sm"
          variant={sharing ? 'outline' : 'default'}
          onClick={sharing ? stop : start}
        >
          {sharing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {sharing ? 'Stop' : 'Start'}
        </Button>
      </div>
    </div>
  );
}
