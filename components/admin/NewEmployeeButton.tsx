'use client'

import { useState, useTransition } from 'react'
import { createEmployee } from '@/lib/actions/employees'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const selectClass = `
  w-full px-4 py-3 rounded-2xl border border-[#e4e0da]
  text-sm bg-[#f0ede8] text-[#0d0c0b]
  focus:outline-none focus:border-[#78716c] focus:ring-2 focus:ring-[#141210]/10
  min-h-[44px] tracking-[-0.01em]
`

export default function NewEmployeeButton() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const pin = form.get('pin') as string

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createEmployee({
        name: form.get('name') as string,
        role: form.get('role') as 'employee' | 'admin',
        pin,
      })
      if (result.success) setOpen(false)
      else setError(result.error ?? 'Failed to create employee')
    })
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)} size="sm" variant="secondary">+ New employee</Button>
  }

  return (
    <div className="animate-fade-in fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="animate-sheet-up sm:animate-float-in bg-[#fffefb] rounded-t-2xl sm:rounded-2xl [box-shadow:var(--shadow-xl)] w-full sm:max-w-sm p-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-6 overflow-y-auto max-h-[90dvh]">
        <div className="w-10 h-1 bg-[#e4e0da] rounded-full mx-auto mb-5 sm:hidden" />
        <h2 className="text-base font-semibold text-[#0d0c0b] mb-5 tracking-[-0.01em]">New employee</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" name="name" type="text" placeholder="Jane Smith" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#44403c] tracking-[-0.01em]">Role</label>
            <select name="role" className={selectClass}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Input label="4-digit PIN" name="pin" type="text" inputMode="numeric" maxLength={4} placeholder="••••" required />
          {error && <p className="text-sm text-red-500 tracking-[-0.01em]">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setOpen(false); setError(null) }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
