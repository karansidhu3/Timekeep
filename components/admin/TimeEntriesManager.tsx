'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { adminCreateTimeEntry, adminUpdateTimeEntry } from '@/lib/actions/time-entries'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import TimeSelect from '@/components/ui/TimeSelect'
import Card from '@/components/ui/Card'
import { formatDuration, calcDurationMinutes } from '@/lib/utils'

export interface TimeEntryRow {
  id: string
  clock_in: string
  clock_out: string | null
  notes: string | null
  employee_id: string
  employee_name: string
}

export interface EmployeeOption {
  id: string
  name: string
}

// ── helpers ───────────────────────────────────────────────────────────────────

function toLocalDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toLocalTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── shared modal ──────────────────────────────────────────────────────────────

interface ModalProps {
  mode: 'add' | 'edit'
  employees: EmployeeOption[]
  entry?: TimeEntryRow
  onClose: () => void
}

function TimeEntryModal({ mode, employees, entry, onClose }: ModalProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const defaultDate = entry ? toLocalDate(entry.clock_in) : toLocalDate(new Date().toISOString())
  const defaultStart = entry ? toLocalTime(entry.clock_in) : ''
  const defaultEnd = entry?.clock_out ? toLocalTime(entry.clock_out) : ''

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError(null)

    const employeeId = mode === 'edit' ? entry!.employee_id : form.get('employeeId') as string
    const date = form.get('date') as string
    const startTime = form.get('startTime') as string
    const endTime = form.get('endTime') as string
    const notes = (form.get('notes') as string) || undefined

    if (!employeeId || !date || !startTime) {
      setError('Employee, date and clock-in time are required.')
      return
    }

    const clockIn = new Date(`${date}T${startTime}`).toISOString()
    const clockOut = endTime ? new Date(`${date}T${endTime}`).toISOString() : null

    if (clockOut && clockOut <= clockIn) {
      setError('Clock-out must be after clock-in.')
      return
    }

    startTransition(async () => {
      const result =
        mode === 'edit'
          ? await adminUpdateTimeEntry({ id: entry!.id, clockIn, clockOut, notes })
          : await adminCreateTimeEntry({ employeeId, clockIn, clockOut, notes })

      if (result.success) {
        onClose()
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to save entry')
      }
    })
  }

  return (
    <div className="animate-fade-in fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="animate-sheet-up sm:animate-float-in bg-[#fffefb] rounded-t-2xl sm:rounded-2xl [box-shadow:var(--shadow-xl)] w-full sm:max-w-sm p-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-6">
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-stone-900">
            {mode === 'add' ? 'Add time entry' : 'Edit time entry'}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'add' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Employee</label>
              <select
                name="employeeId"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-[#f7f6f3] focus:outline-none focus:ring-2 focus:ring-stone-900/20 min-h-[44px]"
              >
                <option value="">Select employee…</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm font-medium text-stone-700 -mb-1">{entry!.employee_name}</p>
          )}

          <Input label="Date" name="date" type="date" defaultValue={defaultDate} required />

          <div className="grid grid-cols-2 gap-3">
            <TimeSelect label="Clock in"  name="startTime" defaultValue={defaultStart} required />
            <TimeSelect label="Clock out" name="endTime"   defaultValue={defaultEnd} />
          </div>
          <p className="text-xs text-stone-400 -mt-1">Leave clock-out blank if still active.</p>

          <Input
            label="Notes (optional)"
            name="notes"
            type="text"
            defaultValue={entry?.notes ?? ''}
            placeholder="e.g. Forgot to clock out"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
  entries: TimeEntryRow[]
  employees: EmployeeOption[]
}

export default function TimeEntriesManager({ entries, employees }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<TimeEntryRow | null>(null)

  return (
    <>
      {/* Header action */}
      <div className="flex justify-end mb-4">
        <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>+ Add entry</Button>
      </div>

      {/* ── Mobile: card list ─────────────────────────────────────── */}
      <div className="md:hidden">
        <Card className="overflow-hidden divide-y divide-stone-50">
          {entries.length === 0 ? (
            <p className="px-4 py-8 text-stone-400 text-sm text-center">No time entries yet.</p>
          ) : (
            entries.map(entry => {
              const duration = calcDurationMinutes(entry.clock_in, entry.clock_out)
              const isActive = !entry.clock_out
              return (
                <div key={entry.id} className={`px-4 py-3.5 ${isActive ? 'bg-green-50/60' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-stone-900">{entry.employee_name}</p>
                    <button
                      onClick={() => setEditEntry(entry)}
                      className="text-xs text-stone-400 hover:text-stone-700 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors shrink-0 -mr-1"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {format(new Date(entry.clock_in), 'MMM d · h:mm a')}
                    {' '}
                    <span className="text-stone-300">→</span>
                    {' '}
                    {entry.clock_out
                      ? format(new Date(entry.clock_out), 'h:mm a')
                      : <Badge variant="success">Active</Badge>}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">{formatDuration(duration)}</p>
                </div>
              )
            })
          )}
        </Card>
      </div>

      {/* ── Desktop: table ────────────────────────────────────────── */}
      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3">Employee</th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3">Clock in</th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3">Clock out</th>
                <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3">Duration</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-stone-400 text-center">No time entries yet.</td>
                </tr>
              ) : (
                entries.map(entry => {
                  const duration = calcDurationMinutes(entry.clock_in, entry.clock_out)
                  const isActive = !entry.clock_out
                  return (
                    <tr key={entry.id} className={`border-b border-stone-50 last:border-0 transition-colors duration-100 ${isActive ? 'bg-green-50/50' : 'hover:bg-stone-50/60'}`}>
                      <td className="px-4 py-3 font-medium text-stone-900">{entry.employee_name}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {format(new Date(entry.clock_in), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {entry.clock_out
                          ? format(new Date(entry.clock_out), 'MMM d, h:mm a')
                          : <Badge variant="success">Active</Badge>}
                      </td>
                      <td className="px-4 py-3 text-stone-500">{formatDuration(duration)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditEntry(entry)}
                          className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1 rounded hover:bg-stone-100 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Modals */}
      {addOpen && (
        <TimeEntryModal
          mode="add"
          employees={employees}
          onClose={() => setAddOpen(false)}
        />
      )}
      {editEntry && (
        <TimeEntryModal
          mode="edit"
          employees={employees}
          entry={editEntry}
          onClose={() => setEditEntry(null)}
        />
      )}
    </>
  )
}
