import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getWorkItem } from '@/integrations/supabase/queries/workItems';
import type { WorkItem, WorkItemStatus } from '@/modules/workItems/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Users, Wrench, Package, ClipboardList } from 'lucide-react';
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

  const currentStatusConfig = STATUSES.find(s => s.id === job.status);
  const availableTransitions = getAvailableTransitions(job.status);
  const materials = (job.materials_json || []) as any[];
  const operations = (job.operations_json || []) as any[];
  const materialsTotal = materials.reduce((s: number, m: any) => s + (m.quantity || 0) * (m.price_per_unit || 0), 0);
  const operationsTotal = operations.reduce((s: number, o: any) => s + (o.quantity || 0) * (o.price || 0), 0);

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
          {/* Detalii lucrare */}
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Detalii lucrare
            </h2>
            <div className="space-y-2 text-sm">
              {job.description && (
                <p className="text-muted-foreground">{job.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <span className="text-muted-foreground">Client: </span>
                  <span className="text-foreground">{job.contact?.name || 'Necunoscut'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Prioritate: </span>
                  <span className="text-foreground capitalize">{job.priority}</span>
                </div>
                {job.scheduled_start && (
                  <div>
                    <span className="text-muted-foreground">Data început: </span>
                    <span className="text-foreground">{new Date(job.scheduled_start).toLocaleDateString('ro-RO')}</span>
                  </div>
                )}
                {job.scheduled_end && (
                  <div>
                    <span className="text-muted-foreground">Data sfârșit: </span>
                    <span className="text-foreground">{new Date(job.scheduled_end).toLocaleDateString('ro-RO')}</span>
                  </div>
                )}
                {job.estimated_value != null && job.estimated_value > 0 && (
                  <div>
                    <span className="text-muted-foreground">Valoare estimată: </span>
                    <span className="text-foreground font-medium">{job.estimated_value.toFixed(2)} RON</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Adresă lucru */}
          {job.location_address && (
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresă lucru
              </h2>
              <p className="text-sm text-foreground">{job.location_address}</p>
            </div>
          )}

          {/* Materiale */}
          {materials.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materiale ({materials.length})
              </h2>
              <div className="space-y-1">
                {materials.map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <span>{m.material_name}</span>
                    <span className="text-muted-foreground">
                      {m.quantity} {m.unit} × {m.price_per_unit?.toFixed(2)} RON = <strong>{((m.quantity || 0) * (m.price_per_unit || 0)).toFixed(2)} RON</strong>
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total materiale:</span>
                  <span>{materialsTotal.toFixed(2)} RON</span>
                </div>
              </div>
            </div>
          )}

          {/* Operații */}
          {operations.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Operații ({operations.length})
              </h2>
              <div className="space-y-1">
                {operations.map((o: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <span>{o.operation_name}</span>
                    <span className="text-muted-foreground">
                      {o.quantity} buc × {o.price?.toFixed(2)} RON = <strong>{((o.quantity || 0) * (o.price || 0)).toFixed(2)} RON</strong>
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total operații:</span>
                  <span>{operationsTotal.toFixed(2)} RON</span>
                </div>
              </div>
            </div>
          )}

          {/* Observații */}
          {job.notes && (
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-2">Observații</h2>
              <p className="text-sm text-foreground whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}

          {/* Istoric status */}
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

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
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
                {availableTransitions.map(t => (
                  <Button
                    key={t}
                    onClick={() => handleStatusChange(t)}
                    className="w-full"
                    variant="outline"
                  >
                    {STATUSES.find(s => s.id === t)?.label || t}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Echipă */}
          {(job.team_lead_name || job.team_member_ids?.length > 0) && (
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Echipă
              </h2>
              <div className="space-y-2 text-sm">
                {job.team_lead_name && (
                  <div>
                    <span className="text-muted-foreground">Șef echipă: </span>
                    <span className="text-foreground">{job.team_lead_name}</span>
                  </div>
                )}
                {job.team_member_ids?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Membri: </span>
                    <span className="text-foreground">{job.team_member_ids.length} persoane</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total */}
          {(materialsTotal > 0 || operationsTotal > 0) && (
            <div className="rounded-lg border p-4 bg-muted">
              <h2 className="font-semibold mb-2">Costuri</h2>
              <div className="space-y-1 text-sm">
                {materialsTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Materiale:</span>
                    <span>{materialsTotal.toFixed(2)} RON</span>
                  </div>
                )}
                {operationsTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operații:</span>
                    <span>{operationsTotal.toFixed(2)} RON</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span>{(materialsTotal + operationsTotal).toFixed(2)} RON</span>
                </div>
              </div>
            </div>
          )}

          {/* Poze */}
          {job.work_item_files?.length > 0 && (
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-2">Poze</h2>
              <div className="grid grid-cols-2 gap-2">
                {job.work_item_files.map(f => (
                  <a
                    key={f.id}
                    href={f.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={f.file_url}
                      alt={f.file_name || 'Poza lucrare'}
                      className="w-full h-20 object-cover rounded border"
                    />
                  </a>
                ))}
              </div>
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
