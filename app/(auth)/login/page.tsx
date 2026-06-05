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
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Timekeep</h1>
          <p className="text-sm text-stone-500 mt-1">Sign in to continue</p>
        </div>
        <LoginForm employees={employees ?? []} />
      </div>
    </div>
  )
}
