export const metadata = { title: 'Ride History' };

export default function RideHistoryPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Ride History</h1>
      <p className="text-sm text-muted-foreground">
        All completed trips: participants, route, vehicle, date, and status. (spec 5.7)
      </p>
    </section>
  );
}
