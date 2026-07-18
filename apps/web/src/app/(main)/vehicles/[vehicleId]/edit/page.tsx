import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/ui/primitives';
import { VehicleForm } from '@/components/vehicle/vehicle-form';
import { createClient } from '@/lib/supabase/server';
import { VEHICLE_TYPES, type VehicleStatus } from '@/types';
import type { VehicleInput } from '@/lib/validations';

export const metadata = { title: 'Edit Vehicle' };

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .maybeSingle();
  if (!vehicle) notFound();

  const { data: memberships } = await supabase
    .from('company_members')
    .select('company:companies(id, name)')
    .eq('user_id', user.id);
  const companies = (memberships ?? [])
    .map((m) => m.company as { id: string; name: string } | null)
    .filter((c): c is { id: string; name: string } => !!c);

  const typeValue = (VEHICLE_TYPES as readonly string[]).includes(vehicle.type ?? '')
    ? (vehicle.type as (typeof VEHICLE_TYPES)[number])
    : undefined;

  const initial: Partial<VehicleInput> = {
    name: vehicle.name ?? '',
    type: typeValue,
    brand: vehicle.brand ?? '',
    model: vehicle.model ?? '',
    registrationNumber: vehicle.registration_number,
    seatingCapacity: vehicle.seating_capacity,
    color: vehicle.color ?? '',
    companyId: vehicle.company_id ?? '',
    status: vehicle.status as VehicleStatus,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/vehicles"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Vehicles
      </Link>
      <PageHeader title="Edit Vehicle" description={vehicle.registration_number} />
      <VehicleForm companies={companies} vehicleId={vehicle.id} initial={initial} />
    </div>
  );
}
