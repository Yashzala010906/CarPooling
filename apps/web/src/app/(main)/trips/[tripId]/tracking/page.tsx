import { notFound } from 'next/navigation';
import { Flag, MapPin } from 'lucide-react';

import { Card } from '@carpool/ui';

import { getTripDetail } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { profileName } from '@/lib/member3/types';
import { isTripActive } from '@/lib/member3/lifecycle';
import { PageHeading } from '@/components/member3/page-heading';
import { Avatar } from '@/components/member3/avatar';
import { LiveTrackingMap } from '@/components/member3/live-tracking-map';
import { DriverLocationBroadcaster } from '@/components/member3/driver-location-broadcaster';
import { NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'Live Tracking' };
export const dynamic = 'force-dynamic';

export default async function TrackingPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const auth = await getAuthState();

  if (!auth.configured || !auth.userId) {
    return (
      <section className="space-y-6">
        <PageHeading title="Live Tracking" backHref={`/trips/${tripId}`} />
        {!auth.configured ? <NotConfiguredNotice /> : <SignInPrompt />}
      </section>
    );
  }

  const detail = await getTripDetail(tripId);
  if (!detail) notFound();

  const { trip, ride, driver, viewerRole, lastLocation } = detail;
  const origin =
    ride?.origin_lat != null && ride?.origin_lng != null
      ? { lat: ride.origin_lat, lng: ride.origin_lng }
      : null;
  const destination =
    ride?.destination_lat != null && ride?.destination_lng != null
      ? { lat: ride.destination_lat, lng: ride.destination_lng }
      : null;

  return (
    <section className="space-y-6">
      <PageHeading title="Live Tracking" backHref={`/trips/${trip.id}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {viewerRole === 'DRIVER' && isTripActive(trip.status) ? (
            <DriverLocationBroadcaster tripId={trip.id} />
          ) : null}
          <LiveTrackingMap
            tripId={trip.id}
            status={trip.status}
            origin={origin}
            destination={destination}
            initialLocation={lastLocation}
          />
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Trip details
            </h3>
            <div className="flex gap-3">
              <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Pickup</p>
                <p className="text-sm font-medium">{ride?.origin_address ?? '—'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                <Flag className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Destination</p>
                <p className="text-sm font-medium">{ride?.destination_address ?? '—'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {viewerRole === 'DRIVER' ? 'You (driver)' : 'Active driver'}
            </h3>
            <div className="flex items-center gap-3">
              <Avatar profile={driver} className="h-11 w-11" />
              <div>
                <p className="font-medium">{profileName(driver)}</p>
                <p className="text-xs text-muted-foreground">
                  {ride?.vehicle_model ?? 'Vehicle'} · {ride?.vehicle_registration ?? ''}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
