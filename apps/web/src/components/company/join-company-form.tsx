'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

import { SubmitButton, TextField } from '@/components/ui/form';
import { joinCompanyAction } from '@/lib/actions/company';
import { joinCompanySchema, type JoinCompanyInput } from '@/lib/validations';

export function JoinCompanyForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinCompanyInput>({ resolver: zodResolver(joinCompanySchema) });

  async function onSubmit(values: JoinCompanyInput) {
    setServerError(null);
    const res = await joinCompanyAction(values);
    if (!res.ok) {
      setServerError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success(res.message ?? 'Joined company.');
    router.push(res.data ? `/company/${res.data.id}` : '/company');
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-border bg-card p-6"
      noValidate
    >
      <TextField
        label="Company Code"
        icon={KeyRound}
        placeholder="ABC123"
        autoCapitalize="characters"
        className="uppercase tracking-widest"
        error={errors.code?.message}
        {...register('code')}
      />
      <p className="text-xs text-muted-foreground">
        Ask a company admin for the 6-character join code.
      </p>
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <div className="pt-2">
        <SubmitButton loading={isSubmitting} className="w-auto px-6">
          Join Company
        </SubmitButton>
      </div>
    </form>
  );
}
