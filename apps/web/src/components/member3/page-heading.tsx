import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function PageHeading({
  title,
  description,
  backHref,
  actions,
}: {
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </div>
    </div>
  );
}
