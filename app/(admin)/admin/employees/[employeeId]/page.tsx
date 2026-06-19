import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInMinutes } from 'date-fns'
import { getWeekRange, formatDuration } from '@/lib/utils'
import TimeEntriesManager, { type TimeEntryRow } from '@/components/admin/TimeEntriesManager'
import EditEmployeeForm from './EditEmployeeForm'
import AdminClockInButton from '@/components/admin/AdminClockInButton'

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { employeeId } = await params
  const { start: weekStart, end: weekEnd } = getWeekRange(0)
  const now = new Date()

  const [
    { data: employee },
    { data: entries },
    { data: weekShifts },
    { data: openEntry },
  ] = await Promise.all([
    supabase
      .from('employees')
      .select('id, name, role, active')
      .eq('id', employeeId)
      .single(),
    supabase
      .from('time_entries')
      .select('id, clock_in, clock_out, notes, employee_id')
      .eq('employee_id', employeeId)
      .order('clock_in', { ascending: false })
      .limit(200),
    supabase
      .from('shifts')
      .select('start_time, end_time')
      .eq('employee_id', employeeId)
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString()),
    supabase
      .from('time_entries')
      .select('id, clock_in')
      .eq('employee_id', employeeId)
      .is('clock_out', null)
      .maybeSingle(),
  ])

  if (!employee) notFound()

  // ── Weekly summary ──────────────────────────────────────────────────────────
  const scheduledMinutes = (weekShifts ?? []).reduce(
    (sum, s) => sum + differenceInMinutes(new Date(s.end_time), new Date(s.start_time)),
    0,
  )

  const workedMinutes = (entries ?? [])
    .filter(e => {
      const d = new Date(e.clock_in)
      return d >= weekStart && d <= weekEnd
    })
    .reduce(
      (sum, e) => sum + differenceInMinutes(e.clock_out ? new Date(e.clock_out) : now, new Date(e.clock_in)),
      0,
    )

  const isActive = !!openEntry
  const pct = scheduledMinutes > 0
    ? Math.min(workedMinutes / scheduledMinutes, 1)
    : workedMinutes > 0 ? 1 : 0
  const isOvertime = workedMinutes > scheduledMinutes + 15
  const barColor = isOvertime ? 'bg-amber-400' : isActive ? 'bg-[#4a7c59]' : 'bg-[#141210]'

  // Elapsed time since clock-in (static snapshot — not live)
  const elapsedMins = openEntry
    ? differenceInMinutes(now, new Date(openEntry.clock_in))
    : 0

  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`
  const initials = employee.name
    .trim()
    .split(/\s+/)
    .map((n: string) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const rows: TimeEntryRow[] = (entries ?? []).map(e => ({
    id: e.id,
    clock_in: e.clock_in,
    clock_out: e.clock_out,
    notes: e.notes,
    employee_id: e.employee_id,
    employee_name: employee.name,
  }))

  const showWeeklySummary = scheduledMinutes > 0 || workedMinutes > 0

  return (
    <div className="max-w-2xl mx-auto px-6 pb-10 pt-page">

      {/* ── Back link ────────────────────────────────────────────────── */}
      <Link
        href="/admin/employees"
        className="inline-flex items-center gap-1 px-3 py-2 -ml-1 mb-5 rounded-xl bg-[#eae3d3] hover:bg-[#ddd4be] active:bg-[#d3c9b2] text-sm font-medium text-label-1 transition-colors tracking-[-0.01em]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Employees
      </Link>

      {/* ── Employee header ─────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isActive ? 'bg-[#eef4f1]' : 'bg-[#eae3d3]'
            }`}>
              <span className={`text-sm font-semibold ${isActive ? 'text-[#3d6b55]' : 'text-label-3'}`}>
                {initials}
              </span>
            </div>
            {isActive && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4a7c59] border-2 border-[#f2ece2]" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-label-1">{employee.name}</h1>
            <p className="text-sm text-label-3 mt-0.5 capitalize tracking-[-0.01em]">{employee.role}</p>
            {isActive && (
              <p className="text-xs text-[#3d6b55] font-medium mt-1 tabular-nums tracking-[-0.01em]">
                Clocked in · {formatDuration(elapsedMins)}
              </p>
            )}
          </div>
        </div>
        {!isActive && (
          <AdminClockInButton
            employeeId={employee.id}
            firstName={employee.name.trim().split(/\s+/)[0]}
          />
        )}
      </div>

      {/* ── This week summary ──────────────────────────────────────── */}
      {showWeeklySummary && (
        <div className="mb-10 bg-[#f9f4ea] rounded-xl border border-[#d3c9b2] [box-shadow:var(--shadow-sm)] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-label-3">This week</p>
            <p className="text-xs text-label-3 tabular-nums">{weekLabel}</p>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-lg font-medium text-label-1 tabular-nums">{formatDuration(workedMinutes)}</p>
            <p className="text-xs text-label-3 tabular-nums">
              of {formatDuration(scheduledMinutes)} scheduled
            </p>
          </div>
          <div className="h-0.5 bg-[#eae3d3] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct * 100}%` }} />
          </div>
          {isOvertime && (
            <p className="text-xs text-orange-600 font-medium mt-2 tabular-nums tracking-[-0.01em]">
              +{formatDuration(workedMinutes - scheduledMinutes)} over scheduled
            </p>
          )}
        </div>
      )}

      {/* ── Settings ───────────────────────────────────────────────── */}
      <div className="mb-10">
        <EditEmployeeForm employee={employee} />
      </div>

      {/* ── Time entry history ─────────────────────────────────────── */}
      <div className="pt-8 border-t border-[#d3c9b2]">
        <TimeEntriesManager
          entries={rows}
          employees={[{ id: employee.id, name: employee.name }]}
          weekLabel={weekLabel}
          collapsible
        />
      </div>

    </div>
  )
}
