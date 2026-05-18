import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  contact?: Database['public']['Tables']['contacts']['Row'];
  work_item?: Database['public']['Tables']['work_items']['Row'];
};
type Payment = Database['public']['Tables']['payments']['Row'];

export async function listInvoices(
  supabase: SupabaseClient<Database>,
  filters?: { status?: string }
) {
  let query = supabase
    .from('invoices')
    .select(`
      *,
      contact:contacts(name, phone, email),
      work_item:work_items(title)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data as Invoice[];
}

export async function getDashboardStats(
  supabase: SupabaseClient<Database>
) {
  const { data, error } = await supabase.rpc('get_tenant_dashboard_stats');
  if (error) throw error;
  return data?.[0] as {
    active_work_items: number;
    revenue_this_month: number;
    outstanding_amount: number;
    overdue_invoices: number;
    urgent_work_items: number;
    contacts_total: number;
    generated_at: string;
  } | undefined;
}

export async function recordPayment(
  supabase: SupabaseClient<Database>,
  invoiceId: string,
  amount: number,
  method: string = 'bank_transfer',
  recordedBy: string
) {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      amount,
      method: method as Database['public']['Enums']['payment_method'],
      recorded_by: recordedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
