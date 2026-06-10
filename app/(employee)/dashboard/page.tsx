import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClockInterface from '@/components/employee/ClockInterface'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const windowStart = new Date(now.getTime() - 14 * 60 * 60 * 1000)
  const windowEnd   = new Date(now.getTime() + 14 * 60 * 60 * 1000)

  const [{ data: shifts }, { data: openEntry }, { data: employee }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, start_time, end_time, notes')
      .eq('employee_id', user.id)
      .gte('start_time', windowStart.toISOString())
      .lte('start_time', windowEnd.toISOString())
      .order('start_time'),
    supabase
      .from('time_entries')
      .select('id, clock_in')
      .eq('employee_id', user.id)
      .is('clock_out', null)
      .maybeSingle(),
    supabase
      .from('employees')
      .select('name, role')
      .eq('id', user.id)
      .single(),
  ])

  return (
    <ClockInterface
      shifts={shifts ?? []}
      openEntry={openEntry}
      serverNow={now.toISOString()}
      employeeName={employee?.name ?? ''}
    />
  )
}
