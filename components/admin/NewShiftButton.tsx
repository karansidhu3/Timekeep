'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createShift } from '@/lib/actions/shifts'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TimeSelect from '@/components/ui/TimeSelect'
import { localDatePST } from '@/lib/utils'

interface Employee { id: string; name: string }

interface Props {
  employees: Employee[]
  weekStart: string
}

const selectClass = `
  w-full px-4 py-3 rounded-xl border border-[#d3c9b2]
  text-sm bg-[#eae3d3] text-label-1
  focus:outline-none focus:border-[#78716c] focus:ring-2 focus:ring-[#141210]/10
  min-h-[44px] tracking-[-0.01em]
`

export default function NewShiftButton({ employees, weekStart }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
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
        setSaved(true)
        setTimeout(() => { setOpen(false); setSaved(false); router.refresh() }, 520)
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

  const defaultDate = localDatePST(new Date().toISOString())

  return (
    <div className="animate-fade-in fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="animate-sheet-up sm:animate-float-in bg-[#f9f4ea] rounded-t-2xl sm:rounded-2xl [box-shadow:var(--shadow-xl)] w-full sm:max-w-sm p-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-6">
        <div className="w-10 h-1 bg-[#d3c9b2] rounded-full mx-auto mb-5 sm:hidden" />
        <h2 className="text-base font-semibold text-label-1 mb-5 tracking-[-0.01em]">New shift</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-label-2 tracking-[-0.01em]">Employee</label>
            <select name="employeeId" className={selectClass} required>
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
          {error && <p className="text-sm text-red-500 tracking-[-0.01em]">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)} disabled={saved}>
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 transition-colors duration-200 ${saved ? '!bg-[#4a7c59] !text-white' : ''}`}
              disabled={isPending || saved}
            >
              {saved ? 'Saved' : isPending ? 'Saving…' : 'Create shift'}
            </Button>
          </div>
          <div className="pt-1 text-center">
            <Link href="/admin/templates" className="text-sm text-label-2 underline underline-offset-2 hover:text-label-1 transition-colors tracking-[-0.01em]">
              Manage templates
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
