import { cn } from '@carpool/ui';

import type { PaymentStatus, TripStatus } from '@/lib/supabase/database.types';
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  TRIP_STATUS_LABEL,
  TRIP_STATUS_TONE,
} from '@/lib/member3/lifecycle';

export type BadgeTone = 'success' | 'active' | 'warning' | 'neutral' | 'error';

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-primary/10 text-primary ring-primary/20',
  active: 'bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400',
  warning: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400',
  neutral: 'bg-muted text-muted-foreground ring-border',
  error: 'bg-destructive/10 text-destructive ring-destructive/20',
};

export function StatusBadge({
  tone,
  children,
  className,
  dot = false,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function TripStatusBadge({ status, className }: { status: TripStatus; className?: string }) {
  const tone = TRIP_STATUS_TONE[status];
  return (
    <StatusBadge tone={tone} dot={tone === 'active'} className={className}>
      {TRIP_STATUS_LABEL[status]}
    </StatusBadge>
  );
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <StatusBadge tone={PAYMENT_STATUS_TONE[status]} className={className}>
      {PAYMENT_STATUS_LABEL[status]}
    </StatusBadge>
  );
}
