import { format, isSameDay } from 'date-fns'
import Card from '@/components/ui/Card'
import { formatShiftTime, formatDuration, calcDurationMinutes } from '@/lib/utils'

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
    <div className="space-y-2">
      {weekDays.map(day => {
        const dayShifts = shifts.filter(s => isSameDay(new Date(s.start_time), day))
        const today = isSameDay(day, new Date())

        return (
          <Card key={day.toISOString()} className={`p-4 ${today ? 'ring-2 ring-stone-900 ring-offset-1' : ''}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${today ? 'text-stone-900' : 'text-stone-400'}`}>
              {format(day, 'EEE, MMM d')}{today && ' · Today'}
            </p>
            {dayShifts.length === 0 ? (
              <p className="text-sm text-stone-400">Off</p>
            ) : (
              dayShifts.map(shift => (
                <div key={shift.id}>
                  <p className="text-sm font-medium text-stone-800">
                    {format(new Date(shift.start_time), 'h:mm a')} – {format(new Date(shift.end_time), 'h:mm a')}
                  </p>
                  <p className="text-xs text-stone-500">
                    {formatDuration(calcDurationMinutes(shift.start_time, shift.end_time))}
                  </p>
                  {shift.notes && <p className="text-xs text-stone-400 mt-1">{shift.notes}</p>}
                </div>
              ))
            )}
          </Card>
        )
      })}
    </div>
  )
}
