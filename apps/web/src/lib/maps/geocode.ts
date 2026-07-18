import type { GeoPoint } from '@carpool/types';

/**
 * Geocoding — PLACEHOLDER until Google Maps is wired up (see google-maps.ts).
 *
 * Derives stable pseudo-coordinates from the address text: the same address
 * always maps to the same point (so the API's "pickup and destination cannot
 * be identical" rule behaves sensibly) and different addresses almost surely
 * differ. Replace with a real geocode() call when the maps key is configured.
 */
export function geocodeAddressStub(address: string): GeoPoint {
  const normalized = address.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) | 0;
  }
  const h = Math.abs(hash);
  // Spread within a ~±0.25° box around a placeholder city center (Bengaluru).
  const lat = 12.9716 + ((h % 1000) / 1000 - 0.5) * 0.5;
  const lng = 77.5946 + ((Math.floor(h / 1000) % 1000) / 1000 - 0.5) * 0.5;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}
