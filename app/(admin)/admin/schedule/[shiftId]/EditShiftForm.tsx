'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateShift, deleteShift } from '@/lib/actions/shifts'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Shift {
  id: string
  employee_id: string
  start_time: string
  end_time: string
  notes: string | null
}

interface Employee { id: string; name: string }

export default function EditShiftForm({ shift, employees }: { shift: Shift; employees: Employee[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const startDate = new Date(shift.start_time)
  const endDate = new Date(shift.end_time)
  const defaultDate = startDate.toISOString().split('T')[0]
  const defaultStart = startDate.toTimeString().slice(0, 5)
  const defaultEnd = endDate.toTimeString().slice(0, 5)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError(null)

    const date = form.get('date') as string
    const startTime = form.get('startTime') as string
    const endTime = form.get('endTime') as string

    const startDateTime = new Date(`${date}T${startTime}`).toISOString()
    const endDateTime = new Date(`${date}T${endTime}`).toISOString()

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time.')
      return
    }

    startTransition(async () => {
      const result = await updateShift(shift.id, {
        employeeId: form.get('employeeId') as string,
        startTime: startDateTime,
        endTime: endDateTime,
        notes: form.get('notes') as string || undefined,
      })
      if (result.success) router.push('/admin/schedule')
      else setError(result.error ?? 'Failed to update shift')
    })
  }

  function handleDelete() {
    if (!confirm('Delete this shift?')) return
    startDeleteTransition(async () => {
      const result = await deleteShift(shift.id)
      if (result.success) router.push('/admin/schedule')
      else setError(result.error ?? 'Failed to delete shift')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-stone-700">Employee</label>
        <select name="employeeId" defaultValue={shift.employee_id} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400" required>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
      <Input label="Date" name="date" type="date" defaultValue={defaultDate} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start time" name="startTime" type="time" defaultValue={defaultStart} required />
        <Input label="End time" name="endTime" type="time" defaultValue={defaultEnd} required />
      </div>
      <Input label="Notes (optional)" name="notes" type="text" defaultValue={shift.notes ?? ''} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? '…' : 'Delete'}
        </Button>
      </div>
    </form>
  )
}
