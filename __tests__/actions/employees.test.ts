import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeMockSupabase } from '../helpers/mock-supabase'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('$2b$10$mocked-hash'),
}))
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
  createServiceClient: vi.fn(),
}))

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createEmployee, updateEmployee, deactivateEmployee } from '@/lib/actions/employees'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── createEmployee ────────────────────────────────────────────────────────────

describe('createEmployee', () => {
  it('returns success when all 3 steps complete', async () => {
    const mock = makeMockSupabase({
      tables: { employees: { insert: { error: null } } },
    })
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    const result = await createEmployee({ name: 'Alice', role: 'employee', pin: '1234' })

    expect(result).toEqual({ success: true })
    expect(mock.auth.admin.createUser).toHaveBeenCalled()
    expect(mock.auth.admin.updateUserById).toHaveBeenCalledWith(
      'new-user-id',
      expect.objectContaining({ email: 'new-user-id@internal.local' })
    )
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/', 'layout')
  })

  it('returns error and does not proceed when createUser fails', async () => {
    const mock = makeMockSupabase({
      adminAuth: {
        createUser: { data: null, error: { message: 'auth service error' } },
      },
    })
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    const result = await createEmployee({ name: 'Bob', role: 'employee', pin: '5678' })

    expect(result).toEqual({ success: false, error: 'auth service error' })
    expect(mock.auth.admin.updateUserById).not.toHaveBeenCalled()
  })

  it('deletes auth user and returns error when employee insert fails', async () => {
    const mock = makeMockSupabase({
      tables: { employees: { insert: { error: { message: 'duplicate key' } } } },
    })
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    const result = await createEmployee({ name: 'Carol', role: 'admin', pin: '0000' })

    expect(result).toEqual({ success: false, error: 'duplicate key' })
    expect(mock.auth.admin.deleteUser).toHaveBeenCalledWith('new-user-id')
  })

  it('hashes the PIN with bcryptjs (never stores plaintext)', async () => {
    const { hash } = await import('bcryptjs')
    const mock = makeMockSupabase({
      tables: { employees: { insert: { error: null } } },
    })
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    await createEmployee({ name: 'Dave', role: 'employee', pin: '9999' })

    expect(vi.mocked(hash)).toHaveBeenCalledWith('9999', 10)
  })

  it('uses temp email for createUser then updates to canonical email', async () => {
    const mock = makeMockSupabase({
      tables: { employees: { insert: { error: null } } },
    })
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    await createEmployee({ name: 'Eve', role: 'employee', pin: '1111' })

    const createCall = mock.auth.admin.createUser.mock.calls[0][0]
    expect(createCall.email).toMatch(/^tmp-\d+@internal\.local$/)
    expect(createCall.password).toBe('1111::tk')
    expect(createCall.email_confirm).toBe(true)
  })
})

// ── updateEmployee ────────────────────────────────────────────────────────────

describe('updateEmployee', () => {
  it('returns success when update succeeds', async () => {
    const mock = makeMockSupabase()
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    const result = await updateEmployee('emp-1', { name: 'Alice Updated' })

    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalled()
  })

  it('also updates Supabase Auth password when PIN is changed', async () => {
    const mock = makeMockSupabase()
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    await updateEmployee('emp-1', { pin: '9876' })

    expect(mock.auth.admin.updateUserById).toHaveBeenCalledWith(
      'emp-1',
      { password: '9876::tk' }
    )
  })

  it('does NOT call updateUserById when PIN is not changed', async () => {
    const mock = makeMockSupabase()
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    await updateEmployee('emp-1', { name: 'New Name' })

    expect(mock.auth.admin.updateUserById).not.toHaveBeenCalled()
  })

  it('returns error when DB update fails', async () => {
    const mock = makeMockSupabase({
      tables: { employees: { update: { data: null, error: { message: 'not found' } } } },
    })
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    const result = await updateEmployee('emp-nonexistent', { name: 'X' })

    expect(result).toEqual({ success: false, error: 'not found' })
  })
})

// ── deactivateEmployee ────────────────────────────────────────────────────────

describe('deactivateEmployee', () => {
  it('sets active=false and returns success', async () => {
    const mock = makeMockSupabase()
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    const result = await deactivateEmployee('emp-1')

    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalled()
  })

  it('returns error on DB failure', async () => {
    const mock = makeMockSupabase({
      tables: { employees: { update: { data: null, error: { message: 'row locked' } } } },
    })
    vi.mocked(createServiceClient).mockReturnValue(mock as any)

    const result = await deactivateEmployee('emp-1')

    expect(result).toEqual({ success: false, error: 'row locked' })
  })
})
