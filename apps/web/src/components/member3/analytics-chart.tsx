import { cn } from '@carpool/ui';

import type { MonthlyPoint } from '@/lib/member3/types';

/**
 * Lightweight CSS bar chart — no external chart library (none is installed and
 * the spec says not to add one). Bars scale to the series max; fully responsive.
 */
export function MiniBarChart({
  data,
  formatValue = (v) => String(v),
  className,
}: {
  data: MonthlyPoint[];
  formatValue?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex h-40 items-end gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">
              {d.value > 0 ? formatValue(d.value) : ''}
            </span>
            <div
              className="w-full rounded-t bg-primary/80 transition-all"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
              title={`${d.label}: ${formatValue(d.value)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[11px] text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
      {!hasData ? (
        <p className="pt-1 text-center text-xs text-muted-foreground">
          No data for this period yet.
        </p>
      ) : null}
    </div>
  );
}

export function Breakdown({ items }: { items: { label: string; count: number }[] }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No records yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{i.label}</span>
            <span className="text-muted-foreground">{i.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(i.count / total) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
