import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

type Team = Database['public']['Tables']['teams']['Row'] & {
  members?: (Database['public']['Tables']['team_members']['Row'] & {
    profile?: Database['public']['Tables']['profiles']['Row'];
  })[];
};
type NewTeam = Database['public']['Tables']['teams']['Insert'];

export async function listTeams(
  supabase: SupabaseClient<Database>
) {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members(
        *,
        profile:profiles(display_name, role, avatar_url)
      ),
      work_items(count)
    `)
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

export async function addTeamMember(
  supabase: SupabaseClient<Database>,
  teamId: string,
  userId: string,
  role: string = 'member'
) {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
      role,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
