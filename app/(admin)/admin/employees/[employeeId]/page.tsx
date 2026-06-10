import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInMinutes } from 'date-fns'
import { getWeekRange, formatDuration } from '@/lib/utils'
import TimeEntriesManager, { type TimeEntryRow } from '@/components/admin/TimeEntriesManager'
import EditEmployeeForm from './EditEmployeeForm'

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
  const barColor = isOvertime ? 'bg-amber-400' : isActive ? 'bg-green-500' : 'bg-stone-900'

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
    <div className="max-w-2xl mx-auto px-6 pb-10 pt-page animate-page-in">

      {/* ── Back link ────────────────────────────────────────────────── */}
      <Link
        href="/admin/employees"
        className="inline-flex items-center gap-1.5 text-sm text-[#a8a29e] hover:text-[#44403c] transition-colors mb-6 -mt-1 py-1"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Employees
      </Link>

      {/* ── Employee header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isActive ? 'bg-green-100' : 'bg-[#f0ede8]'
          }`}>
            <span className={`text-sm font-semibold ${isActive ? 'text-green-700' : 'text-[#78716c]'}`}>
              {initials}
            </span>
          </div>
          {isActive && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#f7f5f2]" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0d0c0b]">{employee.name}</h1>
          <p className="text-sm text-[#a8a29e] mt-0.5 capitalize tracking-[-0.01em]">{employee.role}</p>
          {isActive && (
            <p className="text-xs text-green-600 font-medium mt-1 tabular-nums tracking-[-0.01em]">
              Clocked in · {formatDuration(elapsedMins)}
            </p>
          )}
        </div>
      </div>

      {/* ── This week summary ──────────────────────────────────────── */}
      {showWeeklySummary && (
        <div className="mb-8 bg-[#fffefb] rounded-2xl border border-[#e4e0da] [box-shadow:var(--shadow-sm)] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a8a29e]">This week</p>
            <p className="text-xs text-[#a8a29e] tabular-nums font-mono">{weekLabel}</p>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-lg font-semibold text-[#0d0c0b] tabular-nums font-mono">{formatDuration(workedMinutes)}</p>
            <p className="text-xs text-[#a8a29e] tabular-nums font-mono">
              of {formatDuration(scheduledMinutes)} scheduled
            </p>
          </div>
          <div className="h-0.5 bg-[#f0ede8] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct * 100}%` }} />
          </div>
          {isOvertime && (
            <p className="text-xs text-amber-500 font-medium mt-2 tabular-nums tracking-[-0.01em]">
              +{formatDuration(workedMinutes - scheduledMinutes)} over scheduled
            </p>
          )}
        </div>
      )}

      {/* ── Time entry history ─────────────────────────────────────── */}
      <TimeEntriesManager
        entries={rows}
        employees={[{ id: employee.id, name: employee.name }]}
        weekLabel={weekLabel}
      />

      {/* ── Settings ───────────────────────────────────────────────── */}
      <div className="mt-12 pt-8 border-t border-[#e4e0da]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a8a29e] mb-6">
          Settings
        </p>
        <EditEmployeeForm employee={employee} />
      </div>

    </div>
  )
}
