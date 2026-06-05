'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function clockIn() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

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

export async function clockOut(entryId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('time_entries')
    .update({ clock_out: new Date().toISOString() })
    .eq('id', entryId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
