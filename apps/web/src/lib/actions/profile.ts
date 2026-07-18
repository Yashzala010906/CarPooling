'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { profileSchema, type ProfileInput } from '@/lib/validations';
import type { ActionResult } from '@/types';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

/** Update the authenticated user's own profile (name, phone). */
export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
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

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null })
    .eq('id', user.id); // RLS also enforces id = auth.uid()

  if (error) return { ok: false, error: error.message };

  revalidatePath('/profile');
  revalidatePath('/profile/edit');
  return { ok: true, message: 'Profile updated.' };
}

/** Upload/replace the user's avatar. Validated server-side; stored per-user. */
export async function uploadAvatarAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get('avatar');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Please choose an image to upload.' };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Only JPG, PNG or WebP images are allowed.' };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: 'Image must be smaller than 2MB.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${user.id}/avatar.${ext}`; // first folder = user id → matches storage RLS

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { ok: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`; // cache-bust when replaced

  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/profile');
  revalidatePath('/profile/edit');
  return { ok: true, data: { url }, message: 'Avatar updated.' };
}

/** Remove the user's avatar image. */
export async function removeAvatarAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  await supabase.storage
    .from('avatars')
    .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

  const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/profile');
  revalidatePath('/profile/edit');
  return { ok: true, message: 'Avatar removed.' };
}
