import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, eachDayOfInterval, isSameDay } from 'date-fns'
import { getWeekRange } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Link from 'next/link'
import AdminWeekNav from '@/components/admin/AdminWeekNav'
import NewShiftButton from '@/components/admin/NewShiftButton'
import ClientTime from '@/components/ui/ClientTime'
import ApplyTemplateButton from '@/components/admin/ApplyTemplateButton'

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

  const [{ data: shifts }, { data: employees }, { data: templates }] = await Promise.all([
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
    supabase
      .from('schedule_templates')
      .select('employee_id, day_of_week, start_time, end_time, notes'),
  ])

  const weekDays = eachDayOfInterval({ start, end })

  return (
    <div className="max-w-4xl mx-auto px-6 pb-10 pt-page">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-semibold text-stone-900">Schedule</h1>
          <NewShiftButton employees={employees ?? []} weekStart={start.toISOString()} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-stone-400">
              {format(start, 'MMM d')} – {format(end, 'MMM d')}
            </p>
            <Link href="/admin/templates" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
              Templates →
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <ApplyTemplateButton
              templates={templates ?? []}
              weekStart={start}
            />
            <AdminWeekNav weekOffset={weekOffset} />
          </div>
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
                <p className="text-sm text-stone-400 pl-1 mb-4">No shifts</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {dayShifts.map(shift => (
                    <Card key={shift.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          {(shift.employees as unknown as { name: string } | null)?.name}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          <ClientTime iso={shift.start_time} /> – <ClientTime iso={shift.end_time} />
                        </p>
                        {shift.notes && <p className="text-xs text-stone-400 mt-1">{shift.notes}</p>}
                      </div>
                      <Link
                        href={`/admin/schedule/${shift.id}`}
                        className="text-sm text-stone-400 hover:text-stone-700 px-3 py-3 rounded-xl hover:bg-stone-50 transition-colors min-h-[44px] flex items-center"
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
