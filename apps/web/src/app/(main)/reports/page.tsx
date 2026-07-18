import { Ban, Car, CheckCircle2, IndianRupee, Navigation, Wallet } from 'lucide-react';

import { Card } from '@carpool/ui';

import { getAnalytics } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { formatCurrency } from '@/lib/member3/format';
import { PageHeading } from '@/components/member3/page-heading';
import { StatTile } from '@/components/member3/stat-tile';
import { Breakdown, MiniBarChart } from '@/components/member3/analytics-chart';
import { NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'Reports & Analytics' };
export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const auth = await getAuthState();

  if (!auth.configured || !auth.userId) {
    return (
      <section className="space-y-6">
        <PageHeading title="Reports & Analytics" description="Your trip and financial insights." />
        {!auth.configured ? <NotConfiguredNotice /> : <SignInPrompt />}
      </section>
    );
  }

  const a = await getAnalytics();

  return (
    <section className="space-y-6">
      <PageHeading
        title="Reports & Analytics"
        description="Your trip and financial insights, from live data."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total Trips" value={a.totalTrips} icon={<Car className="h-4 w-4" />} />
        <StatTile
          label="Completed"
          value={a.completedTrips}
          tone="primary"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatTile label="Active" value={a.activeTrips} icon={<Navigation className="h-4 w-4" />} />
        <StatTile
          label="Cancelled"
          value={a.cancelledTrips}
          tone="error"
          icon={<Ban className="h-4 w-4" />}
        />
        <StatTile
          label="Total Paid"
          value={formatCurrency(a.totalPaid)}
          icon={<IndianRupee className="h-4 w-4" />}
        />
        <StatTile
          label="Wallet Balance"
          value={formatCurrency(a.walletBalance)}
          tone="primary"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatTile label="Total Credits" value={formatCurrency(a.totalCredits)} />
        <StatTile label="Total Debits" value={formatCurrency(a.totalDebits)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Trips over time</h3>
          <MiniBarChart data={a.tripsByMonth} formatValue={(v) => String(Math.round(v))} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Spending over time</h3>
          <MiniBarChart data={a.spendByMonth} formatValue={(v) => `₹${Math.round(v)}`} />
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold">Payment status breakdown</h3>
        <Breakdown items={a.paymentStatusBreakdown} />
      </Card>
    </section>
  );
}
