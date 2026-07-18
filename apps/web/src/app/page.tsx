import Link from 'next/link';
import { Button } from '@carpool/ui';

/**
 * Splash / landing screen (§5.1). Redirect authenticated users to /dashboard
 * once auth is implemented (see src/middleware.ts).
 */
export default function SplashPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Carpool</h1>
      <p className="max-w-md text-muted-foreground">
        Enterprise carpooling — find a ride or offer one to your colleagues.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/register">Sign up</Link>
        </Button>
      </div>
    </main>
  );
}
