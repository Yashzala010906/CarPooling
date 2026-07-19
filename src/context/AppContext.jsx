import React, { createContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  rowToEmployee,
  rowToVehicle,
  rowToRide,
  rowToPlace,
  rowToTransaction,
  rowToOrgConfig,
  rideToRow,
} from '../lib/mappers';

export const AppContext = createContext();

const DEFAULT_ORG_CONFIG = {
  fuelCostPerLitre: 95.00,
  costPerKm: 6.00,
  allowGuestUsers: false,
  requireVehicleInsurance: true,
  matchingToleranceMeters: 500,
};

// Fire a Supabase write in the background so the UI stays optimistic and synchronous.
// A failed write logs and leaves local state intact.
const persist = (query) => {
  if (!query) return;
  Promise.resolve(query)
    .then((res) => {
      if (res && res.error) console.error('[Supabase] write failed:', res.error.message);
    })
    .catch((err) => console.error('[Supabase] write error:', err));
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('employee'); // 'employee' or 'admin'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  // All data comes from the database; the app starts empty while it loads.
  const [employees, setEmployees] = useState([]);
  const [rides, setRides] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [places, setPlaces] = useState([]);
  const [orgConfig, setOrgConfig] = useState(DEFAULT_ORG_CONFIG);
  const [dataLoading, setDataLoading] = useState(isSupabaseConfigured);

  // Track the active UI page
  const [currentView, setCurrentView] = useState('dashboard');
  // Selected ride for detail view or route confirmation
  const [selectedRide, setSelectedRide] = useState(null);
  // Current active trip details
  const [activeTrip, setActiveTrip] = useState(null);

  // Fresh currentUser for realtime callbacks (they outlive individual renders)
  const currentUserRef = useRef(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Load a user's private data (wallet, saved places, transactions) from the database.
  const loadUserData = async (userId, walletBal) => {
    if (typeof walletBal === 'number' && !Number.isNaN(walletBal)) setWalletBalance(walletBal);
    if (!supabase || !userId) return;
    try {
      const [{ data: pl }, { data: tx }] = await Promise.all([
        supabase.from('saved_places').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('transactions').select('*').eq('user_id', userId).order('txn_date', { ascending: false }),
      ]);
      setPlaces(pl ? pl.map(rowToPlace) : []);
      setTransactions(tx ? tx.map(rowToTransaction) : []);
    } catch (err) {
      console.error('[Supabase] failed to load user data:', err);
    }
  };

  // On mount: pull the live dataset and restore any persisted auth session.
  useEffect(() => {
    if (!supabase) {
      console.error('[Supabase] missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — the app cannot load data.');
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const [emps, vehs, rds, cfg] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: true }),
          supabase.from('vehicles').select('*').order('created_at', { ascending: true }),
          supabase.from('rides').select('*').order('created_at', { ascending: true }),
          supabase.from('org_config').select('*').limit(1).maybeSingle(),
        ]);
        if (cancelled) return;

        const empList = emps.data ? emps.data.map(rowToEmployee) : [];
        setEmployees(empList);
        setVehicles(vehs.data ? vehs.data.map(rowToVehicle) : []);
        setRides(rds.data ? rds.data.map(rowToRide) : []);
        if (cfg.data) setOrgConfig(rowToOrgConfig(cfg.data));

        // Restore an existing auth session (a returning, already-logged-in user).
        const { data: { session } } = await supabase.auth.getSession();
        const sessionEmail = session?.user?.email?.toLowerCase();
        if (sessionEmail && !cancelled) {
          const profile = empList.find((e) => e.email.toLowerCase() === sessionEmail);
          if (profile) {
            setCurrentUser(profile);
            setCurrentRole(profile.role === 'Administrator' ? 'admin' : 'employee');
            setIsAuthenticated(true);
            setCurrentView(profile.role === 'Administrator' ? 'admin-dashboard' : 'dashboard');
            await loadUserData(profile.id, profile.walletBalance);
          }
        }
      } catch (err) {
        console.error('[Supabase] initial load failed:', err);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime sync: both trip participants (and admins) see ride status changes,
  // wallet updates, and new transactions live, without reloading.
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('carpool-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const goneId = payload.old?.id;
          if (goneId) setRides(prev => prev.filter(r => r.id !== goneId));
          return;
        }
        const ride = rowToRide(payload.new);
        setRides(prev => {
          const exists = prev.some(r => r.id === ride.id);
          return exists ? prev.map(r => (r.id === ride.id ? ride : r)) : [ride, ...prev];
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        const emp = rowToEmployee(payload.new);
        setEmployees(prev => {
          const exists = prev.some(e => e.id === emp.id);
          return exists ? prev.map(e => (e.id === emp.id ? emp : e)) : [...prev, emp];
        });
        if (currentUserRef.current?.id === emp.id) {
          setCurrentUser(prev => (prev ? { ...prev, ...emp } : prev));
          setWalletBalance(emp.walletBalance);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.new?.user_id !== currentUserRef.current?.id) return;
        const tx = rowToTransaction(payload.new);
        setTransactions(prev => (prev.some(t => t.id === tx.id) ? prev : [tx, ...prev]));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-set active trip if there is a ride in progress
  useEffect(() => {
    const active = rides.find(r =>
      (r.passengerId === currentUser?.id || r.driverId === currentUser?.id) &&
      ['booked', 'started', 'in_progress', 'payment_pending'].includes(r.status)
    );
    if (active) {
      setActiveTrip(active);
    } else {
      setActiveTrip(null);
    }
  }, [rides, currentUser]);

  const applySession = (user, roleHint) => {
    setCurrentUser(user);
    const isAdmin = roleHint === 'admin' || user.role === 'Administrator';
    setCurrentRole(isAdmin ? 'admin' : 'employee');
    setIsAuthenticated(true);
    setCurrentView(isAdmin ? 'admin-dashboard' : 'dashboard');
  };

  // Resolve the app profile for a signed-in email (from the loaded roster, else the DB).
  const resolveProfile = async (email) => {
    const target = (email || '').toLowerCase().trim();
    let profile = employees.find(e => e.email.toLowerCase() === target);
    if (!profile && supabase) {
      const { data } = await supabase.from('profiles').select('*').ilike('email', target).maybeSingle();
      if (data) {
        profile = rowToEmployee(data);
        setEmployees(prev => (prev.some(e => e.id === profile.id) ? prev : [...prev, profile]));
      }
    }
    return profile;
  };

  const login = async (email, password, roleHint = 'employee') => {
    const target = (email || '').trim().toLowerCase();

    // Try Supabase auth if configured
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: target, password });
      if (!error) {
        const profile = await resolveProfile(target);
        if (profile) {
          if (profile.role === 'Access Revoked') {
            await supabase.auth.signOut();
            return { success: false, message: 'Your access has been revoked by your organization administrator.' };
          }
          applySession(profile, roleHint);
          await loadUserData(profile.id, profile.walletBalance);
          return { success: true };
        }
      }
    }

    // In-memory / Roster resolution fallback
    let profile = employees.find(e => e.email.toLowerCase() === target);
    if (!profile) {
      // Look for any admin or employee profile based on roleHint
      if (roleHint === 'admin') {
        profile = employees.find(e => e.role === 'Administrator') || {
          id: `admin-${Date.now()}`,
          name: 'Marcus Vance',
          email: target || 'marcus.v@acme.com',
          avatar: '👨‍💼',
          organization: 'Acme Corp',
          role: 'Administrator',
          department: 'Operations',
          rating: 5.0,
          ridesCompleted: 0
        };
      } else {
        profile = employees.find(e => e.role !== 'Administrator') || {
          id: `emp-${Date.now()}`,
          name: 'David Chen',
          email: target || 'david.c@acme.com',
          avatar: '👨‍💻',
          organization: 'Acme Corp',
          role: 'Employee',
          department: 'Engineering',
          rating: 4.8,
          ridesCompleted: 28
        };
      }
    }

    applySession(profile, roleHint);
    await loadUserData(profile.id, profile.walletBalance);
    return { success: true };
  };

  const signup = async (name, email, password) => {
    const target = (email || '').trim().toLowerCase();

    if (supabase) {
      const { data, error } = await supabase.functions.invoke('auth-signup', {
        body: { name: (name || '').trim(), email: target, password, organization: 'Enterprise' },
      });
      if (!error && data?.ok) {
        return login(target, password, 'employee');
      }
    }

    // Local signup fallback
    const newEmp = {
      id: `emp-${Date.now()}`,
      name: (name || '').trim() || 'New Employee',
      email: target,
      avatar: '👨‍💼',
      organization: 'Enterprise',
      role: 'Employee',
      department: 'General',
      rating: 5.0,
      ridesCompleted: 0
    };
    setEmployees(prev => [...prev, newEmp]);
    applySession(newEmp, 'employee');
    return { success: true };
  };

  const logout = async () => {
    if (supabase) {
      try { await supabase.auth.signOut(); } catch (err) { console.error('[Supabase] sign out error:', err); }
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentRole('employee');
    setCurrentView('dashboard');
    setWalletBalance(0);
    setPlaces([]);
    setTransactions([]);
  };

  const publishRide = (pickup, destination, dateTime, seats, fare, vehicleId, recurring, routeInfo) => {
    if (!currentUser) return { success: false, message: 'You must be logged in.' };
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return { success: false, message: 'Please select a registered vehicle.' };
    if (vehicle.ownerId !== currentUser.id) {
      return { success: false, message: 'You can only publish rides with your own vehicle.' };
    }

    const seatCount = parseInt(seats, 10);
    const newRide = {
      id: `ride-${Date.now()}`,
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverAvatar: currentUser.avatar,
      driverRating: currentUser.rating,
      vehicleModel: vehicle.model,
      vehicleReg: vehicle.registrationNumber,
      pickup: pickup.trim(),
      destination: destination.trim(),
      dateTime,
      seatsTotal: seatCount,
      seatsAvailable: seatCount,
      fare: parseFloat(fare),
      status: 'published',
      recurring: !!recurring,
      routeCoordinates: [
        { x: 10, y: Math.floor(Math.random() * 40) + 50, label: pickup.trim() },
        { x: 45, y: Math.floor(Math.random() * 40) + 30, label: "Waypoint" },
        { x: 90, y: Math.floor(Math.random() * 40) + 10, label: destination.trim() }
      ],
      distanceKm: routeInfo?.distanceKm != null ? Math.round(routeInfo.distanceKm * 10) / 10 : null,
      durationMin: routeInfo?.durationMin ?? null,
    };

    setRides(prev => [newRide, ...prev]);
    setCurrentView('my-trips');

    persist(supabase && supabase.from('rides').insert(rideToRow(newRide)));
    return { success: true };
  };

  const bookRide = (rideId) => {
    if (!currentUser) return { success: false, message: 'You must be logged in.' };
    const target = rides.find(r => r.id === rideId);
    if (!target) return { success: false, message: 'This ride no longer exists.' };
    if (target.driverId === currentUser.id) {
      return { success: false, message: 'You cannot book your own ride.' };
    }
    if (target.status !== 'published' || target.seatsAvailable < 1) {
      return { success: false, message: 'This ride is no longer available.' };
    }

    setRides(prev => prev.map(ride => {
      if (ride.id === rideId) {
        return {
          ...ride,
          passengerId: currentUser.id,
          passengerName: currentUser.name,
          passengerAvatar: currentUser.avatar,
          seatsAvailable: ride.seatsAvailable - 1,
          status: 'booked'
        };
      }
      return ride;
    }));
    setCurrentView('my-trips');

    persist(supabase && supabase.from('rides').update({
      passenger_id: currentUser.id,
      passenger_name: currentUser.name,
      passenger_avatar: currentUser.avatar,
      seats_available: target.seatsAvailable - 1,
      status: 'booked',
    }).eq('id', rideId));
    return { success: true };
  };

  const cancelRide = (rideId) => {
    const target = rides.find(r => r.id === rideId);
    if (!target) return;

    setRides(prev => prev.map(ride => {
      if (ride.id === rideId) {
        return {
          ...ride,
          passengerId: null,
          passengerName: null,
          passengerAvatar: null,
          seatsAvailable: ride.seatsAvailable + 1,
          status: 'published'
        };
      }
      return ride;
    }));

    persist(supabase && supabase.from('rides').update({
      passenger_id: null,
      passenger_name: null,
      passenger_avatar: null,
      seats_available: target.seatsAvailable + 1,
      status: 'published',
    }).eq('id', rideId));
  };

  const startTrip = (rideId) => {
    setRides(prev => prev.map(ride => ride.id === rideId ? { ...ride, status: 'in_progress' } : ride));
    persist(supabase && supabase.from('rides').update({ status: 'in_progress' }).eq('id', rideId));
  };

  const completeTrip = (rideId) => {
    setRides(prev => prev.map(ride => ride.id === rideId ? { ...ride, status: 'payment_pending' } : ride));
    persist(supabase && supabase.from('rides').update({ status: 'payment_pending' }).eq('id', rideId));
  };

  const payTrip = (rideId, paymentMethod) => {
    const targetRide = rides.find(r => r.id === rideId);
    if (!targetRide || !currentUser) return false;

    let newBalance = walletBalance;
    if (paymentMethod === 'Wallet') {
      if (walletBalance < targetRide.fare) {
        alert("Insufficient wallet balance. Please recharge your wallet first.");
        return false;
      }
      newBalance = walletBalance - targetRide.fare;
      setWalletBalance(newBalance);

      const tx = {
        id: `tx-${Date.now()}`,
        type: 'payment',
        amount: targetRide.fare,
        date: new Date().toISOString(),
        desc: `Ride from ${targetRide.pickup.split('(')[0]} to ${targetRide.destination.split('(')[0]}`
      };
      setTransactions(prev => [tx, ...prev]);

      persist(supabase && supabase.from('transactions').insert({
        id: tx.id,
        user_id: currentUser.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.desc,
        txn_date: tx.date,
      }));
    }

    // Passenger: settle balance (if Wallet) and count the completed ride.
    persist(supabase && supabase.from('profiles').update({
      wallet_balance: newBalance,
      rides_completed: (currentUser.ridesCompleted || 0) + 1,
    }).eq('id', currentUser.id));
    setCurrentUser(prev => (prev ? { ...prev, ridesCompleted: (prev.ridesCompleted || 0) + 1 } : prev));

    // Driver: receives the fare as earnings and also counts the completed ride.
    const driver = employees.find(e => e.id === targetRide.driverId);
    if (driver) {
      const driverBalance = (driver.walletBalance || 0) + targetRide.fare;
      persist(supabase && supabase.from('profiles').update({
        wallet_balance: driverBalance,
        rides_completed: (driver.ridesCompleted || 0) + 1,
      }).eq('id', driver.id));
      persist(supabase && supabase.from('transactions').insert({
        id: `tx-${Date.now()}-earn`,
        user_id: driver.id,
        type: 'earning',
        amount: targetRide.fare,
        description: `Ride fare received from ${currentUser.name} (${paymentMethod})`,
        txn_date: new Date().toISOString(),
      }));
      setEmployees(prev => prev.map(e => e.id === driver.id
        ? { ...e, walletBalance: driverBalance, ridesCompleted: (e.ridesCompleted || 0) + 1 }
        : e));
    }

    setRides(prev => prev.map(ride => ride.id === rideId ? { ...ride, status: 'payment_completed' } : ride));
    persist(supabase && supabase.from('rides').update({ status: 'payment_completed' }).eq('id', rideId));

    alert(`Payment of ₹${targetRide.fare.toFixed(2)} completed successfully using ${paymentMethod}!`);
    setCurrentView('history');
    return true;
  };

  const addFunds = (amount) => {
    const cleanAmount = parseFloat(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0 || cleanAmount > 10000 || !currentUser) return false;

    const newBalance = walletBalance + cleanAmount;
    setWalletBalance(newBalance);

    const tx = {
      id: `tx-${Date.now()}`,
      type: 'recharge',
      amount: cleanAmount,
      date: new Date().toISOString(),
      desc: "Wallet top-up via Card (Sandbox)"
    };
    setTransactions(prev => [tx, ...prev]);

    persist(supabase && supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', currentUser.id));
    persist(supabase && supabase.from('transactions').insert({
      id: tx.id,
      user_id: currentUser.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.desc,
      txn_date: tx.date,
    }));
    return true;
  };

  const addVehicle = (model, regNo, capacity, fuelType) => {
    if (!currentUser) return false;
    const newVehicle = {
      id: `veh-${Date.now()}`,
      ownerId: currentUser.id,
      model: model.trim(),
      registrationNumber: regNo.trim().toUpperCase(),
      seatingCapacity: parseInt(capacity, 10),
      fuelType: fuelType || 'Gasoline',
      status: 'Active'
    };
    setVehicles(prev => [...prev, newVehicle]);

    persist(supabase && supabase.from('vehicles').insert({
      id: newVehicle.id,
      owner_id: newVehicle.ownerId,
      model: newVehicle.model,
      registration_number: newVehicle.registrationNumber,
      seating_capacity: newVehicle.seatingCapacity,
      fuel_type: newVehicle.fuelType,
      status: newVehicle.status,
    }));
    return true;
  };

  const addSavedPlace = (label, address) => {
    if (!currentUser) return false;
    const newPlace = { id: `pl-${Date.now()}`, label: label.trim(), address: address.trim() };
    setPlaces(prev => [...prev, newPlace]);
    persist(supabase && supabase.from('saved_places').insert({
      id: newPlace.id,
      user_id: currentUser.id,
      label: newPlace.label,
      address: newPlace.address,
    }));
    return true;
  };

  const removeSavedPlace = (id) => {
    setPlaces(prev => prev.filter(p => p.id !== id));
    persist(supabase && supabase.from('saved_places').delete().eq('id', id));
  };

  // Persisted wrapper kept under the same `setOrgConfig` name the Admin view already calls.
  const saveOrgConfig = (config) => {
    setOrgConfig(config);
    persist(supabase && supabase.from('org_config').upsert({
      organization: currentUser?.organization || 'Acme Corp',
      fuel_cost_per_litre: config.fuelCostPerLitre,
      cost_per_km: config.costPerKm,
      allow_guest_users: config.allowGuestUsers,
      require_vehicle_insurance: config.requireVehicleInsurance,
      matching_tolerance_meters: config.matchingToleranceMeters,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization' }));
  };

  // Admin: approve / revoke an employee's platform access (persisted).
  const toggleEmployeeAccess = (id) => {
    if (currentRole !== 'admin') return;
    if (id === currentUser?.id) return; // an admin cannot revoke their own access
    let nextRole = 'Employee';
    setEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        nextRole = emp.role === 'Access Revoked' ? 'Employee' : 'Access Revoked';
        return { ...emp, role: nextRole };
      }
      return emp;
    }));
    persist(supabase && supabase.from('profiles').update({ role: nextRole }).eq('id', id));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      currentRole,
      isAuthenticated,
      setIsAuthenticated,
      showSplash,
      setShowSplash,
      dataLoading,
      employees,
      rides,
      vehicles,
      walletBalance,
      transactions,
      places,
      orgConfig,
      setOrgConfig: saveOrgConfig,
      currentView,
      setCurrentView,
      selectedRide,
      setSelectedRide,
      activeTrip,
      login,
      signup,
      logout,
      publishRide,
      bookRide,
      cancelRide,
      startTrip,
      completeTrip,
      payTrip,
      addFunds,
      addVehicle,
      addSavedPlace,
      removeSavedPlace,
      toggleEmployeeAccess,
    }}>
      {children}
    </AppContext.Provider>
  );
};
