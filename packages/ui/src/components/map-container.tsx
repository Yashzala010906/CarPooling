'use client';

import * as React from 'react';
import { MapPin } from 'lucide-react';

import { cn } from '../lib/utils';

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
}

export interface MapContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  /** Encoded polyline for the route preview. */
  polyline?: string;
}

/**
 * MapContainer — PLACEHOLDER.
 *
 * Swap the inner div for a real Google Maps (or MapLibre/Leaflet) instance.
 * The web app owns the maps API key and loader (see apps/web/src/lib/maps).
 * Keep this component's props stable so screens don't change when the real
 * map is wired in.
 */
export function MapContainer({
  center,
  zoom = 13,
  markers = [],
  polyline,
  className,
  ...props
}: MapContainerProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-64 w-full items-center justify-center overflow-hidden rounded-lg border bg-muted',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <MapPin className="h-8 w-8" />
        <p className="text-sm font-medium">Map placeholder</p>
        <p className="text-xs">
          center: {center ? `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` : 'unset'} · zoom:{' '}
          {zoom} · {markers.length} marker(s){polyline ? ' · route set' : ''}
        </p>
      </div>
    </div>
  );
}
