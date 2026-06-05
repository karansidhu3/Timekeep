import { createServerClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const supabase = await createServerClient()

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name')
    .eq('active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col px-4 pb-8 pt-page">
      <div className="w-full max-w-sm mx-auto">
        <h1 className="text-xl font-semibold text-stone-900 tracking-tight mb-6">Timekeep</h1>
        <LoginForm employees={employees ?? []} />
      </div>
    </div>
  )
}
