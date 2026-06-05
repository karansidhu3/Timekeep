import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (employee?.role === 'admin') redirect('/admin/dashboard')
  redirect('/dashboard')
}
