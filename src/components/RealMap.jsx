import React, { useEffect, useRef, useState } from 'react';

// Comprehensive geographical database for cities, localities, and places
const CITY_GEO_DATABASE = {
  'surat': [21.1702, 72.8311],
  'ahmedabad': [23.0225, 72.5714],
  'gandhinagar': [23.2156, 72.6369],
  'vadodara': [22.3072, 73.1812],
  'baroda': [22.3072, 73.1812],
  'rajkot': [22.3039, 70.8022],
  'bhavnagar': [21.7645, 72.1519],
  'jamnagar': [22.4707, 70.0577],
  'junagadh': [21.5222, 70.4579],
  'mumbai': [19.0760, 72.8777],
  'pune': [18.5204, 73.8567],
  'delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'hyderabad': [17.3850, 78.4867],
  'chennai': [13.0827, 80.2707],
  'sarkhej cross roads, ahmedabad': [23.0225, 72.5025],
  'sarkhej': [23.0225, 72.5025],
  'paldi, ahmedabad': [23.0145, 72.5625],
  'paldi': [23.0145, 72.5625],
  'sg highway, ahmedabad': [23.0300, 72.5100],
  'sg highway': [23.0300, 72.5100],
  'navrangpura, ahmedabad': [23.0365, 72.5615],
  'navrangpura': [23.0365, 72.5615],
  'bopal, ahmedabad': [23.0300, 72.4700],
  'bopal': [23.0300, 72.4700],
  'ashram road, ahmedabad': [23.0250, 72.5800],
  'ashram road': [23.0250, 72.5800],
  'vastrapur, ahmedabad': [23.0360, 72.5260],
  'vastrapur': [23.0360, 72.5260],
  'maninagar, ahmedabad': [23.0000, 72.6000],
  'maninagar': [23.0000, 72.6000],
  'thaltej, ahmedabad': [23.0500, 72.5000],
  'thaltej': [23.0500, 72.5000],
  'cg road, ahmedabad': [23.0300, 72.5700],
  'cg road': [23.0300, 72.5700],
  'downtown hub': [37.7749, -122.4194],
  'acme hq': [37.7885, -122.4014],
  'oakwood complex': [37.7600, -122.4350],
  'oakwood residential complex': [37.7600, -122.4350],
  'highway 101': [37.7800, -122.4100],
  'bay area bridge': [37.7900, -122.3900],
  'broadway ave': [37.7750, -122.4250]
};

// Convert point or label into exact lat/lng coordinates
const convertToLatLng = (pt) => {
  if (!pt) return [23.0225, 72.5714];
  if (pt.lat && pt.lng) return [pt.lat, pt.lng];

  if (pt.label) {
    const cleanLabel = pt.label.toLowerCase().trim();
    // Direct match
    if (CITY_GEO_DATABASE[cleanLabel]) {
      return CITY_GEO_DATABASE[cleanLabel];
    }
    // Substring match
    for (const [key, coords] of Object.entries(CITY_GEO_DATABASE)) {
      if (cleanLabel.includes(key) || key.includes(cleanLabel)) {
        return coords;
      }
    }
  }

  // Fallback offset around center
  const baseLat = 23.0300;
  const baseLng = 72.5300;
  const latOffset = ((pt.y || 50) - 50) * -0.0015;
  const lngOffset = ((pt.x || 50) - 50) * 0.0025;
  return [baseLat + latOffset, baseLng + lngOffset];
};

// Generate realistic curved waypoints if network routing is offline
const generateCurvedWaypoints = (start, end, numPoints = 30) => {
  const points = [];
  const midLat = (start[0] + end[0]) / 2 + (end[1] - start[1]) * 0.12;
  const midLng = (start[1] + end[1]) / 2 - (end[0] - start[0]) * 0.12;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = Math.pow(1 - t, 2) * start[0] + 2 * (1 - t) * t * midLat + Math.pow(t, 2) * end[0];
    const lng = Math.pow(1 - t, 2) * start[1] + 2 * (1 - t) * t * midLng + Math.pow(t, 2) * end[1];
    points.push([lat, lng]);
  }
  return points;
};

export default function RealMap({
  coordinates = [],
  driverPosition = null,
  height = '320px',
  zoom = 13,
  onRouteCalculated = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const polylineBorderRef = useRef(null);
  const polylineInnerRef = useRef(null);
  const [roadPath, setRoadPath] = useState([]);

  const getLeaflet = () => typeof window !== 'undefined' ? window.L : null;

  // Initialize Leaflet Map with CartoDB high-resolution tiles and ResizeObserver
  useEffect(() => {
    const L = getLeaflet();
    if (!mapContainerRef.current || !L) return;
    if (mapInstanceRef.current) return;

    const latLngs = coordinates.map(convertToLatLng);
    const initialCenter = latLngs.length > 0 ? latLngs[0] : [23.0225, 72.5714];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: zoom,
      zoomControl: true,
      attributionControl: false
    });

    // High-reliability CartoDB Voyager tile layer (crisp, beautiful, 100% uptime)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap, &copy; CARTO'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Fix grey tile issue: Invalidate map size on container resize
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    // Delayed size invalidation calls after DOM renders
    const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
    const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch real road route geometry from OSRM driving API
  useEffect(() => {
    const rawLatLngs = coordinates.map(convertToLatLng);
    if (rawLatLngs.length < 2) return;

    const start = rawLatLngs[0];
    const end = rawLatLngs[rawLatLngs.length - 1];

    let isSubscribed = true;

    const fetchOSRMRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (isSubscribed && data.routes && data.routes[0]) {
          const osrmCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRoadPath(osrmCoords);
          if (onRouteCalculated) {
            onRouteCalculated({
              path: osrmCoords,
              distanceKm: (data.routes[0].distance / 1000).toFixed(1),
              durationMin: Math.round(data.routes[0].duration / 60)
            });
          }
          return;
        }
      } catch (err) {
        console.warn('OSRM routing request fallback:', err);
      }

      // Fallback to curved bezier road waypoints
      if (isSubscribed) {
        const fallbackPath = generateCurvedWaypoints(start, end, 35);
        setRoadPath(fallbackPath);
        if (onRouteCalculated) {
          onRouteCalculated({ path: fallbackPath });
        }
      }
    };

    fetchOSRMRoute();

    return () => {
      isSubscribed = false;
    };
  }, [coordinates]);

  // Draw real road polyline, markers & re-fit bounds
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    const activePath = roadPath.length > 0 ? roadPath : coordinates.map(convertToLatLng);
    if (activePath.length === 0) return;

    // Clean up existing layers
    if (polylineBorderRef.current) map.removeLayer(polylineBorderRef.current);
    if (polylineInnerRef.current) map.removeLayer(polylineInnerRef.current);
    if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
    if (endMarkerRef.current) map.removeLayer(endMarkerRef.current);

    // 1. Solid Outer Road Outline
    const polyBorder = L.polyline(activePath, {
      color: '#1e3a8a',
      weight: 8,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    polylineBorderRef.current = polyBorder;

    // 2. Solid Inner Navigation Line
    const polyInner = L.polyline(activePath, {
      color: '#3b82f6',
      weight: 5,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    polylineInnerRef.current = polyInner;

    // Pickup Pin (A - Blue)
    const startIcon = L.divIcon({
      className: 'custom-map-pin-start',
      html: `<div style="background-color: #2563eb; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 800;">A</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    startMarkerRef.current = L.marker(activePath[0], { icon: startIcon }).addTo(map).bindPopup(`<b>Pickup Location</b>`);

    // Dropoff Pin (B - Green)
    const endIdx = activePath.length - 1;
    const endIcon = L.divIcon({
      className: 'custom-map-pin-end',
      html: `<div style="background-color: #10b981; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 800;">B</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    endMarkerRef.current = L.marker(activePath[endIdx], { icon: endIcon }).addTo(map).bindPopup(`<b>Destination</b>`);

    // Fit map bounds to show full route & invalidate size to fix tile alignment
    const bounds = L.latLngBounds(activePath);
    map.fitBounds(bounds, { padding: [50, 50] });
    map.invalidateSize();
  }, [roadPath, coordinates]);

  // Update Driver Vehicle Marker dynamically
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    let targetLatLng = null;
    if (driverPosition) {
      if (Array.isArray(driverPosition)) {
        targetLatLng = driverPosition;
      } else if (driverPosition.lat && driverPosition.lng) {
        targetLatLng = [driverPosition.lat, driverPosition.lng];
      } else if (driverPosition.x !== undefined && driverPosition.y !== undefined) {
        targetLatLng = convertToLatLng(driverPosition);
      }
    } else if (roadPath.length > 0) {
      targetLatLng = roadPath[0];
    }

    if (!targetLatLng) return;

    const carIcon = L.divIcon({
      className: 'custom-map-car-icon',
      html: `<div style="font-size: 26px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)); transform: scale(1.15); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">🚗</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng(targetLatLng);
    } else {
      driverMarkerRef.current = L.marker(targetLatLng, { icon: carIcon, zIndexOffset: 1000 }).addTo(map);
    }
  }, [driverPosition, roadPath]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: height,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #bae6fd',
        boxShadow: 'var(--shadow-md)',
        zIndex: 1
      }}
    />
  );
}
