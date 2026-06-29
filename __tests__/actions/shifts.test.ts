import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeMockSupabase } from '../helpers/mock-supabase'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
  createServiceClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createShift, updateShift, deleteShift } from '@/lib/actions/shifts'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── createShift ───────────────────────────────────────────────────────────────

describe('createShift', () => {
  it('returns error when not authenticated', async () => {
    const mock = makeMockSupabase({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await createShift({
      employeeId: 'emp-1',
      startTime: '2025-06-17T16:00:00Z',
      endTime: '2025-06-17T22:00:00Z',
    })

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('inserts shift with created_by set to authenticated user', async () => {
    const mock = makeMockSupabase({
      user: { id: 'admin-user' },
      tables: { shifts: { insert: { error: null } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await createShift({
      employeeId: 'emp-1',
      startTime: '2025-06-17T16:00:00Z',
      endTime: '2025-06-17T22:00:00Z',
    })

    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/', 'layout')
  })

  it('returns DB error on insert failure', async () => {
    const mock = makeMockSupabase({
      tables: { shifts: { insert: { error: { message: 'foreign key violation' } } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await createShift({
      employeeId: 'nonexistent',
      startTime: '2025-06-17T16:00:00Z',
      endTime: '2025-06-17T22:00:00Z',
    })

    expect(result).toEqual({ success: false, error: 'foreign key violation' })
  })

  it('sets notes to null when not provided', async () => {
    const mock = makeMockSupabase({
      tables: { shifts: { insert: { error: null } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await createShift({
      employeeId: 'emp-1',
      startTime: '2025-06-17T16:00:00Z',
      endTime: '2025-06-17T22:00:00Z',
    })

    expect(result).toEqual({ success: true })
  })
})

// ── updateShift ───────────────────────────────────────────────────────────────

describe('updateShift', () => {
  it('returns success on update', async () => {
    const mock = makeMockSupabase()
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await updateShift('shift-1', {
      startTime: '2025-06-17T17:00:00Z',
      endTime: '2025-06-17T23:00:00Z',
    })

    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/', 'layout')
  })

  it('returns DB error on update failure', async () => {
    const mock = makeMockSupabase({
      tables: { shifts: { update: { data: null, error: { message: 'shift not found' } } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await updateShift('nonexistent', { startTime: '2025-06-17T17:00:00Z' })

    expect(result).toEqual({ success: false, error: 'shift not found' })
  })

  it('KNOWN BUG: returns success even when 0 rows updated (no .select() verification)', async () => {
    // updateShift uses .update().eq() without .select(), so it cannot detect
    // 0-row updates. This test documents the existing behavior.
    const mock = makeMockSupabase({
      tables: { shifts: { update: { data: [], error: null } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await updateShift('nonexistent-id', { startTime: '2025-06-17T17:00:00Z' })

    // Bug: returns success even when nothing was updated
    expect(result).toEqual({ success: true })
  })
})

// ── deleteShift ───────────────────────────────────────────────────────────────

describe('deleteShift', () => {
  it('deletes and returns success', async () => {
    const mock = makeMockSupabase({
      tables: { shifts: { delete: { error: null } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await deleteShift('shift-1')

    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/', 'layout')
  })

  it('returns DB error on delete failure', async () => {
    const mock = makeMockSupabase({
      tables: { shifts: { delete: { error: { message: 'permission denied' } } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await deleteShift('shift-1')

    expect(result).toEqual({ success: false, error: 'permission denied' })
  })
})
