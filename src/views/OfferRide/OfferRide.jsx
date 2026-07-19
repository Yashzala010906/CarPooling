import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { PlusCircle, MapPin, Calendar, Clock, Users, DollarSign, AlertCircle, ArrowRight, Check } from 'lucide-react';
import MapMockup from '../../components/MapMockup';
import { validateRoute, validateFutureDateTime, validateFare, validateSeats } from '../../lib/validation';
import { getRouteInfo, formatDuration } from '../../lib/geo';

export default function OfferRide() {
  const { currentUser, vehicles, publishRide, setCurrentView } = useContext(AppContext);
  const [step, setStep] = useState('form'); // 'form', 'confirm-route'

  // Only the logged-in employee's own registered vehicles can be used to publish.
  const driverVehicles = vehicles.filter(v => v.ownerId === currentUser?.id && v.status === 'Active');

  // Input states
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [seats, setSeats] = useState('1');
  const [fare, setFare] = useState('');
  const [vehicleId, setVehicleId] = useState(driverVehicles[0]?.id || '');
  const [isRecurring, setIsRecurring] = useState(false);
  const [formError, setFormError] = useState('');

  // Real route metrics computed from the entered locations
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const selectedVehicle = driverVehicles.find(v => v.id === (vehicleId || driverVehicles[0]?.id));

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const effectiveVehicleId = vehicleId || driverVehicles[0]?.id;
    const vehicle = driverVehicles.find(v => v.id === effectiveVehicleId);

    const invalid =
      (!vehicle ? 'Please select one of your registered vehicles.' : null) ||
      validateRoute(pickup, destination) ||
      validateFutureDateTime(dateTime, 'Departure date & time') ||
      validateSeats(seats, vehicle ? vehicle.seatingCapacity : undefined) ||
      validateFare(fare);
    if (invalid) {
      setFormError(invalid);
      return;
    }

    if (!vehicleId) setVehicleId(effectiveVehicleId);
    setStep('confirm-route');

    setRouteLoading(true);
    setRouteInfo(null);
    getRouteInfo(pickup, destination).then((info) => {
      setRouteInfo(info);
      setRouteLoading(false);
    });
  };

  const handlePublish = () => {
    const res = publishRide(pickup, destination, dateTime, seats, fare, vehicleId || driverVehicles[0]?.id, isRecurring, routeInfo);
    if (res && !res.success) {
      setFormError(res.message);
      setStep('form');
      return;
    }
    alert("Ride published successfully! Colleagues can now find and book your ride.");
  };

  // If no vehicles are registered
  if (driverVehicles.length === 0) {
    return (
      <div className="view-container animate-fade">
        <div className="card" style={{ textAlign: 'center', padding: '40px', maxWidth: '500px', margin: '40px auto' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff1f2', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Vehicle Registration Required</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
            Before publishing a ride, you must register at least one personal vehicle in your profile so colleagues know the car details.
          </p>
          <button onClick={() => setCurrentView('vehicles')} className="btn btn-primary">
            Register Vehicle Now
          </button>
        </div>
      </div>
    );
  }

  // Route preview coordinates
  const computedRouteCoords = [
    { x: 90, y: 20, label: pickup },
    { x: 50, y: 45, label: "Highway Bypass" },
    { x: 15, y: 70, label: destination }
  ];

  return (
    <div className="view-container animate-fade">
      {/* View Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Offer a Ride</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Share your commute vehicle with other verified employees to reduce transport costs
        </p>
      </div>

      {step === 'form' ? (
        <div className="grid-2">
          <div className="card">
            <form onSubmit={handleFormSubmit}>
              {formError && (
                <div className="badge badge-danger" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', textAlign: 'left' }}>
                  {formError}
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Commute Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="input-field select-field"
                  required
                >
                  {driverVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} - {v.registrationNumber}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Pickup Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Departing from..."
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Destination</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Arriving at..."
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Departure Date & Time</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Seats Offered</label>
                  <select
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="input-field select-field"
                  >
                    {Array.from({ length: Math.max(1, selectedVehicle?.seatingCapacity || 4) }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n} Seat{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Fare Per Seat ($)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                    <input
                      type="number"
                      step="0.50"
                      value={fare}
                      onChange={(e) => setFare(e.target.value)}
                      placeholder="e.g. 5.00"
                      className="input-field"
                      style={{ paddingLeft: '32px' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Publish as Recurring Commute (Weekly)</span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Confirm Route & Details <ArrowRight size={16} />
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary-border)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlusCircle size={16} />
                Driver Guidelines
              </h4>
              <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px', lineHeight: '1.4' }}>
                <li>Specify accurate pickup points that accommodate brief halts.</li>
                <li>Fares must respect organizational limits to prevent profiling commercial transactions.</li>
                <li>Always ensure the selected vehicle's records remain accurate under the "My Vehicles" tab.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          <div>
            <MapMockup coordinates={computedRouteCoords} status="booked" />
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Route & Listing Check</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ color: 'var(--primary)', marginTop: '3px' }}><MapPin size={16} /></div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>START POINT</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: '500' }}>{pickup}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ color: '#10b981', marginTop: '3px' }}><MapPin size={16} /></div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>DESTINATION POINT</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: '500' }}>{destination}</p>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {routeInfo?.approx ? 'Distance (Approx.)' : 'Road Distance'}
                  </span>
                  <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                    {routeLoading ? 'Calculating…' : routeInfo ? `${routeInfo.distanceKm.toFixed(1)} km` : 'Unavailable'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Duration</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                    {routeLoading ? '…' : routeInfo ? formatDuration(routeInfo.durationMin) : '—'}
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Offered Seats</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>{seats} Seats</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fare per Passenger</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>${parseFloat(fare).toFixed(2)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Timing</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {new Date(dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setStep('form')} className="btn btn-secondary" style={{ flex: 1 }}>
                Edit Details
              </button>
              <button onClick={handlePublish} className="btn btn-primary" style={{ flex: 2 }}>
                Publish Carpool Ride <Check size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
