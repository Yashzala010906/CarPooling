export const metadata = { title: 'Saved Places' };

export default function SavedPlacesPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Saved Places</h1>
      <p className="text-sm text-muted-foreground">
        Save frequent pickup/destination locations like Home or Office. (spec 5.10)
      </p>
    </section>
  );
}
