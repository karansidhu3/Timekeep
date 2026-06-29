'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { haversineMeters } from '@/lib/haversine'

// ── Geolocation enforcement ───────────────────────────────────────────────────
// Set to true (and configure the env vars below) to enforce location on clock-in.
const ENFORCE_LOCATION = false
const WORK_LAT = parseFloat(process.env.WORK_LAT ?? '0')
const WORK_LNG = parseFloat(process.env.WORK_LNG ?? '0')
const WORK_RADIUS_M = parseInt(process.env.WORK_RADIUS_METERS ?? '100', 10)
// ─────────────────────────────────────────────────────────────────────────────

export async function clockIn(coords?: { lat: number; lng: number }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (ENFORCE_LOCATION) {
    if (!coords) return { success: false, error: 'Location is required to clock in.' }
    const dist = Math.round(haversineMeters(coords.lat, coords.lng, WORK_LAT, WORK_LNG))
    if (dist > WORK_RADIUS_M) {
      return { success: false, error: `You must be at the workplace to clock in (${dist}m away).` }
    }
  }

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

  revalidatePath('/', 'layout')
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

  revalidatePath('/', 'layout')
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

  revalidatePath('/', 'layout')
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

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function adminClockIn(employeeId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('time_entries')
    .select('id')
    .eq('employee_id', employeeId)
    .is('clock_out', null)
    .maybeSingle()

  if (existing) return { success: false, error: 'Already clocked in.' }

  const { error } = await supabase.from('time_entries').insert({
    employee_id: employeeId,
    clock_in: new Date().toISOString(),
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function adminDeleteTimeEntry(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}
