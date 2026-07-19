// Generates on-the-fly demo ride offers for a searched route, so "Find a Ride"
// always returns a spread of realistic options at different price points — even
// when no colleague has published a matching ride yet.
//
// Fares are derived from the real route distance and the organization's
// configured cost-per-km, then spread across service tiers (cheapest pooled ride
// to fastest express ride) so every option shows a distinct, sensible price.

// A small pool of stand-in drivers/vehicles, one per service tier.
const DRIVERS = [
  { name: 'Priya Sharma',  avatar: '👩‍💼', rating: 4.7, vehicleModel: 'Toyota Prius (Silver)', vehicleReg: 'CA-42K-1180' },
  { name: 'Daniel Okafor', avatar: '🧑‍💻', rating: 4.9, vehicleModel: 'Honda Civic (Blue)',    vehicleReg: 'CA-77M-3391' },
  { name: 'Elena Rossi',   avatar: '👩‍🔬', rating: 4.8, vehicleModel: 'Hyundai Ioniq (White)', vehicleReg: 'CA-19T-8842' },
  { name: 'Marcus Lee',    avatar: '🧑‍✈️', rating: 5.0, vehicleModel: 'Tesla Model Y (Black)', vehicleReg: 'CA-88X-9002' },
];

// Cheapest → priciest. perKmFactor multiplies the org's cost-per-km basis;
// depOffsetMin shifts the departure relative to the requested time.
const TIERS = [
  { key: 'pool',     label: 'Pooled',   perKmFactor: 3.0, seats: 3, depOffsetMin: -5, tag: 'Cheapest' },
  { key: 'standard', label: 'Standard', perKmFactor: 4.5, seats: 2, depOffsetMin: 5,  tag: null },
  { key: 'comfort',  label: 'Comfort',  perKmFactor: 6.0, seats: 2, depOffsetMin: 12, tag: null },
  { key: 'express',  label: 'Express',  perKmFactor: 8.0, seats: 1, depOffsetMin: 20, tag: 'Fastest' },
];

const BASE_FLAGFALL = 2.0;        // fixed per-seat booking component ($)
const FALLBACK_DISTANCE_KM = 12;  // used when the route could not be geocoded
const AVG_SPEED_KMH = 40;

const round2 = (n) => Math.round(n * 100) / 100;

// Build an array of demo ride offers (same shape the ride cards + booking expect).
export function generateRidesForRoute({ pickup, destination, date, time, seats = 1, routeInfo, orgConfig }) {
  const distanceKm = Math.max(routeInfo?.distanceKm ?? FALLBACK_DISTANCE_KM, 1);
  const durationMin = routeInfo?.durationMin ?? Math.max(1, Math.round((distanceKm / AVG_SPEED_KMH) * 60));
  const perKm = orgConfig?.costPerKm ?? 0.15;
  const seatsNeeded = parseInt(seats, 10) || 1;

  // Requested departure as the base time; fall back to now if unparseable.
  const parsed = new Date(`${date}T${time || '09:00'}`);
  const baseTime = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  const stamp = Date.now();

  return TIERS
    .filter((tier) => tier.seats >= seatsNeeded) // only offer tiers that fit the group
    .map((tier, idx) => {
      const driver = DRIVERS[idx % DRIVERS.length];
      const fare = round2(BASE_FLAGFALL + distanceKm * perKm * tier.perKmFactor);
      const departure = new Date(baseTime.getTime() + tier.depOffsetMin * 60000);
      return {
        id: `demo-${stamp}-${tier.key}`,
        driverId: `demo-driver-${tier.key}-${stamp}`,
        driverName: driver.name,
        driverAvatar: driver.avatar,
        driverRating: driver.rating,
        passengerId: null,
        passengerName: null,
        passengerAvatar: null,
        vehicleModel: driver.vehicleModel,
        vehicleReg: driver.vehicleReg,
        pickup: pickup.trim(),
        destination: destination.trim(),
        dateTime: departure.toISOString(),
        seatsTotal: tier.seats,
        seatsAvailable: tier.seats,
        fare,
        status: 'published',
        recurring: false,
        routeCoordinates: [
          { x: 12, y: 72, label: pickup.trim() },
          { x: 48, y: 46, label: 'Route waypoint' },
          { x: 88, y: 18, label: destination.trim() },
        ],
        distanceKm: round2(distanceKm),
        durationMin,
        // demo-only metadata (ignored by Supabase; used for UI badges + cleanup)
        isDemo: true,
        serviceLabel: tier.label,
        serviceTag: tier.tag,
      };
    });
}
