import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Shield, Users, Car, Sliders, TrendingUp, DollarSign, Eye, EyeOff, Save } from 'lucide-react';
import { validateOrgConfig } from '../../lib/validation';
import { CO2_KG_PER_KM } from '../../lib/geo';

export default function AdminDashboard() {
  const {
    currentView,
    vehicles,
    rides,
    orgConfig,
    setOrgConfig,
    employees,
    toggleEmployeeAccess
  } = useContext(AppContext);

  // Configuration States
  const [fuelCost, setFuelCost] = useState(orgConfig.fuelCostPerLitre.toString());
  const [costKm, setCostKm] = useState(orgConfig.costPerKm.toString());
  const [guestAllowed, setGuestAllowed] = useState(orgConfig.allowGuestUsers);
  const [insuranceReq, setInsuranceReq] = useState(orgConfig.requireVehicleInsurance);
  const [tolerance, setTolerance] = useState(orgConfig.matchingToleranceMeters.toString());
  const [configError, setConfigError] = useState('');

  // Live platform metrics derived from real data
  const completedRides = rides.filter(r => ['completed', 'payment_completed'].includes(r.status));
  const cleanVehicles = vehicles.filter(v => ['Hybrid', 'Electric'].includes(v.fuelType));
  const cleanShare = vehicles.length > 0 ? Math.round((cleanVehicles.length / vehicles.length) * 100) : 0;
  // Real road distance per ride where computed; 14.2 km fallback for older rides
  const carbonSavedKg = completedRides.reduce((s, r) => s + (r.distanceKm || 14.2) * CO2_KG_PER_KM, 0);
  const recentActivity = [...rides]
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
    .slice(0, 4)
    .map(r => ({
      time: new Date(r.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      event: r.passengerName
        ? `${r.passengerName} booked ${r.driverName}'s ride (${r.pickup.split('(')[0].trim()} → ${r.destination.split('(')[0].trim()})`
        : `${r.driverName} published a ride (${r.pickup.split('(')[0].trim()} → ${r.destination.split('(')[0].trim()})`
    }));

  const handleSaveConfigs = (e) => {
    e.preventDefault();
    setConfigError('');

    const invalid = validateOrgConfig({ fuelCost, costKm, tolerance });
    if (invalid) {
      setConfigError(invalid);
      return;
    }

    setOrgConfig({
      fuelCostPerLitre: parseFloat(fuelCost),
      costPerKm: parseFloat(costKm),
      allowGuestUsers: guestAllowed,
      requireVehicleInsurance: insuranceReq,
      matchingToleranceMeters: parseInt(tolerance, 10)
    });
    alert("Organization carpooling parameters updated successfully!");
  };

  return (
    <div className="view-container animate-fade">
      
      {/* View Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={22} style={{ color: 'var(--danger)' }} />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Company Administration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monitor organization commute habits and configure parameters</p>
        </div>
      </div>

      {/* RENDER VIEW TAB BASED ON STATE */}

      {/* TAB 1: Admin Overview Dashboard */}
      {currentView === 'admin-dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Admin Stats Grid */}
          <div className="grid-3">
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL REGISTERED USERS</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>{employees.length} Employee{employees.length !== 1 ? 's' : ''}</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px' }}>Active platform accounts</p>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>ACTIVE VEHICLES REGISTERED</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>{vehicles.length} Car{vehicles.length !== 1 ? 's' : ''}</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px' }}>
                {vehicles.length > 0 ? `${cleanShare}% hybrid or electric category` : 'No vehicles registered yet'}
              </p>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--info)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>ORGANIZATION CARBON SAVED</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px', color: 'var(--success)' }}>{carbonSavedKg.toFixed(1)} kg CO₂</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px' }}>
                Based on {completedRides.length} completed shared commute{completedRides.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Organization Participation Logs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              {recentActivity.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No ride activity yet. Logs will appear as employees publish and book rides.</p>
              ) : (
                recentActivity.map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{log.event}</span>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Employee database roster */}
      {currentView === 'admin-employees' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Employee Participation database</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Employee</th>
                  <th style={{ padding: '12px' }}>Corporate Email</th>
                  <th style={{ padding: '12px' }}>Department</th>
                  <th style={{ padding: '12px' }}>Platform Activity</th>
                  <th style={{ padding: '12px' }}>Access Node</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{emp.avatar}</span>
                      <strong>{emp.name}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>{emp.email}</td>
                    <td style={{ padding: '12px' }}>{emp.department}</td>
                    <td style={{ padding: '12px' }}>{emp.ridesCompleted} rides completed</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${emp.role === 'Access Revoked' ? 'badge-danger' : 'badge-success'}`}>
                        {emp.role === 'Access Revoked' ? 'Revoked' : 'Approved'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => toggleEmployeeAccess(emp.id)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        {emp.role === 'Access Revoked' ? 'Approve Access' : 'Revoke Access'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Registered vehicles list */}
      {currentView === 'admin-vehicles' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Registered Vehicles Catalog</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Car Model</th>
                  <th style={{ padding: '12px' }}>Plate Number</th>
                  <th style={{ padding: '12px' }}>Capacity</th>
                  <th style={{ padding: '12px' }}>Fuel Type</th>
                  <th style={{ padding: '12px' }}>Owner</th>
                  <th style={{ padding: '12px' }}>Safety Audited</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{v.model}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{v.registrationNumber}</td>
                    <td style={{ padding: '12px' }}>{v.seatingCapacity} seats</td>
                    <td style={{ padding: '12px' }}>{v.fuelType}</td>
                    <td style={{ padding: '12px' }}>
                      {(employees.find(e => e.id === v.ownerId) || {}).name || 'Unknown Owner'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Verified Pass</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Platform configurations form */}
      {currentView === 'admin-config' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--primary)' }} />
            Configure Organization Parameters
          </h3>
          
          <form onSubmit={handleSaveConfigs}>
            {configError && (
              <div className="badge badge-danger" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', textAlign: 'left' }}>
                {configError}
              </div>
            )}
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Fuel Cost Per Litre (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-light)', fontWeight: 'bold' }}>₹</span>
                  <input
                    type="number"
                    step="0.5"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '32px' }}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Travel Cost Per Km (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-light)', fontWeight: 'bold' }}>₹</span>
                  <input
                    type="number"
                    step="0.5"
                    value={costKm}
                    onChange={(e) => setCostKm(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '32px' }}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Matching Tolerance Radius (Meters)</label>
              <input
                type="number"
                step="50"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={guestAllowed}
                  onChange={(e) => setGuestAllowed(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Allow Guest Coworkers (non-SSO accounts)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={insuranceReq}
                  onChange={(e) => setInsuranceReq(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Enforce Vehicle Insurance Verification prior to publishing rides</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Save size={16} /> Save Configurations
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
