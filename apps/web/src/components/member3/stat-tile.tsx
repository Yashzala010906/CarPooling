import { cn } from '@carpool/ui';

/** Compact KPI tile used across Wallet and Reports. */
export function StatTile({
  label,
  value,
  icon,
  hint,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}) {
  const toneClass = {
    default: 'text-foreground',
    primary: 'text-primary',
    success: 'text-primary',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-destructive',
  }[tone];

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className={cn('mt-2 text-2xl font-bold tracking-tight', toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
