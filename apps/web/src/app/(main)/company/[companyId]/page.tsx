import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Building2, Car, Mail, MapPin, Phone, Users } from 'lucide-react';

import {
  CopyCodeButton,
  LeaveCompanyButton,
  MemberManager,
  type MemberRow,
} from '@/components/company/company-clients';
import { PageHeader, RoleBadge, StatusBadge } from '@/components/ui/primitives';
import { createClient } from '@/lib/supabase/server';
import type { CompanyRole } from '@/types';

export const metadata = { title: 'Company Dashboard' };

export default async function CompanyDashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // RLS returns the row only if the user may see it (member or creator).
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .maybeSingle();
  if (!company) notFound();

  const { data: myMembership } = await supabase
    .from('company_members')
    .select('role')
    .eq('company_id', companyId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!myMembership) redirect('/company');
  const callerRole = myMembership.role as CompanyRole;
  const isManager = callerRole === 'OWNER' || callerRole === 'ADMIN';

  const { data: memberRows } = await supabase
    .from('company_members')
    .select('user_id, role, profile:profiles(full_name, avatar_url)')
    .eq('company_id', companyId)
    .order('joined_at', { ascending: true });

  const members: MemberRow[] = (memberRows ?? []).map((m) => {
    const p = m.profile as { full_name: string | null; avatar_url: string | null } | null;
    return {
      userId: m.user_id,
      name: p?.full_name ?? null,
      avatarUrl: p?.avatar_url ?? null,
      role: m.role as CompanyRole,
    };
  });

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, name, model, registration_number, status')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  const stats = [
    { label: 'Members', value: members.length, icon: <Users className="h-5 w-5" /> },
    { label: 'Company Vehicles', value: vehicles?.length ?? 0, icon: <Car className="h-5 w-5" /> },
    { label: 'Your Role', value: callerRole, icon: <Building2 className="h-5 w-5" /> },
  ];

  const contact = [
    company.email && { icon: <Mail className="h-4 w-4" />, value: company.email },
    company.phone && { icon: <Phone className="h-4 w-4" />, value: company.phone },
    company.address && { icon: <MapPin className="h-4 w-4" />, value: company.address },
  ].filter(Boolean) as { icon: React.ReactNode; value: string }[];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/company"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All Companies
      </Link>

      <PageHeader
        title={company.name}
        description={company.description ?? undefined}
        action={callerRole !== 'OWNER' ? <LeaveCompanyButton companyId={company.id} /> : undefined}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-5"
          >
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {s.icon}
            </span>
          </div>
        ))}
      </div>

      {/* Join code (managers) + contact */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {isManager && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Invite Code</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Share this code so people can join the company.
            </p>
            <CopyCodeButton code={company.code} />
          </div>
        )}
        {contact.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Contact</h3>
            <ul className="space-y-2">
              {contact.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="text-muted-foreground">{c.icon}</span>
                  {c.value}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="mb-1 text-base font-semibold text-foreground">Members</h3>
        <p className="mb-2 text-sm text-muted-foreground">
          {isManager ? 'Manage roles and membership.' : 'People in this company.'}
        </p>
        <MemberManager
          companyId={company.id}
          members={members}
          callerRole={callerRole}
          currentUserId={user.id}
        />
      </div>

      {/* Company vehicles */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Company Vehicles</h3>
          <Link href="/vehicles" className="text-sm font-semibold text-primary hover:underline">
            Manage
          </Link>
        </div>
        {vehicles && vehicles.length > 0 ? (
          <ul className="divide-y divide-border">
            {vehicles.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Car className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{v.name || v.model}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {v.registration_number}
                    </p>
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">No company vehicles yet.</p>
        )}
      </div>
    </div>
  );
}
