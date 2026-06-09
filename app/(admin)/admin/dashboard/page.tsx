import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Card from '@/components/ui/Card'
import Link from 'next/link'
import ClientTime from '@/components/ui/ClientTime'
import ClientDate from '@/components/ui/ClientDate'
import { signOut } from '@/lib/actions/auth'
import { formatElapsed } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const windowStart = new Date(now.getTime() - 14 * 60 * 60 * 1000)
  const windowEnd   = new Date(now.getTime() + 14 * 60 * 60 * 1000)

  const [{ data: todayShifts }, { data: openEntries }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, start_time, end_time, notes, employee_id, employees(name)')
      .gte('start_time', windowStart.toISOString())
      .lte('start_time', windowEnd.toISOString())
      .order('start_time'),
    supabase
      .from('time_entries')
      .select('id, clock_in, employee_id, employees(name)')
      .is('clock_out', null),
  ])

  // Build a map: employee_id → open entry
  const openByEmployee = new Map<string, { id: string; clock_in: string }>()
  for (const e of openEntries ?? []) {
    openByEmployee.set(e.employee_id, { id: e.id, clock_in: e.clock_in })
  }

  // Categorise each shift
  const LATE_THRESHOLD_MS = 15 * 60 * 1000

  type ShiftRow = { id: string; start_time: string; end_time: string; notes: string | null; employee_id: string; employees: unknown }

  const clockedIn:  { shift: ShiftRow; entry: { id: string; clock_in: string } }[] = []
  const upcoming:   ShiftRow[] = []
  const late:       ShiftRow[] = []

  const matchedEmployeeIds = new Set<string>()

  for (const shift of (todayShifts ?? []) as ShiftRow[]) {
    const entry = openByEmployee.get(shift.employee_id)
    if (entry) {
      clockedIn.push({ shift, entry })
      matchedEmployeeIds.add(shift.employee_id)
    } else {
      const shiftStart = new Date(shift.start_time)
      if (shiftStart > now) {
        upcoming.push(shift)
      } else if (now.getTime() - shiftStart.getTime() > LATE_THRESHOLD_MS) {
        late.push(shift)
      } else {
        // Within grace period — treat as upcoming
        upcoming.push(shift)
      }
    }
  }

  // Entries with no scheduled shift today
  const unscheduledActive = (openEntries ?? []).filter(e => !matchedEmployeeIds.has(e.employee_id))

  const totalScheduled = (todayShifts ?? []).length
  const hasActivity = clockedIn.length > 0 || late.length > 0 || upcoming.length > 0 || unscheduledActive.length > 0

  return (
    <div className="max-w-3xl mx-auto px-6 pb-10 pt-page animate-page-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Today</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            <ClientDate /> · {totalScheduled} shift{totalScheduled !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        {/* Sign-out — mobile only (desktop uses sidebar) */}
        <form action={signOut} className="md:hidden">
          <button className="text-xs font-medium text-stone-400 hover:text-stone-700 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors duration-150">
            Sign out
          </button>
        </form>
      </div>

      {!hasActivity && (
        <p className="text-sm text-stone-400 py-4">No shifts scheduled today.</p>
      )}

      {/* ── Clocked in ──────────────────────────────────────────────── */}
      {clockedIn.length > 0 && (
        <section className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
            On shift · {clockedIn.length}
          </p>
          <div className="space-y-2 stagger">
            {clockedIn.map(({ shift, entry }) => {
              const emp = (shift.employees as unknown as { name: string } | null)
              const elapsedSeconds = Math.floor((now.getTime() - new Date(entry.clock_in).getTime()) / 1000)
              return (
                <Card
                  key={shift.id}
                  className="p-4 border-green-400/30"
                  style={{ background: '#f4fbf6' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-stone-900">{emp?.name}</p>
                    </div>
                    <p className="text-sm font-semibold text-stone-900 tabular-nums">
                      {formatElapsed(elapsedSeconds)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 pl-[18px]">
                    <p className="text-xs text-stone-500">
                      Since <ClientTime iso={entry.clock_in} fmt="h:mm a" />
                    </p>
                    <p className="text-xs text-stone-400">
                      <ClientTime iso={shift.start_time} fmt="h:mm a" /> – <ClientTime iso={shift.end_time} fmt="h:mm a" />
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Unscheduled active ──────────────────────────────────────── */}
      {unscheduledActive.length > 0 && (
        <section className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
            Clocked in · no shift
          </p>
          <div className="space-y-2 stagger">
            {unscheduledActive.map(entry => {
              const emp = (entry.employees as unknown as { name: string } | null)
              const elapsedSeconds = Math.floor((now.getTime() - new Date(entry.clock_in).getTime()) / 1000)
              return (
                <Card key={entry.id} className="p-4" style={{ background: '#f4fbf6' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-stone-900">{emp?.name}</p>
                    </div>
                    <p className="text-sm font-semibold text-stone-900 tabular-nums">
                      {formatElapsed(elapsedSeconds)}
                    </p>
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5 pl-[18px]">
                    Since <ClientTime iso={entry.clock_in} fmt="h:mm a" />
                  </p>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Late / no show ──────────────────────────────────────────── */}
      {late.length > 0 && (
        <section className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 mb-3">
            Not in · {late.length}
          </p>
          <div className="space-y-2 stagger">
            {late.map(shift => {
              const emp = (shift.employees as unknown as { name: string } | null)
              const minsLate = Math.floor((now.getTime() - new Date(shift.start_time).getTime()) / 60000)
              return (
                <Card key={shift.id} className="p-4 border-amber-300/40" style={{ background: '#fffdf7' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                      <p className="text-sm font-semibold text-stone-900">{emp?.name}</p>
                    </div>
                    <p className="text-xs font-semibold text-amber-600 tabular-nums">
                      {minsLate}m late
                    </p>
                  </div>
                  <p className="text-xs text-stone-400 mt-1.5 pl-[18px]">
                    Shift started <ClientTime iso={shift.start_time} fmt="h:mm a" />
                  </p>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Upcoming ────────────────────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">
            Upcoming
          </p>
          <div className="space-y-2 stagger">
            {upcoming.map(shift => {
              const emp = (shift.employees as unknown as { name: string } | null)
              const minsUntil = Math.ceil((new Date(shift.start_time).getTime() - now.getTime()) / 60000)
              const h = Math.floor(minsUntil / 60)
              const m = minsUntil % 60
              const untilStr = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
              return (
                <Card key={shift.id} className="p-4" hoverable>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-stone-700">{emp?.name}</p>
                    <p className="text-xs text-stone-400 tabular-nums">in {untilStr}</p>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    <ClientTime iso={shift.start_time} fmt="h:mm a" /> – <ClientTime iso={shift.end_time} fmt="h:mm a" />
                  </p>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Footer link ─────────────────────────────────────────────── */}
      <div className="mt-2">
        <Link
          href="/admin/time-entries"
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          View all time entries →
        </Link>
      </div>

    </div>
  )
}
