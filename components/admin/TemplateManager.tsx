'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertTemplate, deleteTemplate } from '@/lib/actions/templates'
import Button from '@/components/ui/Button'
import TimeSelect from '@/components/ui/TimeSelect'
import Input from '@/components/ui/Input'

export interface TemplateRow {
  id: string
  employee_id: string
  day_of_week: number
  start_time: string
  end_time: string
  notes: string | null
}

export interface EmployeeOption {
  id: string
  name: string
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

function toHHMM(time: string) {
  return time.slice(0, 5)
}

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
    <div className="animate-fade-in fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="animate-sheet-up sm:animate-float-in bg-[#f9f4ea] rounded-t-2xl sm:rounded-2xl [box-shadow:var(--shadow-xl)] w-full sm:max-w-sm p-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-6">
        <div className="w-10 h-1 bg-[#d3c9b2] rounded-full mx-auto mb-5 sm:hidden" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-base font-semibold text-label-1 tracking-[-0.01em]">
              {DAY_FULL[state.dayOfWeek - 1]}
            </p>
            <p className="text-xs text-label-3 mt-0.5 tracking-[-0.01em]">{state.employeeName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-label-3 hover:bg-[#eae3d3] hover:text-label-2 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TimeSelect label="Start" name="startTime" defaultValue={state.startTime} required />
            <TimeSelect label="End"   name="endTime"   defaultValue={state.endTime}   required />
          </div>

          <Input
            label="Notes (optional)"
            name="notes"
            type="text"
            defaultValue={state.notes}
            placeholder="e.g. Opening shift"
          />

          {error && <p className="text-sm text-red-500 tracking-[-0.01em]">{error}</p>}

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

interface Props {
  employees: EmployeeOption[]
  templates: TemplateRow[]
}

export default function TemplateManager({ employees, templates }: Props) {
  const [editState, setEditState] = useState<EditState | null>(null)

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
    return <p className="text-sm text-label-3 py-8 text-center tracking-[-0.01em]">No employees yet.</p>
  }

  return (
    <>
      <div className="space-y-4">
        {employees.map(emp => {
          const empMap = byEmployee[emp.id] ?? {}
          const hasAny = Object.keys(empMap).length > 0

          return (
            <div key={emp.id} className="rounded-xl border border-[#d3c9b2] overflow-hidden [box-shadow:var(--shadow-sm)]">
              {/* Employee header */}
              <div className="px-4 py-3.5 bg-[#f4efe6] border-b border-[#d3c9b2] flex items-center justify-between">
                <p className="text-sm font-semibold text-label-1 tracking-[-0.01em]">{emp.name}</p>
                {!hasAny && (
                  <span className="text-xs text-label-3 tracking-[-0.01em]">No pattern set</span>
                )}
              </div>

              {/* Days */}
              <div className="divide-y divide-[#eae3d3]">
                {[7, 1, 2, 3, 4, 5, 6].map(day => {
                  const t = empMap[day]
                  return (
                    <button
                      key={day}
                      onClick={() => openEdit(emp, day)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 text-left bg-[#f9f4ea] hover:bg-[#f2ece2] active:bg-[#eae3d3] transition-colors"
                    >
                      <span className="text-xs font-bold text-label-4 uppercase w-8 shrink-0 tracking-widest">
                        {DAY_NAMES[day - 1]}
                      </span>
                      {t ? (
                        <>
                          <span className="flex-1 text-sm font-medium text-label-1 tracking-[-0.01em]">
                            {fmt12(t.start_time)} – {fmt12(t.end_time)}
                          </span>
                          {t.notes && (
                            <span className="text-xs text-label-3 truncate max-w-[100px] tracking-[-0.01em]">{t.notes}</span>
                          )}
                          <svg className="text-label-4 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      ) : (
                        <span className="flex-1 text-sm text-label-4 tracking-[-0.01em]">Off — tap to add</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {editState && (
        <DayModal state={editState} onClose={() => setEditState(null)} />
      )}
    </>
  )
}
