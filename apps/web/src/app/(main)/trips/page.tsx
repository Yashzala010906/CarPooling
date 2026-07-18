import { getMyTrips } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { PageHeading } from '@/components/member3/page-heading';
import { TripsBoard } from '@/components/member3/trips-board';
import { NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'My Trips' };
export const dynamic = 'force-dynamic';

export default async function MyTripsPage() {
  const auth = await getAuthState();

  return (
    <section className="space-y-6">
      <PageHeading
        title="My Trips"
        description="Trips you drive or have booked, with their live lifecycle status."
      />
      {!auth.configured ? (
        <NotConfiguredNotice />
      ) : !auth.userId ? (
        <SignInPrompt />
      ) : (
        <TripsBoard items={await getMyTrips()} />
      )}
    </section>
  );
}
