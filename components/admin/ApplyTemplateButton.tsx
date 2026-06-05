'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDays } from 'date-fns'
import { applyTemplatesToWeek } from '@/lib/actions/templates'
import Button from '@/components/ui/Button'

interface Template {
  employee_id: string
  day_of_week: number   // 1=Mon … 7=Sun
  start_time: string    // "HH:MM:SS"
  end_time: string      // "HH:MM:SS"
  notes: string | null
}

interface Props {
  templates: Template[]
  weekStart: Date   // Monday of the displayed week (passed as ISO string, converted in parent)
}

export default function ApplyTemplateButton({ templates, weekStart }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  if (templates.length === 0) return null

  function handleApply() {
    setStatus(null)
    startTransition(async () => {
      // Compute UTC datetimes in the browser (which knows the local timezone).
      // day_of_week 1=Monday: weekStart + 0 days
      // day_of_week 7=Sunday: weekStart + 6 days
      const shifts = templates.map(t => {
        const shiftDay = addDays(weekStart, t.day_of_week - 1)

        const [startH, startM] = t.start_time.split(':').map(Number)
        const [endH, endM]     = t.end_time.split(':').map(Number)

        const start = new Date(shiftDay)
        start.setHours(startH, startM, 0, 0)   // local time → UTC via .toISOString()

        const end = new Date(shiftDay)
        end.setHours(endH, endM, 0, 0)

        return {
          employeeId: t.employee_id,
          startTime:  start.toISOString(),
          endTime:    end.toISOString(),
          notes:      t.notes,
        }
      })

      const result = await applyTemplatesToWeek(shifts)
      if (result.success) {
        const msg = result.created === 0
          ? 'All shifts already exist'
          : `Added ${result.created} shift${result.created !== 1 ? 's' : ''}${result.skipped ? ` (${result.skipped} skipped)` : ''}`
        setStatus(msg)
        router.refresh()
        setTimeout(() => setStatus(null), 4000)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {status && <span className="text-xs text-stone-500">{status}</span>}
      <Button variant="ghost" size="sm" onClick={handleApply} disabled={isPending}>
        {isPending ? 'Applying…' : 'Apply template'}
      </Button>
    </div>
  )
}
