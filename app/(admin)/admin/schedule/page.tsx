import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, eachDayOfInterval, isSameDay } from 'date-fns'
import { getWeekRange } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import AdminWeekNav from '@/components/admin/AdminWeekNav'
import NewShiftButton from '@/components/admin/NewShiftButton'

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const weekOffset = parseInt(params.week ?? '0', 10)
  const { start, end } = getWeekRange(weekOffset)

  const [{ data: shifts }, { data: employees }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, start_time, end_time, notes, employee_id, employees(name)')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time'),
    supabase
      .from('employees')
      .select('id, name')
      .eq('active', true)
      .order('name'),
  ])

  const weekDays = eachDayOfInterval({ start, end })

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Schedule</h1>
          <p className="text-sm text-stone-500 mt-1">
            {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminWeekNav weekOffset={weekOffset} />
          <NewShiftButton employees={employees ?? []} weekStart={start.toISOString()} />
        </div>
      </div>

      <div className="space-y-4">
        {weekDays.map(day => {
          const dayShifts = (shifts ?? []).filter(s => isSameDay(new Date(s.start_time), day))
          const isToday = isSameDay(day, new Date())

          return (
            <div key={day.toISOString()}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isToday ? 'text-stone-900' : 'text-stone-400'}`}>
                {format(day, 'EEEE, MMM d')}{isToday && ' · Today'}
              </p>
              {dayShifts.length === 0 ? (
                <p className="text-sm text-stone-300 pl-1 mb-4">No shifts</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {dayShifts.map(shift => (
                    <Card key={shift.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          {(shift.employees as unknown as { name: string } | null)?.name}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {format(new Date(shift.start_time), 'h:mm a')} – {format(new Date(shift.end_time), 'h:mm a')}
                        </p>
                        {shift.notes && <p className="text-xs text-stone-400 mt-1">{shift.notes}</p>}
                      </div>
                      <Link
                        href={`/admin/schedule/${shift.id}`}
                        className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1 rounded hover:bg-stone-100"
                      >
                        Edit
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
