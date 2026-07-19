import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Car, 
  Search, 
  PlusCircle, 
  Compass, 
  MapPin, 
  CreditCard, 
  History, 
  Settings as SettingsIcon, 
  Users, 
  Sliders, 
  TrendingUp, 
  LogOut,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function Sidebar() {
  const { 
    currentUser, 
    currentRole, 
    currentView, 
    setCurrentView, 
    activeTrip, 
    logout 
  } = useContext(AppContext);

  const employeeMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'find-ride', label: 'Find a Ride', icon: Search },
    { id: 'offer-ride', label: 'Offer a Ride', icon: PlusCircle },
    { 
      id: 'my-trips', 
      label: 'My Trips', 
      icon: Car, 
      badge: activeTrip ? 'Active' : null 
    },
    { id: 'wallet', label: 'Wallet & Payments', icon: CreditCard },
    { id: 'vehicles', label: 'My Vehicles', icon: Car },
    { id: 'history', label: 'Ride History', icon: History },
    { id: 'reports', label: 'Reports & Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'Admin Overview', icon: TrendingUp },
    { id: 'admin-employees', label: 'Manage Employees', icon: Users },
    { id: 'admin-vehicles', label: 'Manage Vehicles', icon: Car },
    { id: 'admin-config', label: 'Platform Config', icon: Sliders },
  ];

  const menuItems = currentRole === 'admin' ? adminMenuItems : employeeMenuItems;

  return (
    <aside style={{
      width: '280px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid var(--border)',
        gap: '10px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '800',
          fontSize: '1.2rem',
          boxShadow: 'var(--shadow-primary)'
        }}>
          O
        </div>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' }}>odoo</span>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Carpool</span>
        </div>
      </div>

      {/* Role Indicator Banner */}
      <div style={{
        margin: '16px 16px 8px 16px',
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: currentRole === 'admin' ? '#fef2f2' : 'var(--primary-light)',
        border: `1px solid ${currentRole === 'admin' ? '#fca5a5' : 'var(--primary-border)'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: currentRole === 'admin' ? '#dc2626' : 'var(--primary)'
      }}>
        {currentRole === 'admin' ? <ShieldCheck size={14} /> : <Zap size={14} />}
        <span>Mode: {currentRole === 'admin' ? 'Company Admin' : 'Employee Access'}</span>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto'
      }}>
        {menuItems.map(item => {
          const IconComp = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.9rem'
              }}
              className="btn-ghost"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IconComp size={18} style={{ color: isActive ? 'var(--primary)' : 'var(--text-light)' }} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="badge badge-success pulse-soft" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Card Footer */}
      {currentUser && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border)',
          backgroundColor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {currentUser.avatar}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <h5 style={{ fontSize: '0.85rem', margin: 0, fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </h5>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                {currentUser.email}
              </span>
            </div>
            <button 
              onClick={logout} 
              style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-light)' }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
