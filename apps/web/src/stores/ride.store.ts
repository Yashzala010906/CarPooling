import { create } from 'zustand';
import type { Location, Ride } from '@carpool/types';

/** Form values collected across the Offer Ride wizard (steps 1–2). */
export interface OfferRideDraft {
  pickupAddress: string;
  destinationAddress: string;
  /** yyyy-MM-dd from the date input. */
  departureDate: string;
  /** HH:mm from the time input. */
  departureTime: string;
  vehicleId: string | null;
  seatsTotal: number;
  /** Raw input value; parsed to a number on submit. */
  farePerSeat: string;
  notes: string;
}

const EMPTY_OFFER_DRAFT: OfferRideDraft = {
  pickupAddress: '',
  destinationAddress: '',
  departureDate: '',
  departureTime: '',
  vehicleId: null,
  seatsTotal: 1,
  farePerSeat: '',
  notes: '',
};

/** Holds the in-progress search / publish flow (find ride, offer ride, route confirmation). */
interface RideState {
  // Find-a-ride flow (later phase)
  origin: Location | null;
  destination: Location | null;
  searchResults: Ride[];
  // Offer-a-ride flow
  offerDraft: OfferRideDraft;
  /** Last ride published in this session, shown on the success page. */
  publishedRide: Ride | null;
  setOrigin: (origin: Location | null) => void;
  setDestination: (destination: Location | null) => void;
  setSearchResults: (rides: Ride[]) => void;
  patchOfferDraft: (patch: Partial<OfferRideDraft>) => void;
  setPublishedRide: (ride: Ride | null) => void;
  resetOffer: () => void;
  reset: () => void;
}

export const useRideStore = create<RideState>()((set) => ({
  origin: null,
  destination: null,
  searchResults: [],
  offerDraft: EMPTY_OFFER_DRAFT,
  publishedRide: null,
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setSearchResults: (searchResults) => set({ searchResults }),
  patchOfferDraft: (patch) => set((state) => ({ offerDraft: { ...state.offerDraft, ...patch } })),
  setPublishedRide: (publishedRide) => set({ publishedRide }),
  resetOffer: () => set({ offerDraft: EMPTY_OFFER_DRAFT }),
  reset: () =>
    set({
      origin: null,
      destination: null,
      searchResults: [],
      offerDraft: EMPTY_OFFER_DRAFT,
      publishedRide: null,
    }),
}));
