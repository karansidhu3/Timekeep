'use client'

import { useState, useTransition } from 'react'
import { signIn } from '@/lib/actions/auth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Employee {
  id: string
  name: string
}

export default function LoginForm({ employees }: { employees: Employee[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePinPress(digit: string) {
    if (pin.length < 4) setPin(p => p + digit)
  }

  function handlePinClear() {
    setPin(p => p.slice(0, -1))
  }

  function handleSubmit() {
    if (!selectedId || pin.length !== 4) return
    setError(null)
    startTransition(async () => {
      const result = await signIn(selectedId, pin)
      if (result && !result.success) {
        setError(result.error ?? 'Something went wrong')
        setPin('')
      }
    })
  }

  if (!selectedId) {
    return (
      <Card className="p-2">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wide px-3 py-2">
          Select your name
        </p>
        {employees.length === 0 ? (
          <p className="text-sm text-stone-500 px-3 py-4">No employees found.</p>
        ) : (
          employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => setSelectedId(emp.id)}
              className="w-full text-left px-4 py-3.5 text-stone-900 font-medium rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors"
            >
              {emp.name}
            </button>
          ))
        )}
      </Card>
    )
  }

  const selected = employees.find(e => e.id === selectedId)

  return (
    <Card className="p-6">
      <button
        onClick={() => { setSelectedId(null); setPin('') }}
        className="text-sm text-stone-500 hover:text-stone-700 mb-5 flex items-center gap-1"
      >
        ← Back
      </button>

      <p className="text-lg font-semibold text-stone-900 mb-1">{selected?.name}</p>
      <p className="text-sm text-stone-500 mb-6">Enter your 4-digit PIN</p>

      <div className="flex gap-3 justify-center mb-6">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-colors duration-150 ${
              i < pin.length ? 'bg-stone-900' : 'bg-stone-200'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600 text-center mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-3 mb-4">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
          <button
            key={i}
            onClick={() => d === '⌫' ? handlePinClear() : d !== '' ? handlePinPress(d) : null}
            className={`
              py-4 rounded-xl text-lg font-medium transition-colors
              ${d === '' ? 'pointer-events-none' : 'hover:bg-stone-100 active:bg-stone-200'}
              text-stone-900
            `}
          >
            {d}
          </button>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={pin.length !== 4 || isPending}
        className="w-full"
        size="lg"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </Card>
  )
}
