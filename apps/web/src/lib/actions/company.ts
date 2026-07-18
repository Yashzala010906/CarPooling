'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth';
import {
  companySchema,
  joinCompanySchema,
  type CompanyInput,
  type JoinCompanyInput,
} from '@/lib/validations';
import type { ActionResult, Company, CompanyRole } from '@/types';

/** Register a new company (atomic via RPC — creator becomes OWNER). */
export async function createCompanyAction(input: CompanyInput): Promise<ActionResult<Company>> {
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the errors and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('create_company', {
    p_name: parsed.data.name,
    p_email: parsed.data.email || null,
    p_phone: parsed.data.phone || null,
    p_address: parsed.data.address || null,
    p_description: parsed.data.description || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/company');
  return { ok: true, data: data as Company, message: 'Company created.' };
}

/** Join an existing company by code (atomic via RPC — always MEMBER). */
export async function joinCompanyAction(input: JoinCompanyInput): Promise<ActionResult<Company>> {
  const parsed = joinCompanySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid company code.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const { data, error } = await supabase.rpc('join_company_by_code', { p_code: parsed.data.code });
  if (error) {
    if (/already a member/i.test(error.message)) {
      return { ok: false, error: 'You are already a member of this company.' };
    }
    if (/invalid company code/i.test(error.message)) {
      return { ok: false, error: 'That company code was not found.' };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath('/company');
  return { ok: true, data: data as Company, message: 'You have joined the company.' };
}

/** Update company details. Only OWNER/ADMIN (enforced by RLS + this check). */
export async function updateCompanyAction(
  companyId: string,
  input: CompanyInput,
): Promise<ActionResult> {
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the errors and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const role = await getCompanyRole(companyId);
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return { ok: false, error: 'You are not allowed to edit this company.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('companies')
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      description: parsed.data.description || null,
    })
    .eq('id', companyId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/company/${companyId}`);
  return { ok: true, message: 'Company updated.' };
}

/** Leave a company. Owners cannot leave (must transfer/delete first). */
export async function leaveCompanyAction(companyId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const role = await getCompanyRole(companyId);
  if (role === 'OWNER') {
    return { ok: false, error: 'Owners cannot leave their own company.' };
  }

  const { error } = await supabase
    .from('company_members')
    .delete()
    .eq('company_id', companyId)
    .eq('user_id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/company');
  return { ok: true, message: 'You have left the company.' };
}

/** Change a member's role. OWNER only. Cannot demote the last owner. */
export async function updateMemberRoleAction(
  companyId: string,
  memberUserId: string,
  role: CompanyRole,
): Promise<ActionResult> {
  const callerRole = await getCompanyRole(companyId);
  if (callerRole !== 'OWNER') {
    return { ok: false, error: 'Only the owner can change roles.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('company_members')
    .update({ role })
    .eq('company_id', companyId)
    .eq('user_id', memberUserId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/company/${companyId}`);
  return { ok: true, message: 'Member role updated.' };
}

/** Remove a member from the company. OWNER/ADMIN only; cannot remove an owner. */
export async function removeMemberAction(
  companyId: string,
  memberUserId: string,
): Promise<ActionResult> {
  const callerRole = await getCompanyRole(companyId);
  if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
    return { ok: false, error: 'You are not allowed to remove members.' };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from('company_members')
    .select('role')
    .eq('company_id', companyId)
    .eq('user_id', memberUserId)
    .maybeSingle();
  if (target?.role === 'OWNER') {
    return { ok: false, error: 'You cannot remove the company owner.' };
  }

  const { error } = await supabase
    .from('company_members')
    .delete()
    .eq('company_id', companyId)
    .eq('user_id', memberUserId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/company/${companyId}`);
  return { ok: true, message: 'Member removed.' };
}
