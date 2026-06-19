import { createServerClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'
import { LogoMark } from '@/components/ui/Logo'

export default async function LoginPage() {
  const supabase = await createServerClient()

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, role')
    .eq('active', true)
    .order('name')

  return (
    <div
      className="min-h-screen bg-[#f2ece2] flex flex-col"
      style={{ paddingTop: 'max(2rem, env(safe-area-inset-top, 0px))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full max-w-sm mx-auto px-6 flex flex-col flex-1">

        {/* Wordmark */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <LogoMark size={18} color="#0d0c0b" />
            <span className="text-sm font-semibold tracking-tight text-label-1">Timekeep</span>
          </div>
        </div>

        {/* Form */}
        <LoginForm employees={employees ?? []} />

      </div>
    </div>
  )
}
