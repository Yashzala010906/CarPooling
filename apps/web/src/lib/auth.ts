import 'server-only';

import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';
import type { CompanyRole, Profile } from '@/types';

/**
 * Reusable server-side authorization utilities. Other team members' modules
 * should import these rather than re-deriving auth, so the identity contract
 * (authenticated user id, profile, company role) stays stable.
 */

/** The authenticated auth user, or null. Never trust a client-sent user id. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Require an authenticated user or redirect to /login. Returns the user. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/** The authenticated user's application profile (or null). */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

/** The current user's company role, or null if they are not a member. */
export async function getCompanyRole(companyId: string): Promise<CompanyRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('company_members')
    .select('role')
    .eq('company_id', companyId)
    .eq('user_id', user.id)
    .maybeSingle();
  return data?.role ?? null;
}

/** True when the current user is OWNER or ADMIN of the given company. */
export async function isCompanyManager(companyId: string): Promise<boolean> {
  const role = await getCompanyRole(companyId);
  return role === 'OWNER' || role === 'ADMIN';
}
