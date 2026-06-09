import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import ClientTime from '@/components/ui/ClientTime'
import ClientDate from '@/components/ui/ClientDate'

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  // ±14h UTC window — same reasoning as employee dashboard
  const windowStart = new Date(now.getTime() - 14 * 60 * 60 * 1000)
  const windowEnd   = new Date(now.getTime() + 14 * 60 * 60 * 1000)

  const [{ data: todayShifts }, { data: openEntries }, { data: employees }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, start_time, end_time, notes, employees(name)')
      .gte('start_time', windowStart.toISOString())
      .lte('start_time', windowEnd.toISOString())
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
    <div className="max-w-3xl mx-auto px-6 pb-10 pt-page animate-page-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1"><ClientDate /></p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Card className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Staff</p>
          <p className="text-4xl font-semibold tracking-tight text-stone-900 mt-2 leading-none">{employees?.length ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Shifts</p>
          <p className="text-4xl font-semibold tracking-tight text-stone-900 mt-2 leading-none">{todayShifts?.length ?? 0}</p>
        </Card>
        <Card className={`p-5 ${(openEntries?.length ?? 0) > 0 ? 'bg-[#f0faf4]' : ''}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${(openEntries?.length ?? 0) > 0 ? 'text-green-700' : 'text-stone-400'}`}>Active</p>
          <p className={`text-4xl font-semibold tracking-tight mt-2 leading-none ${(openEntries?.length ?? 0) > 0 ? 'text-green-900' : 'text-stone-900'}`}>{openEntries?.length ?? 0}</p>
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
                    <ClientTime iso={shift.start_time} fmt="EEE MMM d · h:mm a" /> – <ClientTime iso={shift.end_time} fmt="h:mm a" />
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
