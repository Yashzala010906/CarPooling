import type { Database, CompanyRole, VehicleStatus } from './database.types';

export type { CompanyRole, VehicleStatus };

type Tables = Database['public']['Tables'];

export type Profile = Tables['profiles']['Row'];
export type Company = Tables['companies']['Row'];
export type CompanyMember = Tables['company_members']['Row'];
export type Vehicle = Tables['vehicles']['Row'];
export type SavedPlace = Tables['saved_places']['Row'];
export type UserSettings = Tables['user_settings']['Row'];

/** A company membership joined with the member's profile (for member lists). */
export type CompanyMemberWithProfile = CompanyMember & {
  profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
};

/** A company joined with the current user's role in it. */
export type CompanyWithRole = Company & { role: CompanyRole };

/** A vehicle joined with its owner's display name. */
export type VehicleWithOwner = Vehicle & {
  owner: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
};

/** Standard result shape returned by every Server Action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
};

export const VEHICLE_TYPES = ['Sedan', 'SUV', 'Hatchback', 'MPV', 'Van', 'Bike', 'Other'] as const;
