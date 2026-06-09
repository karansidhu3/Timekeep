'use client'

import { format, isSameDay } from 'date-fns'
import { formatDuration, calcDurationMinutes, formatTimePST } from '@/lib/utils'

interface Shift {
  id: string
  start_time: string
  end_time: string
  notes: string | null
}

interface Props {
  shifts: Shift[]
  weekDays: Date[]
}

export default function WeeklySchedule({ shifts, weekDays }: Props) {
  return (
    <div className="divide-y divide-stone-100 stagger">
      {weekDays.map(day => {
        const dayShifts = shifts.filter(s => isSameDay(new Date(s.start_time), day))
        const today = isSameDay(day, new Date())
        const hasShifts = dayShifts.length > 0

        return (
          <div
            key={day.toISOString()}
            className={`flex gap-4 py-4 ${today ? 'bg-white -mx-4 px-4 rounded-xl' : ''}`}
          >
            {/* Day label */}
            <div className="w-14 flex-shrink-0 pt-0.5">
              <p className={`text-xs font-bold uppercase tracking-wide ${
                today ? 'text-stone-900' : 'text-stone-400'
              }`}>
                {format(day, 'EEE')}
              </p>
              <p className={`text-sm mt-0.5 ${
                today ? 'text-stone-600 font-medium' : 'text-stone-400'
              }`}>
                {format(day, 'MMM d')}
              </p>
              {today && (
                <p className="text-[10px] font-semibold text-stone-900 uppercase tracking-wide mt-0.5">
                  Today
                </p>
              )}
            </div>

            {/* Shift content */}
            <div className="flex-1 min-w-0 pt-0.5">
              {!hasShifts ? (
                <p className="text-sm text-stone-400">Off</p>
              ) : (
                dayShifts.map(shift => (
                  <div key={shift.id} className="mb-2 last:mb-0">
                    <p className={`text-sm font-semibold ${today ? 'text-stone-900' : 'text-stone-700'}`}>
                      {formatTimePST(shift.start_time)} – {formatTimePST(shift.end_time)}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDuration(calcDurationMinutes(shift.start_time, shift.end_time))}
                    </p>
                    {shift.notes && (
                      <p className="text-xs text-stone-400 mt-1">{shift.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
