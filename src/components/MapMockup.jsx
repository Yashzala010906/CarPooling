import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock } from 'lucide-react';

export default function MapMockup({ coordinates = [], status = 'booked' }) {
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(15); // minutes

  // Default coordinate path if none provided
  const path = coordinates.length > 0 ? coordinates : [
    { x: 20, y: 80, label: "Pickup Location" },
    { x: 50, y: 40, label: "Midpoint" },
    { x: 80, y: 20, label: "Destination" }
  ];

  // Animate car when in progress
  useEffect(() => {
    let interval;
    if (status === 'in_progress') {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            setEta(0);
            return 1;
          }
          const next = prev + 0.02; // move 2% every half second
          setEta(Math.max(1, Math.round((1 - next) * 15)));
          return next;
        });
      }, 500);
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
  }, [status]);

  // Calculate current car position on the line segments
  const getCarPosition = () => {
    if (path.length < 2) return { x: 50, y: 50 };
    if (progress <= 0) return path[0];
    if (progress >= 1) return path[path.length - 1];

    // Find current segment
    const segmentCount = path.length - 1;
    const scaledProgress = progress * segmentCount;
    const segmentIndex = Math.floor(scaledProgress);
    const segmentProgress = scaledProgress - segmentIndex;

    const start = path[segmentIndex];
    const end = path[segmentIndex + 1];

    return {
      x: start.x + (end.x - start.x) * segmentProgress,
      y: start.y + (end.y - start.y) * segmentProgress
    };
  };

  const carPos = getCarPosition();

  // Create SVG path string
  const getPathD = () => {
    if (path.length < 2) return "";
    return `M ${path[0].x * 4} ${path[0].y * 3} ` + 
      path.slice(1).map(pt => `Q ${(pt.x * 4)} ${(pt.y * 3)} ${(pt.x * 4)} ${(pt.y * 3)}`).join(' ');
  };

  return (
    <div className="card" style={{ padding: '16px', overflow: 'hidden', position: 'relative', background: '#f0fdf4' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <Navigation size={16} className="text-primary" style={{ color: 'var(--primary)' }} />
          Live Route Tracking
        </h4>
        <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          {status === 'in_progress' ? `ETA: ${eta} mins` : status === 'booked' ? 'Scheduled' : 'Arrived'}
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div style={{ position: 'relative', width: '100%', height: '260px', background: '#e0f2fe', borderRadius: '12px', border: '1px solid #bae6fd', overflow: 'hidden' }}>
        {/* Simple map background grids/details */}
        <div style={{ position: 'absolute', top: '15px', left: '15px', width: '60px', height: '40px', background: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#166534', fontWeight: '500' }}>Park</div>
        <div style={{ position: 'absolute', bottom: '20px', right: '30px', width: '80px', height: '50px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#64748b' }}>Industrial Area</div>

        <svg style={{ width: '100%', height: '100%' }}>
          {/* Roads grid (faint background lines) */}
          <line x1="0" y1="50" x2="400" y2="50" stroke="#bae6fd" strokeWidth="1" strokeDasharray="5,5" />
          <line x1="0" y1="150" x2="400" y2="150" stroke="#bae6fd" strokeWidth="1" strokeDasharray="5,5" />
          <line x1="100" x2="100" y1="0" y2="300" stroke="#bae6fd" strokeWidth="1" strokeDasharray="5,5" />
          <line x1="300" x2="300" y1="0" y2="300" stroke="#bae6fd" strokeWidth="1" strokeDasharray="5,5" />

          {/* Actual Route Road */}
          <path
            d={getPathD()}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={getPathD()}
            fill="none"
            stroke="#f8fafc"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4,4"
          />

          {/* Start and End Dots */}
          {path.map((pt, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === path.length - 1;
            if (!isStart && !isEnd) return null;

            return (
              <g key={idx} transform={`translate(${pt.x * 4}, ${pt.y * 3})`}>
                <circle r="14" fill={isStart ? "rgba(59, 130, 246, 0.2)" : "rgba(16, 185, 129, 0.2)"} className="map-pulse" />
                <circle r="6" fill={isStart ? "#3b82f6" : "#10b981"} />
              </g>
            );
          })}

          {/* Car Avatar */}
          <g transform={`translate(${carPos.x * 4 - 15}, ${carPos.y * 3 - 15})`}>
            <foreignObject width="30" height="30">
              <div style={{ fontSize: '22px', textAlign: 'center', lineHeight: '30px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
                🚗
              </div>
            </foreignObject>
          </g>
        </svg>

        {/* Floating overlays */}
        <div style={{ position: 'absolute', bottom: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="glass-panel" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={10} style={{ color: '#3b82f6' }} />
            <span style={{ fontWeight: '500' }}>From:</span> {path[0]?.label.split('(')[0]}
          </div>
          <div className="glass-panel" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={10} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: '500' }}>To:</span> {path[path.length - 1]?.label.split('(')[0]}
          </div>
        </div>
      </div>
    </div>
  );
}
