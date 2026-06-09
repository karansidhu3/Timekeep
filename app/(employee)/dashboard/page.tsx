import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShiftCard from '@/components/employee/ShiftCard'
import ClockInButton from '@/components/employee/ClockInButton'
import ClientDate from '@/components/ui/ClientDate'
import { signOut } from '@/lib/actions/auth'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  // ±14h UTC window covers all timezones. ShiftCard (client component) filters
  // down to the shift whose start_time falls on the browser's local today.
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
    <div className="max-w-lg mx-auto px-4 pt-page pb-6 animate-page-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            {employee?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-stone-400 mt-0.5"><ClientDate /></p>
        </div>
        <div className="flex items-center gap-1">
          {employee?.role === 'admin' && (
            <a
              href="/admin/dashboard"
              className="text-xs font-medium text-stone-400 hover:text-stone-700 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors duration-150"
            >
              Admin
            </a>
          )}
          <form action={signOut}>
            <button className="text-xs font-medium text-stone-400 hover:text-stone-700 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors duration-150">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-3">
        <ShiftCard shifts={shifts ?? []} />
        <ClockInButton openEntry={openEntry} />
      </div>
    </div>
  )
}
