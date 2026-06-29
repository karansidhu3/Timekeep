import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatTimePST,
  compactTimePST,
  weekdayIndexPST,
  localDatePST,
  localTimePST,
  formatShiftRange,
  formatDuration,
  formatElapsed,
  getWeekRange,
  calcDurationMinutes,
  smartDate,
} from '@/lib/utils'

// 2025-06-17T16:00:00Z = June 17 (Tuesday) at 9:00 AM PDT
const TUE_9AM_PDT = '2025-06-17T16:00:00Z'
// 2025-06-17T01:00:00Z = June 16 (Monday) at 6:00 PM PDT
const MON_6PM_PDT = '2025-06-17T01:00:00Z'

describe('formatTimePST', () => {
  it('formats morning hour', () => {
    expect(formatTimePST(TUE_9AM_PDT)).toBe('9:00 AM')
  })

  it('formats noon', () => {
    // 2025-06-17T19:00:00Z = 12:00 PM PDT
    expect(formatTimePST('2025-06-17T19:00:00Z')).toBe('12:00 PM')
  })

  it('formats PM hour', () => {
    // 2025-06-18T00:00:00Z = 5:00 PM PDT
    expect(formatTimePST('2025-06-18T00:00:00Z')).toBe('5:00 PM')
  })

  it('formats half-hour', () => {
    // 2025-06-17T16:30:00Z = 9:30 AM PDT
    expect(formatTimePST('2025-06-17T16:30:00Z')).toBe('9:30 AM')
  })
})

describe('compactTimePST', () => {
  it('strips colon-zero for whole hours', () => {
    expect(compactTimePST(TUE_9AM_PDT)).toBe('9a')
  })

  it('includes minutes when not zero', () => {
    expect(compactTimePST('2025-06-17T16:30:00Z')).toBe('9:30a')
  })

  it('handles PM hours', () => {
    expect(compactTimePST('2025-06-18T00:00:00Z')).toBe('5p')
  })

  it('handles noon', () => {
    expect(compactTimePST('2025-06-17T19:00:00Z')).toBe('12p')
  })

  it('handles midnight as 12a', () => {
    expect(compactTimePST('2025-06-17T07:00:00Z')).toBe('12a')
  })
})

describe('weekdayIndexPST', () => {
  it('Sunday = 0', () => {
    // 2025-06-15 is Sunday; 2025-06-15T07:00:00Z = midnight PDT
    expect(weekdayIndexPST('2025-06-15T07:00:00Z')).toBe(0)
  })

  it('Monday = 1', () => {
    expect(weekdayIndexPST('2025-06-16T07:00:00Z')).toBe(1)
  })

  it('Tuesday = 2', () => {
    expect(weekdayIndexPST(TUE_9AM_PDT)).toBe(2)
  })

  it('Saturday = 6', () => {
    // 2025-06-21 is Saturday
    expect(weekdayIndexPST('2025-06-21T07:00:00Z')).toBe(6)
  })

  it('treats midnight UTC the previous day correctly in PDT', () => {
    // 2025-06-17T00:00:00Z = June 16 Monday at 5 PM PDT
    expect(weekdayIndexPST('2025-06-17T00:00:00Z')).toBe(1)
  })
})

describe('localDatePST', () => {
  it('returns YYYY-MM-DD in PST timezone', () => {
    expect(localDatePST(TUE_9AM_PDT)).toBe('2025-06-17')
  })

  it('handles timestamps near PST midnight', () => {
    // 2025-06-17T06:59:59Z = June 16 at 11:59:59 PM PDT
    expect(localDatePST('2025-06-17T06:59:59Z')).toBe('2025-06-16')
    // 2025-06-17T07:00:01Z = June 17 at 12:00:01 AM PDT
    expect(localDatePST('2025-06-17T07:00:01Z')).toBe('2025-06-17')
  })
})

describe('localTimePST', () => {
  it('returns HH:MM in 24-hour format', () => {
    expect(localTimePST(TUE_9AM_PDT)).toBe('09:00')
  })

  it('returns PM time correctly', () => {
    // 17:00 PDT = 00:00 next day UTC
    expect(localTimePST('2025-06-18T00:00:00Z')).toBe('17:00')
  })

  it('returns midnight as 00:00', () => {
    expect(localTimePST('2025-06-17T07:00:00Z')).toBe('00:00')
  })
})

describe('formatShiftRange', () => {
  it('strips :00 for whole hours', () => {
    const start = TUE_9AM_PDT               // 9:00 AM PDT
    const end = '2025-06-18T00:00:00Z'      // 5:00 PM PDT
    expect(formatShiftRange(start, end)).toBe('9 AM – 5 PM')
  })

  it('includes minutes when non-zero', () => {
    const start = '2025-06-17T16:30:00Z'    // 9:30 AM PDT
    const end = '2025-06-18T00:30:00Z'      // 5:30 PM PDT
    expect(formatShiftRange(start, end)).toBe('9:30 AM – 5:30 PM')
  })
})

describe('formatDuration', () => {
  it('renders minutes only under one hour', () => {
    expect(formatDuration(45)).toBe('45m')
  })

  it('renders hours only on whole hours', () => {
    expect(formatDuration(120)).toBe('2h')
  })

  it('renders hours and minutes', () => {
    expect(formatDuration(95)).toBe('1h 35m')
  })

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0m')
  })
})

describe('formatElapsed', () => {
  it('returns "Just started" under 60 seconds', () => {
    expect(formatElapsed(0)).toBe('Just started')
    expect(formatElapsed(59)).toBe('Just started')
  })

  it('returns minutes only under one hour', () => {
    expect(formatElapsed(600)).toBe('10m')
  })

  it('returns hours and minutes', () => {
    expect(formatElapsed(3720)).toBe('1h 2m')
  })

  it('returns hours only on whole hour', () => {
    expect(formatElapsed(7200)).toBe('2h')
  })
})

describe('getWeekRange', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns Sun–Sat boundaries for current week', () => {
    // Tuesday June 17, 2025 at 9:00 AM PDT
    vi.setSystemTime(new Date('2025-06-17T16:00:00Z'))
    const { start, end } = getWeekRange(0)

    const startDate = start.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    const endDate = end.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })

    expect(startDate).toBe('2025-06-15')  // Sunday Jun 15
    expect(endDate).toBe('2025-06-21')    // Saturday Jun 21
  })

  it('advances exactly 7 days with weekOffset +1', () => {
    vi.setSystemTime(new Date('2025-06-17T16:00:00Z'))
    const { start: s0 } = getWeekRange(0)
    const { start: s1 } = getWeekRange(1)

    expect(s1.getTime() - s0.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('goes back exactly 7 days with weekOffset -1', () => {
    vi.setSystemTime(new Date('2025-06-17T16:00:00Z'))
    const { start: s0 } = getWeekRange(0)
    const { start: sm1 } = getWeekRange(-1)

    expect(s0.getTime() - sm1.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('handles DST spring forward — week starting March 9, 2025', () => {
    // Wednesday March 12, 2025 at noon PDT (after spring forward March 9)
    vi.setSystemTime(new Date('2025-03-12T19:00:00Z'))
    const { start, end } = getWeekRange(0)

    const startDate = start.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    const endDate = end.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })

    expect(startDate).toBe('2025-03-09')  // Sunday Mar 9 (spring forward day)
    expect(endDate).toBe('2025-03-15')    // Saturday Mar 15
  })

  it('end is 23:59:59.999 of Saturday in PST', () => {
    vi.setSystemTime(new Date('2025-06-17T16:00:00Z'))
    const { end } = getWeekRange(0)

    // end + 1ms should be Sunday Jun 22
    const nextDay = new Date(end.getTime() + 1)
    const nextDate = nextDay.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    expect(nextDate).toBe('2025-06-22')
  })

  it('returns exactly 7-day span', () => {
    vi.setSystemTime(new Date('2025-06-17T16:00:00Z'))
    const { start, end } = getWeekRange(0)

    // end - start should be <7 days (end is 23:59:59.999 Saturday, start is 00:00:00 Sunday)
    const spanMs = end.getTime() - start.getTime() + 1
    expect(spanMs).toBe(7 * 24 * 60 * 60 * 1000)
  })
})

describe('calcDurationMinutes', () => {
  it('returns difference in minutes for two ISO strings', () => {
    const clockIn = '2025-06-17T16:00:00Z'
    const clockOut = '2025-06-17T17:30:00Z'
    expect(calcDurationMinutes(clockIn, clockOut)).toBe(90)
  })

  it('uses current time when clockOut is null', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-17T17:30:00Z'))
    const clockIn = '2025-06-17T16:00:00Z'
    expect(calcDurationMinutes(clockIn, null)).toBe(90)
  })

  it('returns 0 for same timestamps', () => {
    const t = '2025-06-17T16:00:00Z'
    expect(calcDurationMinutes(t, t)).toBe(0)
  })
})

describe('smartDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-17T16:00:00Z'))  // Tuesday Jun 17 at 9 AM PDT
  })

  it('shows only time for today', () => {
    const result = smartDate('2025-06-17T14:00:00Z')  // 7 AM today
    expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/)
    expect(result).not.toContain('·')
  })

  it('shows "Yesterday" for yesterday', () => {
    const result = smartDate('2025-06-16T16:00:00Z')
    expect(result).toContain('Yesterday')
  })

  it('shows weekday name for this week', () => {
    const result = smartDate('2025-06-15T16:00:00Z')  // Sunday
    expect(result).toContain('Sun')
  })

  it('shows month and day for older dates', () => {
    const result = smartDate('2025-05-01T16:00:00Z')
    expect(result).toContain('May 1')
  })
})
