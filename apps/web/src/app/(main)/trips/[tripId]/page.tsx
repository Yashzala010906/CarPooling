import { MapContainer } from '@carpool/ui';

export const metadata = { title: 'Trip Details' };

export default async function TripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Trip Details</h1>
      <p className="text-sm text-muted-foreground">
        Live tracking, participants, vehicle, schedule, fare, and chat for trip{' '}
        <code>{tripId}</code>. (spec 5.4, 5.5)
      </p>
      {/* Live trip tracking (spec 5.5): subscribe to SocketEvents.TRIP_LOCATION_UPDATE */}
      <MapContainer className="h-96" />
    </section>
  );
}
