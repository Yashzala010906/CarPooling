import Link from 'next/link';
import { Button, Card } from '@carpool/ui';
import { Route, Star, Timer } from 'lucide-react';

import { RouteMapPanel } from '@/components/rides/route-map-panel';
import { findMockRide, MOCK_SEARCH_CONTEXT } from '@/lib/mock/rides';

export const metadata = { title: 'Route Confirmation' };

const VEHICLE_TOTAL_SEATS = 4;

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Route Confirmation (Stitch “Ride Route - Desktop Overview” layout): the
 * calculated route on the map with ride details for review before booking.
 * Placeholder data; booking itself arrives in a later phase. (spec 5.2)
 */
export default async function RouteConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ rideId?: string }>;
}) {
  const { rideId } = await searchParams;
  const ride = findMockRide(rideId ?? null);
  const bookedSeats = VEHICLE_TOTAL_SEATS - ride.seatsLeft;

  return (
    <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[400px,1fr]">
      {/* Ride details panel */}
      <Card className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Route Confirmation</h1>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Awaiting Confirmation
          </span>
        </div>

        {/* Driver */}
        <Card className="flex items-center gap-4 bg-muted/50 p-4 shadow-none">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-secondary-foreground">
            {initialsOf(ride.driverName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{ride.driverName}</p>
              <span className="flex items-center gap-1 text-sm font-semibold">
                <Star className="h-4 w-4 fill-current text-amber-500" />
                {ride.driverRating.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{ride.vehicle}</p>
            <p className="font-mono text-xs text-muted-foreground">{ride.registration}</p>
          </div>
        </Card>

        {/* Schedule */}
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Departure
            </p>
            <p className="text-lg font-bold text-primary">{ride.departsAt}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Arrival (Est)
            </p>
            <p className="text-lg font-bold text-primary">{ride.arrivesAt}</p>
          </div>
        </div>

        {/* Route stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-1 rounded-xl border p-4">
            <Route className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">{MOCK_SEARCH_CONTEXT.distanceKm} km</span>
            <span className="text-xs text-muted-foreground">Distance</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border p-4">
            <Timer className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">{MOCK_SEARCH_CONTEXT.durationMins} mins</span>
            <span className="text-xs text-muted-foreground">Duration</span>
          </div>
        </div>

        {/* Route timeline */}
        <div className="relative space-y-6 pl-1">
          <div className="absolute bottom-3 left-[11px] top-3 w-0.5 bg-secondary" />
          <div className="relative flex gap-4">
            <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-background">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">Pickup: {MOCK_SEARCH_CONTEXT.pickup}</p>
              <p className="text-sm text-muted-foreground">Kungsgatan 44, Stockholm</p>
            </div>
          </div>
          <div className="relative flex gap-4">
            <div className="z-10 h-6 w-6 rounded-full border-2 border-primary bg-primary" />
            <div>
              <p className="text-sm font-bold">Drop-off: {MOCK_SEARCH_CONTEXT.destination}</p>
              <p className="text-sm text-muted-foreground">Götgatan 22, Stockholm</p>
            </div>
          </div>
        </div>

        {/* Fare + seats */}
        <div className="mt-auto space-y-4 border-t pt-5">
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Price per seat</p>
              <p className="text-lg font-bold">${ride.farePerSeat.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Seats Available</p>
              <div className="mt-1 flex justify-end gap-1">
                {Array.from({ length: VEHICLE_TOTAL_SEATS }, (_, seat) => (
                  <div
                    key={seat}
                    className={`h-3 w-3 rounded ${seat < bookedSeats ? 'bg-primary' : 'bg-secondary'}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs font-semibold">
                {bookedSeats}/{VEHICLE_TOTAL_SEATS} booked
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="lg" className="w-full">
              Book Ride
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full">
              <Link href="/rides/find">Back to Results</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Booking will be enabled in the Booking phase.
            </p>
          </div>
        </div>
      </Card>

      {/* Route on the map */}
      <RouteMapPanel
        pickup={MOCK_SEARCH_CONTEXT.pickup}
        dropoff={MOCK_SEARCH_CONTEXT.destination}
        distanceLabel={`${MOCK_SEARCH_CONTEXT.distanceKm} km`}
        durationLabel={`${MOCK_SEARCH_CONTEXT.durationMins} mins`}
        className="lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]"
      />
    </section>
  );
}
