export const metadata = { title: 'Route Confirmation' };

export default function RouteConfirmationPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Route Confirmation</h1>
      <p className="text-sm text-muted-foreground">
        Displays the calculated route on the map for confirmation before search/publish. (spec 5.2,
        5.3)
      </p>
    </section>
  );
}
