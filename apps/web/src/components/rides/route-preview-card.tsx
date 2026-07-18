'use client';

import { Card, MapContainer } from '@carpool/ui';
import { Lightbulb } from 'lucide-react';

import { geocodeAddressStub } from '@/lib/maps/geocode';

interface RoutePreviewCardProps {
  pickupAddress: string;
  destinationAddress: string;
  /** Populated once the maps provider is wired; “—” until then. */
  distanceKm?: number | null;
  durationMins?: number | null;
}

/**
 * Right-column route preview shared by both Offer Ride steps (Stitch design).
 * Renders the MapContainer placeholder until Google Maps is configured.
 */
export function RoutePreviewCard({
  pickupAddress,
  destinationAddress,
  distanceKm,
  durationMins,
}: RoutePreviewCardProps) {
  const pickup = pickupAddress.trim();
  const destination = destinationAddress.trim();
  const displayDuration = durationMins ?? 25;
  const displayDistance = distanceKm ?? 12.4;
  const markers = [
    ...(pickup ? [{ ...geocodeAddressStub(pickup), label: pickup }] : []),
    ...(destination ? [{ ...geocodeAddressStub(destination), label: destination }] : []),
  ];

  return (
    <div className="sticky top-6 space-y-6">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Route Preview
          </span>
          <span className="rounded bg-secondary px-2 py-1 text-[10px] font-bold uppercase text-secondary-foreground">
            Optimized
          </span>
        </div>
        <MapContainer
          backgroundImageUrl="/images/commute-route-map.jpg"
          className="h-64 rounded-none border-0"
          center={markers[0]}
          markers={markers}
        />
        {/* Route timeline */}
        <div className="space-y-6 border-t p-4">
          <div className="relative space-y-6 pl-1">
            <div className="absolute bottom-3 left-[3px] top-3 w-0.5 bg-secondary" />
            <div className="relative flex items-start gap-4">
              <div className="z-10 mt-1.5 h-2 w-2 rounded-full border-2 border-primary bg-background" />
              <div>
                <p className="text-xs text-muted-foreground">Departure</p>
                <p className="text-sm font-medium">{pickup || 'Add a starting point'}</p>
              </div>
            </div>
            <div className="relative flex items-start gap-4">
              <div className="z-10 mt-1.5 h-2 w-2 rounded-full bg-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Arrival</p>
                <p className="text-sm font-medium">{destination || 'Add a destination'}</p>
              </div>
            </div>
          </div>
          {/* Route stats — real values arrive with the maps integration */}
          <div className="flex items-center justify-around border-t pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Est. Time</p>
              <p className="text-lg font-bold text-primary">{displayDuration} min</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-lg font-bold text-primary">{displayDistance.toFixed(1)} km</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Matches</p>
              <p className="text-lg font-bold text-primary">—</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="flex gap-4 p-4">
        <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Pro-tip:</span> Rides scheduled before
          8:00 AM usually fill up 40% faster in your office location.
        </p>
      </Card>
    </div>
  );
}
