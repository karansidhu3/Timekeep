'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { signIn } from '@/lib/actions/auth'
import Card from '@/components/ui/Card'

interface Employee {
  id: string
  name: string
}

export default function LoginForm({ employees }: { employees: Employee[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const submitRef = useRef(false)

  // Auto-submit the moment the 4th digit is pressed
  useEffect(() => {
    if (pin.length === 4 && selectedId && !isPending && !submitRef.current) {
      submitRef.current = true
      startTransition(async () => {
        const result = await signIn(selectedId, pin)
        submitRef.current = false
        if (result && !result.success) {
          setError(result.error ?? 'Incorrect PIN')
          setPin('')
        }
      })
    }
  }, [pin, selectedId, isPending])

  function handlePinPress(digit: string) {
    if (isPending) return
    if (pin.length < 4) {
      setError(null)
      setPin(p => p + digit)
    }
  }

  function handlePinClear() {
    if (isPending) return
    setPin(p => p.slice(0, -1))
    setError(null)
  }

  function handleSelectEmployee(id: string) {
    setSelectedId(id)
    setPin('')
    setError(null)
    submitRef.current = false
  }

  // ── Name selection ────────────────────────────────────────────────────────
  if (!selectedId) {
    return (
      <Card className="overflow-hidden">
        {employees.length === 0 ? (
          <p className="text-sm text-stone-400 px-4 py-5">No employees found.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => handleSelectEmployee(emp.id)}
                className="w-full text-left px-4 py-4 text-[15px] font-medium text-stone-900 active:bg-stone-50 transition-colors"
              >
                {emp.name}
              </button>
            ))}
          </div>
        )}
      </Card>
    )
  }

  const selected = employees.find(e => e.id === selectedId)

  // ── PIN entry ─────────────────────────────────────────────────────────────
  return (
    <Card className="p-6">
      <button
        onClick={() => { setSelectedId(null); setPin(''); setError(null) }}
        className="text-sm text-stone-400 mb-6 flex items-center gap-1.5 hover:text-stone-700 transition-colors duration-150"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <p className="text-xl font-semibold text-stone-900 mb-1">{selected?.name}</p>
      <p className="text-sm text-stone-400 mb-7">
        {isPending ? 'Signing in…' : 'Enter your 4-digit PIN'}
      </p>

      {/* PIN dots */}
      <div className="flex gap-4 justify-center mb-7">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-100 ${
              i < pin.length ? 'bg-stone-900 scale-110' : 'bg-stone-200'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center mb-5 -mt-2">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-1">
        {['1','2','3','4','5','6','7','8','9','','0','del'].map((d, i) => (
          <button
            key={i}
            onClick={() => d === 'del' ? handlePinClear() : d !== '' ? handlePinPress(d) : undefined}
            disabled={isPending}
            className={`
              py-5 rounded-xl text-xl font-medium text-stone-900 select-none
              active:bg-stone-100 active:scale-[0.93]
              transition-[colors,transform] duration-100
              ${d === '' ? 'pointer-events-none' : ''}
              disabled:opacity-40 disabled:active:scale-100
            `}
          >
            {d === 'del' ? (
              <svg className="mx-auto" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.374a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.12-.796-.33z" />
              </svg>
            ) : d}
          </button>
        ))}
      </div>
    </Card>
  )
}
