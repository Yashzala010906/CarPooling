'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, CreditCard, Smartphone, Wallet } from 'lucide-react';

import { Button, cn } from '@carpool/ui';

import type { PaymentMethod } from '@/lib/supabase/database.types';
import { createTripPaymentAction, payTripFromWalletAction } from '@/lib/member3/actions';
import { formatCurrency } from '@/lib/member3/format';
import { Spinner } from './states';

const METHODS: { key: PaymentMethod; label: string; hint: string; icon: React.ReactNode }[] = [
  {
    key: 'WALLET',
    label: 'Wallet',
    hint: 'Pay instantly from your balance',
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    key: 'CARD',
    label: 'Card',
    hint: 'Credit / Debit / RuPay',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    key: 'UPI',
    label: 'UPI',
    hint: 'Instant bank transfer',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    key: 'CASH',
    label: 'Cash',
    hint: 'Pay the driver directly',
    icon: <Banknote className="h-5 w-5" />,
  },
];

/**
 * Payment method chooser. Wallet is the fully-settled path (atomic DB transfer).
 * Card/UPI create a PENDING payment routed through the provider verify flow;
 * Cash records a pay-on-arrival payment. Amount is never taken from the client —
 * the server derives it from the booking.
 */
export function PaymentMethodSelector({
  tripId,
  amount,
  walletBalance,
}: {
  tripId: string;
  amount: number;
  walletBalance: number;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>('WALLET');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const insufficient = method === 'WALLET' && walletBalance < amount;

  const pay = () => {
    setError(null);
    startTransition(async () => {
      if (method === 'WALLET') {
        const res = await payTripFromWalletAction(tripId);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push(`/payments/success?paymentId=${res.data.paymentId}`);
        return;
      }

      const res = await createTripPaymentAction({ tripId, method });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Provider checkout / cash-on-arrival: the status-aware result page takes over.
      router.push(`/payments/success?paymentId=${res.data.payment.id}`);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMethod(m.key)}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
              method === m.key
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'hover:bg-accent',
            )}
          >
            <span className={cn('text-muted-foreground', method === m.key && 'text-primary')}>
              {m.icon}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{m.label}</span>
              <span className="block text-xs text-muted-foreground">
                {m.key === 'WALLET' ? `Balance ${formatCurrency(walletBalance)}` : m.hint}
              </span>
            </span>
            <span
              className={cn(
                'h-4 w-4 rounded-full border',
                method === m.key ? 'border-4 border-primary' : 'border-muted-foreground/40',
              )}
            />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
        <span className="text-sm text-muted-foreground">Total fare</span>
        <span className="text-xl font-bold">{formatCurrency(amount)}</span>
      </div>

      {insufficient ? (
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
          Insufficient wallet balance. Recharge your wallet or choose another method.
        </p>
      ) : null}
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <Button className="w-full" size="lg" onClick={pay} disabled={pending || insufficient}>
        {pending ? <Spinner /> : null} Pay {formatCurrency(amount)}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Secured with end-to-end encryption. Payments are verified server-side.
      </p>
    </div>
  );
}
