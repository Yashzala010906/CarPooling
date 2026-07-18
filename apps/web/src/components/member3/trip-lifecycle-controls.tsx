'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Play, Square } from 'lucide-react';

import { Button, Modal } from '@carpool/ui';

import type { TripStatus } from '@/lib/supabase/database.types';
import type { ViewerRole } from '@/lib/member3/types';
import { canCancelTrip, canEndTrip, canStartTrip } from '@/lib/member3/lifecycle';
import {
  cancelTripAction,
  endTripAction,
  startTripAction,
  type ActionResult,
} from '@/lib/member3/actions';
import { Spinner } from './states';

/**
 * Driver-only trip controls with confirmation dialogs for the End/Cancel
 * actions (both are consequential). Passengers never see these — the server
 * rejects the RPC anyway, but we also gate the UI by role.
 */
export function TripLifecycleControls({
  tripId,
  status,
  viewerRole,
}: {
  tripId: string;
  status: TripStatus;
  viewerRole: ViewerRole;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | 'end' | 'cancel'>(null);

  if (viewerRole !== 'DRIVER') return null;
  const showStart = canStartTrip(status);
  const showEnd = canEndTrip(status);
  const showCancel = canCancelTrip(status);
  if (!showStart && !showEnd && !showCancel) return null;

  const run = (fn: () => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else {
        setConfirm(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {showStart ? (
          <Button disabled={pending} onClick={() => run(() => startTripAction(tripId))}>
            {pending ? <Spinner /> : <Play className="h-4 w-4" />} Start Trip
          </Button>
        ) : null}
        {showEnd ? (
          <Button variant="destructive" disabled={pending} onClick={() => setConfirm('end')}>
            <Square className="h-4 w-4" /> End Trip
          </Button>
        ) : null}
        {showCancel ? (
          <Button variant="outline" disabled={pending} onClick={() => setConfirm('cancel')}>
            <Ban className="h-4 w-4" /> Cancel
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <Modal
        open={confirm === 'end'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="End this trip?"
        description="This marks the trip completed, finalises the fare and stops live tracking."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(null)} disabled={pending}>
            Keep active
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => run(() => endTripAction({ tripId }))}
          >
            {pending ? <Spinner /> : null} End trip
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirm === 'cancel'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Cancel this trip?"
        description="Passengers will be notified. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(null)} disabled={pending}>
            Keep trip
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => run(() => cancelTripAction(tripId))}
          >
            {pending ? <Spinner /> : null} Cancel trip
          </Button>
        </div>
      </Modal>
    </div>
  );
}
