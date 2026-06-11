import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, eachDayOfInterval, isSameDay, differenceInMinutes } from 'date-fns'
import { getWeekRange, compactTimePST, weekdayIndexPST } from '@/lib/utils'
import Link from 'next/link'
import AdminWeekNav from '@/components/admin/AdminWeekNav'
import NewShiftButton from '@/components/admin/NewShiftButton'
import ApplyTemplateButton from '@/components/admin/ApplyTemplateButton'

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

  type ShiftRow = { id: string; start_time: string; end_time: string; notes: string | null; employee_id: string }

  const rotaMap = new Map<string, Map<number, ShiftRow>>()
  const hoursMap = new Map<string, number>()

  for (const shift of (shifts ?? []) as ShiftRow[]) {
    const dayIdx = weekdayIndexPST(shift.start_time)
    if (!rotaMap.has(shift.employee_id)) rotaMap.set(shift.employee_id, new Map())
    rotaMap.get(shift.employee_id)!.set(dayIdx, shift)
    const mins = differenceInMinutes(new Date(shift.end_time), new Date(shift.start_time))
    hoursMap.set(shift.employee_id, (hoursMap.get(shift.employee_id) ?? 0) + mins)
  }

  const today = new Date()

  return (
    <div className="max-w-5xl mx-auto px-6 pb-nav md:pb-12 pt-page animate-page-in">

      {/* ── Header — two-row layout fits any screen width ─────────── */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-[#0d0c0b]">Schedule</h1>
          <AdminWeekNav weekOffset={weekOffset} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#a8a29e] tracking-[-0.01em] font-mono">
            {format(start, 'MMM d')} – {format(end, 'MMM d')}
            {shiftCount > 0 && (
              <span className="ml-1.5 text-[#c4bfba]">· {shiftCount} {shiftCount !== 1 ? 'shifts' : 'shift'}</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ApplyTemplateButton templates={templates ?? []} weekStart={start} />
            </div>
            <NewShiftButton employees={employees ?? []} weekStart={start.toISOString()} />
          </div>
        </div>
      </div>

      {(employees ?? []).length === 0 ? (
        <p className="text-sm text-[#a8a29e] py-4">No employees yet.</p>
      ) : (
        /* Horizontal-scroll wrapper: edge-to-edge on mobile, normal on md+ */
        <div className="-mx-6 overflow-x-auto md:overflow-visible md:mx-0 pb-2">
          <div className="px-6 md:px-0" style={{ minWidth: '480px' }}>

            {/* ── Day header row ─────────────────────────────────────── */}
            <div
              className="grid gap-px mb-1"
              style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}
            >
              <div />
              {weekDays.map(day => {
                const isToday = isSameDay(day, today)
                return (
                  <div key={day.toISOString()} className={`text-center py-2 rounded-lg ${isToday ? 'bg-[#141210]' : ''}`}>
                    <p className={`text-[9px] font-bold uppercase tracking-widest leading-none ${
                      isToday ? 'text-white/50' : 'text-[#c4bfba]'
                    }`}>
                      {format(day, 'EEE')[0]}
                    </p>
                    <p className={`text-xs mt-0.5 font-mono tabular-nums ${
                      isToday ? 'text-white font-semibold' : 'text-[#78716c]'
                    }`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* ── Employee rows ───────────────────────────────────────── */}
            <div className="space-y-px stagger">
              {(employees ?? []).map(emp => {
                const empShifts = rotaMap.get(emp.id)
                const totalMins = hoursMap.get(emp.id) ?? 0
                const firstName = emp.name.trim().split(/\s+/)[0]

                return (
                  <div
                    key={emp.id}
                    className="grid gap-px items-stretch"
                    style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}
                  >
                    {/* Name + hours */}
                    <div className="flex flex-col justify-center pr-2 py-1.5 min-w-0">
                      <p className="text-xs font-semibold text-[#0d0c0b] truncate tracking-[-0.01em]">{firstName}</p>
                      <p className="text-[10px] text-[#a8a29e] mt-0.5 font-mono tabular-nums">
                        {totalMins > 0 ? fmtMinutes(totalMins) : <span className="text-[#e4e0da]">—</span>}
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
                            className={`h-12 rounded-xl flex items-center justify-center ${
                              isToday ? 'bg-[#141210]/5' : 'bg-[#f0ede8]/40'
                            }`}
                          >
                            <span className="text-[10px] text-[#e4e0da]">·</span>
                          </div>
                        )
                      }

                      return (
                        <Link
                          key={dayIdx}
                          href={`/admin/schedule/${shift.id}`}
                          className={`h-12 rounded-xl flex flex-col items-center justify-center gap-px
                            transition-all duration-150 hover:opacity-80 active:scale-[0.96] ${
                            isToday
                              ? 'bg-[#141210]'
                              : 'bg-[#1e1c19]'
                          }`}
                        >
                          <span className="text-[10px] font-semibold text-white/90 font-mono tabular-nums leading-none">
                            {compactTimePST(shift.start_time)}
                          </span>
                          <span className="text-[10px] text-white/35 font-mono tabular-nums leading-none">
                            {compactTimePST(shift.end_time)}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {shiftCount === 0 && (
              <p className="text-sm text-[#a8a29e] pt-8 text-center tracking-[-0.01em]">
                No shifts this week — add one above.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
