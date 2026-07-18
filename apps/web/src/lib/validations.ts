import { z } from 'zod';

import { VEHICLE_TYPES } from '@/types';

/* -------------------------------------------------------------------------- */
/* Reusable field schemas                                                     */
/* -------------------------------------------------------------------------- */
const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long');
const phone = z
  .string()
  .trim()
  .regex(/^[+()\d\s-]{7,20}$/, 'Enter a valid phone number');

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Please enter your full name').max(120),
    email,
    phone: phone.optional().or(z.literal('')),
    password,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: 'You must accept the terms to continue',
    }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name').max(120),
  phone: phone.optional().or(z.literal('')),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/* -------------------------------------------------------------------------- */
/* Company                                                                    */
/* -------------------------------------------------------------------------- */
export const companySchema = z.object({
  name: z.string().trim().min(2, 'Company name is required').max(150),
  email: email.optional().or(z.literal('')),
  phone: phone.optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type CompanyInput = z.infer<typeof companySchema>;

export const joinCompanySchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, 'Enter a valid company code')
    .max(12)
    .transform((v) => v.toUpperCase()),
});
export type JoinCompanyInput = z.infer<typeof joinCompanySchema>;

/* -------------------------------------------------------------------------- */
/* Vehicle                                                                    */
/* -------------------------------------------------------------------------- */
export const vehicleSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal('')),
  type: z.enum(VEHICLE_TYPES).optional(),
  brand: z.string().trim().max(80).optional().or(z.literal('')),
  model: z.string().trim().min(1, 'Model is required').max(80),
  registrationNumber: z
    .string()
    .trim()
    .min(3, 'Registration number is required')
    .max(20)
    .transform((v) => v.toUpperCase()),
  seatingCapacity: z.coerce
    .number()
    .int('Must be a whole number')
    .min(1, 'At least 1 seat')
    .max(100, 'Too many seats'),
  color: z.string().trim().max(40).optional().or(z.literal('')),
  companyId: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

/* -------------------------------------------------------------------------- */
/* Saved places                                                               */
/* -------------------------------------------------------------------------- */
const optionalCoord = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().min(min).max(max).optional(),
  );

export const savedPlaceSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(80),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  latitude: optionalCoord(-90, 90),
  longitude: optionalCoord(-180, 180),
});
export type SavedPlaceInput = z.infer<typeof savedPlaceSchema>;
