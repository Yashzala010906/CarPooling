import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { PageHeader } from '@/components/ui/primitives';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Edit Profile' };

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/profile"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>
      <PageHeader title="Edit Profile" description="Update your personal information and avatar." />
      <EditProfileForm
        initial={{
          fullName: profile?.full_name ?? '',
          phone: profile?.phone ?? '',
          avatarUrl: profile?.avatar_url ?? null,
        }}
      />
    </div>
  );
}
