import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Play, CheckCircle2, CreditCard, MessageSquare, AlertCircle, Compass, Users, MapPin } from 'lucide-react';
import MapMockup from '../../components/MapMockup';
import ChatSim from '../../components/ChatSim';

export default function MyTrips() {
  const { 
    currentUser, 
    activeTrip, 
    startTrip, 
    completeTrip, 
    payTrip, 
    cancelRide 
  } = useContext(AppContext);

  const [paymentMethod, setPaymentMethod] = useState('Wallet');

  if (!activeTrip) {
    return (
      <div className="view-container animate-fade">
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>My Trips</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>View active commutes, live route tracking, and chats</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px', maxWidth: '600px', margin: '40px auto' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Compass size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Active Commutes</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
            You do not have any active or booked rides. Use the "Find a Ride" page to search matching commutes, or "Offer a Ride" if you are driving your vehicle today.
          </p>
        </div>
      </div>
    );
  }

  const isDriver = activeTrip.driverId === currentUser.id;
  
  const handlePayment = (e) => {
    e.preventDefault();
    payTrip(activeTrip.id, paymentMethod);
  };

  return (
    <div className="view-container animate-fade">
      {/* View Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>
            {isDriver ? "Driving Commute" : "Passenger Commute"}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Trip ID: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{activeTrip.id}</span>
          </p>
        </div>
        <div className={`badge ${
          activeTrip.status === 'booked' ? 'badge-warning' : 
          activeTrip.status === 'in_progress' ? 'badge-success pulse-soft' : 
          'badge-info'
        }`}>
          {activeTrip.status.replace('_', ' ')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '24px' }}>
        {/* Left Side: Route and Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Animated Map */}
          <MapMockup coordinates={activeTrip.routeCoordinates} status={activeTrip.status} />

          {/* Trip Details Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Commute Parameters
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>DEPARTURE TIME</span>
                <strong>{new Date(activeTrip.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
              
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>ESTIMATED FARE</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>₹{activeTrip.fare.toFixed(2)}</strong>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>ROUTE</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong>{activeTrip.pickup.split('(')[0]}</strong> 
                  <span style={{ color: 'var(--text-light)' }}>➔</span> 
                  <strong>{activeTrip.destination.split('(')[0]}</strong>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>VEHICLE DETAILS</span>
                <strong>{activeTrip.vehicleModel} ({activeTrip.vehicleReg})</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>COWORKER PARTICIPANT</span>
                <strong>
                  {isDriver 
                    ? (activeTrip.passengerName ? `${activeTrip.passengerAvatar} ${activeTrip.passengerName}` : "Waiting for Passenger...") 
                    : `${activeTrip.driverAvatar} ${activeTrip.driverName} (Driver)`
                  }
                </strong>
              </div>
            </div>

            {/* Simulated actions to advance status */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h5 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>
                TRIP ACTIONS
              </h5>
              
              {isDriver ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  {activeTrip.status === 'booked' && (
                    <button onClick={() => startTrip(activeTrip.id)} className="btn btn-primary" style={{ flex: 1 }}>
                      <Play size={16} /> Start Ride (Move Vehicle)
                    </button>
                  )}
                  {activeTrip.status === 'in_progress' && (
                    <button onClick={() => completeTrip(activeTrip.id)} className="btn btn-success" style={{ flex: 1, backgroundColor: 'var(--success)', color: '#ffffff' }}>
                      <CheckCircle2 size={16} /> Complete Ride
                    </button>
                  )}
                  {activeTrip.status === 'payment_pending' && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Waiting for passenger to complete payment transaction.
                    </div>
                  )}
                  <button onClick={() => cancelRide(activeTrip.id)} className="btn btn-ghost btn-danger" style={{ color: 'var(--danger)' }}>
                    Cancel Ride
                  </button>
                </div>
              ) : (
                <div>
                  {activeTrip.status === 'booked' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Waiting for driver ({activeTrip.driverName}) to launch the vehicle.
                      </span>
                      <button onClick={() => cancelRide(activeTrip.id)} className="btn btn-secondary">
                        Cancel Booking
                      </button>
                    </div>
                  )}
                  {activeTrip.status === 'in_progress' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                      <span className="map-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Journey active! Monitor path on the map above.</span>
                    </div>
                  )}
                  {activeTrip.status === 'payment_pending' && (
                    <form onSubmit={handlePayment} className="card" style={{ padding: '16px', background: '#eff6ff', borderColor: '#bfdbfe' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard size={16} /> Complete Payment Gateways
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        The driver has completed the route. Please choose a method to discharge the fare.
                      </p>
                      
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        {['Wallet', 'UPI', 'Card', 'Cash'].map(method => (
                          <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="pay-method"
                              checked={paymentMethod === method}
                              onChange={() => setPaymentMethod(method)}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            {method}
                          </label>
                        ))}
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Pay ₹{activeTrip.fare.toFixed(2)} Now
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Communication Chat */}
        <div>
          <ChatSim rideId={activeTrip.id} partnerName={isDriver ? (activeTrip.passengerName || "Passenger") : activeTrip.driverName} />
        </div>
      </div>
    </div>
  );
}
