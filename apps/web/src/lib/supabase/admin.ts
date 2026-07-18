import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import { getSupabaseConfig } from './config';

/**
 * Service-role Supabase client. **Server-only** — the `server-only` import
 * makes the build fail if this is ever pulled into a Client Component, so the
 * service-role key can never reach the browser.
 *
 * Bypasses RLS, so only use it for trusted server-side operations that have
 * already performed their own authorization checks (e.g. verifying a payment
 * webhook signature, reconciling wallet balances).
 */
export function createAdminClient() {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in apps/web/.env (server-only).');
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
