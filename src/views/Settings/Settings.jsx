import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Plus, Trash2, MapPin, User, ShieldCheck } from 'lucide-react';
import { validatePlace } from '../../lib/validation';

export default function Settings() {
  const { currentUser, places, addSavedPlace, removeSavedPlace } = useContext(AppContext);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [placeError, setPlaceError] = useState('');

  const handleAddPlace = (e) => {
    e.preventDefault();
    setPlaceError('');

    const invalid = validatePlace(label, address, places);
    if (invalid) {
      setPlaceError(invalid);
      return;
    }

    addSavedPlace(label, address);
    setLabel('');
    setAddress('');
    alert("Saved place added successfully!");
  };

  return (
    <div className="view-container animate-fade">
      {/* View Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Customize profile parameters and saved addresses</p>
      </div>

      <div className="grid-2">
        {/* Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--primary)' }} />
              Employee Credentials
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                  {currentUser?.avatar}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>{currentUser?.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role: {currentUser?.role}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>EMAIL</span>
                  <strong>{currentUser?.email}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>ORGANIZATION</span>
                  <strong>{currentUser?.organization}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>DEPARTMENT</span>
                  <strong>{currentUser?.department}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#eff6ff', borderColor: '#bfdbfe' }}>
            <ShieldCheck size={24} style={{ color: '#3b82f6' }} />
            <div>
              <h4 style={{ fontSize: '0.85rem', color: '#1e40af', margin: 0, fontWeight: '700' }}>Corporate Authentication Verified</h4>
              <p style={{ fontSize: '0.7rem', color: '#1e3a8a', margin: 0 }}>Your account is bound to company-wide single-sign-on (SSO).</p>
            </div>
          </div>
        </div>

        {/* Saved Places */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* List of Places */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} style={{ color: 'var(--primary)' }} />
              Saved Locations
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {places.map(p => (
                <div key={p.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#fafafa'
                }}>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', margin: 0, fontWeight: '600' }}>{p.label}</h5>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.address}</span>
                  </div>
                  <button onClick={() => removeSavedPlace(p.id)} className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Place Form */}
            <form onSubmit={handleAddPlace} style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', color: 'var(--text-muted)' }}>Add Custom Place</h4>
              {placeError && (
                <div className="badge badge-danger" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.8rem', textAlign: 'left' }}>
                  {placeError}
                </div>
              )}
              
              <div className="input-group">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Location Tag (e.g. Parent's House)"
                  className="input-field"
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full Address / Coordinates"
                  className="input-field"
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Save Location
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
