export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground">
        My trips, vehicles, payment methods, history, saved places, help. (spec 5.10)
      </p>
    </section>
  );
}
