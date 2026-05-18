import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/daily-report')({
  component: DailyReportForm,
})

function DailyReportForm() {
  const [form, setForm] = useState({
    project_name: '',
    date: new Date().toISOString().split('T')[0],
    materials_used: '',
    operations_done: '',
    equipment_used: false,
    equipment_duration: '',
    notes: '',
    images: '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const handleChange = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.project_name || !form.operations_done) return

    setStatus('saving')
    const { error } = await supabase.from('daily_reports').insert({
      project_name: form.project_name,
      date: form.date,
      materials_used: form.materials_used || null,
      operations_done: form.operations_done,
      equipment_used: form.equipment_used,
      equipment_duration: form.equipment_used ? form.equipment_duration : null,
      notes: form.notes || null,
      images: form.images || null,
    })

    setStatus(error ? 'error' : 'done')
    if (!error) {
      setForm({
        project_name: '',
        date: new Date().toISOString().split('T')[0],
        materials_used: '',
        operations_done: '',
        equipment_used: false,
        equipment_duration: '',
        notes: '',
        images: '',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Raport Zilnic</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nume Lucrare *</label>
          <input
            type="text"
            required
            value={form.project_name}
            onChange={e => handleChange('project_name', e.target.value)}
            className="w-full p-3 border rounded-lg text-base"
            placeholder="Ex: Montaj electric casă Popescu"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data</label>
          <input
            type="date"
            value={form.date}
            onChange={e => handleChange('date', e.target.value)}
            className="w-full p-3 border rounded-lg text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Operațiuni Efectuate *</label>
          <textarea
            required
            value={form.operations_done}
            onChange={e => handleChange('operations_done', e.target.value)}
            className="w-full p-3 border rounded-lg text-base min-h-[100px]"
            placeholder="Ex: Montat tablou electric, tras cabluri prize și întrerupătoare"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Materiale Folosite</label>
          <textarea
            value={form.materials_used}
            onChange={e => handleChange('materials_used', e.target.value)}
            className="w-full p-3 border rounded-lg text-base min-h-[80px]"
            placeholder="Ex: 100m cablu NYM 3x2.5, 10 prize, 5 întrerupătoare"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="equipment_used"
            checked={form.equipment_used}
            onChange={e => handleChange('equipment_used', e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="equipment_used" className="text-sm font-medium">
            S-au folosit utilaje
          </label>
        </div>

        {form.equipment_used && (
          <div>
            <label className="block text-sm font-medium mb-1">Durată Utilaje</label>
            <input
              type="text"
              value={form.equipment_duration}
              onChange={e => handleChange('equipment_duration', e.target.value)}
              className="w-full p-3 border rounded-lg text-base"
              placeholder="Ex: 3h 30m"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Observații</label>
          <textarea
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
            className="w-full p-3 border rounded-lg text-base min-h-[80px]"
            placeholder="Ex: S-a lucrat cu 2 muncitori, terminat mai devreme"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Link-uri Poze (separate prin virgulă)</label>
          <textarea
            value={form.images}
            onChange={e => handleChange('images', e.target.value)}
            className="w-full p-3 border rounded-lg text-base min-h-[60px]"
            placeholder="https://drive.google.com/..., https://..."
          />
        </div>

        <Button type="submit" disabled={status === 'saving'} className="w-full py-3 text-lg">
          {status === 'saving' ? 'Se salvează...' : 'Trimite Raportul'}
        </Button>

        {status === 'done' && (
          <p className="text-green-600 text-center font-medium">Raport salvat cu succes!</p>
        )}
        {status === 'error' && (
          <p className="text-red-600 text-center font-medium">Eroare la salvare. Încearcă din nou.</p>
        )}
      </form>
    </div>
  )
}
