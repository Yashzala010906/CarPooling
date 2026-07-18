export const metadata = { title: 'Registered Vehicles' };

export default function AdminVehiclesPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Registered Vehicles</h1>
      <p className="text-sm text-muted-foreground">
        Company admin: manage registered vehicles and driver information. (spec 3)
      </p>
    </section>
  );
}
