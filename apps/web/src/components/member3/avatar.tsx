import { cn } from '@carpool/ui';

import type { ProfileRow } from '@/lib/supabase/database.types';
import { initials } from '@/lib/member3/types';

/**
 * Small user avatar. Uses the profile photo when present, otherwise a
 * deterministic initials chip. No next/image so it works with arbitrary
 * Supabase storage / gravatar hosts without remote-image config.
 */
export function Avatar({
  profile,
  className,
}: {
  profile?: Pick<ProfileRow, 'first_name' | 'last_name' | 'avatar_url'> | null;
  className?: string;
}) {
  const base = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary',
    className,
  );
  if (profile?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatar_url} alt="" className={cn(base, 'object-cover')} />;
  }
  return <span className={base}>{initials(profile)}</span>;
}
