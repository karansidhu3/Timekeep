import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ClientTime from '@/components/ui/ClientTime'
import ClientDate from '@/components/ui/ClientDate'
import { signOut } from '@/lib/actions/auth'
import { formatElapsed, formatDuration } from '@/lib/utils'

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
    <div className="max-w-2xl mx-auto px-6 pb-nav md:pb-12 pt-page animate-page-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0d0c0b]">Today</h1>
          <p className="text-sm text-[#a8a29e] mt-0.5 tracking-[-0.01em]"><ClientDate /></p>
        </div>
        <form action={signOut} className="md:hidden">
          <button className="text-xs font-medium text-[#a8a29e] hover:text-[#44403c] px-3 py-2 rounded-xl hover:bg-[#f0ede8] transition-colors duration-150 tracking-[-0.01em]">
            Sign out
          </button>
        </form>
      </div>

      {!hasAnyActivity ? (
        <div className="pt-2">
          <p className="text-[2rem] font-semibold tracking-tight text-[#0d0c0b] leading-tight mb-2">
            Nothing today.
          </p>
          <p className="text-sm text-[#a8a29e] tracking-[-0.01em] mb-8">
            No shifts scheduled for today.
          </p>
          <Link
            href="/admin/schedule"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0d0c0b] bg-[#f0ede8] px-4 py-3 rounded-2xl hover:bg-[#e8e4de] active:bg-[#e0dcd6] transition-colors tracking-[-0.01em]"
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
                className="font-mono font-extrabold text-[#0d0c0b] leading-none tabular-nums"
                style={{ fontSize: 'clamp(4rem, 16vw, 5.5rem)' }}
              >
                {totalOnShift}
              </span>
              <span className="text-lg text-[#a8a29e] font-normal tracking-[-0.01em] leading-none">
                {totalScheduled > 0 ? `of ${totalScheduled} on shift` : 'on shift'}
              </span>
            </div>
            {(late.length > 0 || upcoming.length > 0) && (
              <p className="text-sm tracking-[-0.01em]">
                {late.length > 0 && <span className="text-amber-500 font-medium">{late.length} late</span>}
                {late.length > 0 && upcoming.length > 0 && <span className="text-[#d6d3d1] mx-1.5">·</span>}
                {upcoming.length > 0 && <span className="text-[#a8a29e]">{upcoming.length} upcoming</span>}
              </p>
            )}
          </div>

          <div className="space-y-8">

            {/* ── Late — interruption, no card ─────────────────────────── */}
            {late.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mb-3">
                  Late · {late.length}
                </p>
                <div className="border-l-[3px] border-amber-400">
                  {late.map(shift => {
                    const emp = (shift.employees as unknown as { name: string } | null)
                    const minsLate = Math.floor((now.getTime() - new Date(shift.start_time).getTime()) / 60000)
                    return (
                      <Link
                        key={shift.id}
                        href={`/admin/employees/${shift.employee_id}`}
                        className="flex items-center justify-between pl-4 py-3.5 border-b border-amber-100/70 last:border-0 hover:bg-amber-50/60 active:bg-amber-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0d0c0b] tracking-[-0.01em] truncate">{emp?.name}</p>
                          <p className="text-xs text-[#a8a29e] mt-0.5 font-mono tracking-[-0.01em]">
                            shift started <ClientTime iso={shift.start_time} />
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <p className="text-sm font-bold text-amber-500 font-mono tabular-nums">{formatDuration(minsLate)} late</p>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-amber-300 flex-shrink-0">
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
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a8a29e] mb-3">
                    On shift · {clockedIn.length + unscheduledActive.length}
                  </p>
                )}
                <div className="rounded-2xl border border-[#e4e0da] overflow-hidden [box-shadow:var(--shadow-sm)] stagger-fast">
                  {clockedIn.map(({ shift, entry }) => {
                    const emp = (shift.employees as unknown as { name: string } | null)
                    const elapsedSeconds = Math.floor((now.getTime() - new Date(entry.clock_in).getTime()) / 1000)
                    const shiftStart = new Date(shift.start_time)
                    const shiftEnd = new Date(shift.end_time)
                    const progress = Math.min(Math.max(
                      (now.getTime() - shiftStart.getTime()) / (shiftEnd.getTime() - shiftStart.getTime()),
                      0
                    ), 1)
                    const minsLeft = Math.ceil((shiftEnd.getTime() - now.getTime()) / 60000)
                    const isOvertime = minsLeft < 0

                    return (
                      <Link
                        key={shift.id}
                        href={`/admin/employees/${shift.employee_id}`}
                        className="block px-4 py-4 bg-[#fffefb] border-b border-[#e4e0da] last:border-0 hover:bg-[#f7f5f2] active:bg-[#f0ede8] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse-live" />
                            <p className="text-sm font-semibold text-[#0d0c0b] tracking-[-0.01em] truncate">{emp?.name}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className={`text-base font-semibold font-mono tabular-nums ${isOvertime ? 'text-amber-500' : 'text-[#0d0c0b]'}`}>
                              {formatElapsed(elapsedSeconds)}
                            </p>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-[#c4bfba] flex-shrink-0">
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
                          <p className="text-xs text-[#a8a29e] font-mono tracking-[-0.01em]">
                            {isOvertime ? (
                              <span className="text-amber-500">+{formatDuration(Math.abs(minsLeft))} over</span>
                            ) : minsLeft <= 60 ? (
                              <>ends <ClientTime iso={shift.end_time} /><span className="text-[#c4bfba]"> · {minsLeft}m left</span></>
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
                        className="block px-4 py-4 bg-[#fffefb] border-b border-[#e4e0da] last:border-0 hover:bg-[#f7f5f2] active:bg-[#f0ede8] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse-live" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0d0c0b] tracking-[-0.01em] truncate">{emp?.name}</p>
                              <p className="text-xs text-[#a8a29e] mt-0.5 tracking-[-0.01em]">No shift scheduled</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className="text-base font-semibold text-[#0d0c0b] font-mono tabular-nums">
                              {formatElapsed(elapsedSeconds)}
                            </p>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-[#c4bfba] flex-shrink-0">
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
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a8a29e] mb-3">
                  Upcoming · {upcoming.length}
                </p>
                <div className="rounded-2xl border border-[#e4e0da] overflow-hidden [box-shadow:var(--shadow-sm)] stagger-fast">
                  {upcoming.map(shift => {
                    const emp = (shift.employees as unknown as { name: string } | null)
                    const minsUntil = Math.ceil((new Date(shift.start_time).getTime() - now.getTime()) / 60000)
                    return (
                      <Link
                        key={shift.id}
                        href={`/admin/employees/${shift.employee_id}`}
                        className="block px-4 py-3.5 bg-[#fffefb] border-b border-[#e4e0da] last:border-0 hover:bg-[#f7f5f2] active:bg-[#f0ede8] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1a1917] tracking-[-0.01em] truncate">{emp?.name}</p>
                            <p className="text-xs text-[#a8a29e] mt-0.5 font-mono tracking-[-0.01em]">
                              <ClientTime iso={shift.start_time} /> – <ClientTime iso={shift.end_time} />
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <p className="text-sm font-semibold text-[#a8a29e] font-mono tabular-nums">
                              {minsUntil <= 0 ? 'now' : `in ${formatDuration(minsUntil)}`}
                            </p>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-[#c4bfba] flex-shrink-0">
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

          </div>
        </>
      )}

    </div>
  )
}
