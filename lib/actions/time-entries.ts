'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function clockIn() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Belt-and-suspenders: verify the employee is still active even if a stale
  // session somehow bypassed the proxy check.
  const { data: emp } = await supabase
    .from('employees')
    .select('active')
    .eq('id', user.id)
    .single()
  if (!emp?.active) return { success: false, error: 'Your account has been deactivated.' }

  const { data: existing } = await supabase
    .from('time_entries')
    .select('id')
    .eq('employee_id', user.id)
    .is('clock_out', null)
    .maybeSingle()

  if (existing) return { success: false, error: 'You are already clocked in.' }

  const { error } = await supabase.from('time_entries').insert({
    employee_id: user.id,
    clock_in: new Date().toISOString(),
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// customClockOut: ISO string — used when employee is correcting a missed clock-out
export async function clockOut(entryId: string, customClockOut?: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const clockOutTime = customClockOut ?? new Date().toISOString()

  // .select() after .update() returns the modified rows — if empty, no row matched
  // (entry already closed, deleted, or wrong id). Without this check the action
  // would return success on a 0-row update, leaving the UI in a confused state.
  const { data: updated, error } = await supabase
    .from('time_entries')
    .update({ clock_out: clockOutTime })
    .eq('id', entryId)
    .select('id')

  if (error) return { success: false, error: error.message }
  if (!updated || updated.length === 0) {
    return { success: false, error: 'Could not clock out — entry not found or already closed.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ── Admin actions ─────────────────────────────────────────────────────────────

export async function adminCreateTimeEntry(data: {
  employeeId: string
  clockIn: string
  clockOut: string | null
  notes?: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('time_entries').insert({
    employee_id: data.employeeId,
    clock_in: data.clockIn,
    clock_out: data.clockOut ?? null,
    notes: data.notes ?? null,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/time-entries')
  return { success: true }
}

export async function adminUpdateTimeEntry(data: {
  id: string
  clockIn: string
  clockOut: string | null
  notes?: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('time_entries')
    .update({
      clock_in: data.clockIn,
      clock_out: data.clockOut ?? null,
      notes: data.notes ?? null,
    })
    .eq('id', data.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/time-entries')
  return { success: true }
}
