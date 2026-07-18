export const metadata = { title: 'Ride Details' };

export default async function RideDetailPage({ params }: { params: Promise<{ rideId: string }> }) {
  const { rideId } = await params;
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Ride Details</h1>
      <p className="text-sm text-muted-foreground">
        Driver, route, departure, seats, and fare for ride <code>{rideId}</code>. Book from here.
        (spec 5.2)
      </p>
    </section>
  );
}
