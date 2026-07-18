import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import type { Database } from './database.types';
import { getSupabaseConfig } from './config';

/**
 * Server-side Supabase client bound to the request cookies. Use in Server
 * Components, Route Handlers and Server Actions. Reads the authenticated user
 * from the session cookie; all queries run under that user's RLS context.
 *
 * In Next.js 15 `cookies()` is async, so this factory is async too.
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // `setAll` is called from a Server Component where mutating cookies is
          // not allowed. Session refresh is handled by the middleware, so this
          // is safe to ignore.
        }
      },
    },
  });
}

/**
 * Returns the authenticated Supabase user for the current request, or null.
 * Uses `getUser()` (which re-validates the JWT with the Auth server) rather
 * than `getSession()` so it can be trusted for authorization decisions.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
