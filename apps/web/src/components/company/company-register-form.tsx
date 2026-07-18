'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building2, Mail, MapPin, Phone } from 'lucide-react';

import { SubmitButton, TextArea, TextField } from '@/components/ui/form';
import { createCompanyAction } from '@/lib/actions/company';
import { companySchema, type CompanyInput } from '@/lib/validations';

export function CompanyRegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyInput>({ resolver: zodResolver(companySchema) });

  async function onSubmit(values: CompanyInput) {
    setServerError(null);
    const res = await createCompanyAction(values);
    if (!res.ok) {
      setServerError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success('Company created! You are the owner.');
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
        label="Company Name"
        icon={Building2}
        placeholder="Acme Corporation"
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Company Email"
          icon={Mail}
          type="email"
          placeholder="hello@acme.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Company Phone"
          icon={Phone}
          type="tel"
          placeholder="+1 (555) 000-0000"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>
      <TextField
        label="Address"
        icon={MapPin}
        placeholder="123 Market St, San Francisco"
        error={errors.address?.message}
        {...register('address')}
      />
      <TextArea
        label="Description"
        placeholder="What does your company do?"
        error={errors.description?.message}
        {...register('description')}
      />
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <div className="pt-2">
        <SubmitButton loading={isSubmitting} className="w-auto px-6">
          Create Company
        </SubmitButton>
      </div>
    </form>
  );
}
