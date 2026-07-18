import Link from 'next/link';

import { RideCard } from '@/components/rides/ride-card';
import { SearchFilters } from '@/components/rides/search-filters';
import { SearchSummaryBar } from '@/components/rides/search-summary-bar';
import { MOCK_SEARCH_CONTEXT, MOCK_SEARCH_RESULTS } from '@/lib/mock/rides';

export const metadata = { title: 'Available Rides' };

/**
 * Available Rides (Stitch “Comparison View”). Results are placeholder data
 * until the Ride Search API is integrated. (spec 5.2)
 */
export default function AvailableRidesPage() {
  return (
    <section className="mx-auto max-w-[1180px] space-y-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          Dashboard
        </Link>
        <span className="text-muted-foreground">›</span>
        <Link href="/rides" className="text-muted-foreground hover:text-foreground">
          Find Ride
        </Link>
        <span className="text-muted-foreground">›</span>
        <span className="font-medium text-primary">Available Rides</span>
      </nav>

      <SearchSummaryBar context={MOCK_SEARCH_CONTEXT} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px,1fr]">
        <SearchFilters className="lg:sticky lg:top-6" />
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Matching Rides ({MOCK_SEARCH_RESULTS.length} found)</h2>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Sort by:
              <select
                defaultValue="Earlier Departure"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option>Earlier Departure</option>
                <option>Lowest Price</option>
                <option>Highest Rated</option>
              </select>
            </label>
          </div>
          {MOCK_SEARCH_RESULTS.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      </div>
    </section>
  );
}
