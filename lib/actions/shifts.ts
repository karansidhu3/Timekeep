'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

interface ShiftInput {
  employeeId: string
  startTime: string
  endTime: string
  notes?: string
  createdBy: string
}

export async function createShift(data: ShiftInput) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('shifts').insert({
    employee_id: data.employeeId,
    start_time: data.startTime,
    end_time: data.endTime,
    notes: data.notes ?? null,
    created_by: data.createdBy,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/schedule')
  return { success: true }
}

export async function updateShift(shiftId: string, data: Partial<ShiftInput>) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('shifts').update({
    ...(data.employeeId && { employee_id: data.employeeId }),
    ...(data.startTime && { start_time: data.startTime }),
    ...(data.endTime && { end_time: data.endTime }),
    notes: data.notes ?? null,
  }).eq('id', shiftId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/schedule')
  return { success: true }
}

export async function deleteShift(shiftId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('shifts').delete().eq('id', shiftId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/schedule')
  return { success: true }
}
