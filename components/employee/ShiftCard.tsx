'use client'

import Card from '@/components/ui/Card'
import { formatShiftTime, formatDuration, calcDurationMinutes } from '@/lib/utils'

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
        <p className="text-stone-500 text-sm">No shift scheduled for today.</p>
      </Card>
    )
  }

  const duration = calcDurationMinutes(shift.start_time, shift.end_time)

  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Today&apos;s shift</p>
      <p className="text-stone-900 font-semibold text-lg leading-snug">
        {formatShiftTime(shift.start_time, shift.end_time)}
      </p>
      <p className="text-sm text-stone-500 mt-1">{formatDuration(duration)}</p>
      {shift.notes && (
        <p className="text-sm text-stone-500 mt-3 pt-3 border-t border-stone-100">{shift.notes}</p>
      )}
    </Card>
  )
}
