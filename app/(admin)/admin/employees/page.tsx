import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import NewEmployeeButton from '@/components/admin/NewEmployeeButton'

export default async function EmployeesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: employees }, { data: openEntries }] = await Promise.all([
    supabase
      .from('employees')
      .select('id, name, role, active, created_at')
      .order('name'),
    supabase
      .from('time_entries')
      .select('employee_id')
      .is('clock_out', null),
  ])

  const clockedInSet = new Set((openEntries ?? []).map(e => e.employee_id))

  return (
    <div className="max-w-3xl mx-auto px-6 pb-10 pt-page animate-page-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Employees</h1>
        <NewEmployeeButton />
      </div>

      <div className="space-y-2 stagger">
        {(employees ?? []).map(emp => (
          <Card key={emp.id} hoverable className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-stone-500">
                    {emp.name.trim().split(/\s+/).map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                  </span>
                </div>
                {clockedInSet.has(emp.id) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#faf9f7]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-stone-900">{emp.name}</p>
                  {!emp.active && <Badge variant="warning">Inactive</Badge>}
                </div>
                <p className="text-xs text-stone-400 mt-0.5 capitalize">{emp.role}</p>
              </div>
            </div>
            <Link
              href={`/admin/employees/${emp.id}`}
              className="text-sm text-stone-400 hover:text-stone-700 px-3 py-3 rounded-xl hover:bg-stone-50 transition-colors min-h-[44px] flex items-center"
            >
              Edit
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
