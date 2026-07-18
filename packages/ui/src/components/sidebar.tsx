'use client';

import * as React from 'react';

import { cn } from '../lib/utils';

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  items?: SidebarItem[];
  /** Render prop so the app can wrap items with next/link and active-state logic. */
  renderItem?: (item: SidebarItem) => React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Vertical navigation shell. Pass `renderItem` from the app to integrate
 * with next/link and usePathname without coupling this package to Next.js.
 */
export function Sidebar({
  items = [],
  renderItem,
  footer,
  className,
  children,
  ...props
}: SidebarProps) {
  return (
    <aside className={cn('flex h-full w-60 flex-col border-r bg-background', className)} {...props}>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) =>
          renderItem ? (
            <React.Fragment key={item.href}>{renderItem(item)}</React.Fragment>
          ) : (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {item.icon}
              {item.label}
            </a>
          ),
        )}
        {children}
      </nav>
      {footer ? <div className="border-t p-3">{footer}</div> : null}
    </aside>
  );
}
