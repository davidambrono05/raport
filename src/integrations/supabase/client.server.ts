import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required on server.'
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
