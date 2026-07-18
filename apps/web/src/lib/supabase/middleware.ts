import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import type { Database } from './database.types';

/**
 * Refreshes the Supabase auth session on every request and rewrites the
 * refreshed auth cookies onto the response. Following the official
 * @supabase/ssr middleware pattern. Kept side-effect-light: it only touches
 * Supabase cookies and never redirects, so it composes with other members'
 * middleware logic.
 *
 * No-ops when Supabase env vars are absent (e.g. during scaffolding), so the
 * app still builds/runs before Supabase is configured.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Touch the user to trigger a token refresh when needed. Do not remove:
  // without this call the session is not kept alive between requests.
  await supabase.auth.getUser();

  return response;
}
