export const metadata = { title: 'Available Rides' };

export default function AvailableRidesPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Available Rides</h1>
      <p className="text-sm text-muted-foreground">
        Matching rides with driver details, route, departure time, seats, and fare. (spec 5.2)
      </p>
    </section>
  );
}
