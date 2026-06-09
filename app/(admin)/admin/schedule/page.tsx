import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, eachDayOfInterval, isSameDay, differenceInMinutes } from 'date-fns'
import { getWeekRange } from '@/lib/utils'
import Link from 'next/link'
import AdminWeekNav from '@/components/admin/AdminWeekNav'
import NewShiftButton from '@/components/admin/NewShiftButton'
import ApplyTemplateButton from '@/components/admin/ApplyTemplateButton'

// Compact 12h time: "9", "9:30", "12" — no am/pm for display in tight chips
function compactTime(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  const h12 = h % 12 || 12
  return m === 0 ? String(h12) : `${h12}:${String(m).padStart(2, '0')}`
}

function fmtMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const weekOffset = parseInt(params.week ?? '0', 10)
  const { start, end } = getWeekRange(weekOffset)

  const [{ data: shifts }, { data: employees }, { data: templates }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, start_time, end_time, notes, employee_id')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time'),
    supabase
      .from('employees')
      .select('id, name')
      .eq('active', true)
      .order('name'),
    supabase
      .from('schedule_templates')
      .select('employee_id, day_of_week, start_time, end_time, notes'),
  ])

  const weekDays = eachDayOfInterval({ start, end })
  const shiftCount = (shifts ?? []).length

  // Build rota: employee_id → dayIndex (0=Mon…6=Sun) → shift
  type ShiftRow = { id: string; start_time: string; end_time: string; notes: string | null; employee_id: string }

  const rotaMap = new Map<string, Map<number, ShiftRow>>()
  const hoursMap = new Map<string, number>()

  for (const shift of (shifts ?? []) as ShiftRow[]) {
    // getDay() returns 0=Sun…6=Sat → normalise to 0=Mon…6=Sun
    const dayIdx = (new Date(shift.start_time).getDay() + 6) % 7
    if (!rotaMap.has(shift.employee_id)) rotaMap.set(shift.employee_id, new Map())
    rotaMap.get(shift.employee_id)!.set(dayIdx, shift)
    const mins = differenceInMinutes(new Date(shift.end_time), new Date(shift.start_time))
    hoursMap.set(shift.employee_id, (hoursMap.get(shift.employee_id) ?? 0) + mins)
  }

  const today = new Date()

  return (
    <div className="max-w-5xl mx-auto px-6 pb-10 pt-page animate-page-in">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Schedule</h1>
          <NewShiftButton employees={employees ?? []} weekStart={start.toISOString()} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-400">
            {format(start, 'MMM d')} – {format(end, 'MMM d')}
            {shiftCount > 0 && (
              <span className="ml-1.5">· {shiftCount} shift{shiftCount !== 1 ? 's' : ''}</span>
            )}
          </p>
          <div className="flex items-center gap-1">
            <ApplyTemplateButton templates={templates ?? []} weekStart={start} />
            <AdminWeekNav weekOffset={weekOffset} />
          </div>
        </div>
      </div>

      {(employees ?? []).length === 0 ? (
        <p className="text-sm text-stone-400 py-4">No employees yet.</p>
      ) : (
        <>
          {/* ── Day header row ──────────────────────────────────── */}
          <div
            className="grid gap-1.5 mb-2"
            style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}
          >
            <div /> {/* name column spacer */}
            {weekDays.map(day => {
              const isToday = isSameDay(day, today)
              return (
                <div key={day.toISOString()} className="text-center">
                  <p className={`text-[9px] font-bold uppercase tracking-widest leading-none ${
                    isToday ? 'text-stone-900' : 'text-stone-300'
                  }`}>
                    {format(day, 'EEE')[0]}
                  </p>
                  <p className={`text-xs mt-0.5 tabular-nums ${
                    isToday ? 'text-stone-900 font-semibold' : 'text-stone-400'
                  }`}>
                    {format(day, 'd')}
                  </p>
                </div>
              )
            })}
          </div>

          {/* ── Employee rows ───────────────────────────────────── */}
          <div className="space-y-1.5">
            {(employees ?? []).map(emp => {
              const empShifts = rotaMap.get(emp.id)
              const totalMins = hoursMap.get(emp.id) ?? 0
              const firstName = emp.name.trim().split(/\s+/)[0]

              return (
                <div
                  key={emp.id}
                  className="grid gap-1.5 items-center bg-[#fffefb] rounded-2xl border border-stone-200 [box-shadow:var(--shadow-sm)] px-2.5 py-2.5"
                  style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}
                >
                  {/* Name + hours */}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-stone-900 truncate">{firstName}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5 tabular-nums">
                      {totalMins > 0 ? fmtMinutes(totalMins) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </p>
                  </div>

                  {/* Day cells */}
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                    const shift = empShifts?.get(dayIdx)
                    const isToday = isSameDay(weekDays[dayIdx], today)

                    if (!shift) {
                      return (
                        <div
                          key={dayIdx}
                          className={`h-11 rounded-xl flex items-center justify-center ${
                            isToday ? 'bg-stone-100/50' : ''
                          }`}
                        >
                          <span className={`text-[10px] ${isToday ? 'text-stone-300' : 'text-stone-200'}`}>
                            —
                          </span>
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={dayIdx}
                        href={`/admin/schedule/${shift.id}`}
                        className={`h-11 rounded-xl flex flex-col items-center justify-center gap-px transition-opacity hover:opacity-75 active:scale-95 ${
                          isToday ? 'bg-stone-900' : 'bg-stone-800'
                        }`}
                      >
                        <span className="text-[9px] font-semibold text-white tabular-nums leading-none">
                          {compactTime(shift.start_time)}
                        </span>
                        <span className="text-[9px] text-white/50 tabular-nums leading-none">
                          {compactTime(shift.end_time)}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* ── Empty week message ─────────────────────────────── */}
          {shiftCount === 0 && (
            <p className="text-sm text-stone-400 pt-6 text-center">
              No shifts this week — add one with the button above.
            </p>
          )}
        </>
      )}
    </div>
  )
}
