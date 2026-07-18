'use client';

import { Card, MapContainer, cn } from '@carpool/ui';
import { Car, Clock, MapPin, Navigation, Zap } from 'lucide-react';

import { geocodeAddressStub } from '@/lib/maps/geocode';

interface RouteMapPanelProps {
  pickup: string;
  dropoff: string;
  /** “Anders • 08:15” bubble for the live driver position. */
  driverLabel?: string;
  /** “CARPOOL ACTIVE / Trip ID …” chip. */
  tripId?: string;
  etaLabel?: string;
  distanceLabel?: string;
  durationLabel?: string;
  backgroundImageUrl?: string;
  className?: string;
}

function PinChip({
  icon,
  label,
  tone = 'light',
  className,
}: {
  icon: React.ReactNode;
  label: string;
  tone?: 'light' | 'primary';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'pointer-events-auto absolute flex items-center gap-2 rounded-xl border p-1.5 pr-3 shadow-md',
        tone === 'primary'
          ? 'border-primary-foreground/30 bg-primary text-primary-foreground'
          : 'bg-card',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg',
          tone === 'primary' ? 'bg-primary-foreground/20' : 'bg-secondary text-primary',
        )}
      >
        {icon}
      </span>
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}

/**
 * Map surface with route chrome (pins, trip/ETA chips, stats bar), shared by
 * Route Information and Route Confirmation. Wraps the stable MapContainer
 * placeholder until Google Maps is wired in.
 */
export function RouteMapPanel({
  pickup,
  dropoff,
  driverLabel,
  tripId,
  etaLabel,
  distanceLabel,
  durationLabel,
  backgroundImageUrl = '/images/commute-route-map.jpg',
  className,
}: RouteMapPanelProps) {
  const markers = [
    { ...geocodeAddressStub(pickup), label: pickup },
    { ...geocodeAddressStub(dropoff), label: dropoff },
  ];

  return (
    <Card className={cn('relative min-h-[420px] overflow-hidden lg:min-h-full', className)}>
      <MapContainer
        backgroundImageUrl={backgroundImageUrl}
        className="absolute inset-0 h-full rounded-none border-0"
        markers={markers}
      />
      <div className="pointer-events-none absolute inset-0">
        {/* Status chips */}
        {tripId ? (
          <div className="pointer-events-auto absolute left-4 top-4 flex items-center gap-2 rounded-xl border bg-card p-2 pr-4 shadow-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
              <Car className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Carpool Active
              <span className="block text-xs normal-case tracking-normal text-foreground">
                Trip ID: {tripId}
              </span>
            </span>
          </div>
        ) : null}
        {etaLabel ? (
          <div className="pointer-events-auto absolute left-4 top-20 flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-md">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold">ETA: {etaLabel}</span>
          </div>
        ) : null}

        {/* Route pins */}
        <PinChip
          icon={<Navigation className="h-4 w-4" />}
          label={`Pickup: ${pickup}`}
          className="right-6 top-[22%]"
        />
        {driverLabel ? (
          <PinChip
            icon={<Car className="h-4 w-4" />}
            label={driverLabel}
            className="left-[38%] top-[45%]"
          />
        ) : null}
        <PinChip
          icon={<MapPin className="h-4 w-4" />}
          label={`Drop-off: ${dropoff}`}
          tone="primary"
          className="bottom-[14%] right-8"
        />

        {/* Bottom stats bar */}
        {distanceLabel || durationLabel ? (
          <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-2xl border bg-card/95 px-5 py-3 shadow-md backdrop-blur">
            {distanceLabel ? (
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Car className="h-4 w-4 text-primary" />
                {distanceLabel}
              </span>
            ) : null}
            {distanceLabel && durationLabel ? <span className="h-5 w-px bg-border" /> : null}
            {durationLabel ? (
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                {durationLabel}
              </span>
            ) : null}
            <span className="h-5 w-px bg-border" />
            <span className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Zap className="h-4 w-4" />
              Optimal Route
            </span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
