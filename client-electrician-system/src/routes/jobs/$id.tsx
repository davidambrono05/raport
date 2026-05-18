import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getWorkItem } from '@/integrations/supabase/queries/workItems';
import type { WorkItem, WorkItemStatus } from '@/modules/workItems/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Upload, CheckCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const STATUSES: WorkItemStatus[] = [
  { id: 'new', label: 'Nou', color: '#64748b' },
  { id: 'scheduled', label: 'Programat', color: '#2563eb' },
  { id: 'in_progress', label: 'În execuție', color: '#d97706' },
  { id: 'completed', label: 'Finalizat', color: '#16a34a', isFinal: true },
  { id: 'cancelled', label: 'Anulat', color: '#ef4444', isFinal: true },
];

export const Route = createFileRoute('/jobs/$id')({
  component: JobDetail,
});

function JobDetail() {
  const { id } = Route.useParams();

  const { data: job, isLoading, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const result = await getWorkItem(supabase, '', id);
      return result as unknown as WorkItem & {
        work_item_status_history: { from_status: string; to_status: string; note: string; changed_at: string }[];
        work_item_files: { id: string; file_url: string; file_name: string }[];
      };
    },
  });

  async function handleStatusChange(newStatus: string) {
    if (!job) return;
    try {
      await supabase.rpc('update_work_item_status', {
        p_work_item_id: job.id,
        p_new_status: newStatus,
        p_changed_by: (await supabase.auth.getUser())?.data?.user?.id || null,
        p_note: null,
      });
      refetch();
    } catch (err) {
      alert('Eroare la actualizare status: ' + (err instanceof Error ? err.message : ''));
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-6">
        <p className="text-destructive">Lucrarea nu a fost găsită.</p>
      </div>
    );
  }

  const currentStatusConfig = STATUSES.find((s) => s.id === job.status);
  const availableTransitions = getAvailableTransitions(job.status);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/jobs">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-2">Detalii lucrare</h2>
            <p className="text-sm text-muted-foreground mb-1">
              {job.description || 'Fără descriere'}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
              <div>
                <span className="text-muted-foreground">Client:</span>{' '}
                <span className="text-foreground">{job.contact?.name || 'Necunoscut'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Echipa:</span>{' '}
                <span className="text-foreground">{job.team?.name || 'Nepartită'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Valoare estimată:</span>{' '}
                <span className="text-foreground">
                  {job.estimated_value?.toFixed(2) || '0.00'} RON
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Prioritate:</span>{' '}
                <span className="text-foreground">{job.priority}</span>
              </div>
            </div>
          </div>

          {job.work_item_status_history?.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-2">Istoric status</h2>
              <ul className="space-y-2">
                {job.work_item_status_history.map((h, i) => (
                  <li key={i} className="text-sm">
                    <span className="text-muted-foreground">
                      {new Date(h.changed_at).toLocaleString('ro-RO')}
                    </span>{' '}
                    <span className="text-foreground">
                      {h.from_status} → {h.to_status}
                    </span>
                    {h.note && <span className="text-muted-foreground"> — {h.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3">Status</h2>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
              style={{
                backgroundColor: currentStatusConfig?.color + '18' || '#gray',
                color: currentStatusConfig?.color || '#666',
              }}
            >
              {currentStatusConfig?.label || job.status}
            </div>

            {availableTransitions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Schimbă status:</p>
                {availableTransitions.map((t) => (
                  <Button
                    key={t}
                    onClick={() => handleStatusChange(t)}
                    className="w-full"
                    variant="outline"
                  >
                    {STATUSES.find((s) => s.id === t)?.label || t}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {job.work_item_files?.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-2">Poze încărcate</h2>
              <ul className="space-y-2">
                {job.work_item_files.map((f) => (
                  <li key={f.id}>
                    <a
                      href={f.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {f.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getAvailableTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    new: ['scheduled', 'cancelled'],
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  return transitions[currentStatus] || [];
}
