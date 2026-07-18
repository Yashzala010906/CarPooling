'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Mail } from 'lucide-react';

import { PasswordField, SubmitButton, TextField } from '@/components/ui/form';
import { loginAction } from '@/lib/actions/auth';
import { loginSchema, type LoginInput } from '@/lib/validations';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirectTo') || '/dashboard';
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const res = await loginAction(values);
    if (!res.ok) {
      setServerError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success('Welcome back!');
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col">
      <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Login to continue
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
        <PasswordField
          label="Password"
          icon={Lock}
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {serverError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <SubmitButton loading={isSubmitting}>Login</SubmitButton>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold text-muted-foreground">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">Don&apos;t have an account yet?</p>
        <Link
          href="/register"
          className="block w-full rounded-lg border-2 border-primary py-2.5 text-sm font-semibold uppercase tracking-wide text-primary transition-all hover:bg-primary/5"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
