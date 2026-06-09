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

export default function ShiftCard({ shifts, serverNow }: { shifts: Shift[]; serverNow: string }) {
  const now = new Date(serverNow)
  const todayStr = now.toDateString()
  const shift = shifts.find(s => new Date(s.start_time).toDateString() === todayStr) ?? null

  if (!shift) {
    return (
      <Card className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
          Today&apos;s shift
        </p>
        <p className="text-stone-400 text-sm mt-2">No shift scheduled.</p>
      </Card>
    )
  }

  const shiftStart   = new Date(shift.start_time)
  const shiftEnd     = new Date(shift.end_time)
  const hasStarted   = now >= shiftStart
  const isOver       = now >= shiftEnd
  const minutesUntil = hasStarted ? 0 : Math.ceil((shiftStart.getTime() - now.getTime()) / 60000)
  const startTime    = format(shiftStart, 'h:mm a')
  const endTime      = format(shiftEnd,   'h:mm a')
  const duration     = calcDurationMinutes(shift.start_time, shift.end_time)

  return (
    <Card className="p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
        Today&apos;s shift
      </p>

      <p className="text-stone-900 font-semibold text-4xl leading-none tracking-tight">
        {startTime}
      </p>
      <p className="text-stone-400 font-medium text-xl leading-none tracking-tight mt-2">
        until {endTime}
      </p>

      <div className="flex items-center gap-3 mt-3">
        <p className="text-sm text-stone-400">{formatDuration(duration)}</p>
        {!hasStarted && (
          <>
            <span className="text-stone-200">·</span>
            <p className="text-sm text-stone-400">
              Starts in <span className="text-stone-600 font-medium">{formatDuration(minutesUntil)}</span>
            </p>
          </>
        )}
        {hasStarted && !isOver && (
          <>
            <span className="text-stone-200">·</span>
            <p className="text-sm text-green-600 font-medium">In progress</p>
          </>
        )}
        {isOver && (
          <>
            <span className="text-stone-200">·</span>
            <p className="text-sm text-stone-400">Completed</p>
          </>
        )}
      </div>

      {shift.notes && (
        <p className="text-sm text-stone-500 mt-3 pt-3 border-t border-stone-100 leading-relaxed">
          {shift.notes}
        </p>
      )}
    </Card>
  )
}
