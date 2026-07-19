import React, { useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Auth from './views/Auth/Auth';
import Dashboard from './views/Dashboard/Dashboard';
import FindRide from './views/FindRide/FindRide';
import OfferRide from './views/OfferRide/OfferRide';
import MyTrips from './views/MyTrips/MyTrips';
import Wallet from './views/Wallet/Wallet';
import Vehicles from './views/Vehicles/Vehicles';
import RideHistory from './views/History/History';
import Reports from './views/Reports/Reports';
import Settings from './views/Settings/Settings';
import AdminDashboard from './views/Admin/AdminDashboard';

function AppContent() {
  const {
    isAuthenticated,
    currentView,
    currentRole,
    walletBalance,
    currentUser
  } = useContext(AppContext);

  // If not authenticated, render splash / login views
  if (!isAuthenticated) {
    return <Auth />;
  }

  // View mapping based on Sidebar clicks
  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'find-ride':
        return <FindRide />;
      case 'offer-ride':
        return <OfferRide />;
      case 'my-trips':
        return <MyTrips />;
      case 'wallet':
        return <Wallet />;
      case 'vehicles':
        return <Vehicles />;
      case 'history':
        return <RideHistory />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'admin-dashboard':
      case 'admin-employees':
      case 'admin-vehicles':
      case 'admin-config':
        return <AdminDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <div className="main-content">

        {/* Top Header Bar */}
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
              {currentRole === 'admin' ? "Company Control Room" : `${currentUser?.organization || 'Organization'} Ride Hub`}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              <span>Secure Connection</span>
            </div>

            <div style={{
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.85rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              💰 Wallet Balance: ${walletBalance.toFixed(2)}
            </div>
          </div>
        </header>

        {/* View Content Panel */}
        <main style={{ flex: 1 }}>
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
