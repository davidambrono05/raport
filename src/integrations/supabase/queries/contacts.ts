import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

type Contact = Database['public']['Tables']['contacts']['Row'];
type NewContact = Database['public']['Tables']['contacts']['Insert'];

export async function listContacts(
  supabase: SupabaseClient<Database>,
  tenantId: string
) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw error;
  return data as Contact[];
}

export async function getContactById(
  supabase: SupabaseClient<Database>,
  contactId: string
) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();
  if (error) return null;
  return data as Contact;
}

export async function upsertContact(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  contact: NewContact
) {
  const { error } = await supabase.from('contacts').upsert({
    ...contact,
    tenant_id: tenantId,
  });
  if (error) throw error;
}
