import Link from 'next/link';
import { AlertTriangle, Inbox, LogIn, Loader2 } from 'lucide-react';

import { cn } from '@carpool/ui';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-sm text-muted-foreground">
      <Spinner />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
      <div className="text-muted-foreground">{icon ?? <Inbox className="h-8 w-8" />}</div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-destructive">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}

/** Prompt shown when Supabase is configured but the visitor isn't signed in. */
export function SignInPrompt() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
      <LogIn className="h-8 w-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">Sign in to continue</p>
        <p className="text-sm text-muted-foreground">
          Your trips, wallet and payments are private to your account.
        </p>
      </div>
      <Link
        href="/login"
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Go to sign in
      </Link>
    </div>
  );
}

/** Inline notice shown when Supabase env is not configured yet. */
export function NotConfiguredNotice() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
      <p className="font-semibold">Supabase not configured</p>
      <p className="mt-1 text-muted-foreground">
        Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
        <code>apps/web/.env</code>, then sign in to see live data.
      </p>
    </div>
  );
}
