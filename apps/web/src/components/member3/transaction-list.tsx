import { ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

import { cn } from '@carpool/ui';

import type { TransactionRow, TransactionType } from '@/lib/supabase/database.types';
import { formatCurrency, formatDateTime } from '@/lib/member3/format';
import { EmptyState } from './states';

const isCredit = (t: TransactionType) => t === 'CREDIT' || t === 'REFUND';

const TYPE_LABEL: Record<TransactionType, string> = {
  PAYMENT: 'Payment',
  DEBIT: 'Debit',
  CREDIT: 'Credit',
  REFUND: 'Refund',
};

export function TransactionCard({ txn }: { txn: TransactionRow }) {
  const credit = isCredit(txn.type);
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full',
          credit ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        {txn.type === 'REFUND' ? (
          <RotateCcw className="h-4 w-4" />
        ) : credit ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{txn.description ?? TYPE_LABEL[txn.type]}</p>
        <p className="text-xs text-muted-foreground">
          {TYPE_LABEL[txn.type]}
          {txn.method ? ` · ${txn.method}` : ''} · {formatDateTime(txn.created_at)}
        </p>
      </div>
      <div className="text-right">
        <p className={cn('text-sm font-semibold', credit ? 'text-primary' : 'text-foreground')}>
          {credit ? '+' : '−'}
          {formatCurrency(txn.amount)}
        </p>
        {txn.status !== 'SUCCESS' ? (
          <p className="text-[11px] text-muted-foreground">{txn.status}</p>
        ) : null}
      </div>
    </div>
  );
}

export function TransactionList({ items }: { items: TransactionRow[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Wallet and payment activity shows here."
      />
    );
  }
  return (
    <div className="space-y-2">
      {items.map((t) => (
        <TransactionCard key={t.id} txn={t} />
      ))}
    </div>
  );
}
