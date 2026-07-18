'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Plus, Smartphone } from 'lucide-react';

import { Button, Input, cn } from '@carpool/ui';

import type { PaymentMethod } from '@/lib/supabase/database.types';
import { rechargeWalletAction } from '@/lib/member3/actions';
import { formatCurrency } from '@/lib/member3/format';
import { Spinner } from './states';

const QUICK = [200, 500, 1000, 2000];

/** Wallet top-up form: amount + quick chips + method. Uses the recharge RPC. */
export function RechargeForm() {
  const router = useRouter();
  const [amount, setAmount] = useState<string>('500');
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const amountNum = Number(amount);
  const valid = Number.isFinite(amountNum) && amountNum > 0 && amountNum <= 100000;

  const submit = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await rechargeWalletAction({ amount: amountNum, method });
      if (!res.ok) setError(res.error);
      else {
        setSuccess(
          `Added ${formatCurrency(amountNum)} · new balance ${formatCurrency(res.data.balance)}`,
        );
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Enter amount</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ₹
          </span>
          <Input
            type="number"
            min={1}
            max={100000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className="rounded-full border px-3 py-1 text-sm hover:bg-accent"
            >
              + ₹{q}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Payment method</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'CARD' as const, label: 'Card', icon: <CreditCard className="h-4 w-4" /> },
            { key: 'UPI' as const, label: 'UPI', icon: <Smartphone className="h-4 w-4" /> },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMethod(m.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors',
                method === m.key
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'hover:bg-accent',
              )}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-primary">{success}</p> : null}

      <Button className="w-full" onClick={submit} disabled={!valid || pending}>
        {pending ? <Spinner /> : <Plus className="h-4 w-4" />} Add{' '}
        {valid ? formatCurrency(amountNum) : 'funds'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Demo top-up settles instantly. Wire a provider to charge a real card/UPI.
      </p>
    </div>
  );
}
