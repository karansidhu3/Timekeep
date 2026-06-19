'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { clockIn, clockOut } from '@/lib/actions/time-entries'
import { signOut } from '@/lib/actions/auth'
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
  todayWorkedMins?: number
}

function formatLive(seconds: number): string {
  if (seconds < 60) return `0:${String(seconds).padStart(2, '0')}`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}:${String(seconds % 60).padStart(2, '0')}`
  return `${h}:${String(m).padStart(2, '0')}`
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  if (m > 0) return `${m}m`
  return `${s}s`
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

const HOLD_DURATION = 700

export default function ClockInterface({ shifts, openEntry, serverNow, employeeName, todayWorkedMins = 0 }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [fixTime, setFixTime] = useState('')
  const [holdProgress, setHoldProgress] = useState(0)
  const [liveSecondsUntil, setLiveSecondsUntil] = useState(0)
  const [completionFlash, setCompletionFlash] = useState(false)
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const now = new Date(serverNow)
  const firstName = employeeName.trim().split(/\s+/)[0]

  const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
  const todayShift = shifts.find(s =>
    new Date(s.start_time).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }) === todayStr
  ) ?? null

  const isOnShift = !!openEntry
  const isMissed = openEntry ? isMissedClockOut(openEntry.clock_in) : false

  const shiftStart = todayShift ? new Date(todayShift.start_time) : null
  const shiftEnd   = todayShift ? new Date(todayShift.end_time)   : null
  const shiftHasStarted = shiftStart ? now >= shiftStart : false
  const shiftIsOver     = shiftEnd   ? now >= shiftEnd   : false

  // On-shift elapsed timer
  useEffect(() => {
    if (!openEntry || isMissed) { setElapsedSeconds(0); return }
    function tick() {
      setElapsedSeconds(Math.floor((Date.now() - new Date(openEntry!.clock_in).getTime()) / 1000))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [openEntry, isMissed])

  // Upcoming live countdown — ticks every second, shows seconds when < 1min
  useEffect(() => {
    if (!todayShift || isOnShift || shiftHasStarted) return
    function tick() {
      const secs = Math.ceil((new Date(todayShift!.start_time).getTime() - Date.now()) / 1000)
      setLiveSecondsUntil(Math.max(secs, 0))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [todayShift?.start_time, isOnShift, shiftHasStarted])

  // Cleanup hold on unmount
  useEffect(() => {
    return () => { if (holdTimerRef.current) clearInterval(holdTimerRef.current) }
  }, [])

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

  function startHold() {
    if (isPending || holdTimerRef.current) return
    const startTime = Date.now()
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / HOLD_DURATION, 1)
      setHoldProgress(progress)
      if (progress >= 1) {
        clearInterval(holdTimerRef.current!)
        holdTimerRef.current = null
        setHoldProgress(0)
        setCompletionFlash(true)
        handleClockOut()
      }
    }, 16)
  }

  function cancelHold() {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current)
      holdTimerRef.current = null
    }
    setHoldProgress(0)
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
        className="flex flex-col bg-[#f2ece2] px-6 animate-page-in"
        style={{ height: '100dvh', paddingTop: 'max(2rem, env(safe-area-inset-top, 0px))' }}
      >
        <div className="flex justify-end mb-2">
          <form action={signOut}>
            <button className="text-xs font-medium text-label-3 hover:text-label-2 px-3 py-2 rounded-xl hover:bg-[#eae3d3] active:bg-[#ddd4be] transition-colors duration-150 tracking-[-0.01em]">
              Sign out
            </button>
          </form>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-600">Missed clock-out</span>
          </div>

          <p className="text-[1.75rem] font-semibold tracking-tight text-label-1 leading-tight mb-2">
            You forgot to clock out
          </p>
          <p className="text-label-2 text-sm mb-10 tracking-[-0.01em]">
            You clocked in on {missedDate} and didn&apos;t clock out.
          </p>

          <div className="flex flex-col gap-2 mb-6">
            <label className="text-sm font-medium text-label-2 tracking-[-0.01em]">
              What time did you leave on {new Date(openEntry.clock_in).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric' })}?
            </label>
            <select
              value={fixTime}
              onChange={e => setFixTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#d3c9b2] bg-[#eae3d3] text-sm text-label-1
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
            data-spring
            onClick={handleFixClockOut}
            disabled={isPending || !fixTime}
            className="w-full h-14 rounded-2xl bg-[#141210] text-[#f5f3ef] font-medium text-[15px]
              tracking-[-0.01em] transition-colors duration-150
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving…' : 'Fix clock-out'}
          </button>

          <p className="text-xs text-label-3 text-center mt-4">
            If this looks wrong, ask your manager to correct it.
          </p>
        </div>

        <div className="pb-nav" />
      </div>
    )
  }

  // ── ON SHIFT — hero state ───────────────────────────────────────────────
  if (isOnShift) {
    const scheduledMins = (shiftStart && shiftEnd)
      ? Math.floor((shiftEnd.getTime() - shiftStart.getTime()) / 60000)
      : 0
    const totalWorkedMins = Math.floor(elapsedSeconds / 60) + todayWorkedMins
    const isOvertime = scheduledMins > 0
      ? totalWorkedMins > scheduledMins
      : (shiftEnd ? new Date() > shiftEnd : false)
    const overtimeMins = Math.max(0, totalWorkedMins - scheduledMins)

    return (
      <div className="flex flex-col bg-[#141210] animate-clock-in" style={{ height: '100dvh' }}>
        {/* Completion flash */}
        {completionFlash && (
          <div
            className="fixed inset-0 bg-white pointer-events-none z-50"
            style={{ animation: 'fade-in 80ms ease-in reverse both' }}
            onAnimationEnd={() => setCompletionFlash(false)}
          />
        )}

        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6"
          style={{ paddingTop: 'max(1.75rem, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#7ab898] animate-pulse-live" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {isOvertime ? 'Overtime' : 'On shift'}
            </span>
          </div>
          <form action={signOut}>
            <button className="text-xs font-medium text-white/50 hover:text-white/70 px-2 py-1.5 rounded-xl transition-colors duration-150 tracking-[-0.01em]">
              Sign out
            </button>
          </form>
        </div>

        {/* Elapsed time — the centrepiece */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className="font-medium text-white leading-none tracking-tight text-center"
            style={{ fontSize: 'clamp(4.5rem, 22vw, 8rem)' }}
            suppressHydrationWarning
          >
            {formatLive(elapsedSeconds)}
          </div>

          <p className="text-white/60 text-sm mt-6 tracking-[-0.01em]">
            since {formatTimePST(openEntry!.clock_in)}
          </p>

          {todayWorkedMins > 0 && (
            <p className="text-white/45 text-xs mt-1.5 tracking-[-0.01em]">
              +{formatDuration(todayWorkedMins)} prior session
            </p>
          )}

          {todayShift && (
            <p className="text-white/60 text-xs mt-2 tracking-[-0.01em]">
              {formatTimePST(todayShift.start_time)} – {formatTimePST(todayShift.end_time)}
            </p>
          )}

          {isOvertime && (
            <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/15">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold text-amber-400 tracking-[-0.01em]">
                +{formatDuration(overtimeMins)} over
              </span>
            </div>
          )}
        </div>

        {/* Hold-to-clock-out */}
        <div className="px-6 pt-2 pb-nav">
          {error && <p className="text-sm text-red-400 text-center mb-4">{error}</p>}
          <button
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onContextMenu={e => e.preventDefault()}
            disabled={isPending}
            className="relative w-full h-14 rounded-2xl overflow-hidden border border-white/10 text-white font-medium text-[15px] tracking-[-0.01em] select-none disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ WebkitUserSelect: 'none' }}
          >
            <div
              className="absolute inset-0 bg-white/[0.12] origin-left"
              style={{
                transform: `scaleX(${holdProgress})`,
                transition: holdProgress === 0 ? 'transform 200ms ease-out' : 'none',
              }}
            />
            <span className="relative z-10 pointer-events-none">
              {isPending ? 'Clocking out…' : holdProgress > 0.05 ? 'Hold…' : 'Clock out'}
            </span>
          </button>
          <p className="text-center text-white/50 text-[11px] mt-3 tracking-[-0.01em]">
            Hold to clock out
          </p>
        </div>
      </div>
    )
  }

  // ── NOT CLOCKED IN ──────────────────────────────────────────────────────
  const msUntil   = shiftStart ? shiftStart.getTime() - now.getTime() : 0
  const minsUntil = Math.ceil(msUntil / 60000)

  return (
    <div
      className="flex flex-col bg-[#f2ece2] px-6 animate-page-in"
      style={{
        height: '100dvh',
        paddingTop: 'max(2rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(4.5rem + max(1rem, env(safe-area-inset-bottom, 0px)))',
      }}
    >
      <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full">

        {/* Top: greeting + sign out */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-label-2 tracking-[-0.01em]">{firstName}</p>
          <form action={signOut}>
            <button className="text-xs font-medium text-label-3 hover:text-label-2 px-3 py-2 rounded-xl hover:bg-[#eae3d3] active:bg-[#ddd4be] transition-colors duration-150 tracking-[-0.01em]">
              Sign out
            </button>
          </form>
        </div>

        {/* Middle: state content */}
        <div className="flex flex-col">
          {!todayShift ? (
            <div>
              <p className="text-[2.75rem] font-semibold tracking-tight text-label-1 leading-tight mb-2">
                Off today.
              </p>
              <p className="text-label-3 text-sm tracking-[-0.01em]">No shift scheduled.</p>
            </div>
          ) : shiftIsOver ? (
            <div>
              <p className="text-[2.75rem] font-semibold tracking-tight text-label-1 leading-tight mb-2">
                Shift over.
              </p>
              <p className="text-label-2 text-sm tracking-[-0.01em]">
                {formatTimePST(todayShift.start_time)} – {formatTimePST(todayShift.end_time)}
              </p>
            </div>
          ) : shiftHasStarted ? (
            <div>
              <p className="text-[2.75rem] font-semibold tracking-tight text-label-1 leading-tight mb-2">
                Your shift started.
              </p>
              <p className="text-label-2 text-sm tracking-[-0.01em]">
                {formatTimePST(todayShift.start_time)} – {formatTimePST(todayShift.end_time)}
              </p>
              {todayShift.notes && (
                <p className="text-label-2 text-sm mt-3 tracking-[-0.01em]">{todayShift.notes}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-label-3 mb-4">Starts in</p>
              <div
                className="text-label-1 leading-none tracking-tight mb-4"
                style={{ fontSize: 'clamp(3.5rem, 18vw, 6rem)' }}
                suppressHydrationWarning
              >
                {formatCountdown(liveSecondsUntil || minsUntil * 60)}
              </div>
              <p className="text-label-2 text-sm tracking-[-0.01em]">
                {formatTimePST(todayShift.start_time)} – {formatTimePST(todayShift.end_time)}
              </p>
              {todayShift.notes && (
                <p className="text-label-2 text-sm mt-3 tracking-[-0.01em]">{todayShift.notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Bottom: action */}
        <div>
          {error && <p className="text-sm text-red-500 mb-4 tracking-[-0.01em]">{error}</p>}

          <button
            data-spring
            onClick={handleClockIn}
            disabled={isPending}
            className="w-full h-14 rounded-2xl bg-[#4a7c59] text-white font-medium text-[15px]
              tracking-[-0.01em] transition-colors duration-150
              hover:bg-[#3d6b55] active:bg-[#2f5443]
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Clocking in…' : 'Clock in'}
          </button>
          {todayWorkedMins > 0 && (
            <p className="text-center text-xs text-label-2 mt-3 tracking-[-0.01em] tabular-nums">
              {formatDuration(todayWorkedMins)} worked today
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
