'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

// Upsert a single day's template for an employee.
// If a row for (employee_id, day_of_week) already exists it is replaced.
export async function upsertTemplate(data: {
  employeeId: string
  dayOfWeek: number   // 1=Mon … 7=Sun
  startTime: string   // "HH:MM"
  endTime: string     // "HH:MM"
  notes?: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('schedule_templates')
    .upsert(
      {
        employee_id: data.employeeId,
        day_of_week: data.dayOfWeek,
        start_time: data.startTime,
        end_time: data.endTime,
        notes: data.notes ?? null,
      },
      { onConflict: 'employee_id,day_of_week' }
    )

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/templates')
  return { success: true }
}

// Remove a single template day.
export async function deleteTemplate(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('schedule_templates')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/templates')
  return { success: true }
}

// Apply templates to a week.
// The client passes pre-computed UTC datetimes (it knows the local timezone).
// Skips any employee+day that already has a shift in the week to avoid duplicates.
export async function applyTemplatesToWeek(
  shifts: Array<{
    employeeId: string
    startTime: string   // ISO datetime (UTC)
    endTime: string     // ISO datetime (UTC)
    notes: string | null
  }>
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  let created = 0
  let skipped = 0

  for (const shift of shifts) {
    // Check whether a shift already exists for this employee on this calendar day
    const dayStart = new Date(shift.startTime)
    dayStart.setUTCHours(0, 0, 0, 0)
    const dayEnd = new Date(shift.startTime)
    dayEnd.setUTCHours(23, 59, 59, 999)

    const { data: existing } = await supabase
      .from('shifts')
      .select('id')
      .eq('employee_id', shift.employeeId)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    await supabase.from('shifts').insert({
      employee_id: shift.employeeId,
      start_time: shift.startTime,
      end_time: shift.endTime,
      notes: shift.notes,
      created_by: user.id,
    })
    created++
  }

  revalidatePath('/admin/schedule')
  return { success: true, created, skipped }
}
