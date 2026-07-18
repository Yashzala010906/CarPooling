'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './database.types';
import { getSupabaseConfig } from './config';

/**
 * Browser-side Supabase client (uses the public anon key). Safe to import in
 * Client Components. Realtime subscriptions and client-side reads go through it;
 * RLS enforces authorization.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient<Database>(url, anonKey);
}
