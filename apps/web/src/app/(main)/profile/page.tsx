import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, Mail, Pencil, Phone, ShieldCheck } from 'lucide-react';

import { Avatar, PageHeader, RoleBadge } from '@/components/ui/primitives';
import { createClient } from '@/lib/supabase/server';
import type { CompanyRole } from '@/types';

export const metadata = { title: 'My Profile' };

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  const { data: memberships } = await supabase
    .from('company_members')
    .select('role, company:companies(id, name)')
    .eq('user_id', user.id);

  const rows: { label: string; value: string; icon: React.ReactNode }[] = [
    { label: 'Email', value: user.email ?? '—', icon: <Mail className="h-4 w-4" /> },
    {
      label: 'Phone',
      value: profile?.phone || 'Not provided',
      icon: <Phone className="h-4 w-4" />,
    },
    {
      label: 'Account role',
      value: profile?.role === 'admin' ? 'Administrator' : 'Member',
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      label: 'Member since',
      value: formatDate(profile?.created_at),
      icon: <Building2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="My Profile"
        description="Your account and personal information."
        action={
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Pencil className="h-4 w-4" /> Edit Profile
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-4 border-b border-border bg-muted/30 p-6 sm:flex-row">
          <Avatar src={profile?.avatar_url} name={profile?.full_name} size={80} />
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-foreground">
              {profile?.full_name || 'Unnamed user'}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 px-6 py-4">
              <span className="text-muted-foreground">{row.icon}</span>
              <dt className="w-32 shrink-0 text-sm text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-base font-semibold text-foreground">Companies</h3>
        {memberships && memberships.length > 0 ? (
          <ul className="space-y-3">
            {memberships.map((m, i) => {
              const company = m.company as { id: string; name: string } | null;
              return (
                <li key={company?.id ?? i} className="flex items-center justify-between">
                  <Link
                    href="/company"
                    className="flex items-center gap-3 text-sm font-medium text-foreground hover:text-primary"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </span>
                    {company?.name ?? 'Company'}
                  </Link>
                  <RoleBadge role={m.role as CompanyRole} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            You&apos;re not part of any company yet.{' '}
            <Link href="/company" className="font-semibold text-primary hover:underline">
              Create or join one
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
