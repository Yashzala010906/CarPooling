import { create } from 'zustand';
import type { Location, Ride } from '@carpool/types';

/** Holds the in-progress search / publish flow (find ride, offer ride, route confirmation). */
interface RideState {
  origin: Location | null;
  destination: Location | null;
  searchResults: Ride[];
  setOrigin: (origin: Location | null) => void;
  setDestination: (destination: Location | null) => void;
  setSearchResults: (rides: Ride[]) => void;
  reset: () => void;
}

export const useRideStore = create<RideState>()((set) => ({
  origin: null,
  destination: null,
  searchResults: [],
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setSearchResults: (searchResults) => set({ searchResults }),
  reset: () => set({ origin: null, destination: null, searchResults: [] }),
}));
