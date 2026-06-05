import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, eachDayOfInterval } from 'date-fns'
import { getWeekRange } from '@/lib/utils'
import WeeklySchedule from '@/components/employee/WeeklySchedule'
import WeekNav from '@/components/employee/WeekNav'

export default async function SchedulePage({
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

  const { data: shifts } = await supabase
    .from('shifts')
    .select('id, start_time, end_time, notes')
    .eq('employee_id', user.id)
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())
    .order('start_time')

  const weekDays = eachDayOfInterval({ start, end })

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-stone-900">Schedule</h1>
        <WeekNav weekOffset={weekOffset} />
      </div>
      <p className="text-sm text-stone-500 mb-4">
        {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
      </p>
      <WeeklySchedule shifts={shifts ?? []} weekDays={weekDays} />
    </div>
  )
}
