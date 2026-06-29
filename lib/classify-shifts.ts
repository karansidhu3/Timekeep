export const LATE_THRESHOLD_MS = 15 * 60 * 1000

export interface ShiftRow {
  id: string
  employee_id: string
  start_time: string
  end_time: string
  notes: string | null
  employees?: unknown
}

export interface OpenEntry {
  id: string
  employee_id: string
  clock_in: string
  employees?: unknown
}

export interface ClassifyResult {
  clockedIn: Array<{ shift: ShiftRow; entry: OpenEntry }>
  upcoming: ShiftRow[]
  late: ShiftRow[]
  done: ShiftRow[]
  unscheduledActive: OpenEntry[]
}

export function classifyShifts(
  todayShifts: ShiftRow[],
  openEntries: OpenEntry[],
  doneEmployeeIds: Set<string>,
  now: Date,
): ClassifyResult {
  const todayLA = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
  const openByEmployee = new Map(openEntries.map(e => [e.employee_id, e]))

  const clockedIn: Array<{ shift: ShiftRow; entry: OpenEntry }> = []
  const upcoming: ShiftRow[] = []
  const late: ShiftRow[] = []
  const done: ShiftRow[] = []
  const matchedEmployeeIds = new Set<string>()

  for (const shift of todayShifts) {
    const shiftDateLA = new Date(shift.start_time).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    if (shiftDateLA !== todayLA) continue

    const entry = openByEmployee.get(shift.employee_id)
    if (entry) {
      clockedIn.push({ shift, entry })
      matchedEmployeeIds.add(shift.employee_id)
    } else {
      const shiftStart = new Date(shift.start_time)
      if (doneEmployeeIds.has(shift.employee_id) && shiftStart <= now) {
        done.push(shift)
      } else if (shiftStart > now) {
        upcoming.push(shift)
      } else if (now.getTime() - shiftStart.getTime() > LATE_THRESHOLD_MS) {
        late.push(shift)
      } else {
        upcoming.push(shift)
      }
    }
  }

  const unscheduledActive = openEntries.filter(e => !matchedEmployeeIds.has(e.employee_id))

  return { clockedIn, upcoming, late, done, unscheduledActive }
}
