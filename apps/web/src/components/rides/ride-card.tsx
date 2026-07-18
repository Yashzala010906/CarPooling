'use client';

import Link from 'next/link';
import { Button, Card, cn } from '@carpool/ui';
import { Armchair, BadgeCheck, Car, Clock, MapPin, Star, Zap } from 'lucide-react';

import type { RideSearchResult } from '@/lib/mock/rides';

interface RideCardProps {
  ride: RideSearchResult;
  /** `detailed` = comparison-view card; `compact` = map-sidebar card. */
  variant?: 'detailed' | 'compact';
  className?: string;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function DriverAvatar({ ride, size }: { ride: RideSearchResult; size: 'sm' | 'lg' }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground',
        size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm',
      )}
    >
      {initialsOf(ride.driverName)}
    </div>
  );
}

function AmenityChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-muted-foreground">
      {label}
    </span>
  );
}

/**
 * Reusable ride result card (Stitch “Available Rides” designs).
 * UI-only for now: Book/Select links to route confirmation, View Details to
 * route information; wire real ids once the search API exists.
 */
export function RideCard({ ride, variant = 'detailed', className }: RideCardProps) {
  const confirmHref = `/rides/confirm?rideId=${ride.id}`;
  const detailsHref = `/rides/${ride.id}`;

  if (variant === 'compact') {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <DriverAvatar ride={ride} size="sm" />
            <div>
              <p className="flex items-center gap-1 text-sm font-semibold">
                {ride.driverName}
                <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-current text-amber-500" />
                {ride.driverRating.toFixed(1)}
              </p>
            </div>
          </div>
          <p className="text-lg font-bold text-primary">{ride.farePerSeat} SEK</p>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{ride.departsAt}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold">{ride.arrivesAt}</span>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Armchair className="h-3.5 w-3.5" />
            {ride.seatsLeft} left
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {ride.isElectric ? (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase text-secondary-foreground">
                EV
              </span>
            ) : (
              <Car className="h-3.5 w-3.5" />
            )}
            {ride.vehicle} • {ride.registration}
          </p>
          <Button asChild size="sm">
            <Link href={confirmHref}>Select</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:gap-5">
        {/* Driver rail */}
        <div className="flex shrink-0 items-center gap-3 sm:w-28 sm:flex-col sm:gap-2 sm:border-r sm:pr-5 sm:text-center">
          <DriverAvatar ride={ride} size="lg" />
          <div className="flex items-center gap-1 text-sm font-semibold">
            <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
            {ride.driverRating.toFixed(1)}
          </div>
          {ride.driverBadge ? (
            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {ride.driverBadge}
            </span>
          ) : null}
        </div>

        {/* Ride details */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{ride.driverName}</p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  {ride.isElectric ? (
                    <Zap className="h-3.5 w-3.5" />
                  ) : (
                    <Car className="h-3.5 w-3.5" />
                  )}
                  {ride.vehicle} • {ride.registration}
                </span>
                <span className="flex items-center gap-1">
                  <Armchair className="h-3.5 w-3.5" />
                  {ride.seatsLeft} {ride.seatsLeft === 1 ? 'Seat' : 'Seats'} Left
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{ride.farePerSeat} SEK</p>
              <p className="text-xs text-muted-foreground">per seat</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ride.amenities.map((amenity) => (
              <AmenityChip key={amenity} label={amenity} />
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="sm:px-10">
              <Link href={confirmHref}>Book Now</Link>
            </Button>
            <Button asChild variant="secondary" className="sm:px-10">
              <Link href={detailsHref}>View Details</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t bg-muted/50 px-5 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Departs {ride.departsAt}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {ride.distanceFromYou}
        </span>
        {ride.highlight ? (
          <span className="ml-auto font-semibold text-foreground">{ride.highlight}</span>
        ) : null}
      </div>
    </Card>
  );
}
