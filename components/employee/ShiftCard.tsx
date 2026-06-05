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

// Accepts a window of nearby shifts and picks the one that falls on local today.
// The server query uses a ±14h UTC window to avoid timezone-boundary bugs where
// startOfDay/endOfDay on the UTC server misses shifts during late-afternoon/evening
// hours in negative-offset timezones (PST, EST, etc.).
export default function ShiftCard({ shifts }: { shifts: Shift[] }) {
  const todayStr = new Date().toDateString()
  const shift = shifts.find(s => new Date(s.start_time).toDateString() === todayStr) ?? null

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
      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-3">Today&apos;s shift</p>
      <p className="text-stone-900 font-semibold text-3xl leading-none tracking-tight">
        {startTime}
      </p>
      <p className="text-stone-400 font-medium text-xl leading-none tracking-tight mt-1.5">
        until {endTime}
      </p>
      <p className="text-sm text-stone-400 mt-3">{formatDuration(duration)}</p>
      {shift.notes && (
        <p className="text-sm text-stone-500 mt-3 pt-3 border-t border-stone-100">{shift.notes}</p>
      )}
    </Card>
  )
}
