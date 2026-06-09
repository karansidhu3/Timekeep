import { format, startOfWeek, endOfWeek, addWeeks, differenceInMinutes, isToday, isYesterday, isThisWeek } from 'date-fns'

export function formatShiftTime(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  return `${format(s, 'EEE MMM d')} · ${format(s, 'h:mm a')} – ${format(e, 'h:mm a')}`
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// Formats elapsed seconds into a compact display string.
// Used by the live clocked-in timer (updates every second).
export function formatElapsed(seconds: number): string {
  if (seconds < 60) return 'Just started'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function getWeekRange(weekOffset = 0): { start: Date; end: Date } {
  const base = addWeeks(new Date(), weekOffset)
  return {
    start: startOfWeek(base, { weekStartsOn: 1 }),
    end: endOfWeek(base, { weekStartsOn: 1 }),
  }
}

export function calcDurationMinutes(clockIn: string, clockOut: string | null): number {
  return differenceInMinutes(clockOut ? new Date(clockOut) : new Date(), new Date(clockIn))
}

// Contextual date: shows only time for today, "Yesterday · h:mm a" for yesterday,
// "EEE · h:mm a" within the current week, and "MMM d · h:mm a" for older.
export function smartDate(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return `Yesterday · ${format(d, 'h:mm a')}`
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, 'EEE · h:mm a')
  return format(d, 'MMM d · h:mm a')
}
