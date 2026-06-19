'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { signIn } from '@/lib/actions/auth'

interface Employee {
  id: string
  name: string
  role: string
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0]
}

export default function LoginForm({ employees }: { employees: Employee[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [shake, setShake] = useState(false)
  const [dotAnimIdx, setDotAnimIdx] = useState(-1)
  const [dotAnimKey, setDotAnimKey] = useState(0)
  const submitRef = useRef(false)

  // Auto-submit on 4th digit
  useEffect(() => {
    if (pin.length === 4 && selectedId && !isPending && !submitRef.current) {
      submitRef.current = true
      startTransition(async () => {
        const result = await signIn(selectedId, pin)
        submitRef.current = false
        if (result && !result.success) {
          setError(result.error ?? 'Incorrect PIN')
          setPin('')
          setShake(true)
          setDotAnimIdx(-1)
        }
      })
    }
  }, [pin, selectedId, isPending])

  function handlePinPress(digit: string) {
    if (isPending) return
    if (pin.length < 4) {
      setError(null)
      const newIdx = pin.length
      setDotAnimIdx(newIdx)
      setDotAnimKey(k => k + 1)
      setPin(p => p + digit)
    }
  }

  function handlePinClear() {
    if (isPending) return
    setPin(p => p.slice(0, -1))
    setDotAnimIdx(-1)
    setError(null)
  }

  function handleSelectEmployee(id: string) {
    setSelectedId(id)
    setPin('')
    setError(null)
    setShake(false)
    setDotAnimIdx(-1)
    submitRef.current = false
  }

  // ── Name selection ────────────────────────────────────────────────────────
  if (!selectedId) {
    return (
      <div className="flex-1 flex flex-col justify-end pb-8">
        <p className="text-[2.75rem] font-semibold tracking-tight text-label-1 leading-none mb-8 animate-float-in">
          Who&apos;s<br />clocking in?
        </p>
        <div>
          {employees.length === 0 ? (
            <p className="text-sm text-label-3 py-8 text-center animate-float-in">No employees found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {employees.map((emp, i) => (
                <button
                  key={emp.id}
                  data-spring
                  onClick={() => handleSelectEmployee(emp.id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between
                             bg-[#f9f4ea] border border-[#d3c9b2] rounded-2xl
                             [box-shadow:0_1px_3px_rgba(20,16,10,0.08)]
                             active:bg-[#eae3d3] active:[box-shadow:none]
                             transition-colors duration-100 animate-float-in"
                  style={{ animationDelay: `${60 + i * 60}ms` }}
                >
                  <span className="text-[1.5rem] font-semibold tracking-tight text-label-1 leading-none">
                    {getFirstName(emp.name)}
                  </span>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-label-3 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const selected = employees.find(e => e.id === selectedId)

  // ── PIN entry ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col animate-scale-in">

      {/* Back button — top */}
      <div className="mt-5">
        <button
          onClick={() => { setSelectedId(null); setPin(''); setError(null) }}
          className="inline-flex items-center gap-1 px-3 py-2 -ml-1 rounded-xl bg-[#eae3d3] hover:bg-[#ddd4be] active:bg-[#d3c9b2] text-sm font-medium text-label-1 transition-colors duration-150 tracking-[-0.01em]"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Name + dots + keypad — one cohesive bottom group */}
      <div className="mt-auto pb-8">
        <p className="text-[2.5rem] font-semibold tracking-tight text-label-1 leading-none mb-1">
          {getFirstName(selected?.name ?? '')}
        </p>
        <p className="text-sm text-label-3 tracking-[-0.01em] mb-10">
          {isPending ? 'Signing in…' : 'Enter your 4-digit PIN'}
        </p>

        <div
          className={`flex gap-5 justify-center mb-6 ${shake ? 'animate-shake' : ''}`}
          onAnimationEnd={() => setShake(false)}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i === dotAnimIdx ? `dot-${i}-${dotAnimKey}` : i}
              className={`w-5 h-5 rounded-full border-2 ${
                i < pin.length
                  ? `bg-[#141210] border-[#141210] ${i === dotAnimIdx ? 'animate-dot-pop' : ''}`
                  : 'bg-transparent border-[#d3c9b2] transition-all duration-150'
              }`}
            />
          ))}
        </div>

        {error && (
          <p key={error} className="text-sm text-red-500 text-center mb-5 tracking-[-0.01em] animate-error-in">{error}</p>
        )}

        <div className="grid grid-cols-3 gap-1.5">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((d, i) => (
            <button
              key={i}
              data-spring={d !== '' ? true : undefined}
              onClick={() => d === 'del' ? handlePinClear() : d !== '' ? handlePinPress(d) : undefined}
              disabled={isPending}
              className={`
                h-16 rounded-2xl text-xl font-medium text-label-1 select-none
                transition-colors duration-100
                ${d === '' ? 'pointer-events-none' : 'bg-[#f9f4ea] border border-[#d3c9b2] [box-shadow:0_1px_2px_rgba(20,16,10,0.07)] active:bg-[#eae3d3] active:[box-shadow:none]'}
                disabled:opacity-40
              `}
            >
              {d === 'del' ? (
                <svg className="mx-auto" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.374a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.12-.796-.33z" />
                </svg>
              ) : d}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

