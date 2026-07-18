import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/', '/login', '/register'];

/**
 * Keeps the Supabase auth session fresh on every request (Member 3 pages read
 * the user from Supabase cookies) and guards protected routes.
 *
 * Member 1 owns the full auth flow; this stays additive — it refreshes the
 * Supabase session cookie and only redirects unauthenticated users away from
 * protected routes once Supabase is configured.
 */
export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) {
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico)$).*)'],
};
