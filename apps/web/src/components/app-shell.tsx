'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar, Sidebar, cn } from '@carpool/ui';
import {
  BarChart3,
  Bell,
  Bookmark,
  Building2,
  Car,
  CreditCard,
  History,
  LayoutDashboard,
  MapPinned,
  Menu,
  MessageSquare,
  Search,
  Settings,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react';

import { UserMenu, type MenuUser } from '@/components/user-menu';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

/** Member 1 (User, Company & Vehicle) navigation. */
const PRIMARY: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'My Profile', href: '/profile', icon: <UserIcon className="h-4 w-4" /> },
  { label: 'Company', href: '/company', icon: <Building2 className="h-4 w-4" /> },
  { label: 'My Vehicles', href: '/vehicles', icon: <Car className="h-4 w-4" /> },
  { label: 'Saved Places', href: '/saved-places', icon: <Bookmark className="h-4 w-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
];

/** Other team members' modules (kept intact). */
const SECONDARY: NavItem[] = [
  { label: 'Find a Ride', href: '/rides/find', icon: <Search className="h-4 w-4" /> },
  { label: 'Offer a Ride', href: '/rides/offer', icon: <MapPinned className="h-4 w-4" /> },
  { label: 'My Trips', href: '/trips', icon: <Car className="h-4 w-4" /> },
  { label: 'Wallet', href: '/wallet', icon: <Wallet className="h-4 w-4" /> },
  { label: 'Payments', href: '/payments', icon: <CreditCard className="h-4 w-4" /> },
  { label: 'Ride History', href: '/history', icon: <History className="h-4 w-4" /> },
  { label: 'Chat', href: '/chat', icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'Reports', href: '/reports', icon: <BarChart3 className="h-4 w-4" /> },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const renderItem = (item: NavItem) => {
    const active =
      pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  };
  return (
    <>
      {PRIMARY.map(renderItem)}
      <div className="my-2 border-t border-border" />
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        More
      </p>
      {SECONDARY.map(renderItem)}
    </>
  );
}

export function AppShell({ user, children }: { user: MenuUser; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        brand={
          <button
            className="mr-1 rounded-md p-1 hover:bg-accent md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        }
        actions={
          <>
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="rounded-md p-1.5 hover:bg-accent"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Link>
            <UserMenu user={user} />
          </>
        }
      >
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
          <Car className="h-5 w-5 fill-primary" />
          <span className="hidden sm:inline">Carpooling</span>
        </Link>
      </Navbar>

      <div className="flex flex-1">
        <Sidebar className="hidden md:flex">
          <NavList />
        </Sidebar>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col overflow-y-auto bg-background p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between px-2 py-2">
              <span className="flex items-center gap-2 font-bold text-primary">
                <Car className="h-5 w-5 fill-primary" /> Carpooling
              </span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              <NavList onNavigate={() => setMobileOpen(false)} />
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
