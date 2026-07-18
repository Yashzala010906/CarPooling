'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';

import { SelectField, SubmitButton, TextField } from '@/components/ui/form';
import { createVehicleAction, updateVehicleAction } from '@/lib/actions/vehicle';
import { vehicleSchema, type VehicleInput } from '@/lib/validations';
import { VEHICLE_TYPES } from '@/types';

export interface VehicleFormProps {
  companies: { id: string; name: string }[];
  vehicleId?: string;
  initial?: Partial<VehicleInput>;
}

export function VehicleForm({ companies, vehicleId, initial }: VehicleFormProps) {
  const router = useRouter();
  const isEdit = !!vehicleId;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof vehicleSchema>, unknown, VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: initial?.name ?? '',
      type: initial?.type,
      brand: initial?.brand ?? '',
      model: initial?.model ?? '',
      registrationNumber: initial?.registrationNumber ?? '',
      seatingCapacity: initial?.seatingCapacity ?? 4,
      color: initial?.color ?? '',
      companyId: initial?.companyId ?? '',
      status: initial?.status ?? 'ACTIVE',
    },
  });

  async function onSubmit(values: VehicleInput) {
    setServerError(null);
    const res = isEdit
      ? await updateVehicleAction(vehicleId!, values)
      : await createVehicleAction(values);
    if (!res.ok) {
      setServerError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success(res.message ?? 'Saved.');
    router.push('/vehicles');
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-border bg-card p-6"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Vehicle Name"
          placeholder="My Swift"
          error={errors.name?.message}
          {...register('name')}
        />
        <SelectField label="Vehicle Type" error={errors.type?.message} {...register('type')}>
          <option value="">Select type…</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Brand"
          placeholder="Maruti Suzuki"
          error={errors.brand?.message}
          {...register('brand')}
        />
        <TextField
          label="Model"
          placeholder="Swift Dzire"
          error={errors.model?.message}
          {...register('model')}
        />
        <TextField
          label="Registration Number"
          placeholder="GJ01AB1234"
          className="uppercase"
          error={errors.registrationNumber?.message}
          {...register('registrationNumber')}
        />
        <TextField
          label="Seating Capacity"
          type="number"
          min={1}
          max={100}
          error={errors.seatingCapacity?.message}
          {...register('seatingCapacity')}
        />
        <TextField
          label="Color"
          placeholder="White"
          error={errors.color?.message}
          {...register('color')}
        />
        {companies.length > 0 && (
          <SelectField
            label="Company (optional)"
            hint="Associate with a company you belong to."
            error={errors.companyId?.message}
            {...register('companyId')}
          >
            <option value="">Personal vehicle</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        )}
        {isEdit && (
          <SelectField label="Status" error={errors.status?.message} {...register('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </SelectField>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <SubmitButton loading={isSubmitting} className="w-auto px-6">
          {isEdit ? 'Save Changes' : 'Add Vehicle'}
        </SubmitButton>
        <button
          type="button"
          onClick={() => router.push('/vehicles')}
          className="rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
