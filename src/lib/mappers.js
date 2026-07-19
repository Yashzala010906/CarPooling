// Map Supabase rows (snake_case) to the exact camelCase shapes the views expect.
// IMPORTANT: Postgres `numeric` columns come back from PostgREST as strings, so every
// numeric field is coerced with Number() — the UI calls .toFixed() on fares/balances.

export const rowToEmployee = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  avatar: r.avatar,
  organization: r.organization,
  role: r.role,
  department: r.department,
  rating: Number(r.rating),
  ridesCompleted: Number(r.rides_completed),
  walletBalance: Number(r.wallet_balance),
});

export const rowToVehicle = (r) => ({
  id: r.id,
  ownerId: r.owner_id,
  model: r.model,
  registrationNumber: r.registration_number,
  seatingCapacity: Number(r.seating_capacity),
  fuelType: r.fuel_type,
  status: r.status,
});

export const rowToRide = (r) => ({
  id: r.id,
  driverId: r.driver_id,
  driverName: r.driver_name,
  driverAvatar: r.driver_avatar,
  driverRating: r.driver_rating != null ? Number(r.driver_rating) : null,
  passengerId: r.passenger_id,
  passengerName: r.passenger_name,
  passengerAvatar: r.passenger_avatar,
  vehicleModel: r.vehicle_model,
  vehicleReg: r.vehicle_reg,
  pickup: r.pickup,
  destination: r.destination,
  dateTime: r.date_time,
  seatsTotal: Number(r.seats_total),
  seatsAvailable: Number(r.seats_available),
  fare: Number(r.fare),
  status: r.status,
  recurring: !!r.recurring,
  routeCoordinates: r.route_coordinates || [],
  distanceKm: r.distance_km != null ? Number(r.distance_km) : null,
  durationMin: r.duration_min != null ? Number(r.duration_min) : null,
});

export const rowToPlace = (r) => ({
  id: r.id,
  label: r.label,
  address: r.address,
});

export const rowToTransaction = (r) => ({
  id: r.id,
  type: r.type,
  amount: Number(r.amount),
  desc: r.description,
  date: r.txn_date,
});

export const rowToOrgConfig = (r) => ({
  fuelCostPerLitre: Number(r.fuel_cost_per_litre),
  costPerKm: Number(r.cost_per_km),
  allowGuestUsers: !!r.allow_guest_users,
  requireVehicleInsurance: !!r.require_vehicle_insurance,
  matchingToleranceMeters: Number(r.matching_tolerance_meters),
});

// A locally-built ride object (camelCase) -> a row for insert (snake_case).
export const rideToRow = (ride) => ({
  id: ride.id,
  driver_id: ride.driverId,
  driver_name: ride.driverName,
  driver_avatar: ride.driverAvatar,
  driver_rating: ride.driverRating,
  passenger_id: ride.passengerId ?? null,
  passenger_name: ride.passengerName ?? null,
  passenger_avatar: ride.passengerAvatar ?? null,
  vehicle_model: ride.vehicleModel,
  vehicle_reg: ride.vehicleReg,
  pickup: ride.pickup,
  destination: ride.destination,
  date_time: ride.dateTime,
  seats_total: ride.seatsTotal,
  seats_available: ride.seatsAvailable,
  fare: ride.fare,
  status: ride.status,
  recurring: ride.recurring,
  route_coordinates: ride.routeCoordinates,
  distance_km: ride.distanceKm ?? null,
  duration_min: ride.durationMin ?? null,
});

export const employeeToRow = (emp) => ({
  id: emp.id,
  name: emp.name,
  email: emp.email,
  avatar: emp.avatar,
  organization: emp.organization,
  role: emp.role,
  department: emp.department,
  rating: emp.rating,
  rides_completed: emp.ridesCompleted,
  wallet_balance: emp.walletBalance,
});
