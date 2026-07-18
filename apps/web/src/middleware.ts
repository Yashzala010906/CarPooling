import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register'];

/**
 * Auth guard placeholder.
 * TODO: read the access token cookie, verify/refresh it, and redirect
 * unauthenticated users to /login for protected routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // const token = request.cookies.get('access_token')?.value;
  // if (!token) return NextResponse.redirect(new URL('/login', request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|ico)$).*)'],
};
