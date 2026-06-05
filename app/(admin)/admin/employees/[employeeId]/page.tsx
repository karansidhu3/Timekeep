import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
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
    <div className="max-w-lg mx-auto px-6 pb-10 pt-page">
      <h1 className="text-2xl font-semibold text-stone-900 mb-8">Edit employee</h1>
      <EditEmployeeForm employee={employee} />
    </div>
  )
}
