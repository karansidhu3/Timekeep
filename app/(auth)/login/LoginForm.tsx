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
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-4 pt-4 pb-2">
          Who are you?
        </p>
        {employees.length === 0 ? (
          <p className="text-sm text-stone-500 px-4 pb-4">No employees found.</p>
        ) : (
          <div className="pb-2">
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
        className="text-sm text-stone-400 mb-6 flex items-center gap-1.5"
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
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
          <button
            key={i}
            onClick={() => d === '⌫' ? handlePinClear() : d !== '' ? handlePinPress(d) : undefined}
            disabled={isPending}
            className={`
              py-5 rounded-xl text-xl font-medium text-stone-900 select-none
              active:bg-stone-100 transition-colors
              ${d === '' ? 'pointer-events-none' : ''}
              disabled:opacity-40
            `}
          >
            {d}
          </button>
        ))}
      </div>
    </Card>
  )
}
