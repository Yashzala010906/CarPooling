'use client';

import { useAuthStore } from '@/stores';

/** Convenience hook wrapping the auth store; extend with login/logout actions. */
export function useAuth() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  return { user, isAuthenticated, logout: clearAuth };
}
