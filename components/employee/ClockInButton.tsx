'use client'

import { useState, useTransition, useEffect } from 'react'
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

export default function ClockInButton({ openEntry }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState<string | null>(null)

  useEffect(() => {
    if (!openEntry) { setElapsed(null); return }
    function tick() {
      setElapsed(formatDuration(calcDurationMinutes(openEntry!.clock_in, null)))
    }
    tick()
    const id = setInterval(tick, 30000)
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
