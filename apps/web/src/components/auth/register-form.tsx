'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Lock, Mail, Phone, User } from 'lucide-react';

import { PasswordField, SubmitButton, TextField } from '@/components/ui/form';
import { registerAction } from '@/lib/actions/auth';
import { registerSchema, type RegisterInput } from '@/lib/validations';

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const res = await registerAction(values);
    if (!res.ok) {
      setServerError(res.error);
      toast.error(res.error);
      return;
    }
    if (res.data?.needsConfirmation) {
      toast.success('Account created! Check your email to confirm your address.');
      router.replace('/login');
    } else {
      toast.success('Account created! Welcome aboard.');
      router.replace('/dashboard');
      router.refresh();
    }
  }

  return (
    <div>
      <Link
        href="/login"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
      </Link>
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Create Account</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        noValidate
      >
        <TextField
          wrapperClassName="md:col-span-2"
          label="Full Name"
          icon={User}
          autoComplete="name"
          placeholder="John Doe"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <TextField
          label="Phone Number"
          icon={Phone}
          type="tel"
          autoComplete="tel"
          placeholder="+1 (555) 000-0000"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <TextField
          label="Email Address"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="john@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField
          label="Confirm Password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <label className="mt-1 flex items-start gap-3 md:col-span-2">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
            {...register('acceptTerms')}
          />
          <span className="text-sm text-muted-foreground">
            I agree to the <span className="text-primary underline">Terms of Service</span> and{' '}
            <span className="text-primary underline">Privacy Policy</span>.
            {errors.acceptTerms && (
              <span className="mt-1 block text-xs font-medium text-destructive">
                {errors.acceptTerms.message}
              </span>
            )}
          </span>
        </label>

        {serverError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
            {serverError}
          </p>
        )}

        <div className="md:col-span-2">
          <SubmitButton loading={isSubmitting}>
            Register Account <ArrowRight className="h-4 w-4" />
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
