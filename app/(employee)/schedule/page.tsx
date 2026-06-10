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
    <div
      className="max-w-lg mx-auto px-6 pb-24"
      style={{ paddingTop: 'max(2.5rem, env(safe-area-inset-top, 0px))' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0d0c0b]">Schedule</h1>
          <p className="text-sm text-[#a8a29e] mt-0.5 tracking-[-0.01em] font-mono">
            {format(start, 'MMM d')} – {format(end, 'MMM d')}
          </p>
        </div>
        <WeekNav weekOffset={weekOffset} />
      </div>

      <WeeklySchedule shifts={shifts ?? []} weekDays={weekDays} />
    </div>
  )
}
