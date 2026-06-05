'use client'

import { format } from 'date-fns'
import Card from '@/components/ui/Card'
import { formatDuration, calcDurationMinutes } from '@/lib/utils'

interface Shift {
  id: string
  start_time: string
  end_time: string
  notes: string | null
}

export default function ShiftCard({ shift }: { shift: Shift | null }) {
  if (!shift) {
    return (
      <Card className="p-5">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Today&apos;s shift</p>
        <p className="text-stone-400 text-sm">No shift scheduled.</p>
      </Card>
    )
  }

  const startTime = format(new Date(shift.start_time), 'h:mm a')
  const endTime = format(new Date(shift.end_time), 'h:mm a')
  const duration = calcDurationMinutes(shift.start_time, shift.end_time)

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Today&apos;s shift</p>
      <p className="text-stone-900 font-semibold text-2xl leading-none tracking-tight">
        {startTime} – {endTime}
      </p>
      <p className="text-sm text-stone-400 mt-2">{formatDuration(duration)}</p>
      {shift.notes && (
        <p className="text-sm text-stone-500 mt-3 pt-3 border-t border-stone-100">{shift.notes}</p>
      )}
    </Card>
  )
}
