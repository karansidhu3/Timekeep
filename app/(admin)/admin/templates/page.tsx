import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
      <Link
        href="/admin/schedule"
        className="inline-flex items-center gap-1 px-3 py-2 -ml-1 mb-5 rounded-xl bg-[#eae3d3] hover:bg-[#ddd4be] active:bg-[#d3c9b2] text-sm font-medium text-label-1 transition-colors tracking-[-0.01em]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Schedule
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-label-1">Weekly templates</h1>
        <p className="text-sm text-label-3 mt-1 tracking-[-0.01em]">
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
