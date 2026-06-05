import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { startOfDay, endOfDay } from 'date-fns'
import ShiftCard from '@/components/employee/ShiftCard'
import ClockInButton from '@/components/employee/ClockInButton'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()

  const [{ data: shift }, { data: openEntry }, { data: employee }] = await Promise.all([
    supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', user.id)
      .gte('start_time', startOfDay(now).toISOString())
      .lte('start_time', endOfDay(now).toISOString())
      .maybeSingle(),
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
    <div className="max-w-lg mx-auto px-4 pt-12 pb-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">
            Hi, {employee?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-stone-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {employee?.role === 'admin' && (
          <a
            href="/admin/dashboard"
            className="text-xs font-medium text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-100"
          >
            Admin →
          </a>
        )}
      </div>

      <div className="space-y-4">
        <ShiftCard shift={shift} />
        <ClockInButton openEntry={openEntry} />
      </div>
    </div>
  )
}
