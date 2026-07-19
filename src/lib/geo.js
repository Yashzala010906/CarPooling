// Real route calculation from free public services (no API key needed).
//
// Geocoding is the fragile part — free providers rate-limit aggressively — so we
// chain three independent ones and fall through on any failure:
//   1. OpenStreetMap Nominatim  (best for full addresses; strict 1 req/sec limit)
//   2. Photon (komoot)          (OSM data, generous CORS, no hard rate limit)
//   3. Open-Meteo geocoder      (city/town names, very reliable)
// Routing uses OSRM for real road distance/duration, with a straight-line
// (haversine) estimate as the final fallback.

export const CO2_KG_PER_KM = 0.192; // avg petrol car emissions per km
export const KM_PER_LITRE = 12;     // avg fuel efficiency, for fuel-saved estimates

const ROAD_WINDING_FACTOR = 1.3;    // straight-line → road distance approximation
const FALLBACK_SPEED_KMH = 45;      // used only when OSRM is unavailable

const geocodeCache = new Map();

// Free public services can occasionally hang — cap every call so the UI
// falls back to an estimate instead of showing "Calculating…" forever.
const fetchWithTimeout = (url, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
};

const tryNominatim = async (place) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`;
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = await res.json();
  const hit = Array.isArray(data) && data[0];
  return hit ? { lat: parseFloat(hit.lat), lon: parseFloat(hit.lon), name: hit.display_name } : null;
};

const tryPhoton = async (place) => {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(place)}&limit=1`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = await res.json();
  const f = data.features && data.features[0];
  return f && f.geometry
    ? { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], name: f.properties?.name || place }
    : null;
};

const tryOpenMeteo = async (place) => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = await res.json();
  const r = data.results && data.results[0];
  return r ? { lat: r.latitude, lon: r.longitude, name: r.name } : null;
};

const PROVIDERS = [tryNominatim, tryPhoton, tryOpenMeteo];

const geocodeOnce = async (place) => {
  for (const provider of PROVIDERS) {
    try {
      const hit = await provider(place);
      if (hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lon)) return hit;
    } catch (err) {
      // provider unreachable/aborted — fall through to the next one
    }
  }
  return null;
};

export async function geocode(place) {
  const key = place.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  let hit = await geocodeOnce(place);

  // Retry with a simplified query: drop parentheticals and house numbers,
  // e.g. "Acme HQ (Silicon Boulevard 1)" → "Acme HQ", "Main St 405" → "Main St"
  if (!hit) {
    const simplified = place.replace(/\(.*?\)/g, '').replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
    if (simplified && simplified.toLowerCase() !== key) {
      hit = await geocodeOnce(simplified);
    }
  }

  if (hit) geocodeCache.set(key, hit); // only cache successes; failures may be transient
  return hit;
}

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Returns { distanceKm, durationMin, co2SavedKg, approx } or null when the
// places cannot be located at all.
export async function getRouteInfo(pickup, destination) {
  // Sequential on purpose: parallel bursts trip Nominatim's 1 req/sec limit.
  const from = await geocode(pickup);
  const to = await geocode(destination);
  if (!from || !to) return null;

  // Preferred: real road route from the public OSRM demo server
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const data = await res.json();
      const route = data.routes && data.routes[0];
      if (route && route.distance >= 0) {
        const distanceKm = route.distance / 1000;
        return {
          distanceKm,
          durationMin: Math.max(1, Math.round(route.duration / 60)),
          co2SavedKg: distanceKm * CO2_KG_PER_KM,
          approx: false,
        };
      }
    }
  } catch (err) {
    console.warn('[geo] OSRM routing unavailable, using straight-line estimate:', err);
  }

  // Fallback: straight-line distance adjusted for road winding
  const distanceKm = haversineKm(from, to) * ROAD_WINDING_FACTOR;
  return {
    distanceKm,
    durationMin: Math.max(1, Math.round((distanceKm / FALLBACK_SPEED_KMH) * 60)),
    co2SavedKg: distanceKm * CO2_KG_PER_KM,
    approx: true,
  };
}

export const formatDuration = (min) => {
  if (min == null) return '—';
  if (min < 60) return `${min} minutes`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};
