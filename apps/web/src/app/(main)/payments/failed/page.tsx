import Link from 'next/link';
import { XCircle } from 'lucide-react';

import { Button, Card } from '@carpool/ui';

import { PageHeading } from '@/components/member3/page-heading';

export const metadata = { title: 'Payment Failed' };
export const dynamic = 'force-dynamic';

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ tripId?: string; reason?: string }>;
}) {
  const { tripId, reason } = await searchParams;
  // Never surface raw provider errors; show a safe generic message otherwise.
  const message =
    reason?.slice(0, 160) || 'Your payment could not be completed. No money was deducted.';

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <PageHeading title="Payment" backHref={tripId ? `/trips/${tripId}` : '/trips'} />
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-9 w-9 text-destructive" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Payment failed</h2>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {tripId ? (
            <Button asChild className="flex-1">
              <Link href={`/payments?tripId=${tripId}`}>Retry payment</Link>
            </Button>
          ) : null}
          {tripId ? (
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/trips/${tripId}`}>Return to trip</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="flex-1">
            <Link href="/wallet">Top up wallet</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}
