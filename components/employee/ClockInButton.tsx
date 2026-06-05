'use client'

import { useState, useTransition, useEffect } from 'react'
import { format } from 'date-fns'
import { clockIn, clockOut } from '@/lib/actions/time-entries'
import Button from '@/components/ui/Button'
import { calcDurationMinutes, formatDuration } from '@/lib/utils'

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
  const [elapsed, setElapsed] = useState<string | null>(null)
  const [fixTime, setFixTime] = useState('')

  useEffect(() => {
    if (!openEntry || isMissedClockOut(openEntry.clock_in)) { setElapsed(null); return }
    function tick() {
      setElapsed(formatDuration(calcDurationMinutes(openEntry!.clock_in, null)))
    }
    tick()
    const id = setInterval(tick, 60000)
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
    const clockInDate = toLocalDate(openEntry.clock_in)
    const clockInFormatted = format(new Date(openEntry.clock_in), "EEE, MMM d 'at' h:mm a")

    return (
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800">Missed clock-out</p>
          <p className="text-xs text-amber-700 mt-1">
            You clocked in on {clockInFormatted} and didn&apos;t clock out.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-stone-700">
            What time did you leave on {format(new Date(openEntry.clock_in), 'MMM d')}?
          </label>
          <input
            type="time"
            value={fixTime}
            onChange={e => setFixTime(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[44px]"
          />
        </div>

        <Button
          size="lg"
          onClick={handleFixClockOut}
          disabled={isPending || !fixTime}
          className="w-full"
        >
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
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Clocked in</p>
              {elapsed && <p className="text-xs text-green-600 mt-0.5">{elapsed} elapsed</p>}
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
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
          className="w-full"
        >
          {isPending ? 'Clocking in…' : 'Clock in'}
        </Button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
