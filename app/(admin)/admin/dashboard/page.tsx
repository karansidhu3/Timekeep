import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { startOfDay, endOfDay } from 'date-fns'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatShiftTime } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()

  const [{ data: todayShifts }, { data: openEntries }, { data: employees }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, start_time, end_time, notes, employees(name)')
      .gte('start_time', startOfDay(now).toISOString())
      .lte('start_time', endOfDay(now).toISOString())
      .order('start_time'),
    supabase
      .from('time_entries')
      .select('id, clock_in, employees(name)')
      .is('clock_out', null),
    supabase
      .from('employees')
      .select('id')
      .eq('active', true),
  ])

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Active employees</p>
          <p className="text-3xl font-semibold text-stone-900 mt-1">{employees?.length ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Shifts today</p>
          <p className="text-3xl font-semibold text-stone-900 mt-1">{todayShifts?.length ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Clocked in</p>
          <p className="text-3xl font-semibold text-stone-900 mt-1">{openEntries?.length ?? 0}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-700">Today&apos;s shifts</h2>
          <Link href="/admin/schedule" className="text-xs text-stone-400 hover:text-stone-600">
            View schedule →
          </Link>
        </div>

        {!todayShifts?.length ? (
          <p className="text-sm text-stone-400 py-4">No shifts scheduled today.</p>
        ) : (
          todayShifts.map(shift => {
            const isClockedIn = openEntries?.some(e => {
              const empEntry = (e.employees as unknown as { name: string } | null)
              const shiftEmp = (shift.employees as unknown as { name: string } | null)
              return empEntry?.name === shiftEmp?.name
            })

            return (
              <Card key={shift.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {(shift.employees as unknown as { name: string } | null)?.name}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {formatShiftTime(shift.start_time, shift.end_time)}
                  </p>
                </div>
                {isClockedIn && <Badge variant="success">Clocked in</Badge>}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
