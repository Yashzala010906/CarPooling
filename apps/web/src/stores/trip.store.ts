import { create } from 'zustand';
import type { GeoPoint, Trip, TripStatus } from '@carpool/types';

/** Active trip state: lifecycle status + live location stream for tracking. */
interface TripState {
  activeTrip: Trip | null;
  liveLocation: GeoPoint | null;
  setActiveTrip: (trip: Trip | null) => void;
  setTripStatus: (status: TripStatus) => void;
  setLiveLocation: (location: GeoPoint) => void;
}

export const useTripStore = create<TripState>()((set) => ({
  activeTrip: null,
  liveLocation: null,
  setActiveTrip: (activeTrip) => set({ activeTrip }),
  setTripStatus: (status) =>
    set((state) => (state.activeTrip ? { activeTrip: { ...state.activeTrip, status } } : state)),
  setLiveLocation: (liveLocation) => set({ liveLocation }),
}));
