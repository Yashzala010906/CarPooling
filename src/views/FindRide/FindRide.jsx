import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Search, MapPin, Calendar, Clock, Users, ArrowRight, CheckCircle, Navigation } from 'lucide-react';
import MapMockup from '../../components/MapMockup';
import { validateRoute } from '../../lib/validation';
import { getRouteInfo, formatDuration } from '../../lib/geo';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function FindRide() {
  const { currentUser, rides, bookRide, places } = useContext(AppContext);
  const [step, setStep] = useState('search'); // 'search', 'confirm-route', 'results'

  // Search parameters
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('09:00');
  const [seats, setSeats] = useState('1');
  const [isRecurring, setIsRecurring] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Real route metrics computed from the entered locations
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const computeRoute = async (from, to) => {
    setRouteLoading(true);
    setRouteInfo(null);
    const info = await getRouteInfo(from, to);
    setRouteInfo(info);
    setRouteLoading(false);
  };

  // Simulated computed route coordinate references
  const computedRouteCoords = [
    { x: 15, y: 75, label: pickup || "Pickup" },
    { x: 45, y: 55, label: "Express Highway" },
    { x: 85, y: 25, label: destination || "Destination" }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchError('');

    const invalid =
      validateRoute(pickup, destination) ||
      (!date ? 'Travel date is required.' : null) ||
      (date < todayISO() ? 'Travel date cannot be in the past.' : null) ||
      (!time ? 'Travel time is required.' : null);
    if (invalid) {
      setSearchError(invalid);
      return;
    }
    setStep('confirm-route');
    computeRoute(pickup, destination);
  };

  const handleConfirmRoute = () => {
    setStep('results');
  };

  const selectQuickPlace = (type, value) => {
    if (type === 'pickup') setPickup(value);
    if (type === 'destination') setDestination(value);
  };

  const handleBook = (rideId) => {
    const res = bookRide(rideId);
    if (res && !res.success) {
      setSearchError(res.message);
    }
  };

  // Published rides with open seats, excluding the user's own listings
  const availableRides = rides.filter(r =>
    r.status === 'published' &&
    r.seatsAvailable >= parseInt(seats, 10) &&
    r.driverId !== currentUser?.id
  );

  return (
    <div className="view-container animate-fade">
      {/* View Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Find a Ride</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Search and join verified colleague commutes to your workplace
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
        {['Search Criteria', 'Route Confirmation', 'Available Rides'].map((label, idx) => {
          const stepNames = ['search', 'confirm-route', 'results'];
          const activeIdx = stepNames.indexOf(step);
          const isDone = idx < activeIdx;
          const isActive = idx === activeIdx;
          
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <div style={{ flex: 1, height: '2px', background: idx <= activeIdx ? 'var(--primary)' : 'var(--border)' }}></div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isDone || isActive ? 'var(--primary)' : 'transparent',
                  color: isDone || isActive ? '#ffffff' : 'var(--text-light)',
                  border: `2px solid ${isDone || isActive ? 'var(--primary)' : 'var(--border)'}`,
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isDone ? <CheckCircle size={14} /> : idx + 1}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: isActive ? '600' : '500', color: isActive ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Step 1: Search Form */}
      {step === 'search' && (
        <div className="grid-2">
          <div className="card">
            <form onSubmit={handleSearchSubmit}>
              {searchError && (
                <div className="badge badge-danger" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', textAlign: 'left' }}>
                  {searchError}
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Pickup Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup point (e.g. Downtown)"
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
                    placeholder="Enter destination (e.g. Acme HQ)"
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Travel Date</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={todayISO()}
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Travel Time</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Seats Needed</label>
                  <div style={{ position: 'relative' }}>
                    <Users size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-light)' }} />
                    <select
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                      className="input-field select-field"
                      style={{ paddingLeft: '40px' }}
                    >
                      <option value="1">1 Seat</option>
                      <option value="2">2 Seats</option>
                      <option value="3">3 Seats</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>Recurring Commute Ride</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Verify Route & Continue <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* Quick Search helpers using Saved Places */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Navigation size={16} style={{ color: 'var(--primary)' }} />
                Quick Select Saved Places
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {places.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectQuickPlace('pickup', p.address)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Set Pickup: {p.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {places.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectQuickPlace('destination', p.address)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Set Destination: {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary-border)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '8px' }}>Matching Algorithm</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                The Enterprise platform groups rides matching the same route segments within 500 meters of tolerance automatically. Commuters are verified coworkers in registered companies, ensuring a safe travel circle.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Route Confirmation */}
      {step === 'confirm-route' && (
        <div className="grid-2">
          <div>
            <MapMockup coordinates={computedRouteCoords} status="booked" />
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Route Summary</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ color: '#3b82f6', marginTop: '3px' }}><MapPin size={16} /></div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>PICKUP POINT</span>
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

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
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
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Carbon Saved by Sharing</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--success)' }}>
                    {routeLoading ? '…' : routeInfo ? `${routeInfo.co2SavedKg.toFixed(1)} kg CO₂` : '—'}
                  </p>
                </div>
              </div>
              {!routeLoading && !routeInfo && (
                <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '8px' }}>
                  Could not locate one or both places on the map. Check the spelling (e.g. use a city or street name) — you can still continue searching.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setStep('search')} className="btn btn-secondary" style={{ flex: 1 }}>
                Modify Route
              </button>
              <button onClick={handleConfirmRoute} className="btn btn-primary" style={{ flex: 2 }}>
                Confirm & Search Rides <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Available Rides Results */}
      {step === 'results' && (
        <div>
          {searchError && (
            <div className="badge badge-danger" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', textAlign: 'left' }}>
              {searchError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {availableRides.length} matching rides found traveling your direction
            </span>
            <button onClick={() => setStep('confirm-route')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Back to Route
            </button>
          </div>

          {availableRides.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                No rides are currently published for this route and schedule.
              </p>
              <button onClick={() => setStep('search')} className="btn btn-primary">
                Try a different search
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {availableRides.map(ride => (
                <div key={ride.id} className="card animate-fade" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
                  {/* Driver Profile */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                      {ride.driverAvatar}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{ride.driverName}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '600' }}>★ {ride.driverRating} Rating</span>
                    </div>
                  </div>

                  {/* Route & Times */}
                  <div style={{ flex: '2 1 300px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Pickup:</strong> {ride.pickup}</div>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Destination:</strong> {ride.destination}</div>
                      <div style={{ marginTop: '4px', color: 'var(--primary)', fontWeight: '600' }}>
                        Departure: {new Date(ride.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>

                  {/* Car & Pricing */}
                  <div style={{ flex: '1 1 150px' }}>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{ride.vehicleModel}</div>
                      <div style={{ color: 'var(--text-light)' }}>{ride.vehicleReg}</div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                        Seats available: <strong style={{ color: 'var(--text-main)' }}>{ride.seatsAvailable}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 180px', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fare per seat</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>
                        ${ride.fare.toFixed(2)}
                      </div>
                    </div>
                    <button onClick={() => handleBook(ride.id)} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                      Book Ride
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
