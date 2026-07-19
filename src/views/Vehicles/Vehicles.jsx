import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Car, Plus, Trash2, CheckCircle2, Shield } from 'lucide-react';
import { validateVehicleModel, validateRegistration } from '../../lib/validation';

export default function Vehicles() {
  const { currentUser, vehicles, addVehicle } = useContext(AppContext);
  const [showAddForm, setShowAddForm] = useState(false);

  // Only show the logged-in employee's own vehicles
  const myVehicles = vehicles.filter(v => v.ownerId === currentUser?.id);

  // Form states
  const [model, setModel] = useState('');
  const [regNo, setRegNo] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [fuelType, setFuelType] = useState('Gasoline');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Registration numbers must be unique across the whole organization fleet
    const invalid = validateVehicleModel(model) || validateRegistration(regNo, vehicles);
    if (invalid) {
      setFormError(invalid);
      return;
    }

    addVehicle(model, regNo, capacity, fuelType);

    // reset
    setModel('');
    setRegNo('');
    setCapacity('4');
    setFuelType('Gasoline');
    setShowAddForm(false);
    alert("Vehicle registered successfully! You can now offer rides with this vehicle.");
  };

  return (
    <div className="view-container animate-fade">
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>My Vehicles</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Register and manage commute cars</p>
        </div>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Register Car
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="card animate-fade" style={{ marginBottom: '24px', maxWidth: '500px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Register New Vehicle</h3>
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="badge badge-danger" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', textAlign: 'left' }}>
                {formError}
              </div>
            )}
            <div className="input-group">
              <label className="input-label">Vehicle Model & Color</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Honda Civic (Black)"
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">License Plate / Registration No.</label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. TX-99Z-4122"
                className="input-field"
                required
              />
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Seating Capacity</label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="input-field select-field"
                >
                  <option value="2">2 Seater</option>
                  <option value="3">3 Seater</option>
                  <option value="4">4 Seater</option>
                  <option value="5">5 Seater</option>
                  <option value="6">6 Seater</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Fuel Category</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="input-field select-field"
                >
                  <option value="Gasoline">Gasoline</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                Confirm Registration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {myVehicles.length === 0 ? (
          <div className="card animate-fade" style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No vehicles registered yet. Please add a vehicle to publish drives.</p>
          </div>
        ) : (
          myVehicles.map(v => (
            <div key={v.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{v.model}</h4>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Reg: <strong style={{ color: 'var(--text-main)' }}>{v.registrationNumber}</strong></span>
                    <span>•</span>
                    <span>Seats: <strong style={{ color: 'var(--text-main)' }}>{v.seatingCapacity}</strong></span>
                    <span>•</span>
                    <span>Type: <strong style={{ color: 'var(--text-main)' }}>{v.fuelType}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> {v.status}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} /> Verified
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
