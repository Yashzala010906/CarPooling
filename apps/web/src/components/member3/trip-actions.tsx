'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Eye, MessageSquare, Navigation, Play, Square } from 'lucide-react';

import { Button } from '@carpool/ui';

import type { TripStatus } from '@/lib/supabase/database.types';
import type { ViewerRole } from '@/lib/member3/types';
import { canEndTrip, canStartTrip, canTrackTrip, isTripPayable } from '@/lib/member3/lifecycle';
import { endTripAction, startTripAction, type ActionResult } from '@/lib/member3/actions';
import { Spinner } from './states';

/**
 * Role/status-aware action cluster for a trip. Only renders the actions the
 * current viewer is allowed to take; the server RPCs re-check every rule.
 */
export function TripActions({
  tripId,
  status,
  viewerRole,
  myPaymentPaid,
}: {
  tripId: string;
  status: TripStatus;
  viewerRole: ViewerRole;
  myPaymentPaid?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  const isDriver = viewerRole === 'DRIVER';
  const showPay = viewerRole === 'PASSENGER' && isTripPayable(status) && !myPaymentPaid;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/trips/${tripId}`}>
            <Eye className="h-4 w-4" /> View
          </Link>
        </Button>

        {isDriver && canStartTrip(status) ? (
          <Button size="sm" disabled={pending} onClick={() => run(() => startTripAction(tripId))}>
            {pending ? <Spinner /> : <Play className="h-4 w-4" />} Start Trip
          </Button>
        ) : null}

        {isDriver && canEndTrip(status) ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => run(() => endTripAction({ tripId }))}
          >
            {pending ? <Spinner /> : <Square className="h-4 w-4" />} End Trip
          </Button>
        ) : null}

        {canTrackTrip(status) ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/trips/${tripId}/tracking`}>
              <Navigation className="h-4 w-4" /> Track
            </Link>
          </Button>
        ) : null}

        <Button asChild variant="outline" size="sm">
          <Link href={`/trips/${tripId}/chat`}>
            <MessageSquare className="h-4 w-4" /> Chat
          </Link>
        </Button>

        {showPay ? (
          <Button asChild size="sm">
            <Link href={`/payments?tripId=${tripId}`}>
              <CreditCard className="h-4 w-4" /> Pay
            </Link>
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
