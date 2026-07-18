import type { PostgrestError } from '@supabase/supabase-js';

import type { Database } from './database.types';
import type { createClient } from './server';

/**
 * Typed helpers for the Supabase write path.
 *
 * supabase-js@2's generic inference collapses `.rpc(args)` and `.insert(values)`
 * to `undefined`/`never` when the `Database` type is hand-written rather than
 * produced by `supabase gen types` (reads infer correctly). These wrappers keep
 * the call sites fully typed against our schema while isolating the single cast
 * needed to work around that quirk. Replace with generated types to drop them.
 *
 * `DB` is derived from the factory's return type so it matches exactly whatever
 * `SupabaseClient` shape the installed @supabase/ssr produces.
 */

export type DB = Awaited<ReturnType<typeof createClient>>;

type Fns = Database['public']['Functions'];
type Tables = Database['public']['Tables'];

export async function callRpc<K extends keyof Fns>(
  client: DB,
  fn: K,
  args: Fns[K]['Args'],
): Promise<{ data: Fns[K]['Returns'] | null; error: PostgrestError | null }> {
  const rpc = client.rpc as unknown as (
    name: string,
    params: unknown,
  ) => Promise<{ data: Fns[K]['Returns'] | null; error: PostgrestError | null }>;
  return rpc(fn as string, args);
}

export async function insertRow<K extends keyof Tables>(
  client: DB,
  table: K,
  values: Tables[K]['Insert'],
): Promise<{ error: PostgrestError | null }> {
  const from = client.from(table as string) as unknown as {
    insert: (v: unknown) => Promise<{ error: PostgrestError | null }>;
  };
  return from.insert(values);
}
