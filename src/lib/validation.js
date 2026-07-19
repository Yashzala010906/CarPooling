// Shared form-validation helpers.
// Each validator returns an error message string, or null when the value is valid.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// License plates: letters/digits with optional dashes or spaces, e.g. "CA-88X-9002"
const PLATE_RE = /^[A-Za-z0-9]+([ -][A-Za-z0-9]+)*$/;

export const validateName = (name) => {
  const v = (name || '').trim();
  if (!v) return 'Full name is required.';
  if (v.length < 2) return 'Name must be at least 2 characters.';
  if (v.length > 60) return 'Name must be under 60 characters.';
  if (!/^[\p{L}][\p{L}\p{M}' .-]*$/u.test(v)) return 'Name contains invalid characters.';
  return null;
};

export const validateEmail = (email) => {
  const v = (email || '').trim();
  if (!v) return 'Email is required.';
  if (!EMAIL_RE.test(v)) return 'Please enter a valid email address.';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (password.length > 72) return 'Password must be under 72 characters.';
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
  if (n <= 0) return 'Fare must be greater than $0.';
  if (n > 500) return 'Fare cannot exceed $500 per seat.';
  return null;
};

export const validateSeats = (seats, maxCapacity) => {
  const n = parseInt(seats, 10);
  if (Number.isNaN(n) || n < 1) return 'At least 1 seat must be offered.';
  if (maxCapacity && n > maxCapacity) return `This vehicle only has ${maxCapacity} passenger seats.`;
  return null;
};

export const validateVehicleModel = (model) => {
  const v = (model || '').trim();
  if (!v) return 'Vehicle model is required.';
  if (v.length < 3) return 'Vehicle model must be at least 3 characters.';
  if (v.length > 60) return 'Vehicle model must be under 60 characters.';
  return null;
};

export const validateRegistration = (regNo, existingVehicles = []) => {
  const v = (regNo || '').trim();
  if (!v) return 'Registration number is required.';
  if (v.length < 4 || v.length > 15) return 'Registration number must be 4–15 characters.';
  if (!PLATE_RE.test(v)) return 'Registration may only contain letters, digits, spaces, and dashes.';
  const normalized = v.replace(/[ -]/g, '').toLowerCase();
  const duplicate = existingVehicles.some(
    (veh) => (veh.registrationNumber || '').replace(/[ -]/g, '').toLowerCase() === normalized
  );
  if (duplicate) return 'A vehicle with this registration number is already registered.';
  return null;
};

export const validateAmount = (amount, { min = 1, max = 10000 } = {}) => {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return 'Amount must be a number.';
  if (n < min) return `Minimum amount is $${min.toFixed(2)}.`;
  if (n > max) return `Maximum amount is $${max.toLocaleString()}.`;
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
  if (Number.isNaN(fuel) || fuel <= 0 || fuel > 20) return 'Fuel cost must be between $0.01 and $20.00 per litre.';
  const km = parseFloat(costKm);
  if (Number.isNaN(km) || km <= 0 || km > 10) return 'Cost per km must be between $0.01 and $10.00.';
  const tol = parseInt(tolerance, 10);
  if (Number.isNaN(tol) || tol < 50 || tol > 5000) return 'Matching tolerance must be between 50 and 5000 meters.';
  return null;
};
