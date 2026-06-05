import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
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

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-stone-900 mb-8">Edit shift</h1>
      <EditShiftForm shift={shift} employees={employees ?? []} />
    </div>
  )
}
