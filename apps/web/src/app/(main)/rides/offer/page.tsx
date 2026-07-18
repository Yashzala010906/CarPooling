import { OfferRideWizard } from '@/components/rides/offer-ride-wizard';

export const metadata = { title: 'Offer a Ride' };

/** Publish a ride with route, seats, and fare. Requires a registered vehicle. (spec 5.3) */
export default function OfferRidePage() {
  return <OfferRideWizard />;
}
