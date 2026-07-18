import Link from 'next/link';

import { Button } from '@carpool/ui';

import { getWalletSummary } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { PageHeading } from '@/components/member3/page-heading';
import { WalletBalanceCard } from '@/components/member3/wallet-balance-card';
import { RechargeForm } from '@/components/member3/recharge-form';
import { TransactionList } from '@/components/member3/transaction-list';
import { NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'Wallet' };
export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const auth = await getAuthState();

  if (!auth.configured || !auth.userId) {
    return (
      <section className="space-y-6">
        <PageHeading title="Wallet" description="Balance, recharges and spending." />
        {!auth.configured ? <NotConfiguredNotice /> : <SignInPrompt />}
      </section>
    );
  }

  const summary = await getWalletSummary();

  return (
    <section className="space-y-6">
      <PageHeading title="Wallet" description="Balance, recharges and spending." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <WalletBalanceCard summary={summary} />
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recent activity
              </h3>
              <Button asChild variant="link" size="sm">
                <Link href="/transactions">View all</Link>
              </Button>
            </div>
            <TransactionList items={summary.recent} />
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recharge wallet
          </h3>
          <RechargeForm />
        </div>
      </div>
    </section>
  );
}
