import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { TrendingUp, BarChart2, Fuel, Compass, Award } from 'lucide-react';
import { CO2_KG_PER_KM, KM_PER_LITRE } from '../../lib/geo';

// Fallback distance for rides published before route computation existed
const FALLBACK_KM_PER_TRIP = 14.2;
const SOLO_COST_MULTIPLIER = 2.2; // driving alone vs. shared fare

export default function Reports() {
  const { currentUser, rides } = useContext(AppContext);

  // Completed rides this user took part in — the real data behind every stat below
  const myCompleted = rides.filter(r =>
    (r.driverId === currentUser?.id || r.passengerId === currentUser?.id) &&
    ['completed', 'payment_completed'].includes(r.status)
  );

  const totalTrips = myCompleted.length;
  const totalSpent = myCompleted.filter(r => r.passengerId === currentUser?.id).reduce((s, r) => s + r.fare, 0);
  const totalEarned = myCompleted.filter(r => r.driverId === currentUser?.id).reduce((s, r) => s + r.fare, 0);
  // Use each ride's real computed road distance where available
  const totalDistanceKm = myCompleted.reduce((s, r) => s + (r.distanceKm || FALLBACK_KM_PER_TRIP), 0);
  const fuelConservedL = totalDistanceKm / KM_PER_LITRE;
  const carbonSavedKg = totalDistanceKm * CO2_KG_PER_KM;

  const totalFares = myCompleted.reduce((s, r) => s + r.fare, 0);
  const soloCostEst = totalFares * SOLO_COST_MULTIPLIER;
  const netSaving = soloCostEst - totalFares;

  // Fares grouped by weekday for the commute-cost chart
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = dayNames.map((label, idx) => ({
    label,
    cost: myCompleted
      .filter(r => new Date(r.dateTime).getDay() === idx)
      .reduce((s, r) => s + r.fare, 0),
  }));
  const maxDayCost = Math.max(...byDay.map(d => d.cost), 1);

  return (
    <div className="view-container animate-fade">
      {/* View Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Reports & Analytics</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Personal stats, financial savings, and ecological impact ledger</p>
      </div>

      {totalTrips === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px', marginBottom: '24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No completed rides yet. Your reports will populate automatically once you finish your first shared commute.
          </p>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Compass size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>COMPLETED COMMUTES</span>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{totalTrips} trip{totalTrips !== 1 ? 's' : ''} · ~{totalDistanceKm.toFixed(1)} km</h4>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>ECOLOGICAL SAVINGS (EST.)</span>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>{carbonSavedKg.toFixed(1)} kg CO₂</h4>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fuel size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>FUEL CONSERVED (EST.)</span>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{fuelConservedL.toFixed(1)} Litres</h4>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Commute costs by weekday */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            Commute Fares by Weekday ($)
          </h3>

          <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {byDay.map((bar, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  {bar.cost > 0 ? `$${bar.cost.toFixed(0)}` : '—'}
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
                <strong>${soloCostEst.toFixed(2)}</strong>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: '#94a3b8' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Carpool Commuting Cost</span>
                <strong style={{ color: 'var(--primary)' }}>${totalFares.toFixed(2)}</strong>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${soloCostEst > 0 ? Math.round((totalFares / soloCostEst) * 100) : 0}%`, background: 'var(--primary)' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Paid as passenger: <strong style={{ color: 'var(--text-main)' }}>${totalSpent.toFixed(2)}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>Earned as driver: <strong style={{ color: 'var(--success)' }}>${totalEarned.toFixed(2)}</strong></span>
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
                  Net Saving of ${netSaving.toFixed(2)}
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
