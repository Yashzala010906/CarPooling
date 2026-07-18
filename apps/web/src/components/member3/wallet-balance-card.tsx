import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon } from 'lucide-react';

import type { WalletSummary } from '@/lib/member3/types';
import { formatCurrency } from '@/lib/member3/format';

/** Hero wallet card: current balance with credit/debit totals. */
export function WalletBalanceCard({ summary }: { summary: WalletSummary }) {
  const balance = Number(summary.wallet?.balance ?? 0);
  return (
    <div className="overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm opacity-90">
          <WalletIcon className="h-4 w-4" /> Wallet balance
        </div>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">INR</span>
      </div>
      <p className="mt-3 text-4xl font-bold tracking-tight">{formatCurrency(balance)}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/10 p-3">
          <div className="flex items-center gap-1.5 text-xs opacity-90">
            <ArrowDownLeft className="h-3.5 w-3.5" /> Total credits
          </div>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.totalCredits)}</p>
        </div>
        <div className="rounded-lg bg-white/10 p-3">
          <div className="flex items-center gap-1.5 text-xs opacity-90">
            <ArrowUpRight className="h-3.5 w-3.5" /> Total debits
          </div>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.totalDebits)}</p>
        </div>
      </div>
    </div>
  );
}
