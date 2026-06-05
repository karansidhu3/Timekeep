import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDuration, calcDurationMinutes } from '@/lib/utils'
import ClientTime from '@/components/ui/ClientTime'

export default async function TimeEntriesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entries } = await supabase
    .from('time_entries')
    .select('id, clock_in, clock_out, notes, employees(name)')
    .order('clock_in', { ascending: false })
    .limit(200)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-stone-900 mb-8">Time entries</h1>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3">Employee</th>
              <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3">Clock in</th>
              <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3">Clock out</th>
              <th className="text-left text-xs font-medium text-stone-400 uppercase tracking-wide px-4 py-3">Duration</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-stone-400 text-center">No time entries yet.</td>
              </tr>
            ) : (
              (entries ?? []).map(entry => {
                const duration = calcDurationMinutes(entry.clock_in, entry.clock_out)
                return (
                  <tr key={entry.id} className="border-b border-stone-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {(entry.employees as unknown as { name: string } | null)?.name}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      <ClientTime iso={entry.clock_in} fmt="MMM d, h:mm a" />
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {entry.clock_out
                        ? <ClientTime iso={entry.clock_out} fmt="MMM d, h:mm a" />
                        : <Badge variant="success">Active</Badge>}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {formatDuration(duration)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  )
}
