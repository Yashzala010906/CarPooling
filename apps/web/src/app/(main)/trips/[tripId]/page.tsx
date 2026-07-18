import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Car,
  CreditCard,
  Gauge,
  MapPin,
  MessageSquare,
  Navigation2,
  Route,
  Timer,
} from 'lucide-react';

import { Button, Card } from '@carpool/ui';

import { getTripDetail } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { profileName } from '@/lib/member3/types';
import { canTrackTrip, isTripPayable } from '@/lib/member3/lifecycle';
import { formatCurrency, formatDate, formatDistance, formatTime } from '@/lib/member3/format';
import { PageHeading } from '@/components/member3/page-heading';
import { Avatar } from '@/components/member3/avatar';
import { PaymentStatusBadge, TripStatusBadge } from '@/components/member3/status-badge';
import { TripTimeline } from '@/components/member3/trip-timeline';
import { TripLifecycleControls } from '@/components/member3/trip-lifecycle-controls';
import { NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'Trip Details' };
export const dynamic = 'force-dynamic';

export default async function TripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const auth = await getAuthState();

  if (!auth.configured || !auth.userId) {
    return (
      <section className="space-y-6">
        <PageHeading title="Trip Details" backHref="/trips" />
        {!auth.configured ? <NotConfiguredNotice /> : <SignInPrompt />}
      </section>
    );
  }

  const detail = await getTripDetail(tripId);
  if (!detail) notFound();

  const { trip, ride, driver, passengers, viewerRole, myBooking, myPayment } = detail;
  const when = trip.scheduled_start_time ?? ride?.departure_at ?? null;
  const myFare = myBooking?.fare_total ?? ride?.fare_per_seat ?? 0;
  const payable =
    viewerRole === 'PASSENGER' && isTripPayable(trip.status) && myPayment?.status !== 'PAID';

  return (
    <section className="space-y-6">
      <PageHeading title="Trip Details" backHref="/trips" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <Avatar profile={driver} className="h-14 w-14 text-base" />
                <div>
                  <h2 className="text-lg font-semibold">{profileName(driver)}</h2>
                  <p className="text-sm text-muted-foreground">
                    {viewerRole === 'DRIVER' ? 'You are driving this trip' : 'Driver'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <TripStatusBadge status={trip.status} />
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(when)} · {formatTime(when)}
                </p>
              </div>
            </div>

            <div className="grid gap-5 py-5 sm:grid-cols-3">
              <Info icon={<Car className="h-5 w-5" />} label="Vehicle">
                <p className="font-semibold">{ride?.vehicle_model ?? '—'}</p>
                {ride?.vehicle_registration ? (
                  <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
                    {ride.vehicle_registration}
                  </span>
                ) : null}
              </Info>
              <Info icon={<MapPin className="h-5 w-5" />} label="Pickup">
                <p className="font-semibold">{ride?.origin_address?.split(',')[0] ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{ride?.origin_address}</p>
              </Info>
              <Info icon={<Navigation2 className="h-5 w-5" />} label="Drop">
                <p className="font-semibold">{ride?.destination_address?.split(',')[0] ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{ride?.destination_address}</p>
              </Info>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
              <TripLifecycleControls
                tripId={trip.id}
                status={trip.status}
                viewerRole={viewerRole}
              />
              <div className="rounded-xl border bg-muted/40 px-5 py-2 text-right">
                <p className="text-xs uppercase text-muted-foreground">Fare</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(myFare)}</p>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            {canTrackTrip(trip.status) ? (
              <Button asChild variant="outline">
                <Link href={`/trips/${trip.id}/tracking`}>
                  <Route className="h-4 w-4" /> Live tracking
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/trips/${trip.id}/chat`}>
                <MessageSquare className="h-4 w-4" /> Open chat
              </Link>
            </Button>
            {payable ? (
              <Button asChild>
                <Link href={`/payments?tripId=${trip.id}`}>
                  <CreditCard className="h-4 w-4" /> Pay {formatCurrency(myFare)}
                </Link>
              </Button>
            ) : null}
          </div>

          {trip.actual_end_time ? (
            <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
              <Summary
                icon={<Route className="h-4 w-4" />}
                label="Distance"
                value={formatDistance(trip.distance_km)}
              />
              <Summary
                icon={<Timer className="h-4 w-4" />}
                label="Duration"
                value={durationLabel(trip.actual_start_time, trip.actual_end_time)}
              />
              <Summary
                icon={<Gauge className="h-4 w-4" />}
                label="Final fare"
                value={formatCurrency(trip.final_fare ?? myFare)}
              />
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Trip timeline
            </h3>
            <TripTimeline
              status={trip.status}
              startedAt={trip.actual_start_time}
              endedAt={trip.actual_end_time}
            />
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Co-passengers
            </h3>
            {passengers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No passengers booked yet.</p>
            ) : (
              <ul className="space-y-3">
                {passengers.map((p) => (
                  <li key={p.booking.id} className="flex items-center gap-3">
                    <Avatar profile={p.profile} className="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{profileName(p.profile)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.booking.seats} seat{p.booking.seats > 1 ? 's' : ''} ·{' '}
                        {formatCurrency(p.booking.fare_total)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {myPayment ? (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Payment
                </h3>
                <PaymentStatusBadge status={myPayment.status} />
              </div>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(myPayment.amount)}</p>
              <p className="text-xs text-muted-foreground">
                {myPayment.method} · {formatDate(myPayment.created_at)}
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Info({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 rounded-lg bg-muted p-2 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function durationLabel(start?: string | null, end?: string | null): string {
  if (!start || !end) return '—';
  const mins = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
  );
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
