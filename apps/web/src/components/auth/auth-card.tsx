import Link from 'next/link';
import { Car } from 'lucide-react';

/**
 * Shared branded auth shell matching the Stitch design: a vertical side label,
 * a header with the Carpooling brand, and a content slot for the form.
 */
export function AuthCard({
  sideLabel,
  children,
  maxWidth = 'max-w-4xl',
}: {
  sideLabel: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      className={`mx-auto flex w-full ${maxWidth} overflow-hidden rounded-2xl border border-border bg-card shadow-xl`}
    >
      {/* Vertical side label — desktop only */}
      <aside className="hidden w-[140px] flex-col items-center justify-center border-r border-border bg-muted/50 p-8 md:flex">
        <h1 className="rotate-180 text-2xl font-bold uppercase tracking-widest text-primary [writing-mode:vertical-lr]">
          {sideLabel}
        </h1>
        <div className="mt-8 h-24 w-0.5 bg-border" />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-20 items-center justify-between border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-6 w-6 fill-primary text-primary" />
            <span className="text-lg font-bold tracking-tight text-primary">Carpooling</span>
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            FleetHR
          </span>
        </header>
        <div className="flex-1 p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
