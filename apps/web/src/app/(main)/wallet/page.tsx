export const metadata = { title: 'Wallet' };

export default function WalletPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
      <p className="text-sm text-muted-foreground">
        View balance, recharge (Razorpay test mode), and pay with wallet. (spec 5.6)
      </p>
    </section>
  );
}
