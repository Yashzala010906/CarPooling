export const metadata = { title: 'Payments' };

export default function PaymentsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
      <p className="text-sm text-muted-foreground">
        Complete post-trip payments via cash, card, UPI, or wallet. (spec 5.6)
      </p>
    </section>
  );
}
