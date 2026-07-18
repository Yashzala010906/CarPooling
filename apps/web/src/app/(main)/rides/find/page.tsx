export const metadata = { title: 'Find a Ride' };

export default function FindRidePage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Find a Ride</h1>
      <p className="text-sm text-muted-foreground">
        Search rides by pickup, destination, date, time, seats, recurring. (spec 5.2)
      </p>
    </section>
  );
}
