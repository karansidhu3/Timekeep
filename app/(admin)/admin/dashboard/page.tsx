import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  const openByEmployee = new Map<string, { id: string; clock_in: string }>()
  for (const e of openEntries ?? []) {
    openByEmployee.set(e.employee_id, { id: e.id, clock_in: e.clock_in })
  }

  const LATE_THRESHOLD_MS = 15 * 60 * 1000

  type ShiftRow = {
    id: string; start_time: string; end_time: string
    notes: string | null; employee_id: string; employees: unknown
  }

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
        upcoming.push(shift)
      }
    }
  }

  const unscheduledActive = (openEntries ?? []).filter(e => !matchedEmployeeIds.has(e.employee_id))
  const totalScheduled = (todayShifts ?? []).length
  const totalOnShift = clockedIn.length + unscheduledActive.length
  const hasAnyActivity = totalScheduled > 0 || unscheduledActive.length > 0

  return (
    <div className="max-w-2xl mx-auto px-6 pb-12 pt-page animate-page-in">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-xs text-[#a8a29e] tracking-[-0.01em] mb-1"><ClientDate /></p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0d0c0b]">Today</h1>
        </div>
        <form action={signOut} className="md:hidden">
          <button className="text-xs font-medium text-[#a8a29e] hover:text-[#44403c] px-3 py-2 rounded-xl hover:bg-[#f0ede8] transition-colors duration-150 tracking-[-0.01em]">
            Sign out
          </button>
        </form>
      </div>

      {/* ── Status statement ─────────────────────────────────────────── */}
      {hasAnyActivity ? (
        <div className="mb-10">
          <p className="text-[1.375rem] font-semibold tracking-tight text-[#0d0c0b] leading-snug">
            {totalOnShift > 0 ? (
              <>
                <span className="font-mono">{totalOnShift}</span>
                {totalScheduled > 0 && (
                  <span className="text-[#a8a29e] font-normal"> of <span className="font-mono">{totalScheduled}</span></span>
                )}
                {' '}on shift
              </>
            ) : (
              <span className="text-[#a8a29e] font-normal">No one clocked in</span>
            )}
            {late.length > 0 && (
              <span className="text-amber-500"> · <span className="font-mono">{late.length}</span> late</span>
            )}
            {upcoming.length > 0 && (
              <span className="text-[#a8a29e] font-normal"> · <span className="font-mono">{upcoming.length}</span> upcoming</span>
            )}
          </p>
        </div>
      ) : (
        <p className="text-[#a8a29e] mb-10 tracking-[-0.01em]">No shifts today.</p>
      )}

      {/* ── Clocked in ──────────────────────────────────────────────── */}
      {(clockedIn.length > 0 || unscheduledActive.length > 0) && (
        <section className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a8a29e] mb-3">
            On shift · {clockedIn.length + unscheduledActive.length}
          </p>
          <div className="rounded-2xl border border-[#e4e0da] overflow-hidden [box-shadow:var(--shadow-sm)] stagger-fast">
            {clockedIn.map(({ shift, entry }) => {
              const emp = (shift.employees as unknown as { name: string } | null)
              const elapsedSeconds = Math.floor((now.getTime() - new Date(entry.clock_in).getTime()) / 1000)
              return (
                <div
                  key={shift.id}
                  className="flex items-center justify-between px-4 py-3.5 bg-[#fffefb] border-b border-[#e4e0da] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse-live" />
                    <div>
                      <p className="text-sm font-semibold text-[#0d0c0b] tracking-[-0.01em]">{emp?.name}</p>
                      <p className="text-xs text-[#a8a29e] tracking-[-0.01em] mt-0.5 font-mono">
                        since <ClientTime iso={entry.clock_in} />
                        <span className="text-[#d6d3d1] mx-1">·</span>
                        <ClientTime iso={shift.start_time} /> – <ClientTime iso={shift.end_time} />
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#0d0c0b] font-mono tabular-nums">
                    {formatElapsed(elapsedSeconds)}
                  </p>
                </div>
              )
            })}
            {unscheduledActive.map(entry => {
              const emp = (entry.employees as unknown as { name: string } | null)
              const elapsedSeconds = Math.floor((now.getTime() - new Date(entry.clock_in).getTime()) / 1000)
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-3.5 bg-[#fffefb] border-b border-[#e4e0da] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse-live" />
                    <div>
                      <p className="text-sm font-semibold text-[#0d0c0b] tracking-[-0.01em]">{emp?.name}</p>
                      <p className="text-xs text-[#a8a29e] tracking-[-0.01em] mt-0.5 font-mono">
                        since <ClientTime iso={entry.clock_in} />
                        <span className="text-[#d6d3d1] mx-1.5">·</span>
                        no shift
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#0d0c0b] font-mono tabular-nums">
                    {formatElapsed(elapsedSeconds)}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Late ──────────────────────────────────────────────────────── */}
      {late.length > 0 && (
        <section className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mb-3">
            Not in · {late.length}
          </p>
          <div className="rounded-2xl border border-amber-200/60 overflow-hidden [box-shadow:var(--shadow-sm)] stagger-fast">
            {late.map(shift => {
              const emp = (shift.employees as unknown as { name: string } | null)
              const minsLate = Math.floor((now.getTime() - new Date(shift.start_time).getTime()) / 60000)
              return (
                <div
                  key={shift.id}
                  className="flex items-center justify-between px-4 py-3.5 bg-[#fffdf7] border-b border-amber-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#0d0c0b] tracking-[-0.01em]">{emp?.name}</p>
                      <p className="text-xs text-[#a8a29e] tracking-[-0.01em] mt-0.5 font-mono">
                        shift started <ClientTime iso={shift.start_time} />
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-amber-500 font-mono tabular-nums">
                    {minsLate}m late
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Upcoming ────────────────────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a8a29e] mb-3">
            Upcoming · {upcoming.length}
          </p>
          <div className="rounded-2xl border border-[#e4e0da] overflow-hidden [box-shadow:var(--shadow-sm)] stagger-fast">
            {upcoming.map(shift => {
              const emp = (shift.employees as unknown as { name: string } | null)
              const minsUntil = Math.ceil((new Date(shift.start_time).getTime() - now.getTime()) / 60000)
              const h = Math.floor(minsUntil / 60)
              const m = minsUntil % 60
              const untilStr = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
              return (
                <div
                  key={shift.id}
                  className="flex items-center justify-between px-4 py-3.5 bg-[#fffefb] border-b border-[#e4e0da] last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1a1917] tracking-[-0.01em]">{emp?.name}</p>
                    <p className="text-xs text-[#a8a29e] mt-0.5 font-mono tracking-[-0.01em]">
                      <ClientTime iso={shift.start_time} /> – <ClientTime iso={shift.end_time} />
                    </p>
                  </div>
                  <p className="text-xs text-[#a8a29e] font-mono tabular-nums">in {untilStr}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

    </div>
  )
}
