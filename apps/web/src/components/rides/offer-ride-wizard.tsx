'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublishRideRequest, Vehicle } from '@carpool/types';
import { AlertCircle } from 'lucide-react';

import { extractApiErrors } from '@/lib/api/errors';
import { ridesService } from '@/lib/api/services';
import { geocodeAddressStub } from '@/lib/maps/geocode';
import { useRideStore } from '@/stores';
import { OfferRouteStep } from './offer-route-step';
import { OfferVehicleStep } from './offer-vehicle-step';
import {
  combineDeparture,
  validateRouteStep,
  validateVehicleStep,
  type OfferFieldErrors,
} from './offer-validation';
import { RoutePreviewCard } from './route-preview-card';

const STEP_TITLES: Record<1 | 2, string> = {
  1: 'Ride Details',
  2: 'Vehicle & Fare',
};

/**
 * Offer Ride wizard (Stitch “Offer a Ride” steps 1–2): collects the draft in
 * the ride store, validates each step, then publishes via POST /rides and
 * navigates to the success page.
 */
export function OfferRideWizard() {
  const router = useRouter();
  const { offerDraft, patchOfferDraft, setPublishedRide, resetOffer } = useRideStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [fieldErrors, setFieldErrors] = useState<OfferFieldErrors>({});
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // The driver's active vehicles power the step-2 selector.
  useEffect(() => {
    let cancelled = false;
    ridesService
      .vehicleOptions()
      .then((options) => {
        if (!cancelled) setVehicles(options);
      })
      .catch((error) => {
        if (!cancelled) setApiErrors(extractApiErrors(error));
      })
      .finally(() => {
        if (!cancelled) setVehiclesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNext = () => {
    const errors = validateRouteStep(offerDraft);
    setFieldErrors(errors);
    if (Object.keys(errors).length === 0) {
      setApiErrors([]);
      setStep(2);
    }
  };

  const handlePublish = async () => {
    // Re-run both steps so stale step-1 data can never be published.
    const routeErrors = validateRouteStep(offerDraft);
    if (Object.keys(routeErrors).length > 0) {
      setFieldErrors(routeErrors);
      setStep(1);
      return;
    }
    const selectedVehicle = vehicles?.find((vehicle) => vehicle.id === offerDraft.vehicleId);
    const vehicleErrors = validateVehicleStep(offerDraft, selectedVehicle);
    setFieldErrors(vehicleErrors);
    if (Object.keys(vehicleErrors).length > 0) return;

    const pickup = offerDraft.pickupAddress.trim();
    const destination = offerDraft.destinationAddress.trim();
    const payload: PublishRideRequest = {
      vehicleId: offerDraft.vehicleId as string,
      origin: { address: pickup, ...geocodeAddressStub(pickup) },
      destination: { address: destination, ...geocodeAddressStub(destination) },
      departureAt: (
        combineDeparture(offerDraft.departureDate, offerDraft.departureTime) as Date
      ).toISOString(),
      seatsTotal: offerDraft.seatsTotal,
      farePerSeat: Number(offerDraft.farePerSeat),
      ...(offerDraft.notes.trim() ? { notes: offerDraft.notes.trim() } : {}),
    };

    setPublishing(true);
    setApiErrors([]);
    try {
      const ride = await ridesService.publish(payload);
      setPublishedRide(ride);
      resetOffer();
      router.push(`/rides/offer/success?rideId=${ride.id}`);
    } catch (error) {
      setApiErrors(extractApiErrors(error));
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Offer a Ride · Step {step} of 2
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{STEP_TITLES[step]}</h1>
      </header>

      {apiErrors.length > 0 ? (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="space-y-1">
            {apiErrors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-7">
          {step === 1 ? (
            <OfferRouteStep
              draft={offerDraft}
              errors={fieldErrors}
              onPatch={patchOfferDraft}
              onNext={handleNext}
            />
          ) : (
            <OfferVehicleStep
              draft={offerDraft}
              errors={fieldErrors}
              vehicles={vehicles}
              vehiclesLoading={vehiclesLoading}
              publishing={publishing}
              onPatch={patchOfferDraft}
              onBack={() => setStep(1)}
              onPublish={handlePublish}
            />
          )}
        </div>
        <div className="hidden xl:col-span-5 xl:block">
          <RoutePreviewCard
            pickupAddress={offerDraft.pickupAddress}
            destinationAddress={offerDraft.destinationAddress}
          />
        </div>
      </div>
    </div>
  );
}
