import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

/**
 * Privileged Supabase client using the service-role key. Bypasses RLS.
 *
 * SERVER-ONLY. The `server-only` import guarantees this file can never be
 * bundled into client code. Use sparingly — only for administrative tasks
 * such as rolling back a half-created auth user when profile creation fails.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
