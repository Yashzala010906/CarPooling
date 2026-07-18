import Link from 'next/link';
import { Button, Card } from '@carpool/ui';
import { ArrowRight, CalendarDays, Users } from 'lucide-react';

import type { RideSearchContext } from '@/lib/mock/rides';

/**
 * Search context bar above the results list (Stitch “Comparison View”):
 * pickup → destination, date, passengers, route stats, Edit Search.
 */
export function SearchSummaryBar({ context }: { context: RideSearchContext }) {
  return (
    <Card className="flex flex-wrap items-center gap-x-6 gap-y-4 p-4 lg:px-6">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pickup
          </p>
          <p className="font-semibold">{context.pickup}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Destination
          </p>
          <p className="font-semibold">{context.destination}</p>
        </div>
      </div>
      <div className="hidden h-8 w-px bg-border sm:block" />
      <span className="flex items-center gap-1.5 text-sm">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {context.dateLabel}
      </span>
      <span className="flex items-center gap-1.5 text-sm">
        <Users className="h-4 w-4 text-muted-foreground" />
        {context.passengers} {context.passengers === 1 ? 'Passenger' : 'Passengers'}
      </span>
      <div className="hidden h-8 w-px bg-border sm:block" />
      <div className="flex items-center gap-6 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="font-semibold">{context.distanceKm} km</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="font-semibold">{context.durationMins} min</p>
        </div>
      </div>
      <Button asChild variant="secondary" className="ml-auto">
        <Link href="/rides">Edit Search</Link>
      </Button>
    </Card>
  );
}
