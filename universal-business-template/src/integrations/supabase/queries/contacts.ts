import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

type Contact = Database['public']['Tables']['contacts']['Row'] & {
  totalWorkItems?: number;
  totalInvoiced?: number;
};
type NewContact = Database['public']['Tables']['contacts']['Insert'];

export async function listContacts(
  supabase: SupabaseClient<Database>,
  filters?: { search?: string }
) {
  let query = supabase
    .from('contacts')
    .select('*, work_items(count)')
    .order('name');

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((c) => ({
    ...c,
    totalWorkItems: c.work_items?.[0]?.count || 0,
  })) as Contact[];
}

export async function getContact(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      work_items(*, invoices(*))
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createContact(
  supabase: SupabaseClient<Database>,
  contact: NewContact
) {
  const { data, error } = await supabase
    .from('contacts')
    .insert(contact)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContact(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Partial<NewContact>
) {
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
