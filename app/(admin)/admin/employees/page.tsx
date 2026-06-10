import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
    <div className="max-w-2xl mx-auto px-6 pb-12 pt-page animate-page-in">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0d0c0b]">People</h1>
        <NewEmployeeButton />
      </div>

      <div className="rounded-2xl border border-[#e4e0da] overflow-hidden [box-shadow:var(--shadow-sm)] stagger">
        {(employees ?? []).map(emp => {
          const initials = emp.name.trim().split(/\s+/).map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
          const isClockedIn = clockedInSet.has(emp.id)

          return (
            <Link
              key={emp.id}
              href={`/admin/employees/${emp.id}`}
              className="flex items-center justify-between px-4 py-3.5 bg-[#fffefb] border-b border-[#e4e0da]
                last:border-0 hover:bg-[#f7f5f2] active:bg-[#f0ede8] transition-colors duration-150 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isClockedIn ? 'bg-green-100' : 'bg-[#f0ede8]'
                  }`}>
                    <span className={`text-xs font-semibold ${isClockedIn ? 'text-green-700' : 'text-[#78716c]'}`}>
                      {initials}
                    </span>
                  </div>
                  {isClockedIn && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#fffefb]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#0d0c0b] tracking-[-0.01em]">{emp.name}</p>
                    {!emp.active && <Badge variant="warning">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-[#a8a29e] mt-0.5 capitalize tracking-[-0.01em]">{emp.role}</p>
                </div>
              </div>

              <svg
                className="w-4 h-4 text-[#d6d3d1] group-hover:text-[#a8a29e] transition-colors duration-150 flex-shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )
        })}

        {(employees ?? []).length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#a8a29e] tracking-[-0.01em]">No employees yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
