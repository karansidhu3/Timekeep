import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ClientTime from '@/components/ui/ClientTime'
import ClientDate from '@/components/ui/ClientDate'
import CountUp from '@/components/ui/CountUp'
import { signOut } from '@/lib/actions/auth'
import { formatElapsed, formatDuration } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const windowStart = new Date(now.getTime() - 14 * 60 * 60 * 1000)
  const windowEnd   = new Date(now.getTime() + 14 * 60 * 60 * 1000)

  const lookback24 = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [{ data: todayShifts }, { data: openEntries }, { data: completedToday }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, start_time, end_time, notes, employee_id, employees!shifts_employee_id_fkey(name)')
      .gte('start_time', windowStart.toISOString())
      .lte('start_time', windowEnd.toISOString())
      .order('start_time'),
    supabase
      .from('time_entries')
      .select('id, clock_in, employee_id, employees(name)')
      .is('clock_out', null),
    supabase
      .from('time_entries')
      .select('clock_in, clock_out, employee_id')
      .not('clock_out', 'is', null)
      .gte('clock_in', lookback24.toISOString()),
  ])

  const todayLA = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
  const priorMinsByEmployee = new Map<string, number>()
  for (const e of completedToday ?? []) {
    if (!e.clock_out) continue
    if (new Date(e.clock_in).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }) !== todayLA) continue
    const mins = Math.floor((new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 60000)
    priorMinsByEmployee.set(e.employee_id, (priorMinsByEmployee.get(e.employee_id) ?? 0) + mins)
  }

  // Employees who have at least one completed session today (clocked in AND out today)
  const doneEmployeeIds = new Set<string>(priorMinsByEmployee.keys())

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
  const done:       ShiftRow[] = []
  const matchedEmployeeIds = new Set<string>()

  for (const shift of (todayShifts ?? []) as ShiftRow[]) {
    const shiftDateLA = new Date(shift.start_time).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    if (shiftDateLA !== todayLA) continue

    const entry = openByEmployee.get(shift.employee_id)
    if (entry) {
      clockedIn.push({ shift, entry })
      matchedEmployeeIds.add(shift.employee_id)
    } else {
      const shiftStart = new Date(shift.start_time)
      if (doneEmployeeIds.has(shift.employee_id) && shiftStart <= now) {
        // Already worked today and shift has started — treat as completed
        done.push(shift)
      } else if (shiftStart > now) {
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
    <div className="max-w-2xl mx-auto px-6 pb-nav md:pb-12 pt-page">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-label-1">Today</h1>
          <p className="text-sm text-label-3 mt-0.5 tracking-[-0.01em]"><ClientDate /></p>
        </div>
        <form action={signOut} className="md:hidden">
          <button className="inline-flex items-center px-3 py-2 rounded-xl bg-[#eae3d3] hover:bg-[#ddd4be] active:bg-[#d3c9b2] text-sm font-medium text-label-1 transition-colors duration-150 tracking-[-0.01em]">
            Sign out
          </button>
        </form>
      </div>

      {!hasAnyActivity ? (
        <div className="pt-2">
          <p className="text-[2rem] font-semibold tracking-tight text-label-1 leading-tight mb-2">
            Nothing today.
          </p>
          <p className="text-sm text-label-3 tracking-[-0.01em] mb-8">
            No shifts scheduled for today.
          </p>
          <Link
            href="/admin/schedule"
            className="inline-flex items-center gap-2 text-sm font-medium text-label-1 bg-[#eae3d3] px-4 py-3 rounded-2xl hover:bg-[#ddd4be] active:bg-[#cdbfa0] transition-colors tracking-[-0.01em]"
          >
            View schedule
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      ) : (
        <>
          {/* ── Status number ─────────────────────────────────────────── */}
          <div className="mb-10">
            <div className="flex items-baseline gap-3 mb-1.5">
              <span
                className="font-extrabold text-label-1 leading-none tabular-nums"
                style={{ fontSize: 'clamp(4rem, 16vw, 5.5rem)' }}
              >
                <CountUp value={totalOnShift} />
              </span>
              <span className="text-lg text-label-2 font-normal tracking-[-0.01em] leading-none">
                on shift
              </span>
            </div>
            {(late.length > 0 || upcoming.length > 0 || done.length > 0) && (
              <p className="text-sm tracking-[-0.01em] flex items-center flex-wrap gap-x-1.5">
                {done.length > 0 && (
                  <span className="text-label-2">{done.length}{totalScheduled > 0 ? ` of ${totalScheduled}` : ''} done</span>
                )}
                {done.length > 0 && (late.length > 0 || upcoming.length > 0) && <span className="text-label-4">·</span>}
                {late.length > 0 && <span className="text-rose-600 font-medium">{late.length} late</span>}
                {late.length > 0 && upcoming.length > 0 && <span className="text-label-4">·</span>}
                {upcoming.length > 0 && <span className="text-label-2">{upcoming.length} upcoming</span>}
              </p>
            )}
          </div>

          <div className="space-y-8">

            {/* ── Late — interruption, no card ─────────────────────────── */}
            {late.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-600 mb-3">
                  Late · {late.length}
                </p>
                <div className="border-l-[3px] border-red-400">
                  {late.map(shift => {
                    const emp = (shift.employees as unknown as { name: string } | null)
                    const minsLate = Math.floor((now.getTime() - new Date(shift.start_time).getTime()) / 60000)
                    return (
                      <Link
                        key={shift.id}
                        href={`/admin/employees/${shift.employee_id}`}
                        className="flex items-center justify-between pl-4 py-3.5 border-b border-red-100/70 last:border-0 hover:bg-red-50/60 active:bg-red-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-label-1 tracking-[-0.01em] truncate">{emp?.name}</p>
                          <p className="text-xs text-label-2 mt-0.5 font-mono tracking-[-0.01em]">
                            Due at <ClientTime iso={shift.start_time} />
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <p className="text-sm font-medium text-rose-600 font-mono tabular-nums">{formatDuration(minsLate)} late</p>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-red-400 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── On shift ─────────────────────────────────────────────── */}
            {(clockedIn.length > 0 || unscheduledActive.length > 0) && (
              <section>
                {/* Label only shown when late section is also visible, for clarity */}
                {late.length > 0 && (
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-label-2 mb-3">
                    On shift · {clockedIn.length + unscheduledActive.length}
                  </p>
                )}
                <div className="rounded-xl border border-[#d3c9b2] overflow-hidden [box-shadow:var(--shadow-sm)] stagger-fast">
                  {clockedIn.map(({ shift, entry }) => {
                    const emp = (shift.employees as unknown as { name: string } | null)
                    const elapsedSeconds = Math.floor((now.getTime() - new Date(entry.clock_in).getTime()) / 1000)
                    const shiftStart = new Date(shift.start_time)
                    const shiftEnd = new Date(shift.end_time)
                    const minsLeft = Math.ceil((shiftEnd.getTime() - now.getTime()) / 60000)
                    const priorMins = priorMinsByEmployee.get(shift.employee_id) ?? 0
                    const totalTodaySeconds = elapsedSeconds + priorMins * 60
                    const scheduledMins = Math.floor((shiftEnd.getTime() - shiftStart.getTime()) / 60000)
                    const totalWorkedMins = Math.floor(totalTodaySeconds / 60)
                    const isOvertime = scheduledMins > 0 ? totalWorkedMins > scheduledMins : minsLeft < 0
                    const overtimeMins = Math.max(0, totalWorkedMins - scheduledMins)
                    const progress = scheduledMins > 0
                      ? Math.min(totalWorkedMins / scheduledMins, 1)
                      : Math.min(Math.max((now.getTime() - shiftStart.getTime()) / (shiftEnd.getTime() - shiftStart.getTime()), 0), 1)

                    return (
                      <Link
                        key={shift.id}
                        href={`/admin/employees/${shift.employee_id}`}
                        className="block px-4 py-4 bg-[#f9f4ea] border-b border-[#d3c9b2] last:border-0 hover:bg-[#f2ece2] active:bg-[#eae3d3] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] flex-shrink-0 animate-pulse-live" />
                            <p className="text-sm font-semibold text-label-1 tracking-[-0.01em] truncate">{emp?.name}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className={`text-base font-medium font-mono tabular-nums ${isOvertime ? 'text-orange-600' : 'text-label-1'}`}>
                              {formatElapsed(totalTodaySeconds)}
                              {priorMins > 0 && (
                                <span className="text-[11px] font-normal text-label-3 ml-1">today</span>
                              )}
                            </p>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-label-3 flex-shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="h-[3px] bg-[#ede9e3] rounded-full overflow-hidden mb-1.5">
                            <div
                              className={`h-full rounded-full ${isOvertime ? 'bg-amber-400' : 'bg-[#141210]'}`}
                              style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-label-2 font-mono tracking-[-0.01em]">
                            {isOvertime ? (
                              <span className="text-orange-600">+{formatDuration(overtimeMins)} over</span>
                            ) : minsLeft <= 60 ? (
                              <span className="text-label-2">{minsLeft}m left</span>
                            ) : (
                              <>ends <ClientTime iso={shift.end_time} /></>
                            )}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                  {unscheduledActive.map(entry => {
                    const emp = (entry.employees as unknown as { name: string } | null)
                    const elapsedSeconds = Math.floor((now.getTime() - new Date(entry.clock_in).getTime()) / 1000)
                    return (
                      <Link
                        key={entry.id}
                        href={`/admin/employees/${entry.employee_id}`}
                        className="block px-4 py-4 bg-[#f9f4ea] border-b border-[#d3c9b2] last:border-0 hover:bg-[#f2ece2] active:bg-[#eae3d3] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] flex-shrink-0 animate-pulse-live" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-label-1 tracking-[-0.01em] truncate">{emp?.name}</p>
                              <p className="text-xs text-label-3 mt-0.5 tracking-[-0.01em]">No shift scheduled</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className="text-base font-medium text-label-1 font-mono tabular-nums">
                              {formatElapsed(elapsedSeconds)}
                            </p>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-label-3 flex-shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Upcoming ─────────────────────────────────────────────── */}
            {upcoming.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-label-2 mb-3">
                  Upcoming · {upcoming.length}
                </p>
                <div className="rounded-xl border border-[#d3c9b2] overflow-hidden [box-shadow:var(--shadow-sm)] stagger-fast">
                  {upcoming.map(shift => {
                    const emp = (shift.employees as unknown as { name: string } | null)
                    const minsUntil = Math.ceil((new Date(shift.start_time).getTime() - now.getTime()) / 60000)
                    return (
                      <Link
                        key={shift.id}
                        href={`/admin/employees/${shift.employee_id}`}
                        className="block px-4 py-3.5 bg-[#f9f4ea] border-b border-[#d3c9b2] last:border-0 hover:bg-[#f2ece2] active:bg-[#eae3d3] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-label-1 tracking-[-0.01em] truncate">{emp?.name}</p>
                            <p className="text-xs text-label-2 mt-0.5 font-mono tracking-[-0.01em]">
                              <ClientTime iso={shift.start_time} /> – <ClientTime iso={shift.end_time} />
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className="text-sm font-medium text-label-1 font-mono tabular-nums">
                              {minsUntil <= 0 ? 'now' : `in ${formatDuration(minsUntil)}`}
                            </p>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-label-3 flex-shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Done today ───────────────────────────────────────────── */}
            {done.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-label-2 mb-3">
                  Done today · {done.length}
                </p>
                <div className="rounded-xl border border-[#d3c9b2] overflow-hidden [box-shadow:var(--shadow-sm)]">
                  {done.map(shift => {
                    const emp = (shift.employees as unknown as { name: string } | null)
                    const workedMins = priorMinsByEmployee.get(shift.employee_id) ?? 0
                    const scheduledMins = Math.floor(
                      (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 60000
                    )
                    const diffMins = workedMins - scheduledMins
                    const isOver = diffMins > 15
                    const isShort = diffMins < -15
                    return (
                      <Link
                        key={shift.id}
                        href={`/admin/employees/${shift.employee_id}`}
                        className="block px-4 py-3.5 bg-[#f9f4ea] border-b border-[#d3c9b2] last:border-0 hover:bg-[#f2ece2] active:bg-[#eae3d3] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-label-1 tracking-[-0.01em] truncate">{emp?.name}</p>
                            <p className="text-xs text-label-3 mt-0.5 font-mono tracking-[-0.01em]">
                              <ClientTime iso={shift.start_time} /> – <ClientTime iso={shift.end_time} />
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 shrink-0 ml-4">
                            <p className="text-sm font-medium text-label-1 font-mono tabular-nums">{formatDuration(workedMins)}</p>
                            {isOver && (
                              <p className="text-xs text-orange-600 font-mono tabular-nums">+{formatDuration(diffMins)} over</p>
                            )}
                            {isShort && (
                              <p className="text-xs text-rose-600 font-mono tabular-nums">-{formatDuration(Math.abs(diffMins))} short</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

          </div>
        </>
      )}

    </div>
  )
}
