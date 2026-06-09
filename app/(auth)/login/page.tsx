import { createServerClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'
import Logo from '@/components/ui/Logo'

export default async function LoginPage() {
  const supabase = await createServerClient()

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, role')
    .eq('active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col px-4 pb-8 pt-page animate-page-in">
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-10">
          <Logo size="lg" />
        </div>
        <LoginForm employees={employees ?? []} />
      </div>
    </div>
  )
}
