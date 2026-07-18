import 'server-only';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getCurrentUser } from '@/lib/supabase/server';

/**
 * Page-level auth snapshot used to pick between the not-configured notice,
 * the sign-in prompt, and the real content — without throwing during SSR.
 */
export async function getAuthState(): Promise<
  { configured: false; userId: null } | { configured: true; userId: string | null }
> {
  if (!isSupabaseConfigured()) return { configured: false, userId: null };
  const user = await getCurrentUser();
  return { configured: true, userId: user?.id ?? null };
}
