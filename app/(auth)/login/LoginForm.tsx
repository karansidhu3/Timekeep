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
      <div className="flex-1 flex flex-col justify-center animate-page-in">
        <p className="text-[#a8a29e] text-sm tracking-[-0.01em] mb-6">Who&apos;s clocking in?</p>
        <div>
          {employees.length === 0 ? (
            <p className="text-sm text-[#a8a29e] py-8 text-center">No employees found.</p>
          ) : (
            <div>
              {employees.map((emp, i) => (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp.id)}
                  className="w-full text-left py-5 flex items-center justify-between
                             border-b border-[#e4e0da] last:border-0
                             active:opacity-50 transition-opacity duration-100"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="text-[2rem] font-semibold tracking-tight text-[#0d0c0b] leading-none">
                    {getFirstName(emp.name)}
                  </span>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-[#c4bfba] flex-shrink-0">
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

      {/* Top: back + name + circles */}
      <div>
        <button
          onClick={() => { setSelectedId(null); setPin(''); setError(null) }}
          className="flex items-center gap-1.5 text-[#44403c] hover:text-[#0d0c0b] transition-colors duration-150 mb-8 -ml-0.5"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium tracking-[-0.01em]">Back</span>
        </button>

        <p className="text-[2rem] font-semibold tracking-tight text-[#0d0c0b] leading-none mb-1">
          {getFirstName(selected?.name ?? '')}
        </p>
        <p className="text-sm text-[#a8a29e] mb-8 tracking-[-0.01em]">
          {isPending ? 'Signing in…' : 'Enter your 4-digit PIN'}
        </p>

        <div className="flex gap-4 mb-3">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-150 ${
                i < pin.length
                  ? 'bg-[#141210] border-[#141210]'
                  : 'bg-transparent border-[#c4bfba]'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-3 tracking-[-0.01em]">{error}</p>
        )}
      </div>

      {/* Keypad — pinned to bottom */}
      <div className="mt-auto pb-2">
        <div className="grid grid-cols-3 gap-1.5">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((d, i) => (
            <button
              key={i}
              onClick={() => d === 'del' ? handlePinClear() : d !== '' ? handlePinPress(d) : undefined}
              disabled={isPending}
              className={`
                h-16 rounded-2xl text-xl font-medium text-[#0d0c0b] select-none
                transition-all duration-100
                ${d === '' ? 'pointer-events-none' : 'bg-white border border-[#ccc8c2] [box-shadow:0_1px_3px_rgba(0,0,0,0.08)] active:scale-[0.92] active:bg-[#f0ede8] active:[box-shadow:none]'}
                disabled:opacity-40 disabled:active:scale-100
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
