import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, differenceInMinutes } from 'date-fns'
import { getWeekRange } from '@/lib/utils'
import TimeEntriesManager, { type TimeEntryRow, type WeeklySummary } from '@/components/admin/TimeEntriesManager'

export default async function TimeEntriesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { start: weekStart, end: weekEnd } = getWeekRange(0)

  const [{ data: entries }, { data: employees }, { data: weekShifts }] = await Promise.all([
    supabase
      .from('time_entries')
      .select('id, clock_in, clock_out, notes, employee_id, employees(name)')
      .order('clock_in', { ascending: false })
      .limit(200),
    supabase
      .from('employees')
      .select('id, name')
      .eq('active', true)
      .order('name'),
    supabase
      .from('shifts')
      .select('employee_id, start_time, end_time')
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString()),
  ])

  const rows: TimeEntryRow[] = (entries ?? []).map(e => ({
    id: e.id,
    clock_in: e.clock_in,
    clock_out: e.clock_out,
    notes: e.notes,
    employee_id: e.employee_id,
    employee_name: (e.employees as unknown as { name: string } | null)?.name ?? 'Unknown',
  }))

  // ── Weekly summary ─────────────────────────────────────────────────────────
  const scheduledMap = new Map<string, number>()
  for (const s of weekShifts ?? []) {
    const mins = differenceInMinutes(new Date(s.end_time), new Date(s.start_time))
    scheduledMap.set(s.employee_id, (scheduledMap.get(s.employee_id) ?? 0) + mins)
  }

  const workedMap = new Map<string, number>()
  const activeSet = new Set<string>()
  const now = new Date()

  for (const row of rows) {
    const entryDate = new Date(row.clock_in)
    if (entryDate >= weekStart && entryDate <= weekEnd) {
      const mins = differenceInMinutes(row.clock_out ? new Date(row.clock_out) : now, entryDate)
      workedMap.set(row.employee_id, (workedMap.get(row.employee_id) ?? 0) + mins)
      if (!row.clock_out) activeSet.add(row.employee_id)
    }
  }

  const weeklySummaries: WeeklySummary[] = (employees ?? [])
    .map(emp => ({
      employee_id: emp.id,
      employee_name: emp.name,
      scheduled_minutes: scheduledMap.get(emp.id) ?? 0,
      worked_minutes: workedMap.get(emp.id) ?? 0,
      has_active_entry: activeSet.has(emp.id),
    }))
    .filter(s => s.scheduled_minutes > 0 || s.worked_minutes > 0)

  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`

  return (
    <div className="max-w-4xl mx-auto px-6 pb-10 pt-page animate-page-in">
      <h1 className="text-3xl font-semibold tracking-tight text-[#0d0c0b] mb-8">Time entries</h1>
      <TimeEntriesManager
        entries={rows}
        employees={employees ?? []}
        weeklySummaries={weeklySummaries}
        weekLabel={weekLabel}
      />
    </div>
  )
}
