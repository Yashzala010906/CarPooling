import Link from 'next/link';

import { Button } from '@carpool/ui';

import { getTransactions } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { PageHeading } from '@/components/member3/page-heading';
import { TransactionList } from '@/components/member3/transaction-list';
import { NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'Transactions' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const auth = await getAuthState();

  if (!auth.configured || !auth.userId) {
    return (
      <section className="space-y-6">
        <PageHeading title="Transaction History" description="Every credit, debit and payment." />
        {!auth.configured ? <NotConfiguredNotice /> : <SignInPrompt />}
      </section>
    );
  }

  const current = Math.max(1, Number(page) || 1);
  const { items, total } = await getTransactions(PAGE_SIZE, (current - 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-6">
      <PageHeading
        title="Transaction History"
        description={`${total} transaction${total === 1 ? '' : 's'}`}
      />
      <TransactionList items={items} />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" size="sm" disabled={current <= 1}>
            <Link href={`/transactions?page=${current - 1}`}>Previous</Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {current} of {totalPages}
          </span>
          <Button asChild variant="outline" size="sm" disabled={current >= totalPages}>
            <Link href={`/transactions?page=${current + 1}`}>Next</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
