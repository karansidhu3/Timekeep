'use client'

import { useState, useTransition, useEffect } from 'react'
import { clockIn, clockOut } from '@/lib/actions/time-entries'
import Button from '@/components/ui/Button'
import { formatElapsed, formatDuration, formatTimePST } from '@/lib/utils'

interface TimeEntry {
  id: string
  clock_in: string
}

interface Props {
  openEntry: TimeEntry | null
}

function isMissedClockOut(clockInIso: string): boolean {
  const today = new Date()
  const entryDay = new Date(clockInIso)
  return (
    entryDay.getFullYear() !== today.getFullYear() ||
    entryDay.getMonth() !== today.getMonth() ||
    entryDay.getDate() !== today.getDate()
  )
}

function toLocalDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ClockInButton({ openEntry }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null)
  const [fixTime, setFixTime] = useState('')

  // Tick every second for a live elapsed display
  useEffect(() => {
    if (!openEntry || isMissedClockOut(openEntry.clock_in)) {
      setElapsedSeconds(null)
      return
    }
    function tick() {
      setElapsedSeconds(
        Math.floor((Date.now() - new Date(openEntry!.clock_in).getTime()) / 1000)
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [openEntry])

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

  // ── Missed clock-out from a previous day ──────────────────────────────────
  if (openEntry && isMissedClockOut(openEntry.clock_in)) {
    const clockInFormatted = `${new Date(openEntry.clock_in).toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric',
    })} at ${formatTimePST(openEntry.clock_in)}`

    return (
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-800">Missed clock-out</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            You clocked in on {clockInFormatted} and didn&apos;t clock out.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-stone-700">
            What time did you leave on {new Date(openEntry.clock_in).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric' })}?
          </label>
          <select
            value={fixTime}
            onChange={e => setFixTime(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-[#f7f6f3]
              text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/20 min-h-[44px]"
          >
            <option value="">Select time…</option>
            {Array.from({ length: 96 }, (_, i) => {
              const h = Math.floor(i / 4)
              const m = (i % 4) * 15
              const value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
              const h12  = h % 12 || 12
              const ampm = h >= 12 ? 'PM' : 'AM'
              return <option key={value} value={value}>{h12}:{String(m).padStart(2,'0')} {ampm}</option>
            })}
          </select>
        </div>

        <Button size="lg" onClick={handleFixClockOut} disabled={isPending || !fixTime} className="w-full">
          {isPending ? 'Saving…' : 'Fix clock-out'}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-xs text-stone-400 text-center">
          If this looks wrong, ask your manager to correct it.
        </p>
      </div>
    )
  }

  // ── Normal clock-in / clock-out ───────────────────────────────────────────
  return (
    <div className="space-y-3">
      {openEntry ? (
        <div className="space-y-3">

          {/* Dark cinematic on-shift card */}
          <div className="bg-stone-900 rounded-2xl px-6 py-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                On shift
              </span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>

            <p className="text-6xl font-semibold tracking-tight text-white leading-none">
              {elapsedSeconds !== null ? formatElapsed(elapsedSeconds) : '—'}
            </p>

            <div className="mt-6 pt-5 border-t border-stone-800">
              <p className="text-sm text-stone-500">
                Since{' '}
                <span className="text-stone-300 font-medium">
                  {formatTimePST(openEntry.clock_in)}
                </span>
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleClockOut}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Clocking out…' : 'Clock out'}
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          onClick={handleClockIn}
          disabled={isPending}
          className="w-full py-5 text-base"
        >
          {isPending ? 'Clocking in…' : 'Clock in'}
        </Button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
