import Link from 'next/link';
import { Card } from '@carpool/ui';
import { CalendarDays, Pencil, Users } from 'lucide-react';

import { RideCard } from '@/components/rides/ride-card';
import { RouteMapPanel } from '@/components/rides/route-map-panel';
import { SearchFilters } from '@/components/rides/search-filters';
import {
  findMockRide,
  MOCK_ROUTE_INFO,
  MOCK_SEARCH_CONTEXT,
  MOCK_SEARCH_RESULTS,
} from '@/lib/mock/rides';

export const metadata = { title: 'Route Information' };

/**
 * Route Information (Stitch “Desktop Results”): live route map with the
 * selected ride, plus filters and the matching rides list. Placeholder data
 * until the Ride Search API is integrated. (spec 5.2)
 */
export default async function RouteInformationPage({
  params,
}: {
  params: Promise<{ rideId: string }>;
}) {
  const { rideId } = await params;
  const featured = findMockRide(rideId);
  const [driverFirstName] = featured.driverName.split(' ');
  const departTime = featured.departsAt.replace(/\s?[AP]M$/i, '');

  return (
    <section className="grid min-h-[calc(100vh-4rem)] grid-cols-1 items-stretch bg-[#faf6f1] xl:grid-cols-[380px,1fr]">
      {/* Left rail: route summary, filters, matching rides */}
      <div className="custom-scrollbar space-y-5 overflow-y-auto p-4 lg:p-6">
        <Card className="space-y-4 rounded-[14px] p-4 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Your Route
              </p>
              <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                {MOCK_SEARCH_CONTEXT.pickup}
                <span className="text-muted-foreground">→</span>
                {MOCK_SEARCH_CONTEXT.destination}
              </p>
            </div>
            <Link
              href="/rides"
              aria-label="Edit route"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary transition-colors hover:bg-accent"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex items-center gap-5 border-t pt-3 text-sm">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Today, {MOCK_SEARCH_CONTEXT.dateLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              {MOCK_SEARCH_CONTEXT.passengers} Seat
            </span>
          </div>
        </Card>

        <SearchFilters variant="route" />

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Available Rides ({MOCK_SEARCH_RESULTS.length})</h2>
          {MOCK_SEARCH_RESULTS.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              variant="compact"
              className={ride.id === featured.id ? 'border-primary' : undefined}
            />
          ))}
        </div>
      </div>

      {/* Map with live-route chrome for the selected ride */}
      <RouteMapPanel
        pickup={MOCK_SEARCH_CONTEXT.pickup}
        dropoff={MOCK_SEARCH_CONTEXT.destination}
        driverLabel={`${driverFirstName} • ${departTime}`}
        tripId={MOCK_ROUTE_INFO.tripId}
        etaLabel={MOCK_ROUTE_INFO.etaLabel}
        className="min-h-[520px] rounded-none border-0 shadow-none xl:sticky xl:top-16 xl:h-[calc(100vh-4rem)]"
      />
    </section>
  );
}
