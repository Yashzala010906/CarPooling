import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Car, Plus } from 'lucide-react';

import { EmptyState, PageHeader } from '@/components/ui/primitives';
import { VehiclesTable, type VehicleListItem } from '@/components/vehicle/vehicles-table';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'My Vehicles' };

export default async function VehiclesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // RLS returns vehicles the user owns plus vehicles of companies they belong to.
  const { data } = await supabase
    .from('vehicles')
    .select(
      'id, name, model, registration_number, seating_capacity, status, owner:profiles(full_name, avatar_url)',
    )
    .order('created_at', { ascending: false });

  const vehicles: VehicleListItem[] = (data ?? []).map((v) => {
    const owner = v.owner as { full_name: string | null; avatar_url: string | null } | null;
    return {
      id: v.id,
      name: v.name,
      model: v.model,
      registrationNumber: v.registration_number,
      seatingCapacity: v.seating_capacity,
      status: v.status,
      ownerName: owner?.full_name ?? null,
      ownerAvatar: owner?.avatar_url ?? null,
    };
  });

  const activeCount = vehicles.filter((v) => v.status === 'ACTIVE').length;

  const addButton = (
    <Link
      href="/vehicles/add"
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
    >
      <Plus className="h-4 w-4" /> Add Vehicle
    </Link>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My Vehicles"
        description="Register and manage your vehicles."
        action={vehicles.length > 0 ? addButton : undefined}
      />

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet"
          description="Add your first vehicle to start offering rides."
          action={addButton}
        />
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Vehicles" value={vehicles.length} />
            <StatCard label="Active" value={activeCount} />
            <StatCard label="Inactive" value={vehicles.length - activeCount} />
          </div>
          <VehiclesTable vehicles={vehicles} />
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Car className="h-5 w-5" />
      </span>
    </div>
  );
}
