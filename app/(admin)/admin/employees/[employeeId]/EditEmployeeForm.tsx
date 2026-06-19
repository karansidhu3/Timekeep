'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateEmployee, deactivateEmployee } from '@/lib/actions/employees'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Employee {
  id: string
  name: string
  role: 'employee' | 'admin'
  active: boolean
}

export default function EditEmployeeForm({ employee }: { employee: Employee }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeactivating, startDeactivateTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const pin = form.get('pin') as string

    if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      setError('PIN must be exactly 4 digits.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await updateEmployee(employee.id, {
        name: form.get('name') as string,
        role: form.get('role') as 'employee' | 'admin',
        ...(pin ? { pin } : {}),
      })
      if (result.success) router.push('/admin/employees')
      else setError(result.error ?? 'Failed to update employee')
    })
  }

  function handleDeactivate() {
    if (!confirm(`Deactivate ${employee.name}? They will no longer be able to sign in.`)) return
    startDeactivateTransition(async () => {
      const result = await deactivateEmployee(employee.id)
      if (result.success) router.push('/admin/employees')
      else setError(result.error ?? 'Failed to deactivate employee')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Full name" name="name" type="text" defaultValue={employee.name} required />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-label-2">Role</label>
        <select name="role" defaultValue={employee.role} className="w-full px-3.5 py-2.5 rounded-xl border border-[#d3c9b2] text-sm bg-[#f9f4ea] focus:outline-none focus:ring-2 focus:ring-[#141210]/20 min-h-[44px]">
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <Input label="New PIN" name="pin" type="text" inputMode="numeric" maxLength={4} placeholder="••••" />
        <p className="text-xs text-label-3 tracking-[-0.01em]">Leave blank to keep the current PIN</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="pt-2">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
        {employee.active && (
          <div className="mt-8 pt-6 border-t border-[#d3c9b2]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-label-4 mb-3">Danger zone</p>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="w-full"
            >
              {isDeactivating ? 'Deactivating…' : 'Deactivate employee'}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}
