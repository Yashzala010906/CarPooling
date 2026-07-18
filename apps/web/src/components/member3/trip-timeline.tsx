import { Check } from 'lucide-react';

import { cn } from '@carpool/ui';

import type { TripStatus } from '@/lib/supabase/database.types';
import { TRIP_TIMELINE_STEPS, timelineIndex } from '@/lib/member3/lifecycle';
import { formatTime } from '@/lib/member3/format';

/**
 * Vertical trip lifecycle timeline (Booked → In Progress → Completed → Paid).
 * Highlights the current step; cancelled trips render a single error step.
 */
export function TripTimeline({
  status,
  startedAt,
  endedAt,
}: {
  status: TripStatus;
  startedAt?: string | null;
  endedAt?: string | null;
}) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
        <p className="text-sm font-medium text-destructive">Trip cancelled</p>
      </div>
    );
  }

  const current = timelineIndex(status);
  const stampFor = (i: number): string | null => {
    if (i === 1 && startedAt) return formatTime(startedAt);
    if (i === 2 && endedAt) return formatTime(endedAt);
    return null;
  };

  return (
    <ol className="relative space-y-6">
      {TRIP_TIMELINE_STEPS.map((step, i) => {
        const stepIdx = timelineIndex(step.status);
        const done = current >= stepIdx;
        const isCurrent = current === stepIdx;
        const isLast = i === TRIP_TIMELINE_STEPS.length - 1;
        const stamp = stampFor(i);
        return (
          <li key={step.status} className="relative flex gap-4">
            {!isLast ? (
              <span
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%+0.5rem)] w-0.5',
                  done ? 'bg-primary' : 'bg-border',
                )}
              />
            ) : null}
            <span
              className={cn(
                'z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-background',
                done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                isCurrent && 'ring-primary/30',
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </span>
            <div className="flex flex-col">
              <span
                className={cn(
                  'text-sm font-medium',
                  done ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
              {stamp ? <span className="text-xs text-muted-foreground">{stamp}</span> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
