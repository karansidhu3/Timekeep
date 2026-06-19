'use server'

import { revalidatePath } from 'next/cache'
import { hash } from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase/server'

interface EmployeeInput {
  name: string
  role: 'employee' | 'admin'
  pin: string
}

export async function createEmployee(data: EmployeeInput) {
  const service = createServiceClient()

  // Create auth user first — the UUID it generates becomes the employee's ID
  const tempEmail = `tmp-${Date.now()}@internal.local`
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email: tempEmail,
    password: data.pin + '::tk',
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { success: false, error: authError?.message ?? 'Failed to create auth user' }
  }

  const userId = authData.user.id

  // Update the email to the canonical {id}@internal.local format
  await service.auth.admin.updateUserById(userId, {
    email: `${userId}@internal.local`,
  })

  const pinHash = await hash(data.pin, 10)

  // Insert the employee row using the auth UUID as primary key
  const { error: insertError } = await service
    .from('employees')
    .insert({ id: userId, name: data.name, role: data.role, pin: pinHash })

  if (insertError) {
    await service.auth.admin.deleteUser(userId)
    return { success: false, error: insertError.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateEmployee(
  id: string,
  data: { name?: string; role?: 'employee' | 'admin'; pin?: string }
) {
  const service = createServiceClient()

  const updateData: Record<string, string> = {}
  if (data.name) updateData.name = data.name
  if (data.role) updateData.role = data.role
  if (data.pin) updateData.pin = await hash(data.pin, 10)

  const { error } = await service.from('employees').update(updateData).eq('id', id)
  if (error) return { success: false, error: error.message }

  if (data.pin) {
    // The employee's Supabase Auth UUID is their employee ID — no lookup needed
    const { error: authError } = await service.auth.admin.updateUserById(id, { password: data.pin + '::tk' })
    if (authError) return { success: false, error: 'PIN update failed: ' + authError.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deactivateEmployee(id: string) {
  const service = createServiceClient()

  const { error } = await service
    .from('employees')
    .update({ active: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}
