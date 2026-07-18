import Link from 'next/link';
import { History } from 'lucide-react';

import { cn } from '@carpool/ui';

import type { TripListItem } from '@/lib/member3/types';
import { profileName, routeLabel } from '@/lib/member3/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/member3/format';
import { TripStatusBadge } from './status-badge';
import { EmptyState } from './states';

/** Ride history table (desktop) with zebra rows; collapses to cards on mobile. */
export function RideHistoryTable({ items }: { items: TripListItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-8 w-8" />}
        title="No past rides"
        description="Completed and cancelled trips appear here."
      />
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <Th>Driver</Th>
              <Th>Route</Th>
              <Th>Vehicle</Th>
              <Th>Date</Th>
              <Th className="text-right">Fare</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const when =
                it.trip.actual_end_time ?? it.trip.scheduled_start_time ?? it.ride?.departure_at;
              const fare = it.trip.final_fare ?? it.ride?.fare_per_seat ?? 0;
              return (
                <tr key={it.trip.id} className={cn('border-t', i % 2 === 1 && 'bg-muted/20')}>
                  <Td className="font-medium">{profileName(it.driver)}</Td>
                  <Td>{routeLabel(it.ride)}</Td>
                  <Td className="whitespace-nowrap">
                    {it.ride?.vehicle_registration ?? it.ride?.vehicle_model ?? '—'}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {formatDate(when)} · {formatTime(when)}
                  </Td>
                  <Td className="whitespace-nowrap text-right font-semibold">
                    {formatCurrency(fare)}
                  </Td>
                  <Td>
                    <TripStatusBadge status={it.trip.status} />
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/trips/${it.trip.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {items.map((it) => {
          const when =
            it.trip.actual_end_time ?? it.trip.scheduled_start_time ?? it.ride?.departure_at;
          const fare = it.trip.final_fare ?? it.ride?.fare_per_seat ?? 0;
          return (
            <Link
              key={it.trip.id}
              href={`/trips/${it.trip.id}`}
              className="block rounded-lg border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{routeLabel(it.ride)}</p>
                <TripStatusBadge status={it.trip.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {profileName(it.driver)} · {formatDate(when)}
              </p>
              <p className="mt-2 text-sm font-semibold">{formatCurrency(fare)}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 text-left font-semibold', className)}>{children}</th>;
}
function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3', className)}>{children}</td>;
}
