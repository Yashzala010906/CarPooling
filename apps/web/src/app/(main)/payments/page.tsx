import Link from 'next/link';
import { CreditCard } from 'lucide-react';

import { Button, Card } from '@carpool/ui';

import { getMyTrips, getTripDetail, getWalletSummary } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { routeLabel } from '@/lib/member3/types';
import { isTripPayable } from '@/lib/member3/lifecycle';
import { formatCurrency } from '@/lib/member3/format';
import { PageHeading } from '@/components/member3/page-heading';
import { PaymentMethodSelector } from '@/components/member3/payment-method-selector';
import { EmptyState, NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'Payments' };
export const dynamic = 'force-dynamic';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tripId?: string }>;
}) {
  const { tripId } = await searchParams;
  const auth = await getAuthState();

  if (!auth.configured || !auth.userId) {
    return (
      <section className="space-y-6">
        <PageHeading title="Payments" description="Complete post-trip payments." />
        {!auth.configured ? <NotConfiguredNotice /> : <SignInPrompt />}
      </section>
    );
  }

  // Single-trip checkout.
  if (tripId) {
    const [detail, wallet] = await Promise.all([getTripDetail(tripId), getWalletSummary()]);
    const amount = detail?.myBooking?.fare_total ?? detail?.ride?.fare_per_seat ?? 0;
    return (
      <section className="space-y-6">
        <PageHeading
          title="Payment Method"
          description={routeLabel(detail?.ride)}
          backHref={`/trips/${tripId}`}
        />
        {!detail ? (
          <EmptyState title="Trip not found" description="This trip is unavailable for payment." />
        ) : detail.myPayment?.status === 'PAID' ? (
          <Card className="p-6 text-center">
            <p className="font-semibold text-primary">This trip is already paid.</p>
            <Button asChild className="mt-4">
              <Link href={`/payments/success?paymentId=${detail.myPayment.id}`}>View receipt</Link>
            </Button>
          </Card>
        ) : (
          <div className="mx-auto max-w-xl">
            <Card className="p-6">
              <PaymentMethodSelector
                tripId={tripId}
                amount={Number(amount)}
                walletBalance={Number(wallet.wallet?.balance ?? 0)}
              />
            </Card>
          </div>
        )}
      </section>
    );
  }

  // Otherwise list trips awaiting payment.
  const trips = await getMyTrips();
  const payable = trips.filter((t) => t.viewerRole === 'PASSENGER' && isTripPayable(t.trip.status));

  return (
    <section className="space-y-6">
      <PageHeading title="Payments" description="Trips awaiting payment." />
      {payable.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-8 w-8" />}
          title="Nothing to pay"
          description="Fares for completed trips will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {payable.map((t) => (
            <Card key={t.trip.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{routeLabel(t.ride)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(t.trip.final_fare ?? t.ride?.fare_per_seat ?? 0)}
                </p>
              </div>
              <Button asChild size="sm">
                <Link href={`/payments?tripId=${t.trip.id}`}>Pay</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
