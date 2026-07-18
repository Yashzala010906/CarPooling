export const metadata = { title: 'Offer a Ride' };

export default function OfferRidePage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Offer a Ride</h1>
      <p className="text-sm text-muted-foreground">
        Publish a ride with route, seats, and fare. Requires a registered vehicle. (spec 5.3)
      </p>
    </section>
  );
}
