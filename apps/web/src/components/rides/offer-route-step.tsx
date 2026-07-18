'use client';

import { Button, Card, Input } from '@carpool/ui';
import { ArrowRight, CalendarDays, Clock, Leaf, LocateFixed, MapPin } from 'lucide-react';

import type { OfferRideDraft } from '@/stores/ride.store';
import type { OfferFieldErrors } from './offer-validation';

interface OfferRouteStepProps {
  draft: OfferRideDraft;
  errors: OfferFieldErrors;
  onPatch: (patch: Partial<OfferRideDraft>) => void;
  onNext: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

/** Offer Ride — Step 1: pickup, destination, date, and time (Stitch “Ride Details”). */
export function OfferRouteStep({ draft, errors, onPatch, onNext }: OfferRouteStepProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-2xl font-semibold tracking-tight">Plan your route</h3>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Enter your commute details below to find colleagues heading in the same direction.
          Let&apos;s make the journey better together.
        </p>
      </section>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          onNext();
        }}
      >
        {/* Location cluster with the route timeline visual */}
        <Card className="relative overflow-hidden p-6">
          <div className="absolute bottom-[72px] left-[27px] top-[76px] w-0.5 bg-secondary" />
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="pickup" className="text-sm font-medium text-muted-foreground">
                Starting Point
              </label>
              <div className="relative">
                <LocateFixed className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pickup"
                  className="h-12 bg-background pl-10"
                  placeholder="Enter pickup address..."
                  value={draft.pickupAddress}
                  onChange={(event) => onPatch({ pickupAddress: event.target.value })}
                />
              </div>
              <FieldError message={errors.pickupAddress} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="destination" className="text-sm font-medium text-muted-foreground">
                Destination
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="destination"
                  className="h-12 bg-background pl-10"
                  placeholder="Enter destination address..."
                  value={draft.destinationAddress}
                  onChange={(event) => onPatch({ destinationAddress: event.target.value })}
                />
              </div>
              <FieldError message={errors.destinationAddress} />
            </div>
          </div>
        </Card>

        {/* Date & time */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="departure-date" className="text-sm font-medium text-muted-foreground">
              Date of Departure
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="departure-date"
                type="date"
                min={today}
                className="h-12 bg-background pl-10"
                value={draft.departureDate}
                onChange={(event) => onPatch({ departureDate: event.target.value })}
              />
            </div>
            <FieldError message={errors.departureDate} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="departure-time" className="text-sm font-medium text-muted-foreground">
              Preferred Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="departure-time"
                type="time"
                className="h-12 bg-background pl-10"
                value={draft.departureTime}
                onChange={(event) => onPatch({ departureTime: event.target.value })}
              />
            </div>
            <FieldError message={errors.departureTime} />
          </div>
        </div>

        {/* CO₂ note + Next */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-muted p-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">CO2 Reduction Potential</p>
              <p className="text-sm text-muted-foreground">
                This ride could save ~4.2kg of CO2 per seat shared.
              </p>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full md:w-auto">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
