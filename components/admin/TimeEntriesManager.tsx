'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'
import { adminCreateTimeEntry, adminUpdateTimeEntry } from '@/lib/actions/time-entries'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
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

// Contextual clock time — omits date for today, adds context for older entries
function smartTime(iso: string): string {
  const d = new Date(iso)
  return format(d, 'h:mm a')
}

// Group label for date headers
function dateGroupLabel(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, 'EEEE')
  return format(d, 'EEEE, MMM d')
}

interface DateGroup {
  label: string
  dateKey: string
  entries: TimeEntryRow[]
  totalMinutes: number
}

function groupByDate(entries: TimeEntryRow[]): DateGroup[] {
  const map = new Map<string, TimeEntryRow[]>()
  for (const e of entries) {
    const key = toLocalDate(e.clock_in)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  const groups: DateGroup[] = []
  for (const [key, group] of map) {
    const totalMinutes = group.reduce((sum, e) => sum + calcDurationMinutes(e.clock_in, e.clock_out), 0)
    groups.push({
      label: dateGroupLabel(group[0].clock_in),
      dateKey: key,
      entries: group,
      totalMinutes,
    })
  }
  return groups
}

// ── modal ─────────────────────────────────────────────────────────────────────

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

  const groups = groupByDate(entries)

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-stone-400">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </p>
        <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
          + Add entry
        </Button>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-stone-400 py-8 text-center">No time entries yet.</p>
      )}

      {/* ── Date groups ─────────────────────────────────────────────── */}
      <div className="space-y-6">
        {groups.map(group => (
          <div key={group.dateKey}>
            {/* Group header */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-stone-500">{group.label}</p>
              <p className="text-xs text-stone-400 tabular-nums">{formatDuration(group.totalMinutes)} total</p>
            </div>

            {/* ── Mobile: card list ────────────────────────── */}
            <div className="md:hidden">
              <Card className="overflow-hidden divide-y divide-stone-50">
                {group.entries.map(entry => {
                  const isActive = !entry.clock_out
                  return (
                    <div
                      key={entry.id}
                      className={`px-4 py-3.5 ${isActive ? 'border-l-2 border-green-500 bg-[#f4fbf6]' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-stone-700">{entry.employee_name}</p>
                        <button
                          onClick={() => setEditEntry(entry)}
                          className="text-xs text-stone-400 hover:text-stone-700 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors shrink-0 -mr-1"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 tabular-nums">
                        {smartTime(entry.clock_in)}
                        {' – '}
                        {entry.clock_out ? smartTime(entry.clock_out) : (
                          <span className="text-green-600 font-medium">now</span>
                        )}
                      </p>
                      <p className="text-sm font-semibold text-stone-900 mt-0.5 tabular-nums">
                        {formatDuration(calcDurationMinutes(entry.clock_in, entry.clock_out))}
                        {isActive && <span className="text-green-600 text-xs font-medium ml-1.5">active</span>}
                      </p>
                    </div>
                  )
                })}
              </Card>
            </div>

            {/* ── Desktop: table ───────────────────────────── */}
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
                    {group.entries.map(entry => {
                      const isActive = !entry.clock_out
                      return (
                        <tr
                          key={entry.id}
                          className={`border-b border-stone-50 last:border-0 transition-colors duration-100 ${
                            isActive
                              ? 'border-l-2 border-green-500 bg-[#f4fbf6] hover:bg-[#edf8f1]'
                              : 'hover:bg-stone-50/60'
                          }`}
                        >
                          <td className="px-4 py-3 text-stone-700 font-medium">{entry.employee_name}</td>
                          <td className="px-4 py-3 text-stone-900 tabular-nums">
                            {smartTime(entry.clock_in)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {entry.clock_out
                              ? <span className="text-stone-900">{smartTime(entry.clock_out)}</span>
                              : <span className="text-green-600 font-medium text-xs">Active</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-stone-900 font-semibold tabular-nums">
                            {formatDuration(calcDurationMinutes(entry.clock_in, entry.clock_out))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setEditEntry(entry)}
                              className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        ))}
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
