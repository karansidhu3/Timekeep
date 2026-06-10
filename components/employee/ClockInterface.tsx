'use client'

import { useState, useTransition, useEffect } from 'react'
import { clockIn, clockOut } from '@/lib/actions/time-entries'
import { formatTimePST, formatDuration } from '@/lib/utils'

interface Shift {
  id: string
  start_time: string
  end_time: string
  notes: string | null
}

interface OpenEntry {
  id: string
  clock_in: string
}

interface Props {
  shifts: Shift[]
  openEntry: OpenEntry | null
  serverNow: string
  employeeName: string
}

function formatLive(seconds: number): string {
  if (seconds < 60) return `0:${String(seconds).padStart(2, '0')}`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}:${String(seconds % 60).padStart(2, '0')}`
  return `${h}:${String(m).padStart(2, '0')}`
}

function isMissedClockOut(clockInIso: string): boolean {
  const todayPST = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
  const entryDayPST = new Date(clockInIso).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
  return entryDayPST !== todayPST
}

function toLocalDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ClockInterface({ shifts, openEntry, serverNow, employeeName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [fixTime, setFixTime] = useState('')

  const now = new Date(serverNow)
  const firstName = employeeName.trim().split(/\s+/)[0]

  const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
  const todayShift = shifts.find(s =>
    new Date(s.start_time).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }) === todayStr
  ) ?? null

  const isOnShift = !!openEntry
  const isMissed = openEntry ? isMissedClockOut(openEntry.clock_in) : false

  useEffect(() => {
    if (!openEntry || isMissed) { setElapsedSeconds(0); return }
    function tick() {
      setElapsedSeconds(Math.floor((Date.now() - new Date(openEntry!.clock_in).getTime()) / 1000))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [openEntry, isMissed])

  function handleClockIn() {
    setError(null)
    startTransition(async () => {
      const result = await clockIn()
      if (!result.success) setError(result.error ?? 'Failed to clock in')
    })
  }

  function handleClockOut() {
    if (!openEntry) return
    setError(null)
    startTransition(async () => {
      const result = await clockOut(openEntry.id)
      if (!result.success) setError(result.error ?? 'Failed to clock out')
    })
  }

  function handleFixClockOut() {
    if (!openEntry || !fixTime) return
    setError(null)
    const clockInDate = toLocalDate(openEntry.clock_in)
    const fixedClockOut = new Date(`${clockInDate}T${fixTime}`).toISOString()
    if (new Date(fixedClockOut) <= new Date(openEntry.clock_in)) {
      setError('Leave time must be after your clock-in time.')
      return
    }
    if (new Date(fixedClockOut) > new Date()) {
      setError("Leave time can't be in the future.")
      return
    }
    startTransition(async () => {
      const result = await clockOut(openEntry.id, fixedClockOut)
      if (!result.success) setError(result.error ?? 'Failed to fix clock-out')
    })
  }

  // ── Missed clock-out ────────────────────────────────────────────────────
  if (isMissed && openEntry) {
    const missedDate = new Date(openEntry.clock_in).toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric',
    })

    return (
      <div
        className="flex flex-col min-h-screen bg-[#f7f5f2] px-6 animate-page-in"
        style={{ paddingTop: 'max(2rem, env(safe-area-inset-top, 0px))' }}
      >
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">

          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">Missed clock-out</span>
          </div>

          <p className="text-[1.75rem] font-semibold tracking-tight text-[#0d0c0b] leading-tight mb-2">
            You forgot to clock out
          </p>
          <p className="text-[#78716c] text-sm mb-10 tracking-[-0.01em]">
            You clocked in on {missedDate} and didn&apos;t clock out.
          </p>

          <div className="flex flex-col gap-2 mb-6">
            <label className="text-sm font-medium text-[#44403c] tracking-[-0.01em]">
              What time did you leave on {new Date(openEntry.clock_in).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric' })}?
            </label>
            <select
              value={fixTime}
              onChange={e => setFixTime(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#e4e0da] bg-[#f0ede8] text-sm text-[#0d0c0b]
                focus:outline-none focus:border-[#78716c] focus:ring-2 focus:ring-[#141210]/10
                transition-all duration-150 min-h-[44px]"
            >
              <option value="">Select time…</option>
              {Array.from({ length: 96 }, (_, i) => {
                const h = Math.floor(i / 4)
                const m = (i % 4) * 15
                const value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
                const h12 = h % 12 || 12
                const ampm = h >= 12 ? 'PM' : 'AM'
                return <option key={value} value={value}>{h12}:{String(m).padStart(2,'0')} {ampm}</option>
              })}
            </select>
          </div>

          {error && <p className="text-sm text-red-500 mb-4 tracking-[-0.01em]">{error}</p>}

          <button
            onClick={handleFixClockOut}
            disabled={isPending || !fixTime}
            className="w-full h-14 rounded-2xl bg-[#141210] text-[#f5f3ef] font-medium text-[15px]
              tracking-[-0.01em] transition-all duration-150 active:scale-[0.98]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isPending ? 'Saving…' : 'Fix clock-out'}
          </button>

          <p className="text-xs text-[#a8a29e] text-center mt-4">
            If this looks wrong, ask your manager to correct it.
          </p>
        </div>

        <div className="pb-nav" />
      </div>
    )
  }

  // ── ON SHIFT — the hero state ───────────────────────────────────────────
  if (isOnShift) {
    const shiftEnd = todayShift ? new Date(todayShift.end_time) : null
    const isOvertime = shiftEnd ? new Date() > shiftEnd : false

    return (
      <div className="flex flex-col min-h-screen bg-[#141210] animate-clock-in">

        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6"
          style={{ paddingTop: 'max(1.75rem, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-live" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {isOvertime ? 'Overtime' : 'On shift'}
            </span>
          </div>
          <span className="text-xs text-white/30 tracking-[-0.01em]">{firstName}</span>
        </div>

        {/* Elapsed time — the centrepiece */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className="font-mono text-white leading-none tracking-tight text-center"
            style={{ fontSize: 'clamp(4.5rem, 22vw, 8rem)' }}
            suppressHydrationWarning
          >
            {formatLive(elapsedSeconds)}
          </div>

          <p className="text-white/40 text-sm mt-6 tracking-[-0.01em] font-mono">
            since {formatTimePST(openEntry!.clock_in)}
          </p>

          {todayShift && (
            <p className="text-white/25 text-xs mt-2 tracking-[-0.01em] font-mono">
              {formatTimePST(todayShift.start_time)} – {formatTimePST(todayShift.end_time)}
            </p>
          )}

          {isOvertime && (
            <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/15">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold text-amber-400 tracking-[-0.01em]">
                +{formatDuration(Math.floor((Date.now() - new Date(todayShift!.end_time).getTime()) / 60000))} over
              </span>
            </div>
          )}
        </div>

        {/* Clock out — pb-nav ensures button clears the frosted BottomNav */}
        <div className="px-6 pt-2 pb-nav">
          {error && <p className="text-sm text-red-400 text-center mb-4">{error}</p>}
          <button
            onClick={handleClockOut}
            disabled={isPending}
            className="w-full h-14 rounded-2xl bg-white/[0.08] border border-white/10 text-white font-medium text-[15px]
              tracking-[-0.01em] transition-all duration-150
              hover:bg-white/[0.12] active:scale-[0.98] active:bg-white/[0.06]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isPending ? 'Clocking out…' : 'Clock out'}
          </button>
        </div>
      </div>
    )
  }

  // ── NOT CLOCKED IN ──────────────────────────────────────────────────────

  const shiftStart = todayShift ? new Date(todayShift.start_time) : null
  const shiftEnd   = todayShift ? new Date(todayShift.end_time)   : null
  const msUntil    = shiftStart ? shiftStart.getTime() - now.getTime() : 0
  const minsUntil  = Math.ceil(msUntil / 60000)
  const shiftHasStarted = shiftStart ? now >= shiftStart : false
  const shiftIsOver     = shiftEnd   ? now >= shiftEnd   : false

  return (
    <div
      className="flex flex-col min-h-screen bg-[#f7f5f2] px-6 animate-page-in"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(4.5rem + max(1rem, env(safe-area-inset-bottom, 0px)))',
      }}
    >
      <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full">

        {/* Top: greeting */}
        <div>
          <p className="text-sm text-[#a8a29e] tracking-[-0.01em] mb-1">{firstName}</p>
        </div>

        {/* Middle: state content */}
        <div className="flex flex-col">
          {!todayShift ? (
            <div>
              <p className="text-[2.75rem] font-semibold tracking-tight text-[#0d0c0b] leading-tight mb-2">
                Off today.
              </p>
              <p className="text-[#a8a29e] text-sm tracking-[-0.01em]">No shift scheduled.</p>
            </div>
          ) : shiftIsOver ? (
            <div>
              <p className="text-[2.75rem] font-semibold tracking-tight text-[#0d0c0b] leading-tight mb-2">
                Shift over.
              </p>
              <p className="text-[#a8a29e] text-sm tracking-[-0.01em] font-mono">
                {formatTimePST(todayShift.start_time)} – {formatTimePST(todayShift.end_time)}
              </p>
            </div>
          ) : shiftHasStarted ? (
            <div>
              <p className="text-[2.75rem] font-semibold tracking-tight text-[#0d0c0b] leading-tight mb-2">
                Shift started.
              </p>
              <p className="text-[#a8a29e] text-sm tracking-[-0.01em] font-mono">
                {formatTimePST(todayShift.start_time)} – {formatTimePST(todayShift.end_time)}
              </p>
              {todayShift.notes && (
                <p className="text-[#78716c] text-sm mt-3 tracking-[-0.01em]">{todayShift.notes}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a8a29e] mb-4">Starts in</p>
              <div
                className="font-mono text-[#0d0c0b] leading-none tracking-tight mb-4"
                style={{ fontSize: 'clamp(3.5rem, 18vw, 6rem)' }}
              >
                {minsUntil >= 60
                  ? `${Math.floor(minsUntil / 60)}h ${minsUntil % 60 > 0 ? `${minsUntil % 60}m` : ''}`
                  : `${minsUntil}m`}
              </div>
              <p className="text-[#a8a29e] text-sm tracking-[-0.01em] font-mono">
                {formatTimePST(todayShift.start_time)} – {formatTimePST(todayShift.end_time)}
              </p>
              {todayShift.notes && (
                <p className="text-[#78716c] text-sm mt-3 tracking-[-0.01em]">{todayShift.notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Bottom: action */}
        <div>
          {error && <p className="text-sm text-red-500 mb-4 tracking-[-0.01em]">{error}</p>}

          <button
            onClick={handleClockIn}
            disabled={isPending}
            className="w-full h-14 rounded-2xl bg-[#141210] text-[#f5f3ef] font-medium text-[15px]
              tracking-[-0.01em] transition-all duration-150 active:scale-[0.98]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isPending ? 'Clocking in…' : 'Clock in'}
          </button>
        </div>

      </div>
    </div>
  )
}
