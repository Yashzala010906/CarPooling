'use client';

import * as React from 'react';

import { cn } from '../lib/utils';

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  /** Left slot — brand / logo. */
  brand?: React.ReactNode;
  /** Right slot — user menu, notifications bell, etc. */
  actions?: React.ReactNode;
}

/**
 * Top navigation bar shell. Apps compose brand, links, and actions into it.
 */
export function Navbar({ brand, actions, className, children, ...props }: NavbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6',
        className,
      )}
      {...props}
    >
      {brand ? <div className="flex items-center gap-2 font-semibold">{brand}</div> : null}
      <nav className="flex flex-1 items-center gap-4 text-sm font-medium">{children}</nav>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
