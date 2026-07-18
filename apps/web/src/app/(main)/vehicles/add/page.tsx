import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/ui/primitives';
import { VehicleForm } from '@/components/vehicle/vehicle-form';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Add Vehicle' };

export default async function AddVehiclePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships } = await supabase
    .from('company_members')
    .select('company:companies(id, name)')
    .eq('user_id', user.id);

  const companies = (memberships ?? [])
    .map((m) => m.company as { id: string; name: string } | null)
    .filter((c): c is { id: string; name: string } => !!c);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/vehicles"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Vehicles
      </Link>
      <PageHeader title="Add Vehicle" description="Register a vehicle you own." />
      <VehicleForm companies={companies} />
    </div>
  );
}
