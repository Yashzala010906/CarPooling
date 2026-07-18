/**
 * Shared enums mirroring the Prisma schema.
 * Keep in sync with packages/database/prisma/schema.prisma.
 */

export enum UserRole {
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum RideStatus {
  PUBLISHED = 'PUBLISHED',
  FULL = 'FULL',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/** Trip lifecycle from the problem statement (section 5.4). */
export enum TripStatus {
  BOOKED = 'BOOKED',
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  WALLET = 'WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum WalletTransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum NotificationType {
  RIDE = 'RIDE',
  BOOKING = 'BOOKING',
  TRIP = 'TRIP',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
}
