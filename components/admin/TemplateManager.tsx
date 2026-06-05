'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertTemplate, deleteTemplate } from '@/lib/actions/templates'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export interface TemplateRow {
  id: string
  employee_id: string
  day_of_week: number
  start_time: string   // "HH:MM:SS"
  end_time: string     // "HH:MM:SS"
  notes: string | null
}

export interface EmployeeOption {
  id: string
  name: string
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function fmt12(time: string) {
  // "HH:MM:SS" → "9:00 AM"
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

function toHHMM(time: string) {
  // "HH:MM:SS" → "HH:MM"
  return time.slice(0, 5)
}

// ── per-day row modal ─────────────────────────────────────────────────────────

interface EditState {
  employeeId: string
  employeeName: string
  dayOfWeek: number
  templateId?: string
  startTime: string
  endTime: string
  notes: string
}

function DayModal({ state, onClose }: { state: EditState; onClose: () => void }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSave] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const startTime = form.get('startTime') as string
    const endTime = form.get('endTime') as string
    const notes = (form.get('notes') as string) || undefined

    if (!startTime || !endTime) { setError('Both times are required.'); return }
    if (endTime <= startTime) { setError('End must be after start.'); return }

    setError(null)
    startSave(async () => {
      const result = await upsertTemplate({
        employeeId: state.employeeId,
        dayOfWeek: state.dayOfWeek,
        startTime,
        endTime,
        notes,
      })
      if (result.success) { router.refresh(); onClose() }
      else setError(result.error ?? 'Failed to save')
    })
  }

  function handleDelete() {
    if (!state.templateId) return
    startDelete(async () => {
      const result = await deleteTemplate(state.templateId!)
      if (result.success) { router.refresh(); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6 pb-8 sm:pb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-base font-semibold text-stone-900">
              {DAY_FULL[state.dayOfWeek - 1]}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">{state.employeeName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Start</label>
              <input
                type="time"
                name="startTime"
                defaultValue={state.startTime}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">End</label>
              <input
                type="time"
                name="endTime"
                defaultValue={state.endTime}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Notes (optional)</label>
            <input
              type="text"
              name="notes"
              defaultValue={state.notes}
              placeholder="e.g. Opening shift"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
            {state.templateId && (
              <Button
                type="button"
                variant="danger"
                className="w-full"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Removing…' : 'Remove this day'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
  employees: EmployeeOption[]
  templates: TemplateRow[]
}

export default function TemplateManager({ employees, templates }: Props) {
  const [editState, setEditState] = useState<EditState | null>(null)

  // Index templates by employee_id → day_of_week for fast lookup
  const byEmployee: Record<string, Record<number, TemplateRow>> = {}
  for (const t of templates) {
    if (!byEmployee[t.employee_id]) byEmployee[t.employee_id] = {}
    byEmployee[t.employee_id][t.day_of_week] = t
  }

  function openEdit(emp: EmployeeOption, day: number) {
    const existing = byEmployee[emp.id]?.[day]
    setEditState({
      employeeId: emp.id,
      employeeName: emp.name,
      dayOfWeek: day,
      templateId: existing?.id,
      startTime: existing ? toHHMM(existing.start_time) : '',
      endTime: existing ? toHHMM(existing.end_time) : '',
      notes: existing?.notes ?? '',
    })
  }

  if (employees.length === 0) {
    return <p className="text-sm text-stone-400 py-8 text-center">No employees yet.</p>
  }

  return (
    <>
      <div className="space-y-4">
        {employees.map(emp => {
          const empMap = byEmployee[emp.id] ?? {}
          const hasAny = Object.keys(empMap).length > 0

          return (
            <Card key={emp.id} className="overflow-hidden">
              {/* Employee header */}
              <div className="px-4 py-3.5 border-b border-stone-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-900">{emp.name}</p>
                {!hasAny && (
                  <span className="text-xs text-stone-400">No pattern set</span>
                )}
              </div>

              {/* Days */}
              <div className="divide-y divide-stone-50">
                {[1, 2, 3, 4, 5, 6, 7].map(day => {
                  const t = empMap[day]
                  return (
                    <button
                      key={day}
                      onClick={() => openEdit(emp, day)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-stone-50 active:bg-stone-100 transition-colors"
                    >
                      <span className="text-xs font-bold text-stone-400 uppercase w-8 shrink-0">
                        {DAY_NAMES[day - 1]}
                      </span>
                      {t ? (
                        <>
                          <span className="flex-1 text-sm font-medium text-stone-800">
                            {fmt12(t.start_time)} – {fmt12(t.end_time)}
                          </span>
                          {t.notes && (
                            <span className="text-xs text-stone-400 truncate max-w-[100px]">{t.notes}</span>
                          )}
                          <svg className="text-stone-300 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      ) : (
                        <span className="flex-1 text-sm text-stone-300">Off — tap to add</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {editState && (
        <DayModal state={editState} onClose={() => setEditState(null)} />
      )}
    </>
  )
}
