import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createWorkItem } from '@/integrations/supabase/queries/workItems';
import type { Contact } from '@/modules/crm/types';
import type { Material, Operation, WorkItemMaterial, WorkItemOperation } from '@/modules/workItems/types';
import { Button } from './ui/button';
import { X, Plus, Trash2, MapPin } from 'lucide-react';
import { listContacts } from '@/integrations/supabase/queries/contacts';
import { listTeams } from '@/integrations/supabase/queries/teams';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TeamOption {
  id: string;
  name: string;
  members: { id: string; display_name: string; role: string }[];
}

export function CreateJobDialog({ open, onClose, onSuccess }: Props) {
  const [clients, setClients] = useState<Contact[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    contact_id: '',
    location_address: '',
    location_lat: null as number | null,
    location_lng: null as number | null,
    scheduled_start: '',
    scheduled_end: '',
    estimated_value: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    team_lead_id: '',
    team_member_ids: [] as string[],
    notes: '',
  });

  const [selectedMaterials, setSelectedMaterials] = useState<WorkItemMaterial[]>([]);
  const [selectedOperations, setSelectedOperations] = useState<WorkItemOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Searchable select states
  const [materialSearch, setMaterialSearch] = useState('');
  const [operationSearch, setOperationSearch] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [showOperationDropdown, setShowOperationDropdown] = useState(false);
  const materialRef = useRef<HTMLDivElement>(null);
  const operationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setLoadingData(true);
      Promise.all([
        listContacts(supabase, ''),
        listTeams(supabase, ''),
        supabase.from('materials').select('*').eq('active', true).order('name'),
        supabase.from('operations').select('*').eq('active', true).order('name'),
      ]).then(([contactsRes, teamsRes, materialsRes, operationsRes]) => {
        setClients(contactsRes as Contact[]);
        setTeams((teamsRes || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          members: (t.team_members || []).map((m: any) => ({
            id: m.profile?.id || m.id,
            display_name: m.profile?.display_name || 'Necunoscut',
            role: m.profile?.role || '',
          })),
        })));
        setMaterials((materialsRes.data || []) as Material[]);
        setOperations((operationsRes.data || []) as Operation[]);
      }).finally(() => setLoadingData(false));
    }
  }, [open]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (materialRef.current && !materialRef.current.contains(e.target as Node)) {
        setShowMaterialDropdown(false);
      }
      if (operationRef.current && !operationRef.current.contains(e.target as Node)) {
        setShowOperationDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function addMaterial(material: Material) {
    if (selectedMaterials.find(m => m.material_id === material.id)) return;
    setSelectedMaterials(prev => [...prev, {
      material_id: material.id,
      material_name: material.name,
      quantity: 1,
      unit: material.unit,
      price_per_unit: material.price_per_unit,
    }]);
    setMaterialSearch('');
    setShowMaterialDropdown(false);
  }

  function updateMaterialQty(index: number, qty: number) {
    setSelectedMaterials(prev => prev.map((m, i) => i === index ? { ...m, quantity: qty } : m));
  }

  function removeMaterial(index: number) {
    setSelectedMaterials(prev => prev.filter((_, i) => i !== index));
  }

  function addOperation(operation: Operation) {
    if (selectedOperations.find(o => o.operation_id === operation.id)) return;
    setSelectedOperations(prev => [...prev, {
      operation_id: operation.id,
      operation_name: operation.name,
      quantity: 1,
      price: operation.default_price,
    }]);
    setOperationSearch('');
    setShowOperationDropdown(false);
  }

  function updateOperationQty(index: number, qty: number) {
    setSelectedOperations(prev => prev.map((o, i) => i === index ? { ...o, quantity: qty } : o));
  }

  function removeOperation(index: number) {
    setSelectedOperations(prev => prev.filter((_, i) => i !== index));
  }

  function toggleTeamMember(memberId: string) {
    setForm(f => ({
      ...f,
      team_member_ids: f.team_member_ids.includes(memberId)
        ? f.team_member_ids.filter(id => id !== memberId)
        : [...f.team_member_ids, memberId],
    }));
  }

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(materialSearch.toLowerCase())
  );

  const filteredOperations = operations.filter(o =>
    o.name.toLowerCase().includes(operationSearch.toLowerCase()) ||
    o.category.toLowerCase().includes(operationSearch.toLowerCase())
  );

  const materialsTotal = selectedMaterials.reduce((s, m) => s + m.quantity * m.price_per_unit, 0);
  const operationsTotal = selectedOperations.reduce((s, o) => s + o.quantity * o.price, 0);
  const grandTotal = materialsTotal + operationsTotal;

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
        scheduled_start: form.scheduled_start || null,
        scheduled_end: form.scheduled_end || null,
        estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : grandTotal || null,
        priority: form.priority,
        status: 'new',
        tenant_id: '',
        location_address: form.location_address || null,
        location_lat: form.location_lat,
        location_lng: form.location_lng,
        team_lead_id: form.team_lead_id || null,
        team_member_ids: form.team_member_ids.length > 0 ? form.team_member_ids : [],
        materials_json: selectedMaterials as any,
        operations_json: selectedOperations as any,
        notes: form.notes || null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <div className="mx-4 w-full max-w-2xl rounded-lg bg-background p-6 shadow-lg">
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

        {loadingData ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Se încarcă...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
            {/* Informații lucrare */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Informații lucrare</h3>

              <div>
                <label className="text-sm font-medium">Denumire lucrare *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Ex: Instalație electrică apartament"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Client *</label>
                <select
                  required
                  value={form.contact_id}
                  onChange={(e) => setForm(f => ({ ...f, contact_id: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selectează client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Adresă lucru</label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.location_address}
                    onChange={(e) => setForm(f => ({ ...f, location_address: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Strada, număr, oraș..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Descriere</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Descrierea lucrării..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data început</label>
                  <input
                    type="date"
                    value={form.scheduled_start}
                    onChange={(e) => setForm(f => ({ ...f, scheduled_start: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data sfârșit</label>
                  <input
                    type="date"
                    value={form.scheduled_end}
                    onChange={(e) => setForm(f => ({ ...f, scheduled_end: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valoare estimată (RON)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.estimated_value}
                    onChange={(e) => setForm(f => ({ ...f, estimated_value: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Prioritate</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as typeof form.priority }))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="low">Scăzută</option>
                    <option value="medium">Medie</option>
                    <option value="high">Ridicată</option>
                    <option value="urgent">Urgentă</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Informații echipă */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Informații echipă</h3>

              <div>
                <label className="text-sm font-medium">Șef echipă</label>
                <select
                  value={form.team_lead_id}
                  onChange={(e) => setForm(f => ({ ...f, team_lead_id: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selectează șef echipă...</option>
                  {teams.flatMap(t => t.members).filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i).map(m => (
                    <option key={m.id} value={m.id}>{m.display_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Membri echipă</label>
                <div className="mt-1 space-y-2 max-h-32 overflow-y-auto rounded-md border border-input p-2">
                  {teams.flatMap(t => t.members).filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i).map(m => (
                    <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-2 py-1">
                      <input
                        type="checkbox"
                        checked={form.team_member_ids.includes(m.id)}
                        onChange={() => toggleTeamMember(m.id)}
                        className="rounded"
                      />
                      <span>{m.display_name}</span>
                      <span className="text-xs text-muted-foreground">({m.role})</span>
                    </label>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">Nicio echipă configurată.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Materiale și Operații */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Materiale și Operații</h3>

              {/* Materials searchable select */}
              <div ref={materialRef} className="relative">
                <label className="text-sm font-medium">Materiale folosite</label>
                <div className="mt-1 relative">
                  <input
                    value={materialSearch}
                    onChange={(e) => { setMaterialSearch(e.target.value); setShowMaterialDropdown(true); }}
                    onFocus={() => setShowMaterialDropdown(true)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Caută material..."
                  />
                  {showMaterialDropdown && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-background shadow-lg max-h-40 overflow-y-auto">
                      {filteredMaterials.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">Niciun material găsit</p>
                      ) : (
                        filteredMaterials.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => addMaterial(m)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between"
                          >
                            <span>{m.name}</span>
                            <span className="text-muted-foreground">{m.price_per_unit.toFixed(2)} RON/{m.unit}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedMaterials.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedMaterials.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 rounded border px-2 py-1 text-sm">
                        <span className="flex-1">{m.material_name}</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={m.quantity}
                          onChange={(e) => updateMaterialQty(i, parseFloat(e.target.value) || 0)}
                          className="w-16 rounded border px-1 py-0.5 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">{m.unit}</span>
                        <span className="text-xs font-medium">{(m.quantity * m.price_per_unit).toFixed(2)} RON</span>
                        <button type="button" onClick={() => removeMaterial(i)} className="text-destructive hover:opacity-80">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs font-medium text-right">Total materiale: {materialsTotal.toFixed(2)} RON</p>
                  </div>
                )}
              </div>

              {/* Operations searchable select */}
              <div ref={operationRef} className="relative">
                <label className="text-sm font-medium">Operații</label>
                <div className="mt-1 relative">
                  <input
                    value={operationSearch}
                    onChange={(e) => { setOperationSearch(e.target.value); setShowOperationDropdown(true); }}
                    onFocus={() => setShowOperationDropdown(true)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Caută operație..."
                  />
                  {showOperationDropdown && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-background shadow-lg max-h-40 overflow-y-auto">
                      {filteredOperations.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">Nicio operație găsită</p>
                      ) : (
                        filteredOperations.map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => addOperation(o)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between"
                          >
                            <span>{o.name}</span>
                            <span className="text-muted-foreground">{o.default_price.toFixed(2)} RON</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedOperations.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedOperations.map((o, i) => (
                      <div key={i} className="flex items-center gap-2 rounded border px-2 py-1 text-sm">
                        <span className="flex-1">{o.operation_name}</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={o.quantity}
                          onChange={(e) => updateOperationQty(i, parseInt(e.target.value) || 1)}
                          className="w-16 rounded border px-1 py-0.5 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">buc</span>
                        <span className="text-xs font-medium">{(o.quantity * o.price).toFixed(2)} RON</span>
                        <button type="button" onClick={() => removeOperation(i)} className="text-destructive hover:opacity-80">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs font-medium text-right">Total operații: {operationsTotal.toFixed(2)} RON</p>
                  </div>
                )}
              </div>

              {grandTotal > 0 && (
                <div className="rounded-md bg-muted p-3 text-sm flex justify-between font-semibold">
                  <span>Total general:</span>
                  <span>{grandTotal.toFixed(2)} RON</span>
                </div>
              )}
            </div>

            {/* Observații */}
            <div>
              <label className="text-sm font-medium">Observații</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Observații despre lucrare..."
              />
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
        )}
      </div>
    </div>
  );
}
