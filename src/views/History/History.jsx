import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { History, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

export default function RideHistory() {
  const { rides, currentUser } = useContext(AppContext);

  // Filter completed/payment_completed rides involving the current user
  const completedRides = rides.filter(r => 
    (r.passengerId === currentUser.id || r.driverId === currentUser.id) &&
    ['completed', 'payment_completed'].includes(r.status)
  );

  return (
    <div className="view-container animate-fade">
      {/* View Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Ride History</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Review all finished corporate commutes</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {completedRides.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <History size={24} />
            </div>
            <p style={{ color: 'var(--text-muted)' }}>You have no completed rides in your ledger yet.</p>
          </div>
        ) : (
          completedRides.map(ride => {
            const isDriver = ride.driverId === currentUser.id;
            return (
              <div key={ride.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
                {/* Date & Time */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Calendar size={14} />
                    <span>{new Date(ride.dateTime).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '2px' }}>
                    {new Date(ride.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Route details */}
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></span>
                      <span><strong>From:</strong> {ride.pickup}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                      <span><strong>To:</strong> {ride.destination}</span>
                    </div>
                  </div>
                </div>

                {/* Counterpart */}
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    {isDriver ? "Passenger" : "Driver"}
                  </span>
                  <strong style={{ fontSize: '0.85rem' }}>
                    {isDriver ? (ride.passengerName || "Coworker") : ride.driverName}
                  </strong>
                </div>

                {/* Price & Badge */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.2rem' }}>
                    ${ride.fare.toFixed(2)}
                  </span>
                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', padding: '2px 8px' }}>
                    <CheckCircle2 size={10} /> Paid
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
