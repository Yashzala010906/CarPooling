export const metadata = { title: 'My Vehicles' };

export default function VehiclesPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">My Vehicles</h1>
      <p className="text-sm text-muted-foreground">
        Register and manage vehicles: model, registration number, seating capacity. (spec 5.8)
      </p>
    </section>
  );
}
