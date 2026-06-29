import { describe, it, expect } from 'vitest'
import { classifyShifts, LATE_THRESHOLD_MS, type ShiftRow, type OpenEntry } from '@/lib/classify-shifts'

// All test timestamps use PDT (UTC-7). LA midnight = 07:00 UTC in summer.
// June 17, 2025 (Tuesday) — used as "today" throughout.
const TODAY = new Date('2025-06-17T14:00:00Z')  // 7:00 AM PDT

function shift(overrides: Partial<ShiftRow> & { start_time: string; end_time: string }): ShiftRow {
  return {
    id: 'shift-1',
    employee_id: 'emp-1',
    notes: null,
    ...overrides,
  }
}

function entry(overrides: Partial<OpenEntry> & { clock_in: string }): OpenEntry {
  return {
    id: 'entry-1',
    employee_id: 'emp-1',
    ...overrides,
  }
}

// A shift on today (starts 9 AM PDT = 16:00 UTC)
const TODAY_SHIFT_9AM = shift({
  id: 'shift-1',
  employee_id: 'emp-1',
  start_time: '2025-06-17T16:00:00Z',
  end_time: '2025-06-17T22:00:00Z',
})

describe('classifyShifts', () => {
  describe('clockedIn', () => {
    it('places shift+entry pair in clockedIn when employee has open entry', () => {
      const openEntry = entry({ id: 'entry-1', employee_id: 'emp-1', clock_in: '2025-06-17T16:05:00Z' })
      const result = classifyShifts([TODAY_SHIFT_9AM], [openEntry], new Set(), TODAY)

      expect(result.clockedIn).toHaveLength(1)
      expect(result.clockedIn[0].shift.id).toBe('shift-1')
      expect(result.clockedIn[0].entry.id).toBe('entry-1')
      expect(result.upcoming).toHaveLength(0)
      expect(result.late).toHaveLength(0)
    })
  })

  describe('upcoming', () => {
    it('classifies future shift as upcoming', () => {
      // Shift starts 2 hours from now
      const futureShift = shift({
        id: 'shift-future',
        employee_id: 'emp-2',
        start_time: '2025-06-17T21:00:00Z',  // 2 PM PDT — 7 hours from 7 AM
        end_time: '2025-06-18T01:00:00Z',
      })
      const result = classifyShifts([futureShift], [], new Set(), TODAY)

      expect(result.upcoming).toHaveLength(1)
      expect(result.upcoming[0].id).toBe('shift-future')
      expect(result.late).toHaveLength(0)
    })

    it('classifies recently-started shift (under threshold) as upcoming', () => {
      // Shift started 10 minutes ago (under 15-min LATE_THRESHOLD)
      const recentShift = shift({
        id: 'shift-recent',
        employee_id: 'emp-3',
        start_time: '2025-06-17T13:50:00Z',  // 6:50 AM PDT — 10 mins before 7 AM "now"
        end_time: '2025-06-17T22:00:00Z',
      })
      const result = classifyShifts([recentShift], [], new Set(), TODAY)

      expect(result.upcoming).toHaveLength(1)
      expect(result.late).toHaveLength(0)
    })
  })

  describe('late', () => {
    it('classifies shift past threshold as late', () => {
      // Shift started 30 minutes ago (past 15-min LATE_THRESHOLD)
      const lateShift = shift({
        id: 'shift-late',
        employee_id: 'emp-4',
        start_time: '2025-06-17T13:30:00Z',  // 6:30 AM PDT — 30 mins before 7 AM "now"
        end_time: '2025-06-17T22:00:00Z',
      })
      const result = classifyShifts([lateShift], [], new Set(), TODAY)

      expect(result.late).toHaveLength(1)
      expect(result.late[0].id).toBe('shift-late')
      expect(result.upcoming).toHaveLength(0)
    })

    it('uses LATE_THRESHOLD_MS = 15 minutes', () => {
      expect(LATE_THRESHOLD_MS).toBe(15 * 60 * 1000)
    })

    it('classifies shift exactly at threshold as upcoming (boundary)', () => {
      // Start exactly LATE_THRESHOLD_MS ago — NOT strictly greater, so still upcoming
      const now = TODAY
      const startMs = now.getTime() - LATE_THRESHOLD_MS
      const boundaryShift = shift({
        id: 'shift-boundary',
        employee_id: 'emp-5',
        start_time: new Date(startMs).toISOString(),
        end_time: new Date(startMs + 8 * 3600000).toISOString(),
      })
      const result = classifyShifts([boundaryShift], [], new Set(), now)

      // exactly at threshold: now - start === LATE_THRESHOLD_MS, NOT >
      expect(result.upcoming).toHaveLength(1)
      expect(result.late).toHaveLength(0)
    })
  })

  describe('done', () => {
    it('classifies past shift as done when employee is in doneEmployeeIds', () => {
      const pastShift = shift({
        id: 'shift-past',
        employee_id: 'emp-6',
        start_time: '2025-06-17T09:00:00Z',  // 2 AM PDT — before "now" (7 AM)
        end_time: '2025-06-17T13:00:00Z',     // 6 AM PDT — before "now"
      })
      const done = new Set<string>(['emp-6'])
      const result = classifyShifts([pastShift], [], done, TODAY)

      expect(result.done).toHaveLength(1)
      expect(result.done[0].id).toBe('shift-past')
      expect(result.late).toHaveLength(0)
    })

    it('keeps past shift in late if employee NOT in doneEmployeeIds', () => {
      const pastShift = shift({
        id: 'shift-past',
        employee_id: 'emp-7',
        start_time: '2025-06-17T09:00:00Z',
        end_time: '2025-06-17T13:00:00Z',
      })
      const result = classifyShifts([pastShift], [], new Set(), TODAY)

      expect(result.late).toHaveLength(1)
      expect(result.done).toHaveLength(0)
    })
  })

  describe('unscheduledActive', () => {
    it('puts open entry without matching shift in unscheduledActive', () => {
      const orphanEntry = entry({ id: 'entry-orphan', employee_id: 'emp-unscheduled', clock_in: '2025-06-17T14:00:00Z' })
      // No shifts for emp-unscheduled
      const result = classifyShifts([], [orphanEntry], new Set(), TODAY)

      expect(result.unscheduledActive).toHaveLength(1)
      expect(result.unscheduledActive[0].id).toBe('entry-orphan')
    })

    it('does NOT include entry that is matched to a clockedIn shift', () => {
      const matchedEntry = entry({ id: 'entry-matched', employee_id: 'emp-1', clock_in: '2025-06-17T16:05:00Z' })
      const result = classifyShifts([TODAY_SHIFT_9AM], [matchedEntry], new Set(), TODAY)

      expect(result.unscheduledActive).toHaveLength(0)
      expect(result.clockedIn).toHaveLength(1)
    })
  })

  describe('date filtering', () => {
    it('excludes shifts from yesterday (wrong date in LA timezone)', () => {
      // Yesterday shift: June 16 — should be filtered out even within ±14h window
      const yesterdayShift = shift({
        id: 'shift-yesterday',
        employee_id: 'emp-8',
        start_time: '2025-06-16T22:00:00Z',  // June 16 3 PM PDT
        end_time: '2025-06-17T02:00:00Z',
      })
      const result = classifyShifts([yesterdayShift], [], new Set(), TODAY)

      expect(result.clockedIn).toHaveLength(0)
      expect(result.upcoming).toHaveLength(0)
      expect(result.late).toHaveLength(0)
      expect(result.done).toHaveLength(0)
    })

    it('excludes shifts from tomorrow', () => {
      const tomorrowShift = shift({
        id: 'shift-tomorrow',
        employee_id: 'emp-9',
        start_time: '2025-06-18T16:00:00Z',  // June 18 9 AM PDT
        end_time: '2025-06-18T22:00:00Z',
      })
      const result = classifyShifts([tomorrowShift], [], new Set(), TODAY)

      expect(result.upcoming).toHaveLength(0)
    })
  })

  describe('multiple employees', () => {
    it('classifies multiple employees independently', () => {
      const clocked = entry({ employee_id: 'emp-a', clock_in: '2025-06-17T16:05:00Z' })
      const lateShift = shift({ id: 's-late', employee_id: 'emp-b', start_time: '2025-06-17T13:30:00Z', end_time: '2025-06-17T22:00:00Z' })
      const upcomingShift = shift({ id: 's-upcoming', employee_id: 'emp-c', start_time: '2025-06-17T21:00:00Z', end_time: '2025-06-18T01:00:00Z' })
      const clockedShift = shift({ id: 's-clocked', employee_id: 'emp-a', start_time: '2025-06-17T16:00:00Z', end_time: '2025-06-17T22:00:00Z' })

      const result = classifyShifts(
        [clockedShift, lateShift, upcomingShift],
        [clocked],
        new Set(),
        TODAY,
      )

      expect(result.clockedIn).toHaveLength(1)
      expect(result.late).toHaveLength(1)
      expect(result.upcoming).toHaveLength(1)
    })
  })

  describe('empty inputs', () => {
    it('returns all empty arrays for no data', () => {
      const result = classifyShifts([], [], new Set(), TODAY)
      expect(result.clockedIn).toHaveLength(0)
      expect(result.upcoming).toHaveLength(0)
      expect(result.late).toHaveLength(0)
      expect(result.done).toHaveLength(0)
      expect(result.unscheduledActive).toHaveLength(0)
    })
  })
})
