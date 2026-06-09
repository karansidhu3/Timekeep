import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import EditEmployeeForm from './EditEmployeeForm'

export default async function EditEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { employeeId } = await params
  const { data: employee } = await supabase
    .from('employees')
    .select('id, name, role, active')
    .eq('id', employeeId)
    .single()

  if (!employee) notFound()

  return (
    <div className="max-w-lg mx-auto px-6 pb-10 pt-page animate-page-in">
      <Link
        href="/admin/employees"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors mb-6 -mt-1"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Employees
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-8">{employee.name}</h1>
      <EditEmployeeForm employee={employee} />
    </div>
  )
}
