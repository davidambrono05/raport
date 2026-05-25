import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

type WorkItem = Database['public']['Tables']['work_items']['Row'] & {
  contact?: Database['public']['Tables']['contacts']['Row'];
  team?: Database['public']['Tables']['teams']['Row'];
};
type NewWorkItem = Database['public']['Tables']['work_items']['Insert'];

export async function listWorkItems(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  filters?: { status?: string; teamId?: string }
) {
  let query = supabase
    .from('work_items')
    .select(`
      *,
      contact:contacts(*),
      team:teams(*)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.teamId) query = query.eq('team_id', filters.teamId);

  const { data, error } = await query;
  if (error) throw error;
  return data as WorkItem[];
}

export async function getWorkItem(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string
) {
  const { data, error } = await supabase
    .from('work_items')
    .select(`
      *,
      contact:contacts(*),
      team:teams(*)
    `)
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as WorkItem;
}

export async function createWorkItem(
  supabase: SupabaseClient<Database>,
  item: NewWorkItem
) {
  const { data, error } = await supabase
    .from('work_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkItemStatus(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  workItemId: string,
  newStatus: string
) {
  const { data, error } = await supabase
    .from('work_items')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', workItemId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
