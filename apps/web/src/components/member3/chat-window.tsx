'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';

import { Button, cn } from '@carpool/ui';

import type { MessageRow } from '@/lib/supabase/database.types';
import type { MessageWithSender } from '@/lib/member3/types';
import { createClient } from '@/lib/supabase/client';
import { sendMessageAction } from '@/lib/member3/actions';
import { formatTime } from '@/lib/member3/format';
import { EmptyState } from './states';

interface Member {
  name: string;
  avatarUrl: string | null;
}

/**
 * Trip-scoped realtime chat. Loads history server-side, then subscribes to
 * Supabase Realtime for new messages (deduped by id). RLS guarantees only trip
 * participants can read/insert, so changing the URL to another trip's chat
 * returns nothing and inserts are rejected.
 */
export function ChatWindow({
  tripId,
  currentUserId,
  initialMessages,
  members,
}: {
  tripId: string;
  currentUserId: string;
  initialMessages: MessageWithSender[];
  members: Record<string, Member>;
}) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          const row = payload.new as MessageRow;
          if (seen.current.has(row.id)) return;
          seen.current.add(row.id);
          const m = members[row.sender_id];
          setMessages((prev) => [
            ...prev,
            {
              ...row,
              sender: m
                ? {
                    id: row.sender_id,
                    first_name: m.name,
                    last_name: null,
                    avatar_url: m.avatarUrl,
                  }
                : null,
            },
          ]);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId, members]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    const res = await sendMessageAction({ tripId, content });
    setSending(false);
    if (!res.ok) setError(res.error);
    else setDraft('');
  };

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border bg-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState title="No messages yet" description="Say hello to your co-riders." />
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              content={m.content}
              time={formatTime(m.created_at)}
              mine={m.sender_id === currentUserId}
              name={memberName(m, members)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3">
        {error ? <p className="mb-2 text-xs font-medium text-destructive">{error}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Type a message…"
            className="max-h-32 min-h-9 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button size="icon" onClick={() => void send()} disabled={sending || !draft.trim()}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function memberName(m: MessageWithSender, members: Record<string, Member>): string {
  if (m.sender)
    return [m.sender.first_name, m.sender.last_name].filter(Boolean).join(' ') || 'Member';
  return members[m.sender_id]?.name ?? 'Member';
}

function MessageBubble({
  content,
  time,
  mine,
  name,
}: {
  content: string;
  time: string;
  mine: boolean;
  name: string;
}) {
  return (
    <div className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      {!mine ? (
        <span className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">{name}</span>
      ) : null}
      <div
        className={cn(
          'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm',
          mine
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground',
        )}
      >
        {content}
      </div>
      <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">{time}</span>
    </div>
  );
}
