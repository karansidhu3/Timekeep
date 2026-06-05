import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TemplateManager, { type TemplateRow } from '@/components/admin/TemplateManager'

export default async function TemplatesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: employees }, { data: templates }] = await Promise.all([
    supabase
      .from('employees')
      .select('id, name')
      .eq('active', true)
      .order('name'),
    supabase
      .from('schedule_templates')
      .select('id, employee_id, day_of_week, start_time, end_time, notes')
      .order('day_of_week'),
  ])

  return (
    <div className="max-w-2xl mx-auto px-6 pb-10 pt-page">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Weekly templates</h1>
        <p className="text-sm text-stone-400 mt-1">
          Set each person&apos;s recurring weekly pattern. Apply it to any week from the Schedule page.
        </p>
      </div>

      <TemplateManager
        employees={employees ?? []}
        templates={(templates ?? []) as TemplateRow[]}
      />
    </div>
  )
}
