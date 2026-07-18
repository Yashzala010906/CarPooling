'use client';

import { useMemo, useState } from 'react';
import { Car } from 'lucide-react';

import { cn } from '@carpool/ui';

import type { TripListItem } from '@/lib/member3/types';
import { tripCategory, type TripCategory } from '@/lib/member3/lifecycle';
import { TripCard } from './trip-card';
import { EmptyState } from './states';

type Tab = 'all' | TripCategory;

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function TripsBoard({ items }: { items: TripListItem[] }) {
  const [tab, setTab] = useState<Tab>('all');

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      all: items.length,
      upcoming: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const it of items) c[tripCategory(it.trip.status)] += 1;
    return c;
  }, [items]);

  const filtered = useMemo(
    () => (tab === 'all' ? items : items.filter((it) => tripCategory(it.trip.status) === tab)),
    [items, tab],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Car className="h-8 w-8" />}
          title="No trips here"
          description="Trips you drive or book will appear in this list."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((it) => (
            <TripCard key={it.trip.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
