'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateShift, deleteShift } from '@/lib/actions/shifts'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TimeSelect from '@/components/ui/TimeSelect'
import { localDatePST, localTimePST } from '@/lib/utils'

interface Shift {
  id: string
  employee_id: string
  start_time: string
  end_time: string
  notes: string | null
}

interface Employee { id: string; name: string }

const selectClass = `
  w-full px-4 py-3 rounded-2xl border border-[#e4e0da]
  text-sm bg-[#f0ede8] text-[#0d0c0b]
  focus:outline-none focus:border-[#78716c] focus:ring-2 focus:ring-[#141210]/10
  min-h-[44px] tracking-[-0.01em]
`

export default function EditShiftForm({ shift, employees }: { shift: Shift; employees: Employee[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const defaultDate = localDatePST(shift.start_time)
  const defaultStart = localTimePST(shift.start_time)
  const defaultEnd = localTimePST(shift.end_time)

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
        <label className="text-sm font-medium text-[#44403c] tracking-[-0.01em]">Employee</label>
        <select name="employeeId" defaultValue={shift.employee_id} className={selectClass} required>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
      <Input label="Date" name="date" type="date" defaultValue={defaultDate} required />
      <div className="grid grid-cols-2 gap-3">
        <TimeSelect label="Start time" name="startTime" defaultValue={defaultStart} required />
        <TimeSelect label="End time"   name="endTime"   defaultValue={defaultEnd}   required />
      </div>
      <Input label="Notes (optional)" name="notes" type="text" defaultValue={shift.notes ?? ''} />
      {error && <p className="text-sm text-red-500 tracking-[-0.01em]">{error}</p>}
      <div className="space-y-2 pt-2">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
        <Button type="button" variant="danger" onClick={handleDelete} disabled={isDeleting} className="w-full">
          {isDeleting ? 'Deleting…' : 'Delete shift'}
        </Button>
      </div>
    </form>
  )
}
