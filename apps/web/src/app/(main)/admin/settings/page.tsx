export const metadata = { title: 'Company Settings' };

export default function AdminSettingsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Company Settings</h1>
      <p className="text-sm text-muted-foreground">
        Fuel cost, travel cost, and operational configuration. (spec 3)
      </p>
    </section>
  );
}
