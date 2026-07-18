import { Suspense } from 'react';

import { RidePublishedSuccess } from '@/components/rides/ride-published-success';

export const metadata = { title: 'Ride Published' };

/** Confirmation for a freshly published ride; reads ?rideId= on refresh. */
export default function RidePublishedSuccessPage() {
  return (
    <Suspense>
      <RidePublishedSuccess />
    </Suspense>
  );
}
