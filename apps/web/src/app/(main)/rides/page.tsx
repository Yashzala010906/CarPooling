import Link from 'next/link';
import { Button, Card, Input } from '@carpool/ui';
import { CalendarDays, CarFront, ChevronDown, Clock3, MapPin, Search, Users } from 'lucide-react';

export const metadata = { title: 'Find a Ride' };

export default function RideModeSelectionPage() {
  return (
    <section className="mx-auto max-w-[1040px] space-y-6 py-6">
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border bg-card p-1 shadow-sm" aria-label="Ride mode">
          <Link
            href="/rides/find"
            className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2 text-sm font-semibold text-primary-foreground"
          >
            <CarFront className="h-4 w-4" />
            Find Ride
          </Link>
          <Link
            href="/rides/offer"
            className="flex items-center gap-2 rounded-lg px-8 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <MapPin className="h-4 w-4" />
            Offer Ride
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden rounded-[14px] shadow-none">
        <div className="space-y-1 border-b bg-card px-6 py-5">
          <h1 className="text-lg font-medium">Find a Ride</h1>
          <p className="text-sm text-muted-foreground">
            Configure your commute preferences to find the best match.
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Pickup Location
              <span className="relative block">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" />
                <Input className="h-10 pl-9" defaultValue="Main Office, Building A" />
              </span>
            </label>
            <label className="space-y-2 text-sm font-medium">
              Destination
              <span className="relative block">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" />
                <Input className="h-10 pl-9" placeholder="Where are you going?" />
              </span>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              Date
              <span className="relative block">
                <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="h-10 pl-9" type="date" defaultValue="2023-11-24" />
              </span>
            </label>
            <label className="space-y-2 text-sm font-medium">
              Departure After
              <span className="relative block">
                <Clock3 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="h-10 pl-9" type="time" defaultValue="08:30" />
              </span>
            </label>
            <label className="space-y-2 text-sm font-medium">
              Seats Needed
              <span className="relative block">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <select className="h-10 w-full appearance-none rounded-md border border-input bg-background px-9 text-sm">
                  <option>1 Seat</option>
                  <option>2 Seats</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <Button asChild size="lg">
              <Link href="/rides/find">
                <Search className="h-4 w-4" />
                Find Available Rides
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/50 px-6 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-primary">
              42
            </span>{' '}
            32 rides typically available for this route
          </span>
          <Link href="/rides/find" className="font-medium text-primary hover:underline">
            Advanced Filters →
          </Link>
        </div>
      </Card>
    </section>
  );
}
