/**
 * Central place to read Supabase environment configuration. Keeps the failure
 * mode explicit: if the public env vars are missing we surface a clear error at
 * the call site instead of letting the SDK throw an opaque one.
 */

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.',
    );
  }

  return { url, anonKey };
}

/** True when the public Supabase env vars are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
