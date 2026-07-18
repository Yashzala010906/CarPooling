'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';

import { SubmitButton, TextField } from '@/components/ui/form';
import { forgotPasswordAction } from '@/lib/actions/auth';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations';

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    const res = await forgotPasswordAction(values);
    if (res.ok) {
      setSent(true);
      toast.success(res.message ?? 'Check your email.');
    } else {
      toast.error(res.error);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/login"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
      </Link>
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Forgot Password?</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter your registered email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <TextField
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <SubmitButton loading={isSubmitting}>Send Reset Link</SubmitButton>
      </form>
    </div>
  );
}
