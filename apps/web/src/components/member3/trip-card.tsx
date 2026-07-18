import { CalendarDays, Car, Clock, IndianRupee, MapPin, Navigation2 } from 'lucide-react';

import { Card } from '@carpool/ui';

import type { TripListItem } from '@/lib/member3/types';
import { profileName } from '@/lib/member3/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/member3/format';
import { Avatar } from './avatar';
import { TripActions } from './trip-actions';
import { TripStatusBadge } from './status-badge';

/** Trip summary card used on My Trips. Presentational; actions are delegated. */
export function TripCard({ item }: { item: TripListItem }) {
  const { trip, ride, driver, viewerRole } = item;
  const when = trip.scheduled_start_time ?? ride?.departure_at ?? null;
  const fare = trip.final_fare ?? ride?.fare_per_seat ?? 0;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar profile={driver} className="h-11 w-11 text-sm" />
          <div>
            <p className="font-semibold leading-tight">{profileName(driver)}</p>
            <p className="text-xs text-muted-foreground">
              {viewerRole === 'DRIVER' ? 'You are driving' : 'Driver'}
            </p>
          </div>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field icon={<MapPin className="h-4 w-4" />} label="Pickup">
          {ride?.origin_address?.split(',')[0] ?? '—'}
        </Field>
        <Field icon={<Navigation2 className="h-4 w-4" />} label="Drop">
          {ride?.destination_address?.split(',')[0] ?? '—'}
        </Field>
        <Field icon={<CalendarDays className="h-4 w-4" />} label="Date">
          {formatDate(when)}
        </Field>
        <Field icon={<Clock className="h-4 w-4" />} label="Time">
          {formatTime(when)}
        </Field>
        <Field icon={<Car className="h-4 w-4" />} label="Vehicle">
          {ride?.vehicle_model ?? '—'}
          {ride?.vehicle_registration ? (
            <span className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-[10px] uppercase">
              {ride.vehicle_registration}
            </span>
          ) : null}
        </Field>
        <Field icon={<IndianRupee className="h-4 w-4" />} label="Fare">
          <span className="font-semibold text-foreground">{formatCurrency(fare)}</span>
        </Field>
      </div>

      <div className="border-t pt-3">
        <TripActions tripId={trip.id} status={trip.status} viewerRole={viewerRole} />
      </div>
    </Card>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-foreground">{children}</p>
      </div>
    </div>
  );
}
