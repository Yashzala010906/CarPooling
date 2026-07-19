import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { BarChart2, Leaf, Car, Award, TrendingUp } from 'lucide-react';
import { CO2_KG_PER_KM } from '../../lib/geo';

export default function Reports() {
  const { rides, currentUser } = useContext(AppContext);

  // Trips where the user participated (as driver or passenger)
  const myCompletedRides = rides.filter(r =>
    (r.driverId === currentUser?.id || r.passengerId === currentUser?.id) &&
    ['completed', 'payment_completed'].includes(r.status)
  );

  const totalTrips = myCompletedRides.length;

  // Real CO2 calculation using distance per ride
  const totalCo2SavedKg = myCompletedRides.reduce(
    (acc, r) => acc + (r.distanceKm || 14.2) * CO2_KG_PER_KM,
    0
  );

  // Financial breakdown
  const totalSpent = myCompletedRides
    .filter(r => r.passengerId === currentUser?.id)
    .reduce((acc, r) => acc + r.fare, 0);

  const totalEarned = myCompletedRides
    .filter(r => r.driverId === currentUser?.id)
    .reduce((acc, r) => acc + r.fare, 0);

  const totalFares = totalSpent;
  // Estimated solo commuting cost (fuel + wear, ~ ₹10/km)
  const totalKm = myCompletedRides.reduce((acc, r) => acc + (r.distanceKm || 14.2), 0);
  const soloCostEst = totalKm * 10;
  const netSaving = Math.max(0, soloCostEst - totalFares + totalEarned);

  // Fares aggregated by day of week
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = days.map((dayLabel, dayIdx) => {
    const cost = myCompletedRides
      .filter(r => new Date(r.dateTime).getDay() === dayIdx)
      .reduce((acc, r) => acc + r.fare, 0);
    return { label: dayLabel, cost };
  });

  const maxDayCost = Math.max(...byDay.map(b => b.cost), 10);

  return (
    <div className="view-container animate-fade">
      {/* View Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Reports & Analytics</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Personal impact metrics and corporate commute cost savings</p>
      </div>

      {/* Impact Stats Row */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>CARBON FOOTPRINT SAVED</span>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--success)', fontWeight: '800' }}>
              {totalCo2SavedKg.toFixed(1)} kg CO₂
            </h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>SHARED COMMUTES</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{totalTrips} Trips</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL FINANCIAL SAVINGS</span>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--info)', fontWeight: '800' }}>
              ₹{netSaving.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Commute costs by weekday */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            Commute Fares by Weekday (₹)
          </h3>

          <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {byDay.map((bar, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  {bar.cost > 0 ? `₹${bar.cost.toFixed(0)}` : '—'}
                </span>
                <div style={{
                  width: '24px',
                  height: '100px',
                  backgroundColor: 'var(--primary-light)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  overflow: 'hidden'
                }}>
                  <div style={{ width: '100%', height: `${Math.round((bar.cost / maxDayCost) * 100)}%`, backgroundColor: 'var(--primary)', transition: 'height 0.8s ease' }}></div>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: '500' }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Savings comparison */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} style={{ color: 'var(--primary)' }} />
            Transport Cost Analysis
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Solo Commuting Cost (Est.)</span>
                <strong>₹{soloCostEst.toFixed(2)}</strong>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: '#94a3b8' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Carpool Commuting Cost</span>
                <strong style={{ color: 'var(--primary)' }}>₹{totalFares.toFixed(2)}</strong>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${soloCostEst > 0 ? Math.round((totalFares / soloCostEst) * 100) : 0}%`, background: 'var(--primary)' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Paid as passenger: <strong style={{ color: 'var(--text-main)' }}>₹{totalSpent.toFixed(2)}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>Earned as driver: <strong style={{ color: 'var(--success)' }}>₹{totalEarned.toFixed(2)}</strong></span>
            </div>

            <div style={{
              marginTop: '4px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'var(--success-light)',
              border: '1px solid var(--success-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Award size={20} style={{ color: 'var(--success)' }} />
              <div>
                <h5 style={{ fontSize: '0.8rem', color: 'var(--success)', margin: 0, fontWeight: '700' }}>
                  Net Saving of ₹{netSaving.toFixed(2)}
                </h5>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                  Estimated vs. driving solo, based on your {totalTrips} completed shared commute{totalTrips !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
