import { getRideHistory } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { PageHeading } from '@/components/member3/page-heading';
import { RideHistoryTable } from '@/components/member3/ride-history-table';
import { NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'Ride History' };
export const dynamic = 'force-dynamic';

export default async function RideHistoryPage() {
  const auth = await getAuthState();

  return (
    <section className="space-y-6">
      <PageHeading title="Ride History" description="Your completed and cancelled trips." />
      {!auth.configured ? (
        <NotConfiguredNotice />
      ) : !auth.userId ? (
        <SignInPrompt />
      ) : (
        <RideHistoryTable items={await getRideHistory()} />
      )}
    </section>
  );
}
