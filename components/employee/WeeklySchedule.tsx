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
  dir?: 'next' | 'prev'
}

export default function WeeklySchedule({ shifts, weekDays, dir }: Props) {
  return (
    <div className={dir === 'next' ? 'animate-slide-right' : dir === 'prev' ? 'animate-slide-left' : 'animate-page-in'}>
      {weekDays.map((day, i) => {
        const dayShifts = shifts.filter(s => isSameDay(new Date(s.start_time), day))
        const today = isSameDay(day, new Date())
        const hasShifts = dayShifts.length > 0
        const isOff = !hasShifts

        return (
          <div
            key={day.toISOString()}
            className={`flex gap-5 py-5 border-b border-[#d3c9b2] last:border-0 animate-float-in`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Day label column */}
            <div className="w-16 flex-shrink-0">
              <p className={`text-xs font-semibold uppercase tracking-widest leading-none ${
                today ? 'text-label-1' : 'text-label-2'
              }`}>
                {format(day, 'EEE')}
              </p>
              <p className={`text-sm mt-1 ${
                today ? 'text-label-1 font-semibold' : 'text-label-2'
              }`}>
                {format(day, 'MMM d')}
              </p>
              {today && (
                <div className="mt-2 w-1 h-1 rounded-full bg-[#0d0c0b]" />
              )}
            </div>

            {/* Shift content */}
            <div className="flex-1 pt-0.5">
              {isOff ? (
                <p className={`text-sm tracking-[-0.01em] ${today ? 'text-label-3' : 'text-label-4'}`}>Off</p>
              ) : (
                dayShifts.map(shift => (
                  <div key={shift.id} className="mb-3 last:mb-0">
                    <p className={`tracking-[-0.01em] ${
                      today ? 'text-sm font-semibold text-label-1' : 'text-sm font-medium text-label-2'
                    }`}>
                      {formatTimePST(shift.start_time)} – {formatTimePST(shift.end_time)}
                    </p>
                    <p className="text-xs text-label-2 mt-0.5 tracking-[-0.01em]">
                      {formatDuration(calcDurationMinutes(shift.start_time, shift.end_time))}
                    </p>
                    {shift.notes && (
                      <p className="text-xs text-label-2 mt-1 tracking-[-0.01em] leading-relaxed">{shift.notes}</p>
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
