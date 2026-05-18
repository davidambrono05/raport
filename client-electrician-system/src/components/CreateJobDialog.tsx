import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createWorkItem } from '@/integrations/supabase/queries/workItems';
import type { Contact } from '@/modules/crm/types';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { listContacts } from '@/integrations/supabase/queries/contacts';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateJobDialog({ open, onClose, onSuccess }: Props) {
  const [clients, setClients] = useState<Contact[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    contact_id: '',
    scheduled_date: '',
    estimated_value: '',
    priority: 'low' as 'low' | 'medium' | 'high' | 'urgent',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (open && clients.length === 0 && !loadingClients) {
    setLoadingClients(true);
    listContacts(supabase, '')
      .then((data) => setClients(data as Contact[]))
      .finally(() => setLoadingClients(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.contact_id) return;
    setLoading(true);
    setError('');

    try {
      await createWorkItem(supabase, {
        title: form.title,
        description: form.description || null,
        contact_id: form.contact_id,
        scheduled_start: form.scheduled_date || null,
        estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
        priority: form.priority,
        status: 'new',
        type: 'Instalatie',
        tenant_id: '',
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lucrare nouă</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Denumire lucrare *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex: Instalație electrică apartament"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Client *</label>
            <select
              required
              value={form.contact_id}
              onChange={(e) => setForm((f) => ({ ...f, contact_id: e.target.value }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selectează client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Descriere</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="Descrierea lucrării..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Data programată</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Valoare estimată (RON)</label>
              <input
                type="number"
                step="0.01"
                value={form.estimated_value}
                onChange={(e) => setForm((f) => ({ ...f, estimated_value: e.target.value }))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Prioritate</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as typeof form.priority }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="low">Scăzută</option>
              <option value="medium">Medie</option>
              <option value="high">Ridicată</option>
              <option value="urgent">Urgentă</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Anulează
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Se salvează...' : 'Salvează'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
