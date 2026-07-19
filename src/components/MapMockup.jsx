import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Radio, Route } from 'lucide-react';
import RealMap from './RealMap';
import socketService from '../lib/socketService';

export default function MapMockup({ coordinates = [], status = 'booked', tripId = 'demo-trip-1' }) {
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(15);
  const [distanceKm, setDistanceKm] = useState('14.2');
  const [detailedRoadPath, setDetailedRoadPath] = useState([]);
  const [liveDriverPos, setLiveDriverPos] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Default coordinate path if none provided
  const path = coordinates.length > 0 ? coordinates : [
    { x: 20, y: 80, label: "Downtown Hub" },
    { x: 50, y: 40, label: "Highway 101" },
    { x: 80, y: 20, label: "Acme HQ" }
  ];

  // Callback when OSRM routing engine calculates real turn-by-turn road path
  const handleRouteCalculated = (routeData) => {
    if (routeData.path && routeData.path.length > 0) {
      setDetailedRoadPath(routeData.path);
    }
    if (routeData.distanceKm) {
      setDistanceKm(routeData.distanceKm);
    }
    if (routeData.durationMin) {
      setEta(routeData.durationMin);
    }
  };

  // Initialize Socket.IO connection and location subscription
  useEffect(() => {
    socketService.connect();
    socketService.joinTrip(tripId);
    setSocketConnected(true);

    // Subscribe to incoming location updates over Socket.IO
    const unsubscribe = socketService.onLocationUpdate((data) => {
      if (data && (data.lat || data.x || Array.isArray(data))) {
        setLiveDriverPos(data);
      }
    });

    return () => {
      unsubscribe();
      socketService.leaveTrip(tripId);
    };
  }, [tripId]);

  // Animate vehicle smoothly along turn-by-turn road geometry & emit over Socket.IO when in_progress
  useEffect(() => {
    let interval;
    if (status === 'in_progress') {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            setEta(0);
            return 1;
          }
          const next = prev + 0.015; // advance progress smoothly along turn points
          const remainingEta = Math.max(1, Math.round((1 - next) * 15));
          setEta(remainingEta);

          // Calculate current vehicle location along actual turn-by-turn road path
          const activePath = detailedRoadPath.length > 0 ? detailedRoadPath : path;
          const totalPoints = activePath.length;
          if (totalPoints > 1) {
            const scaledIdx = next * (totalPoints - 1);
            const idx = Math.min(Math.floor(scaledIdx), totalPoints - 1);
            const nextIdx = Math.min(idx + 1, totalPoints - 1);
            const segProgress = scaledIdx - idx;

            const startPt = activePath[idx];
            const endPt = activePath[nextIdx];

            let currentPos;
            if (Array.isArray(startPt)) {
              const currentLat = startPt[0] + (endPt[0] - startPt[0]) * segProgress;
              const currentLng = startPt[1] + (endPt[1] - startPt[1]) * segProgress;
              currentPos = [currentLat, currentLng];
            } else {
              const currentX = startPt.x + (endPt.x - startPt.x) * segProgress;
              const currentY = startPt.y + (endPt.y - startPt.y) * segProgress;
              currentPos = { x: currentX, y: currentY, label: startPt.label };
            }

            // Emit location update over Socket.IO
            socketService.emitLocationUpdate({
              tripId,
              lat: Array.isArray(currentPos) ? currentPos[0] : null,
              lng: Array.isArray(currentPos) ? currentPos[1] : null,
              x: !Array.isArray(currentPos) ? currentPos.x : null,
              y: !Array.isArray(currentPos) ? currentPos.y : null
            });
          }

          return next;
        });
      }, 400);
    } else if (status === 'payment_completed' || status === 'completed') {
      setProgress(1);
      setEta(0);
    } else {
      setProgress(0);
      setEta(15);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, detailedRoadPath, path, tripId]);

  return (
    <div className="card" style={{ padding: '16px', overflow: 'hidden', position: 'relative', background: '#f0fdf4' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <Navigation size={16} style={{ color: 'var(--primary)' }} />
          Real Road Route & Turn-by-Turn Tracking
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
            <Route size={10} />
            {distanceKm} km
          </div>
          <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
            <Radio size={10} className="pulse-soft" />
            Socket.IO Live
          </div>
          <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            {status === 'in_progress' ? `ETA: ${eta} mins` : status === 'booked' ? 'Scheduled' : 'Arrived'}
          </div>
        </div>
      </div>

      {/* Real Interactive Map Canvas (Leaflet + OpenStreetMap + OSRM Real Road Engine) */}
      <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
        <RealMap
          coordinates={path}
          driverPosition={liveDriverPos}
          height="300px"
          zoom={13}
          onRouteCalculated={handleRouteCalculated}
        />

        {/* Floating route origin/destination badges */}
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.92)' }}>
            <MapPin size={12} style={{ color: '#2563eb' }} />
            <span style={{ fontWeight: '600' }}>Pickup:</span> {path[0]?.label || 'Start Point'}
          </div>
          <div className="glass-panel" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.92)' }}>
            <MapPin size={12} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: '600' }}>Dropoff:</span> {path[path.length - 1]?.label || 'Destination'}
          </div>
        </div>
      </div>
    </div>
  );
}
