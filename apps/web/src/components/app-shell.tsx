'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar, Sidebar, cn, type SidebarItem } from '@carpool/ui';
import {
  BarChart3,
  Bell,
  Building2,
  Car,
  CreditCard,
  History,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Search,
  Settings,
  Wallet,
} from 'lucide-react';

const NAV_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Find a Ride', href: '/rides/find', icon: <Search className="h-4 w-4" /> },
  { label: 'Offer a Ride', href: '/rides/offer', icon: <MapPinned className="h-4 w-4" /> },
  { label: 'My Trips', href: '/trips', icon: <Car className="h-4 w-4" /> },
  { label: 'My Vehicles', href: '/vehicles', icon: <Car className="h-4 w-4" /> },
  { label: 'Wallet', href: '/wallet', icon: <Wallet className="h-4 w-4" /> },
  { label: 'Payments', href: '/payments', icon: <CreditCard className="h-4 w-4" /> },
  { label: 'Ride History', href: '/history', icon: <History className="h-4 w-4" /> },
  { label: 'Chat', href: '/chat', icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'Reports', href: '/reports', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Company Admin', href: '/admin/employees', icon: <Building2 className="h-4 w-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
];

const RIDE_NAV_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Find Rides', href: '/rides/find', icon: <Search className="h-4 w-4" /> },
  { label: 'My Bookings', href: '/trips', icon: <Car className="h-4 w-4" /> },
  { label: 'Profile', href: '/settings', icon: <Settings className="h-4 w-4" /> },
  { label: 'Post a Ride', href: '/rides/offer', icon: <MapPinned className="h-4 w-4" /> },
];

const TOP_NAV_ITEMS = [
  ['Home', '/dashboard'],
  ['Trips', '/trips'],
  ['Messages', '/chat'],
  ['Account', '/settings'],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRideExperience = pathname.startsWith('/rides');
  const isImmersiveRideScreen =
    pathname === '/rides/confirm' ||
    (pathname.startsWith('/rides/') && pathname.split('/').length === 3);

  return (
    <div className={cn('flex min-h-screen flex-col', isRideExperience && 'ride-screen')}>
      <Navbar
        brand={
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-primary">
            CommuteSync
          </Link>
        }
        className="h-16 px-4 lg:px-6"
      >
        {isImmersiveRideScreen ? (
          <span className="text-sm text-muted-foreground">
            {pathname === '/rides/confirm' ? 'Route Confirmation' : 'Route Information'}
          </span>
        ) : (
          <>
            {TOP_NAV_ITEMS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'hidden border-b-2 pb-1 text-sm md:inline-flex',
                  pathname.startsWith(href)
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent text-muted-foreground hover:text-primary',
                )}
              >
                {label}
              </Link>
            ))}
          </>
        )}
      </Navbar>

      <div className="flex flex-1">
        {!isImmersiveRideScreen ? (
          <Sidebar
            className="hidden bg-background md:flex"
            items={isRideExperience ? RIDE_NAV_ITEMS : NAV_ITEMS}
            renderItem={(item) => (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )}
            footer={
              isRideExperience ? (
                <div className="space-y-1 border-t pt-3">
                  <Link
                    href="/help"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border text-[10px]">
                      ?
                    </span>
                    Help Center
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <span aria-hidden="true">↪</span>
                    Logout
                  </Link>
                </div>
              ) : null
            }
          />
        ) : null}

        <main
          className={cn(
            'min-w-0 flex-1 p-4 lg:p-6',
            isRideExperience && !isImmersiveRideScreen && 'bg-muted/30',
            isImmersiveRideScreen && 'p-0',
          )}
        >
          {children}
        </main>
      </div>

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex items-center gap-3 text-muted-foreground">
        <Bell className="pointer-events-auto h-4 w-4" />
        <Settings className="pointer-events-auto h-4 w-4" />
        <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-secondary text-xs font-semibold text-primary">
          AJ
        </span>
      </div>
    </div>
  );
}
