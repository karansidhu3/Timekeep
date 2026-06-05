'use client'

import { useState, useTransition } from 'react'
import { createShift } from '@/lib/actions/shifts'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Employee { id: string; name: string }

interface Props {
  employees: Employee[]
  weekStart: string
}

export default function NewShiftButton({ employees, weekStart }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError(null)

    const employeeId = form.get('employeeId') as string
    const date = form.get('date') as string
    const startTime = form.get('startTime') as string
    const endTime = form.get('endTime') as string
    const notes = form.get('notes') as string

    if (!employeeId || !date || !startTime || !endTime) {
      setError('Please fill in all required fields.')
      return
    }

    const startDateTime = new Date(`${date}T${startTime}`).toISOString()
    const endDateTime = new Date(`${date}T${endTime}`).toISOString()

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time.')
      return
    }

    startTransition(async () => {
      const result = await createShift({
        employeeId,
        startTime: startDateTime,
        endTime: endDateTime,
        notes: notes || undefined,
      })
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error ?? 'Failed to create shift')
      }
    })
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        + New shift
      </Button>
    )
  }

  const defaultDate = new Date(weekStart).toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">New shift</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Employee</label>
            <select name="employeeId" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400" required>
              <option value="">Select employee…</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <Input label="Date" name="date" type="date" defaultValue={defaultDate} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start time" name="startTime" type="time" required />
            <Input label="End time" name="endTime" type="time" required />
          </div>
          <Input label="Notes (optional)" name="notes" type="text" placeholder="e.g. Opening shift" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Saving…' : 'Create shift'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
