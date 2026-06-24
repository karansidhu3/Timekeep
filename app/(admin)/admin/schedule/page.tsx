import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, addDays, isSameDay, differenceInMinutes } from 'date-fns'
import { getWeekRange, formatShiftRange, weekdayIndexPST } from '@/lib/utils'
import Link from 'next/link'
import AdminWeekNav from '@/components/admin/AdminWeekNav'
import NewShiftButton from '@/components/admin/NewShiftButton'
import ScheduleOptionsMenu from '@/components/admin/ScheduleOptionsMenu'

function fmtMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; dir?: string }>
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const weekOffset = parseInt(params.week ?? '0', 10)
  const dir = params.dir as 'next' | 'prev' | undefined
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

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const shiftCount = (shifts ?? []).length

  type ShiftRow = { id: string; start_time: string; end_time: string; notes: string | null; employee_id: string }

  // First name lookup
  const nameMap = new Map((employees ?? []).map(e => [e.id, e.name.trim().split(/\s+/)[0]]))

  // Group shifts by day index (0=Sun … 6=Sat)
  const dayShiftsMap = new Map<number, ShiftRow[]>()
  for (const shift of (shifts ?? []) as ShiftRow[]) {
    const dayIdx = weekdayIndexPST(shift.start_time)
    if (!dayShiftsMap.has(dayIdx)) dayShiftsMap.set(dayIdx, [])
    dayShiftsMap.get(dayIdx)!.push(shift)
  }

  const today = new Date()

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pb-nav md:pb-12 pt-page">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mb-6">
        {/* Row 1: Title + options menu + primary action */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-3xl font-semibold tracking-tight text-label-1">Schedule</h1>
          <div className="flex items-center gap-2">
            <ScheduleOptionsMenu templates={templates ?? []} weekStart={start} />
            <NewShiftButton employees={employees ?? []} weekStart={start.toISOString()} />
          </div>
        </div>
        {/* Row 2: Week nav + date range */}
        <div className="flex items-center gap-2.5">
          <AdminWeekNav weekOffset={weekOffset} />
          <p className="text-sm text-label-2 tracking-[-0.01em]">
            {format(start, 'MMM d')} – {format(end, 'MMM d')}
            {shiftCount > 0 && (
              <span className="ml-1.5">· {shiftCount} {shiftCount !== 1 ? 'shifts' : 'shift'}</span>
            )}
          </p>
        </div>
      </div>

      {(employees ?? []).length === 0 ? (
        <p className={`text-sm text-label-3 py-4 ${!dir ? 'animate-page-in' : ''}`}>No employees yet.</p>
      ) : (
        <div className={`space-y-5 ${dir === 'next' ? 'animate-slide-right' : dir === 'prev' ? 'animate-slide-left' : 'animate-page-in'}`}>
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            const dayShifts = dayShiftsMap.get(i) ?? []

            return (
              <div key={day.toISOString()}>

                {/* ── Day header ─────────────────────────────────────── */}
                <div className="flex items-center gap-3 mb-1.5">
                  <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                    isToday ? 'bg-[#141210]' : 'bg-[#eae3d3]'
                  }`}>
                    <p className={`text-[8px] font-bold uppercase tracking-widest leading-none ${
                      isToday ? 'text-white/50' : 'text-label-3'
                    }`}>{format(day, 'EEE')}</p>
                    <p className={`text-sm font-semibold leading-none mt-0.5 ${
                      isToday ? 'text-white' : 'text-label-2'
                    }`}>{format(day, 'd')}</p>
                  </div>
                  <p className={`text-sm tracking-[-0.01em] ${
                    isToday ? 'font-semibold text-label-1' : 'text-label-3'
                  }`}>
                    {format(day, 'EEEE, MMM d')}
                    {isToday && <span className="ml-2 text-[11px] font-semibold text-label-3 uppercase tracking-widest">Today</span>}
                  </p>
                </div>

                {/* ── Shifts ─────────────────────────────────────────── */}
                {dayShifts.length > 0 ? (
                  <div className="ml-12 rounded-xl border border-[#d3c9b2] overflow-hidden [box-shadow:var(--shadow-sm)]">
                    {dayShifts.map(shift => {
                      const mins = differenceInMinutes(new Date(shift.end_time), new Date(shift.start_time))
                      const firstName = nameMap.get(shift.employee_id) ?? '?'
                      return (
                        <Link
                          key={shift.id}
                          href={`/admin/schedule/${shift.id}`}
                          className="flex items-center justify-between px-4 py-3 bg-[#f9f4ea] border-b border-[#d3c9b2] last:border-0 hover:bg-[#f2ece2] active:bg-[#eae3d3] transition-colors duration-150 group"
                        >
                          <p className="text-sm font-semibold text-label-1 tracking-[-0.01em]">
                            {firstName}
                          </p>
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-label-2 tracking-[-0.01em]">
                              {formatShiftRange(shift.start_time, shift.end_time)}
                            </p>
                            <p className="text-xs text-label-2 tabular-nums w-7 text-right">
                              {fmtMinutes(mins)}
                            </p>
                            <svg
                              className="w-3.5 h-3.5 text-label-3 group-hover:text-label-2 transition-colors flex-shrink-0"
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p className="ml-12 text-sm text-label-3 tracking-[-0.01em] py-1">
                    No shifts
                  </p>
                )}

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
