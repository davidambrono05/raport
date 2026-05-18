import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

type WorkItem = Database['public']['Tables']['work_items']['Row'] & {
  contact?: Database['public']['Tables']['contacts']['Row'];
  team?: Database['public']['Tables']['teams']['Row'];
};
type NewWorkItem = Database['public']['Tables']['work_items']['Insert'];
type WorkItemStatus = Database['public']['Enums']['work_item_status'] | string;

export async function listWorkItems(
  supabase: SupabaseClient<Database>,
  filters?: { status?: string; teamId?: string }
) {
  let query = supabase
    .from('work_items')
    .select(`
      *,
      contact:contacts(*),
      team:teams(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.teamId) query = query.eq('team_id', filters.teamId);

  const { data, error } = await query;
  if (error) throw error;
  return data as WorkItem[];
}

export async function getWorkItem(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { data, error } = await supabase
    .from('work_items')
    .select(`
      *,
      contact:contacts(*),
      team:teams(*),
      work_item_status_history(*),
      work_item_files(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as WorkItem & {
    work_item_status_history: Database['public']['Tables']['work_item_status_history']['Row'][];
    work_item_files: Database['public']['Tables']['work_item_files']['Row'][];
  };
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
  workItemId: string,
  newStatus: string,
  changedBy: string,
  note?: string
) {
  const { data, error } = await supabase.rpc('update_work_item_status', {
    p_work_item_id: workItemId,
    p_new_status: newStatus,
    p_changed_by: changedBy,
    p_note: note ?? null,
  });

  if (error) throw error;
  return data;
}
