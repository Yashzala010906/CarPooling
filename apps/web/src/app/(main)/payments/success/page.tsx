import Link from 'next/link';
import { CheckCircle2, Clock } from 'lucide-react';

import { Button, Card } from '@carpool/ui';

import { getPaymentById } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { formatCurrency, formatDateTime } from '@/lib/member3/format';
import { PageHeading } from '@/components/member3/page-heading';
import { PaymentStatusBadge } from '@/components/member3/status-badge';
import { EmptyState, NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'Payment Result' };
export const dynamic = 'force-dynamic';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { paymentId } = await searchParams;
  const auth = await getAuthState();

  if (!auth.configured || !auth.userId) {
    return (
      <section className="space-y-6">
        <PageHeading title="Payment" />
        {!auth.configured ? <NotConfiguredNotice /> : <SignInPrompt />}
      </section>
    );
  }

  const payment = paymentId ? await getPaymentById(paymentId) : null;
  if (!payment) {
    return (
      <section className="space-y-6">
        <PageHeading title="Payment" backHref="/trips" />
        <EmptyState title="Payment not found" description="We couldn't locate this payment." />
      </section>
    );
  }

  const paid = payment.status === 'PAID';

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {paid ? (
            <CheckCircle2 className="h-9 w-9 text-primary" />
          ) : (
            <Clock className="h-9 w-9 text-amber-500" />
          )}
        </div>
        <h2 className="mt-4 text-xl font-bold">
          {paid ? 'Payment successful' : 'Payment initiated'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {paid
            ? 'Your trip fare has been paid.'
            : payment.method === 'CASH'
              ? 'Please pay the driver directly. This record stays pending until settled.'
              : 'Complete the payment at the provider to finish.'}
        </p>
        <p className="mt-4 text-3xl font-bold text-primary">{formatCurrency(payment.amount)}</p>
        <div className="mt-2 flex justify-center">
          <PaymentStatusBadge status={payment.status} />
        </div>

        <dl className="mt-6 space-y-2 rounded-lg border bg-muted/30 p-4 text-left text-sm">
          <Row label="Payment ID" value={payment.id} mono />
          {payment.provider_payment_id ? (
            <Row label="Transaction ID" value={payment.provider_payment_id} mono />
          ) : null}
          <Row label="Method" value={payment.method} />
          <Row label="Date" value={formatDateTime(payment.created_at)} />
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {payment.trip_id ? (
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/trips/${payment.trip_id}`}>View trip</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="flex-1">
            <Link href="/transactions">View transactions</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/trips">My trips</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'truncate font-mono text-xs' : 'font-medium'}>{value}</dd>
    </div>
  );
}
