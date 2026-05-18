import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Tenant = Database['public']['Tables']['tenants']['Row'];

export async function getProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<(Profile & { tenant: Tenant | null }) | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      tenant:tenants(*)
    `)
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as Profile & { tenant: Tenant | null };
}

export async function getTenantConfig(
  supabase: SupabaseClient<Database>,
  tenantId: string
): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error || !data) return null;
  return data;
}
