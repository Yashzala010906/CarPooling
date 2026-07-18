'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { savedPlaceSchema, type SavedPlaceInput } from '@/lib/validations';
import type { ActionResult, SavedPlace } from '@/types';

function toRow(input: SavedPlaceInput) {
  return {
    label: input.label,
    address: input.address || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  };
}

/** Add a saved place for the current user. */
export async function createSavedPlaceAction(
  input: SavedPlaceInput,
): Promise<ActionResult<SavedPlace>> {
  const parsed = savedPlaceSchema.safeParse(input);
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
    .from('saved_places')
    .insert({ ...toRow(parsed.data), user_id: user.id }) // user derived server-side
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath('/saved-places');
  return { ok: true, data, message: 'Place saved.' };
}

/** Update a saved place. RLS ensures the user owns it. */
export async function updateSavedPlaceAction(
  placeId: string,
  input: SavedPlaceInput,
): Promise<ActionResult> {
  const parsed = savedPlaceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the errors and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_places')
    .update(toRow(parsed.data))
    .eq('id', placeId)
    .select('id');
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: 'Place not found.' };

  revalidatePath('/saved-places');
  return { ok: true, message: 'Place updated.' };
}

/** Delete a saved place. RLS ensures the user owns it. */
export async function deleteSavedPlaceAction(placeId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_places')
    .delete()
    .eq('id', placeId)
    .select('id');
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: 'Place not found.' };

  revalidatePath('/saved-places');
  return { ok: true, message: 'Place removed.' };
}
