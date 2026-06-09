import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import NewEmployeeButton from '@/components/admin/NewEmployeeButton'

export default async function EmployeesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, role, active, created_at')
    .order('name')

  return (
    <div className="max-w-3xl mx-auto px-6 pb-10 pt-page animate-page-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Employees</h1>
        <NewEmployeeButton />
      </div>

      <div className="space-y-2">
        {(employees ?? []).map(emp => (
          <Card key={emp.id} hoverable className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-stone-900">{emp.name}</p>
                <p className="text-xs text-stone-400 mt-0.5 capitalize">{emp.role}</p>
              </div>
              {!emp.active && <Badge variant="warning">Inactive</Badge>}
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
