import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, Plus, Users } from 'lucide-react';

import { EmptyState, PageHeader, RoleBadge } from '@/components/ui/primitives';
import { createClient } from '@/lib/supabase/server';
import type { CompanyRole } from '@/types';

export const metadata = { title: 'Company' };

export default async function CompanyHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships } = await supabase
    .from('company_members')
    .select('role, company:companies(id, name, description, code)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true });

  const companies = (memberships ?? [])
    .map((m) => ({
      role: m.role as CompanyRole,
      company: m.company as {
        id: string;
        name: string;
        description: string | null;
        code: string;
      } | null,
    }))
    .filter(
      (
        m,
      ): m is {
        role: CompanyRole;
        company: { id: string; name: string; description: string | null; code: string };
      } => !!m.company,
    );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Company"
        description="Companies you own or belong to."
        action={
          <div className="flex gap-2">
            <Link
              href="/company/join"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              <Users className="h-4 w-4" /> Join
            </Link>
            <Link
              href="/company/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Register
            </Link>
          </div>
        }
      />

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Register your own company to manage its members and vehicles, or join an existing one with a company code."
          action={
            <div className="flex gap-3">
              <Link
                href="/company/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Register a Company
              </Link>
              <Link
                href="/company/join"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                Join with Code
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.map(({ role, company }) => (
            <Link
              key={company.id}
              href={`/company/${company.id}`}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </span>
                <RoleBadge role={role} />
              </div>
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                {company.name}
              </h3>
              {company.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {company.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
