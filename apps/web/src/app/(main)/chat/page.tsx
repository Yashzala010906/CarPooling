import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

import { Button, Card } from '@carpool/ui';

import { getMyTrips } from '@/lib/member3/queries';
import { getAuthState } from '@/lib/member3/session';
import { profileName, routeLabel } from '@/lib/member3/types';
import { tripCategory } from '@/lib/member3/lifecycle';
import { PageHeading } from '@/components/member3/page-heading';
import { Avatar } from '@/components/member3/avatar';
import { TripStatusBadge } from '@/components/member3/status-badge';
import { EmptyState, NotConfiguredNotice, SignInPrompt } from '@/components/member3/states';

export const metadata = { title: 'Chat' };
export const dynamic = 'force-dynamic';

export default async function ChatHubPage() {
  const auth = await getAuthState();

  if (!auth.configured || !auth.userId) {
    return (
      <section className="space-y-6">
        <PageHeading title="Chat" description="Trip conversations with drivers and passengers." />
        {!auth.configured ? <NotConfiguredNotice /> : <SignInPrompt />}
      </section>
    );
  }

  const trips = await getMyTrips();
  // Chat is most useful for upcoming/active trips; show those first.
  const chattable = trips.filter((t) => {
    const c = tripCategory(t.trip.status);
    return c === 'active' || c === 'upcoming' || c === 'completed';
  });

  return (
    <section className="space-y-6">
      <PageHeading title="Chat" description="Pick a trip to open its conversation." />
      {chattable.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8" />}
          title="No conversations yet"
          description="Chats appear once you have booked or offered a trip."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {chattable.map((t) => (
            <Card key={t.trip.id} className="flex items-center gap-3 p-4">
              <Avatar profile={t.driver} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{routeLabel(t.ride)}</p>
                <p className="text-xs text-muted-foreground">{profileName(t.driver)}</p>
              </div>
              <TripStatusBadge status={t.trip.status} />
              <Button asChild size="sm" variant="outline">
                <Link href={`/trips/${t.trip.id}/chat`}>Open</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
