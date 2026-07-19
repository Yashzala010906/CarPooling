import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Search, PlusCircle, CreditCard, Car, MapPin, Compass, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, walletBalance, setCurrentView, activeTrip, places } = useContext(AppContext);

  return (
    <div className="view-container animate-fade">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #7e22ce 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        color: '#ffffff',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-primary)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circle shapes */}
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}></div>
        <div style={{ position: 'absolute', right: '80px', bottom: '-80px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, marginBottom: '8px' }}>
          <ShieldCheck size={14} /> Registered Employee of {currentUser?.organization || 'Acme Corp'}
        </div>
        <h1 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
          Hello, {currentUser?.name || 'Coworker'}! 👋
        </h1>
        <p style={{ fontSize: '1rem', opacity: 0.9, maxWidth: '600px' }}>
          Ready to save commute costs and reduce carbon footprint? Coordinate a shared ride inside your corporate circle.
        </p>
      </div>

      {/* Main Choice Cards */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        {/* Find a Ride Card */}
        <div 
          onClick={() => setCurrentView('find-ride')}
          className="card card-interactive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderLeft: '4px solid #3b82f6',
            minHeight: '200px'
          }}
        >
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifycontent: 'center', marginBottom: '16px' }}>
              <Search size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Find a Ride</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Search for available rides posted by colleagues traveling along your route. Book a seat instantly.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', fontWeight: '600', fontSize: '0.875rem', marginTop: '16px' }}>
            Search Rides <ArrowRight size={16} />
          </div>
        </div>

        {/* Offer a Ride Card */}
        <div 
          onClick={() => setCurrentView('offer-ride')}
          className="card card-interactive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderLeft: '4px solid var(--primary)',
            minHeight: '200px'
          }}
        >
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifycontent: 'center', marginBottom: '16px' }}>
              <PlusCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Offer a Ride</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Driving your personal vehicle to work? Publish your route, pick up colleagues, and share costs.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: '600', fontSize: '0.875rem', marginTop: '16px' }}>
            Publish Route <ArrowRight size={16} />
          </div>
        </div>
      </div>

      {/* Overview Dashboard Row */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {/* Wallet Balance Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Wallet Balance</span>
            <h4 style={{ fontSize: '1.4rem', fontWeight: '700' }}>₹{walletBalance.toFixed(2)}</h4>
          </div>
          <button onClick={() => setCurrentView('wallet')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
            Recharge
          </button>
        </div>

        {/* Active Trip Status Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: activeTrip ? 'var(--primary-light)' : '#f1f5f9', color: activeTrip ? 'var(--primary)' : 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car size={20} className={activeTrip ? "pulse-soft" : ""} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Active Journey</span>
            <h4 style={{ fontSize: '0.9rem', color: activeTrip ? 'var(--success)' : 'var(--text-muted)', fontWeight: '600' }}>
              {activeTrip ? `Status: ${activeTrip.status.replace('_', ' ')}` : 'No active trips'}
            </h4>
          </div>
          {activeTrip && (
            <button onClick={() => setCurrentView('my-trips')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              Track
            </button>
          )}
        </div>

        {/* Saved Places Summary */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Saved Places</span>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{places.length} Locations Configured</h4>
          </div>
          <button onClick={() => setCurrentView('settings')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
            Manage
          </button>
        </div>
      </div>

      {/* Walkthrough Guide Visual Block */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={18} style={{ color: 'var(--primary)' }} />
          Carpool Commute Process
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', position: 'relative' }}>
          {[
            { step: '1', title: 'Find or Offer', desc: 'Specify pickup location, destination, and timing.' },
            { step: '2', title: 'Route Confirmed', desc: 'Interactive route mapping is computed automatically.' },
            { step: '3', title: 'Rides Matching', desc: 'Instantly search lists of matching corporate rides.' },
            { step: '4', title: 'Live Trip & Pay', desc: 'Track vehicle, communicate via chat, and pay via Wallet.' }
          ].map((item, index) => (
            <div key={index} style={{ flex: '1 1 200px', display: 'flex', gap: '12px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.step}
              </div>
              <div>
                <h5 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>{item.title}</h5>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
