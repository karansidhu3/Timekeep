'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function signIn(employeeId: string, pin: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: `${employeeId}@internal.local`,
    password: pin + '::tk',
  })

  if (error) return { success: false, error: 'Invalid PIN. Please try again.' }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', employeeId)
    .single()

  if (employee?.role === 'admin') redirect('/admin/dashboard')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
