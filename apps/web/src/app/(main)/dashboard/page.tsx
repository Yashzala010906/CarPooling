export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Overview of upcoming trips, wallet balance, and quick actions.
      </p>
    </section>
  );
}
