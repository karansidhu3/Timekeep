'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { adminCreateTimeEntry, adminUpdateTimeEntry } from '@/lib/actions/time-entries'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
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

// ── local helpers ─────────────────────────────────────────────────────────────

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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          {mode === 'add' ? 'Add time entry' : 'Edit time entry'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'add' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Employee</label>
              <select
                name="employeeId"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                <option value="">Select employee…</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm font-medium text-stone-700">{entry!.employee_name}</p>
          )}

          <Input label="Date" name="date" type="date" defaultValue={defaultDate} required />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Clock in" name="startTime" type="time" defaultValue={defaultStart} required />
            <Input label="Clock out" name="endTime" type="time" defaultValue={defaultEnd} />
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
      {/* Add entry button */}
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setAddOpen(true)}>+ Add entry</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
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
                    <tr key={entry.id} className={`border-b border-stone-50 last:border-0 ${isActive ? 'bg-green-50/50' : ''}`}>
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
        </div>
      </Card>

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
