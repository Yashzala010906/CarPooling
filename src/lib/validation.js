// Shared form-validation helpers with real-world production rules.

const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'mailinator.com', 'dispostable.com', '10minutemail.com',
  'guerrillamail.com', 'trashmail.com', 'yopmail.com', 'test.com', 'example.com', 'fake.com'
];

export const validateName = (name) => {
  const v = (name || '').trim();
  if (!v) return 'Full name is required.';
  if (v.length < 2) return 'Name must be at least 2 characters.';
  if (v.length > 60) return 'Name must be under 60 characters.';
  if (!/^[\p{L}][\p{L}\p{M}' .-]*$/u.test(v)) return 'Name contains invalid characters.';
  return null;
};

// Real-world strict email validator
export const validateEmail = (email) => {
  const v = (email || '').trim().toLowerCase();
  if (!v) return 'Email address is required.';
  
  const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!EMAIL_RE.test(v)) return 'Please enter a valid email address (e.g. user@gmail.com).';
  
  const domain = v.split('@')[1];
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return 'Disposable or temporary emails are not allowed. Please use a valid personal or corporate email.';
  }
  
  return null;
};

// Real-world strict password validator
export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter (A-Z).';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter (a-z).';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number (0-9).';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*...).';
  }
  return null;
};

export const validateLocation = (value, fieldLabel = 'Location') => {
  const v = (value || '').trim();
  if (!v) return `${fieldLabel} is required.`;
  if (v.length < 3) return `${fieldLabel} must be at least 3 characters.`;
  if (v.length > 120) return `${fieldLabel} must be under 120 characters.`;
  return null;
};

export const validateRoute = (pickup, destination) => {
  const p = validateLocation(pickup, 'Pickup location');
  if (p) return p;
  const d = validateLocation(destination, 'Destination');
  if (d) return d;
  if (pickup.trim().toLowerCase() === destination.trim().toLowerCase()) {
    return 'Pickup and destination cannot be the same place.';
  }
  return null;
};

export const validateFutureDateTime = (value, fieldLabel = 'Departure time') => {
  if (!value) return `${fieldLabel} is required.`;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return `${fieldLabel} is not a valid date.`;
  if (dt.getTime() < Date.now() - 60 * 1000) return `${fieldLabel} must be in the future.`;
  if (dt.getTime() > Date.now() + 365 * 24 * 3600 * 1000) return `${fieldLabel} cannot be more than a year ahead.`;
  return null;
};

export const validateFare = (fare) => {
  const n = parseFloat(fare);
  if (Number.isNaN(n)) return 'Fare must be a number.';
  if (n <= 0) return 'Fare must be greater than ₹0.';
  if (n > 5000) return 'Fare cannot exceed ₹5000 per seat.';
  return null;
};

export const validateSeats = (seats, maxCapacity) => {
  const n = parseInt(seats, 10);
  if (Number.isNaN(n) || n < 1) return 'Seats must be at least 1.';
  if (maxCapacity && n > maxCapacity) return `This vehicle only has ${maxCapacity} passenger seats.`;
  return null;
};

export const validateVehicleModel = (model) => {
  const m = (model || '').trim();
  if (!m) return 'Car model is required.';
  if (m.length < 2) return 'Car model must be at least 2 characters.';
  if (m.length > 60) return 'Car model must be under 60 characters.';
  return null;
};

export const validateRegistration = (regNo, existingVehicles = []) => {
  const r = (regNo || '').trim();
  if (!r) return 'Registration number is required.';
  if (r.length < 3) return 'Registration number must be at least 3 characters.';
  if (!PLATE_RE.test(r)) return 'Registration plate contains invalid characters.';
  const duplicate = existingVehicles.some(
    (v) => (v.registrationNumber || '').replace(/[- ]/g, '').toLowerCase() === r.replace(/[- ]/g, '').toLowerCase()
  );
  if (duplicate) return 'A vehicle with this registration number is already registered.';
  return null;
};

export const validateVehicle = (model, regNo, capacity) => {
  const m = (model || '').trim();
  const r = (regNo || '').trim();
  const c = parseInt(capacity, 10);

  if (!m) return 'Car model is required.';
  if (m.length < 2) return 'Car model must be at least 2 characters.';
  if (!r) return 'Registration number is required.';
  if (r.length < 4) return 'Registration number must be at least 4 characters.';
  if (Number.isNaN(c) || c < 1 || c > 12) return 'Seating capacity must be between 1 and 12.';
  return null;
};

export const validateAmount = (amount, { min = 1, max = 100000 } = {}) => {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return 'Amount must be a number.';
  if (n < min) return `Minimum amount is ₹${min.toFixed(2)}.`;
  if (n > max) return `Maximum amount is ₹${max.toLocaleString()}.`;
  return null;
};

export const validatePlace = (label, address, existingPlaces = []) => {
  const l = (label || '').trim();
  const a = (address || '').trim();
  if (!l) return 'Location tag is required.';
  if (l.length > 40) return 'Location tag must be under 40 characters.';
  if (!a) return 'Address is required.';
  if (a.length < 4) return 'Address must be at least 4 characters.';
  if (a.length > 120) return 'Address must be under 120 characters.';
  if (existingPlaces.some((p) => p.label.trim().toLowerCase() === l.toLowerCase())) {
    return `You already have a place tagged "${l}".`;
  }
  return null;
};

export const validateOrgConfig = ({ fuelCost, costKm, tolerance }) => {
  const fuel = parseFloat(fuelCost);
  if (Number.isNaN(fuel) || fuel <= 0 || fuel > 500) return 'Fuel cost must be between ₹1 and ₹500 per litre.';
  const km = parseFloat(costKm);
  if (Number.isNaN(km) || km <= 0 || km > 100) return 'Cost per km must be between ₹0.5 and ₹100.';
  const tol = parseInt(tolerance, 10);
  if (Number.isNaN(tol) || tol < 50 || tol > 5000) return 'Matching tolerance must be between 50 and 5000 meters.';
  return null;
};
