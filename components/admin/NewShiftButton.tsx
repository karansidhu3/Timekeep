'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createShift } from '@/lib/actions/shifts'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TimeSelect from '@/components/ui/TimeSelect'

interface Employee { id: string; name: string }

interface Props {
  employees: Employee[]
  weekStart: string
}

export default function NewShiftButton({ employees, weekStart }: Props) {
  const router = useRouter()
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
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to create shift')
      }
    })
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="secondary">
        + New shift
      </Button>
    )
  }

  // Use local date to avoid UTC-offset mismatch
  const _d = new Date(weekStart)
  const defaultDate = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`

  return (
    <div className="animate-fade-in fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="animate-sheet-up sm:animate-float-in bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-6">
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5 sm:hidden" />
        <h2 className="text-base font-semibold text-stone-900 mb-5">New shift</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">Employee</label>
            <select name="employeeId" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]" required>
              <option value="">Select employee…</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <Input label="Date" name="date" type="date" defaultValue={defaultDate} required />
          <div className="grid grid-cols-2 gap-3">
            <TimeSelect label="Start time" name="startTime" required />
            <TimeSelect label="End time"   name="endTime"   required />
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
