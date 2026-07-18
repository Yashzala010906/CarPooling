'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { SubmitButton } from '@/components/ui/form';
import { resendOtpAction, verifyOtpAction } from '@/lib/actions/auth';

const RESEND_COOLDOWN = 30;

export function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    const res = await verifyOtpAction({ email, token: code });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success('Email verified!');
    router.replace('/dashboard');
    router.refresh();
  }

  async function onResend() {
    if (cooldown > 0 || !email) return;
    const res = await resendOtpAction({ email });
    if (res.ok) {
      toast.success(res.message ?? 'Code sent.');
      setCooldown(RESEND_COOLDOWN);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/login"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
      </Link>
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Verify Your Email</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        {email ? (
          <>
            Enter the 6-digit code sent to{' '}
            <span className="font-medium text-foreground">{email}</span>.
          </>
        ) : (
          'Enter the 6-digit code sent to your email.'
        )}
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          className="w-full rounded-lg border bg-background px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <SubmitButton loading={loading}>Verify</SubmitButton>
      </form>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Didn&apos;t get a code?{' '}
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0}
          className="font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
        </button>
      </div>
    </div>
  );
}
