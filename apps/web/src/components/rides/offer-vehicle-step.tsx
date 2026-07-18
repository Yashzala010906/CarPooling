'use client';

import Link from 'next/link';
import { Button, Card, Input, cn } from '@carpool/ui';
import type { Vehicle } from '@carpool/types';
import { ArrowLeft, Car, CheckCircle2, Loader2, Minus, Plus, Zap } from 'lucide-react';

import type { OfferRideDraft } from '@/stores/ride.store';
import { maxOfferableSeats, type OfferFieldErrors } from './offer-validation';

interface OfferVehicleStepProps {
  draft: OfferRideDraft;
  errors: OfferFieldErrors;
  vehicles: Vehicle[] | null;
  vehiclesLoading: boolean;
  publishing: boolean;
  onPatch: (patch: Partial<OfferRideDraft>) => void;
  onBack: () => void;
  onPublish: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

/** Selectable vehicle card (Stitch “Select Vehicle” radio cards). */
function VehicleOptionCard({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: Vehicle;
  selected: boolean;
  onSelect: () => void;
}) {
  const isElectric = vehicle.fuelType?.toLowerCase() === 'electric';
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="vehicle"
        className="sr-only"
        checked={selected}
        onChange={onSelect}
      />
      <Card
        className={cn(
          'p-4 transition-all hover:border-primary/50',
          selected && 'border-primary bg-accent',
        )}
      >
        <div className="mb-2 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-background">
            {isElectric ? (
              <Zap className="h-6 w-6 text-primary" />
            ) : (
              <Car className="h-6 w-6 text-primary" />
            )}
          </div>
          <CheckCircle2
            className={cn(
              'h-5 w-5 text-primary transition-opacity',
              selected ? 'opacity-100' : 'opacity-0',
            )}
          />
        </div>
        <p className="font-semibold">{vehicle.model}</p>
        <p className="text-xs text-muted-foreground">{vehicle.registrationNumber}</p>
        <div className="mt-4 flex gap-2">
          {vehicle.fuelType ? (
            <span className="rounded bg-secondary px-2 py-1 text-[10px] font-bold uppercase text-secondary-foreground">
              {vehicle.fuelType}
            </span>
          ) : null}
          <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
            {maxOfferableSeats(vehicle)} seats
          </span>
        </div>
      </Card>
    </label>
  );
}

/** Offer Ride — Step 2: vehicle, seats, fare, and notes (Stitch “Vehicle & Fare”). */
export function OfferVehicleStep({
  draft,
  errors,
  vehicles,
  vehiclesLoading,
  publishing,
  onPatch,
  onBack,
  onPublish,
}: OfferVehicleStepProps) {
  const selectedVehicle = vehicles?.find((vehicle) => vehicle.id === draft.vehicleId);
  const seatCap = selectedVehicle ? maxOfferableSeats(selectedVehicle) : 6;

  const selectVehicle = (vehicle: Vehicle) =>
    onPatch({
      vehicleId: vehicle.id,
      seatsTotal: Math.min(draft.seatsTotal, maxOfferableSeats(vehicle)),
    });

  return (
    <div className="space-y-6">
      {/* Vehicle selection */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className="text-xl font-semibold tracking-tight">Select Vehicle</h3>
          <Link href="/vehicles" className="text-sm font-medium text-primary hover:underline">
            + Add New
          </Link>
        </div>
        {vehiclesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="h-36 animate-pulse bg-muted" />
            <Card className="h-36 animate-pulse bg-muted" />
          </div>
        ) : vehicles && vehicles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vehicles.map((vehicle) => (
              <VehicleOptionCard
                key={vehicle.id}
                vehicle={vehicle}
                selected={vehicle.id === draft.vehicleId}
                onSelect={() => selectVehicle(vehicle)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">
            No active vehicles on your profile yet. Register one under{' '}
            <Link href="/vehicles" className="font-medium text-primary hover:underline">
              My Vehicles
            </Link>{' '}
            to offer a ride.
          </Card>
        )}
        <FieldError message={errors.vehicleId} />
      </section>

      {/* Seats + fare */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">Available Seats</label>
          <div className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Fewer seats"
              disabled={draft.seatsTotal <= 1}
              onClick={() => onPatch({ seatsTotal: Math.max(1, draft.seatsTotal - 1) })}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold">{draft.seatsTotal}</span>
              <span className="text-sm text-muted-foreground">
                {draft.seatsTotal === 1 ? 'Seat' : 'Seats'}
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="More seats"
              disabled={draft.seatsTotal >= seatCap}
              onClick={() => onPatch({ seatsTotal: Math.min(seatCap, draft.seatsTotal + 1) })}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <FieldError message={errors.seatsTotal} />
        </div>
        <div className="space-y-2">
          <label htmlFor="fare" className="block text-sm font-medium text-muted-foreground">
            Fare per Seat
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 z-10 flex items-center font-semibold">
              $
            </span>
            <Input
              id="fare"
              type="number"
              min={0}
              step="0.50"
              inputMode="decimal"
              placeholder="0.00"
              className="h-12 bg-background pl-8 font-semibold"
              value={draft.farePerSeat}
              onChange={(event) => onPatch({ farePerSeat: event.target.value })}
            />
          </div>
          <FieldError message={errors.farePerSeat} />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium text-muted-foreground">
          Ride Notes (Optional)
        </label>
        <textarea
          id="notes"
          rows={4}
          maxLength={500}
          placeholder="Mention drop-off specifics, music preferences, or carbon-neutral details..."
          className="flex w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={draft.notes}
          onChange={(event) => onPatch({ notes: event.target.value })}
        />
        <FieldError message={errors.notes} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button type="button" variant="ghost" onClick={onBack} disabled={publishing}>
          <ArrowLeft className="h-4 w-4" />
          Back to Step 1
        </Button>
        <Button type="button" size="lg" className="px-10" onClick={onPublish} disabled={publishing}>
          {publishing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publishing…
            </>
          ) : (
            'Publish Ride'
          )}
        </Button>
      </div>
    </div>
  );
}
