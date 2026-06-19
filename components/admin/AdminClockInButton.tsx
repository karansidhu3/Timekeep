'use client'

import { useState, useTransition } from 'react'
import { adminClockIn } from '@/lib/actions/time-entries'

export default function AdminClockInButton({ employeeId, firstName }: { employeeId: string; firstName: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await adminClockIn(employeeId)
      if (!result.success) setError(result.error ?? 'Failed to clock in')
    })
  }

  return (
    <div className="mt-4">
      <button
        data-spring
        onClick={handleClick}
        disabled={isPending}
        className="w-full text-sm font-medium text-[#3d6b55] bg-[#eef4f1] hover:bg-[#dceee5] active:bg-[#c8e2d5] px-4 py-3 rounded-xl transition-colors tracking-[-0.01em] disabled:opacity-50"
      >
        {isPending ? 'Clocking in…' : `Clock in ${firstName}`}
      </button>
      {error && <p className="text-xs text-red-500 mt-2 tracking-[-0.01em]">{error}</p>}
    </div>
  )
}
