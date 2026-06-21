import { format, differenceInMinutes, isToday, isYesterday, isThisWeek } from 'date-fns'

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

// Compact 12h + am/pm suffix, no ":00" on the hour — for tight schedule chips
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
  const period = h < 12 ? 'a' : 'p'
  const timeStr = m === 0 ? String(h12) : `${h12}:${String(m).padStart(2, '0')}`
  return `${timeStr}${period}`
}

// 0=Sun … 6=Sat, evaluated in PST
export function weekdayIndexPST(iso: string): number {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(new Date(iso))
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
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

// "9 AM – 5 PM" or "9:30 AM – 5:30 PM" — strips :00 for whole hours
export function formatShiftRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) => new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso)).replace(':00 ', ' ')
  return `${fmt(startIso)} – ${fmt(endIso)}`
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
  const tz = 'America/Los_Angeles'
  const now = new Date()

  // Find Sunday of the current PST week, then apply offset
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const pstDow = dowMap[now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' })] ?? 0
  const daysSinceSunday = pstDow
  const approxSundayMs = now.getTime() - daysSinceSunday * 86400000 + weekOffset * 7 * 86400000
  const approxSaturdayMs = approxSundayMs + 6 * 86400000

  const sundayStr  = new Date(approxSundayMs).toLocaleDateString('en-CA', { timeZone: tz })
  const saturdayStr = new Date(approxSaturdayMs).toLocaleDateString('en-CA', { timeZone: tz })

  // Returns the UTC timestamp corresponding to midnight PST/PDT on the given date,
  // correctly handling DST by trying UTC-7 (PDT) then UTC-8 (PST).
  function pstMidnight(dateStr: string): Date {
    for (const h of [7, 8]) {
      const t = new Date(`${dateStr}T${String(h).padStart(2, '0')}:00:00Z`)
      if (t.toLocaleDateString('en-CA', { timeZone: tz }) === dateStr) return t
    }
    return new Date(`${dateStr}T08:00:00Z`)
  }

  const start = pstMidnight(sundayStr)
  const end = new Date(pstMidnight(saturdayStr).getTime() + 24 * 3600000 - 1)
  return { start, end }
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
  if (isThisWeek(d, { weekStartsOn: 0 })) return format(d, 'EEE · h:mm a')
  return format(d, 'MMM d · h:mm a')
}
