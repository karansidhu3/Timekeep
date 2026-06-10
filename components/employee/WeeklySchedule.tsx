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
    <div className="animate-page-in">
      {weekDays.map((day, i) => {
        const dayShifts = shifts.filter(s => isSameDay(new Date(s.start_time), day))
        const today = isSameDay(day, new Date())
        const hasShifts = dayShifts.length > 0
        const isOff = !hasShifts

        return (
          <div
            key={day.toISOString()}
            className={`flex gap-5 py-5 border-b border-[#e4e0da] last:border-0 animate-float-in`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Day label column */}
            <div className="w-16 flex-shrink-0">
              <p className={`text-xs font-semibold uppercase tracking-widest leading-none ${
                today ? 'text-[#0d0c0b]' : 'text-[#a8a29e]'
              }`}>
                {format(day, 'EEE')}
              </p>
              <p className={`text-sm mt-1 font-mono ${
                today ? 'text-[#0d0c0b] font-semibold' : 'text-[#78716c]'
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
                <p className={`text-sm tracking-[-0.01em] ${today ? 'text-[#78716c]' : 'text-[#c4bfba]'}`}>Off</p>
              ) : (
                dayShifts.map(shift => (
                  <div key={shift.id} className="mb-3 last:mb-0">
                    <p className={`text-sm font-semibold tracking-[-0.01em] font-mono ${
                      today ? 'text-[#0d0c0b]' : 'text-[#1a1917]'
                    }`}>
                      {formatTimePST(shift.start_time)} – {formatTimePST(shift.end_time)}
                    </p>
                    <p className="text-xs text-[#a8a29e] mt-0.5 tracking-[-0.01em]">
                      {formatDuration(calcDurationMinutes(shift.start_time, shift.end_time))}
                    </p>
                    {shift.notes && (
                      <p className="text-xs text-[#78716c] mt-1 tracking-[-0.01em] leading-relaxed">{shift.notes}</p>
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
