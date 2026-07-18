'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Card } from '@carpool/ui';
import type { Ride } from '@carpool/types';
import { Armchair, Car, CheckCircle2, Leaf, Loader2, ShieldCheck } from 'lucide-react';

import { extractApiErrors } from '@/lib/api/errors';
import { ridesService } from '@/lib/api/services';
import { useRideStore } from '@/stores';

/** “Today”, “Tomorrow”, or e.g. “Fri, Oct 24” in the viewer's locale. */
function formatDepartureDate(iso: string): string {
  const departure = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  const dayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(departure);
  if (sameDay(departure, today)) return `Today, ${dayLabel}`;
  if (sameDay(departure, tomorrow)) return `Tomorrow, ${dayLabel}`;
  return dayLabel;
}

function formatDepartureTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso),
  );
}

/**
 * CO₂ saved — PLACEHOLDER until the reports phase: uses the route distance
 * when the maps provider supplied one, otherwise ~4.2kg per shared seat.
 */
function estimateCo2SavedKg(ride: Ride): number {
  if (ride.routeDistanceKm) return ride.routeDistanceKm * 0.12 * ride.seatsTotal;
  return ride.seatsTotal * 4.2;
}

/** Post-publish confirmation (Stitch “Ride Published Successfully”). */
export function RidePublishedSuccess() {
  const searchParams = useSearchParams();
  const rideId = searchParams.get('rideId');
  const publishedRide = useRideStore((state) => state.publishedRide);

  const [ride, setRide] = useState<Ride | null>(publishedRide);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(!publishedRide && Boolean(rideId));

  // Refreshing the page loses the store; refetch from the API instead.
  useEffect(() => {
    if (ride || !rideId) return;
    let cancelled = false;
    ridesService
      .getById(rideId)
      .then((fetched) => {
        if (!cancelled) setRide(fetched);
      })
      .catch((error) => {
        if (!cancelled) setErrors(extractApiErrors(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ride, rideId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        {errors.map((message) => (
          <p key={message} className="text-sm text-destructive">
            {message}
          </p>
        ))}
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find a freshly published ride.
        </p>
        <Button asChild>
          <Link href="/rides/offer">Offer a Ride</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-8">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Success</span>
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Ride Published Successfully
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Your ride is now visible to other commuters in your organization. We&apos;ll notify you
            as soon as someone requests a seat.
          </p>
        </div>

        {/* Ride summary */}
        <Card className="mb-8 overflow-hidden text-left">
          <div className="p-6">
            <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
              Trip ID: #{ride.id.slice(-6).toUpperCase()}
            </p>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Ride Details
                  </p>
                  <p className="text-lg font-semibold">{formatDepartureDate(ride.departureAt)}</p>
                </div>
              </div>
              <div className="rounded-full bg-accent px-4 py-1.5">
                <span className="text-sm font-medium text-primary">
                  {formatDepartureTime(ride.departureAt)} Departure
                </span>
              </div>
            </div>
            {/* Route timeline */}
            <div className="relative flex flex-col gap-8 pl-1">
              <div className="absolute bottom-2 left-[3px] top-2 w-0.5 bg-secondary" />
              <div className="relative flex items-start gap-4">
                <div className="z-10 mt-1.5 h-2 w-2 rounded-full border-2 border-primary bg-background" />
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="text-sm font-medium">{ride.origin.address}</p>
                </div>
              </div>
              <div className="relative flex items-start gap-4">
                <div className="z-10 mt-1.5 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="text-sm font-medium">{ride.destination.address}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 border-t bg-muted/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Armchair className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {ride.seatsAvailable} {ride.seatsAvailable === 1 ? 'Seat' : 'Seats'} Available
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                ~{estimateCo2SavedKg(ride).toFixed(1)}kg CO₂ Saved
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Corp-Verified</span>
            </div>
            <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              {ride.status}
            </span>
          </div>
        </Card>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="w-full px-10 sm:w-auto">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full px-10 sm:w-auto">
            <Link href="/trips">View My Trips</Link>
          </Button>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Need to make changes?{' '}
          <Link href="/rides/offer" className="font-medium text-primary hover:underline">
            Edit ride details
          </Link>
        </p>
      </div>
    </div>
  );
}
