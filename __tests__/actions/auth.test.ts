import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeMockSupabase } from '../helpers/mock-supabase'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
  createServiceClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/lib/actions/auth'

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for wrong PIN', async () => {
    const mock = makeMockSupabase({ signInError: 'Invalid login credentials' })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await signIn('emp-123', '9999')

    expect(result).toEqual({ success: false, error: 'Invalid PIN. Please try again.' })
    expect(vi.mocked(redirect)).not.toHaveBeenCalled()
  })

  it('redirects admin to /admin/dashboard on success', async () => {
    const mock = makeMockSupabase({
      tables: {
        employees: {
          select: { data: { role: 'admin' }, error: null },
        },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    await signIn('emp-admin', '1234')

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('redirects employee to /dashboard on success', async () => {
    const mock = makeMockSupabase({
      tables: {
        employees: {
          select: { data: { role: 'employee' }, error: null },
        },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    await signIn('emp-123', '5555')

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/dashboard')
  })

  it('derives email as {id}@internal.local', async () => {
    const mock = makeMockSupabase({
      tables: {
        employees: { select: { data: { role: 'employee' }, error: null } },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    await signIn('emp-999', '5555')

    expect(mock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'emp-999@internal.local',
      password: '5555::tk',
    })
  })
})

describe('signOut', () => {
  it('calls auth.signOut and redirects to /login', async () => {
    const mock = makeMockSupabase()
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    await signOut()

    expect(mock.auth.signOut).toHaveBeenCalled()
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/login')
  })
})
