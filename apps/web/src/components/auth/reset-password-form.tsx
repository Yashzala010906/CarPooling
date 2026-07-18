'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

import { PasswordField, SubmitButton } from '@/components/ui/form';
import { resetPasswordAction } from '@/lib/actions/auth';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations';

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const res = await resetPasswordAction(values);
    if (!res.ok) {
      setServerError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success(res.message ?? 'Password updated.');
    router.replace('/login');
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Set a New Password</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose a strong password you don&apos;t use elsewhere.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <PasswordField
          label="New Password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField
          label="Confirm New Password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        {serverError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}
        <SubmitButton loading={isSubmitting}>Update Password</SubmitButton>
      </form>
    </div>
  );
}
