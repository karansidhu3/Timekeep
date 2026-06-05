import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TimeEntriesManager, { type TimeEntryRow } from '@/components/admin/TimeEntriesManager'

export default async function TimeEntriesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: entries }, { data: employees }] = await Promise.all([
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
  ])

  // Flatten nested employee name for the client component
  const rows: TimeEntryRow[] = (entries ?? []).map(e => ({
    id: e.id,
    clock_in: e.clock_in,
    clock_out: e.clock_out,
    notes: e.notes,
    employee_id: e.employee_id,
    employee_name: (e.employees as unknown as { name: string } | null)?.name ?? 'Unknown',
  }))

  return (
    <div className="max-w-4xl mx-auto px-6 pb-10 pt-page">
      <h1 className="text-2xl font-semibold text-stone-900 mb-8">Time entries</h1>
      <TimeEntriesManager entries={rows} employees={employees ?? []} />
    </div>
  )
}
