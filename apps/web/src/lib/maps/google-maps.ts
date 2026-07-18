/**
 * Google Maps integration — PLACEHOLDER.
 *
 * Planned responsibilities:
 *  - loadGoogleMaps(): script loader using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 *  - geocode(address) / reverseGeocode(latLng)
 *  - getRoute(origin, destination): Directions API -> polyline + distance + ETA
 *
 * Until the key is configured, screens render the <MapContainer /> placeholder
 * from @carpool/ui.
 */
export const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export async function loadGoogleMaps(): Promise<void> {
  // TODO: inject the maps <script> once, resolve when window.google is ready
  throw new Error('Google Maps loader not implemented yet');
}

export async function getRoute(
  _origin: { lat: number; lng: number },
  _destination: { lat: number; lng: number },
): Promise<{ polyline: string; distanceKm: number; durationMin: number }> {
  // TODO: call the Directions API (or proxy through the NestJS API)
  throw new Error('getRoute not implemented yet');
}
