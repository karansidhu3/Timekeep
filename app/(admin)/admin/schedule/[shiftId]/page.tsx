import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { formatShiftRange } from '@/lib/utils'
import EditShiftForm from './EditShiftForm'

export default async function EditShiftPage({ params }: { params: Promise<{ shiftId: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { shiftId } = await params

  const [{ data: shift }, { data: employees }] = await Promise.all([
    supabase.from('shifts').select('*').eq('id', shiftId).single(),
    supabase.from('employees').select('id, name').eq('active', true).order('name'),
  ])

  if (!shift) notFound()

  const employeeName = (employees ?? []).find(e => e.id === shift.employee_id)?.name ?? ''
  const firstName = employeeName.trim().split(/\s+/)[0] || 'Shift'
  const shiftDate = format(new Date(shift.start_time), 'EEE, MMM d')
  const timeRange = formatShiftRange(shift.start_time, shift.end_time)

  return (
    <div className="max-w-lg mx-auto px-6 pb-10 pt-page animate-page-in">
      <Link
        href="/admin/schedule"
        className="inline-flex items-center gap-1 px-3 py-2 -ml-1 mb-5 rounded-xl bg-[#eae3d3] hover:bg-[#ddd4be] active:bg-[#d3c9b2] text-sm font-medium text-label-1 transition-colors tracking-[-0.01em]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Schedule
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-label-1">{firstName}</h1>
        <p className="text-sm text-label-3 mt-0.5 tracking-[-0.01em]">{shiftDate} · {timeRange}</p>
      </div>
      <EditShiftForm shift={shift} employees={employees ?? []} />
    </div>
  )
}
