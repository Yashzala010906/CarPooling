export const metadata = { title: 'My Trips' };

export default function MyTripsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">My Trips</h1>
      <p className="text-sm text-muted-foreground">
        Booked and offered trips with their current lifecycle status. (spec 5.4)
      </p>
    </section>
  );
}
