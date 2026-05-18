import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

type Team = Database['public']['Tables']['teams']['Row'] & {
  members?: (Database['public']['Tables']['team_members']['Row'] & {
    profile?: Database['public']['Tables']['profiles']['Row'];
  })[];
};
type NewTeam = Database['public']['Tables']['teams']['Insert'];

export async function listTeams(
  supabase: SupabaseClient<Database>,
  tenantId: string
) {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members(
        *,
        profile:profiles(display_name, role, avatar_url)
      )
    `)
    .eq('tenant_id', tenantId)
    .order('name');

  if (error) throw error;
  return (data || []) as Team[];
}

export async function createTeam(
  supabase: SupabaseClient<Database>,
  team: NewTeam
) {
  const { data, error } = await supabase
    .from('teams')
    .insert(team)
    .select()
    .single();

  if (error) throw error;
  return data;
}
