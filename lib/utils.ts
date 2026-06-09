import { format, startOfWeek, endOfWeek, addWeeks, differenceInMinutes, isToday, isYesterday, isThisWeek } from 'date-fns'

const TZ = 'America/Los_Angeles'

// "7:00 AM" / "12:30 PM" — always PST/PDT, consistent on server and client
export function formatTimePST(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

// Compact 12h, no AM/PM, no ":00" on the hour — for tight schedule chips
export function compactTimePST(iso: string): string {
  const str = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))
  const [hStr, mStr] = str.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const h12 = h % 12 || 12
  return m === 0 ? String(h12) : `${h12}:${String(m).padStart(2, '0')}`
}

// 0=Mon … 6=Sun, evaluated in PST
export function weekdayIndexPST(iso: string): number {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(new Date(iso))
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
  return map[short] ?? 0
}

// YYYY-MM-DD date string in PST — use en-CA locale which outputs ISO date format
export function localDatePST(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })
}

// HH:MM in PST (24-hour) — for pre-filling <input type="time"> and <TimeSelect>
export function localTimePST(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))
}

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
