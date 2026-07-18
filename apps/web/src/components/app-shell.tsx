'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar, Sidebar, cn, type SidebarItem } from '@carpool/ui';
import {
  Bell,
  Car,
  CreditCard,
  History,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Search,
  Settings,
  Wallet,
  BarChart3,
  Building2,
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        brand={<Link href="/dashboard">Carpool</Link>}
        actions={
          <Link href="/notifications" aria-label="Notifications">
            <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </Link>
        }
      />
      <div className="flex flex-1">
        <Sidebar
          className="hidden md:flex"
          items={NAV_ITEMS}
          renderItem={(item) => (
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                pathname.startsWith(item.href)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
