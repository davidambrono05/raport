import { supabase } from '../client';
import type { Client } from '../../modules/crm/types';

export async function getClients(tenantId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone, email, address, vat_code, notes, created_at')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error) throw error;

  return data.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    address: r.address ?? undefined,
    vatCode: r.vat_code ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: new Date(r.created_at),
  }));
}

export async function getClientById(tenantId: string, clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone, email, address, vat_code, notes, created_at')
    .eq('tenant_id', tenantId)
    .eq('id', clientId)
    .single();

  if (error) return null;

  return {
    id: data.id,
    name: data.name,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    address: data.address ?? undefined,
    vatCode: data.vat_code ?? undefined,
    notes: data.notes ?? undefined,
    createdAt: new Date(data.created_at),
  };
}

export async function upsertClient(tenantId: string, client: Omit<Client, 'createdAt'>): Promise<void> {
  const { error } = await supabase.from('clients').upsert({
    id: client.id,
    tenant_id: tenantId,
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address,
    vat_code: client.vatCode,
    notes: client.notes,
  });
  if (error) throw error;
}
