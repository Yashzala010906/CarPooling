'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { vehicleSchema, type VehicleInput } from '@/lib/validations';
import type { ActionResult, Vehicle, VehicleStatus } from '@/types';

const DUPLICATE_REG = 'A vehicle with this registration number already exists.';

function toRow(input: VehicleInput) {
  return {
    name: input.name || null,
    type: input.type || null,
    brand: input.brand || null,
    model: input.model,
    registration_number: input.registrationNumber,
    seating_capacity: input.seatingCapacity,
    color: input.color || null,
    company_id: input.companyId || null,
  };
}

/** Create a vehicle owned by the current user (optionally tied to a company). */
export async function createVehicleAction(input: VehicleInput): Promise<ActionResult<Vehicle>> {
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the errors and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const { data, error } = await supabase
    .from('vehicles')
    .insert({ ...toRow(parsed.data), owner_id: user.id }) // owner derived server-side
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { ok: false, error: DUPLICATE_REG };
    return { ok: false, error: error.message };
  }

  revalidatePath('/vehicles');
  return { ok: true, data, message: 'Vehicle added.' };
}

/** Update a vehicle the user owns (or manages via company). */
export async function updateVehicleAction(
  vehicleId: string,
  input: VehicleInput,
): Promise<ActionResult> {
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the errors and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  // RLS enforces ownership / company-manager permission. Never trust owner from client.
  const { data, error } = await supabase
    .from('vehicles')
    .update({ ...toRow(parsed.data), status: parsed.data.status ?? undefined })
    .eq('id', vehicleId)
    .select('id');

  if (error) {
    if (error.code === '23505') return { ok: false, error: DUPLICATE_REG };
    return { ok: false, error: error.message };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: 'Vehicle not found or you are not allowed to edit it.' };
  }

  revalidatePath('/vehicles');
  revalidatePath(`/vehicles/${vehicleId}/edit`);
  return { ok: true, message: 'Vehicle updated.' };
}

/** Enable/disable a vehicle (soft toggle). */
export async function setVehicleStatusAction(
  vehicleId: string,
  status: VehicleStatus,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .update({ status })
    .eq('id', vehicleId)
    .select('id');
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: 'Vehicle not found or not permitted.' };
  }

  revalidatePath('/vehicles');
  return { ok: true, message: status === 'ACTIVE' ? 'Vehicle activated.' : 'Vehicle deactivated.' };
}

/** Permanently delete a vehicle. RLS enforces ownership/permission. */
export async function deleteVehicleAction(vehicleId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('vehicles').delete().eq('id', vehicleId).select('id');

  if (error) {
    // e.g. FK from another module's rides table would raise 23503.
    if (error.code === '23503') {
      return {
        ok: false,
        error: 'This vehicle is used by existing rides. Deactivate it instead of deleting.',
      };
    }
    return { ok: false, error: error.message };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: 'Vehicle not found or not permitted.' };
  }

  revalidatePath('/vehicles');
  return { ok: true, message: 'Vehicle deleted.' };
}
