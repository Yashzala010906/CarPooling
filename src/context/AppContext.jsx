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
  employeeToRow,
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
const persist = (query) => {
  if (!query) return;
  Promise.resolve(query)
    .then((res) => {
      if (res && res.error) console.error('[Supabase] write failed:', res.error.message);
    })
    .catch((err) => console.error('[Supabase] write error:', err));
};

const DEFAULT_ADMIN = {
  id: 'admin-1',
  name: 'System Administrator',
  email: 'admin@gmail.com',
  avatar: '👨‍💼',
  organization: 'Odoo Enterprise',
  role: 'Administrator',
  department: 'Administration',
  rating: 5.0,
  ridesCompleted: 0,
  walletBalance: 5000
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('employee'); // 'employee' or 'admin'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  // Database initialized with 1 default System Admin account
  const [employees, setEmployees] = useState([DEFAULT_ADMIN]);
  const [rides, setRides] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [places, setPlaces] = useState([]);
  const [orgConfig, setOrgConfig] = useState(DEFAULT_ORG_CONFIG);
  const [dataLoading, setDataLoading] = useState(isSupabaseConfigured);

  // Track the active UI page
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedRide, setSelectedRide] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);

  const currentUserRef = useRef(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Load a user's private data from the database
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

  // On mount: pull live data from database
  useEffect(() => {
    if (!supabase) return;
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
  }, []);

  // Realtime sync
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

  // Track active trip
  useEffect(() => {
    const active = rides.find(r =>
      (r.passengerId === currentUser?.id || r.driverId === currentUser?.id) &&
      ['booked', 'started', 'in_progress', 'payment_pending'].includes(r.status)
    );
    setActiveTrip(active || null);
  }, [rides, currentUser]);

  const applySession = (user, roleHint) => {
    setCurrentUser(user);
    const isAdmin = roleHint === 'admin' || user.role === 'Administrator';
    setCurrentRole(isAdmin ? 'admin' : 'employee');
    setIsAuthenticated(true);
    setCurrentView(isAdmin ? 'admin-dashboard' : 'dashboard');
  };

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

  // User Login
  const login = async (email, password, roleHint = 'employee') => {
    const target = (email || '').trim().toLowerCase();

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

    // In-memory roster resolution
    const profile = employees.find(e => e.email.toLowerCase() === target);
    if (!profile) {
      return { success: false, message: `No account found for "${target}". Please click Register to create a new ${roleHint} account.` };
    }

    if (profile.role === 'Access Revoked') {
      return { success: false, message: 'Your access has been revoked by your organization administrator.' };
    }

    applySession(profile, roleHint);
    await loadUserData(profile.id, profile.walletBalance);
    return { success: true };
  };

  // User Signup (with Employee or Admin role choice)
  const signup = async (name, email, password, role = 'Employee') => {
    const target = (email || '').trim().toLowerCase();

    // Check if email already registered
    const existing = employees.find(e => e.email.toLowerCase() === target);
    if (existing) {
      return { success: false, message: `An account with "${target}" already exists. Please log in.` };
    }

    const isAdmin = role === 'Administrator' || role === 'admin';
    const newEmp = {
      id: `usr-${Date.now()}`,
      name: (name || '').trim(),
      email: target,
      avatar: isAdmin ? '👨‍💼' : '👨‍💻',
      organization: 'Enterprise',
      role: isAdmin ? 'Administrator' : 'Employee',
      department: isAdmin ? 'Administration' : 'Operations',
      rating: 5.0,
      ridesCompleted: 0,
      walletBalance: 0
    };

    setEmployees(prev => [...prev, newEmp]);
    applySession(newEmp, isAdmin ? 'admin' : 'employee');
    persist(supabase && supabase.from('profiles').insert(employeeToRow(newEmp)));
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

  const toggleEmployeeAccess = (id) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        const newRole = emp.role === 'Access Revoked' ? 'Employee' : 'Access Revoked';
        persist(supabase && supabase.from('profiles').update({ role: newRole }).eq('id', id));
        return { ...emp, role: newRole };
      }
      return emp;
    }));
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
        { x: 10, y: 50, label: pickup.trim() },
        { x: 90, y: 50, label: destination.trim() }
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
    if (!target) return { success: false, message: 'Ride not found.' };
    if (target.driverId === currentUser.id) {
      return { success: false, message: 'You cannot book your own ride.' };
    }
    if (target.seatsAvailable < 1) {
      return { success: false, message: 'No seats available.' };
    }

    setRides(prev => prev.map(r => r.id === rideId ? {
      ...r,
      passengerId: currentUser.id,
      passengerName: currentUser.name,
      passengerAvatar: currentUser.avatar,
      seatsAvailable: r.seatsAvailable - 1,
      status: 'booked'
    } : r));

    setCurrentView('my-trips');
    return { success: true };
  };

  const cancelRide = (rideId) => {
    setRides(prev => prev.map(r => r.id === rideId ? {
      ...r,
      passengerId: null,
      passengerName: null,
      seatsAvailable: Math.min(r.seatsTotal, r.seatsAvailable + 1),
      status: 'published'
    } : r));
  };

  const startTrip = (rideId) => {
    setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'in_progress' } : r));
  };

  const completeTrip = (rideId) => {
    setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'payment_pending' } : r));
  };

  const payTrip = (rideId, paymentMethod) => {
    const targetRide = rides.find(r => r.id === rideId);
    if (!targetRide) return false;

    if (paymentMethod === 'Wallet') {
      if (walletBalance < targetRide.fare) {
        alert("Insufficient wallet balance. Please recharge first.");
        return false;
      }
      setWalletBalance(prev => prev - targetRide.fare);
      setTransactions(prev => [{
        id: `tx-${Date.now()}`,
        type: 'payment',
        amount: targetRide.fare,
        date: new Date().toISOString(),
        desc: `Ride from ${targetRide.pickup.split('(')[0]} to ${targetRide.destination.split('(')[0]}`
      }, ...prev]);
    }

    setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'payment_completed' } : r));
    alert(`Payment of ₹${targetRide.fare.toFixed(2)} completed successfully using ${paymentMethod}!`);
    setCurrentView('history');
    return true;
  };

  const addFunds = (amount) => {
    const cleanAmount = parseFloat(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0) return false;

    setWalletBalance(prev => prev + cleanAmount);
    setTransactions(prev => [{
      id: `tx-${Date.now()}`,
      type: 'recharge',
      amount: cleanAmount,
      date: new Date().toISOString(),
      desc: 'Wallet top-up'
    }, ...prev]);
    return true;
  };

  const addVehicle = (model, regNo, capacity, fuelType) => {
    if (!currentUser) return;
    const newVeh = {
      id: `veh-${Date.now()}`,
      ownerId: currentUser.id,
      model: model.trim(),
      registrationNumber: regNo.trim(),
      seatingCapacity: parseInt(capacity, 10),
      fuelType,
      status: 'Active'
    };
    setVehicles(prev => [...prev, newVeh]);
  };

  const clearAllDatabaseRecords = async () => {
    if (supabase) {
      try {
        await supabase.from('rides').delete().neq('id', '0');
        await supabase.from('transactions').delete().neq('id', '0');
        await supabase.from('saved_places').delete().neq('id', '0');
        await supabase.from('vehicles').delete().neq('id', '0');
        await supabase.from('profiles').delete().neq('id', '0');
        await supabase.auth.signOut();
      } catch (err) {
        console.error('[Supabase WIPE Error]:', err);
      }
    }
    setEmployees([]);
    setRides([]);
    setVehicles([]);
    setTransactions([]);
    setPlaces([]);
    setWalletBalance(0);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentRole('employee');
    setCurrentView('dashboard');
  };

  const addGeneratedRides = (newRides) => {
    if (!Array.isArray(newRides) || newRides.length === 0) return;
    setRides((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const fresh = newRides.filter((r) => !existingIds.has(r.id));
      return [...fresh, ...prev];
    });
  };

  return (
    <AppContext.Provider value={{
      currentUser, currentRole, isAuthenticated, employees, rides, vehicles, walletBalance, transactions, places, orgConfig, currentView, selectedRide, activeTrip, dataLoading,
      setCurrentView, setSelectedRide, setOrgConfig, toggleEmployeeAccess, login, signup, logout, publishRide, bookRide, cancelRide, startTrip, completeTrip, payTrip, addFunds, addVehicle, clearAllDatabaseRecords, addGeneratedRides
    }}>
      {children}
    </AppContext.Provider>
  );
};
