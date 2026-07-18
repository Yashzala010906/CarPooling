/** UI-only ride data for the approved search and route screens. */
export interface RideSearchResult {
  id: string;
  driverName: string;
  driverRating: number;
  driverBadge?: 'Verified' | 'Top Rated';
  vehicle: string;
  registration: string;
  isElectric?: boolean;
  seatsLeft: number;
  farePerSeat: number;
  amenities: string[];
  departsAt: string;
  arrivesAt: string;
  distanceFromYou: string;
  highlight?: string;
}

export interface RideSearchContext {
  pickup: string;
  destination: string;
  dateLabel: string;
  passengers: number;
  distanceKm: number;
  durationMins: number;
}

export const MOCK_SEARCH_CONTEXT: RideSearchContext = {
  pickup: 'Norrmalm',
  destination: 'Södermalm',
  dateLabel: 'Oct 12',
  passengers: 1,
  distanceKm: 18.4,
  durationMins: 28,
};

const RIDE_ANDERS: RideSearchResult = {
  id: 'mock-ride-anders',
  driverName: 'Anders Lindberg',
  driverRating: 4.9,
  driverBadge: 'Verified',
  vehicle: 'Tesla Model 3',
  registration: 'ABC 123',
  isElectric: true,
  seatsLeft: 2,
  farePerSeat: 45,
  amenities: ['EV', 'AC'],
  departsAt: '08:15 AM',
  arrivesAt: '08:40 AM',
  distanceFromYou: '2.1 km from you',
  highlight: 'Earliest Departure',
};

export const MOCK_SEARCH_RESULTS: RideSearchResult[] = [
  {
    id: 'mock-ride-erik',
    driverName: 'Erik Svensson',
    driverRating: 4.9,
    driverBadge: 'Verified',
    vehicle: 'Volvo XC40',
    registration: 'ABC 123',
    seatsLeft: 2,
    farePerSeat: 12,
    amenities: ['AC', 'Charging', 'Women Friendly'],
    departsAt: '08:30 AM',
    arrivesAt: '08:58 AM',
    distanceFromYou: '1.2 km from you',
    highlight: 'Fastest Route',
  },
  {
    id: 'mock-ride-karin',
    driverName: 'Karin Larsson',
    driverRating: 5.0,
    driverBadge: 'Top Rated',
    vehicle: 'Tesla Model 3',
    registration: 'XYZ 789',
    isElectric: true,
    seatsLeft: 3,
    farePerSeat: 15,
    amenities: ['AC', 'Music', 'Luggage Space'],
    departsAt: '09:00 AM',
    arrivesAt: '09:28 AM',
    distanceFromYou: '0.5 km from you',
    highlight: 'Carbon Neutral',
  },
  RIDE_ANDERS,
];

export const MOCK_ROUTE_INFO = {
  tripId: '#SCANDI-90210',
  etaLabel: '15 min.',
  driverPin: 'Anders · 08:15',
};

export function findMockRide(id: string | null): RideSearchResult {
  return MOCK_SEARCH_RESULTS.find((ride) => ride.id === id) ?? RIDE_ANDERS;
}
