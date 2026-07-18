import { notFound } from 'next/navigation';

import { getTripDetail, getTripMessages } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { profileName, routeLabel } from '@/lib/member3/types';
import { PageHeading } from '@/components/member3/page-heading';
import { ChatWindow } from '@/components/member3/chat-window';
import { NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'Trip Chat' };
export const dynamic = 'force-dynamic';

export default async function TripChatPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const auth = await getAuthState();

  if (!auth.configured || !auth.userId) {
    return (
      <section className="space-y-6">
        <PageHeading title="Trip Chat" backHref={`/trips/${tripId}`} />
        {!auth.configured ? <NotConfiguredNotice /> : <SignInPrompt />}
      </section>
    );
  }

  const detail = await getTripDetail(tripId);
  if (!detail) notFound();

  const messages = await getTripMessages(tripId);

  const members: Record<string, { name: string; avatarUrl: string | null }> = {};
  if (detail.driver) {
    members[detail.driver.id] = {
      name: profileName(detail.driver),
      avatarUrl: detail.driver.avatar_url,
    };
  }
  for (const p of detail.passengers) {
    if (p.profile)
      members[p.profile.id] = { name: profileName(p.profile), avatarUrl: p.profile.avatar_url };
  }

  return (
    <section className="space-y-6">
      <PageHeading
        title="Trip Chat"
        description={routeLabel(detail.ride)}
        backHref={`/trips/${tripId}`}
      />
      <ChatWindow
        tripId={tripId}
        currentUserId={auth.userId}
        initialMessages={messages}
        members={members}
      />
    </section>
  );
}
