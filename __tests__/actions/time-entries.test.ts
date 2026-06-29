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
import {
  clockIn,
  clockOut,
  adminCreateTimeEntry,
  adminUpdateTimeEntry,
  adminClockIn,
  adminDeleteTimeEntry,
} from '@/lib/actions/time-entries'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── clockIn ──────────────────────────────────────────────────────────────────

describe('clockIn', () => {
  it('returns error when not authenticated', async () => {
    const mock = makeMockSupabase({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await clockIn()

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns error when employee is inactive', async () => {
    const mock = makeMockSupabase({
      user: { id: 'emp-1' },
      tables: {
        employees: { select: { data: { active: false }, error: null } },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await clockIn()

    expect(result).toEqual({ success: false, error: 'Your account has been deactivated.' })
  })

  it('returns error when already clocked in', async () => {
    const mock = makeMockSupabase({
      user: { id: 'emp-1' },
      tables: {
        employees: { select: { data: { active: true }, error: null } },
        time_entries: { select: { data: { id: 'existing-entry' }, error: null } },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await clockIn()

    expect(result).toEqual({ success: false, error: 'You are already clocked in.' })
  })

  it('inserts entry and revalidates on success', async () => {
    const mock = makeMockSupabase({
      user: { id: 'emp-1' },
      tables: {
        employees: { select: { data: { active: true }, error: null } },
        time_entries: {
          select: { data: null, error: null },   // no existing open entry
          insert: { error: null },
        },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await clockIn()

    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/', 'layout')
  })

  it('returns DB error when insert fails', async () => {
    const mock = makeMockSupabase({
      user: { id: 'emp-1' },
      tables: {
        employees: { select: { data: { active: true }, error: null } },
        time_entries: {
          select: { data: null, error: null },
          insert: { error: { message: 'constraint violation' } },
        },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await clockIn()

    expect(result).toEqual({ success: false, error: 'constraint violation' })
  })
})

// ── clockOut ─────────────────────────────────────────────────────────────────

describe('clockOut', () => {
  it('returns error when not authenticated', async () => {
    const mock = makeMockSupabase({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await clockOut('entry-1')

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns error when entry not found or already closed (0 rows updated)', async () => {
    const mock = makeMockSupabase({
      user: { id: 'emp-1' },
      tables: {
        time_entries: { update: { data: [], error: null } },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await clockOut('nonexistent-entry')

    expect(result).toEqual({
      success: false,
      error: 'Could not clock out — entry not found or already closed.',
    })
  })

  it('returns success when row is updated', async () => {
    const mock = makeMockSupabase({
      user: { id: 'emp-1' },
      tables: {
        time_entries: { update: { data: [{ id: 'entry-1' }], error: null } },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await clockOut('entry-1')

    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/', 'layout')
  })

  it('accepts a custom clock-out time', async () => {
    const customTime = '2025-06-17T20:00:00.000Z'
    const mock = makeMockSupabase({
      user: { id: 'emp-1' },
      tables: {
        time_entries: { update: { data: [{ id: 'entry-1' }], error: null } },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await clockOut('entry-1', customTime)

    expect(result).toEqual({ success: true })
  })

  it('returns DB error from update', async () => {
    const mock = makeMockSupabase({
      user: { id: 'emp-1' },
      tables: {
        time_entries: { update: { data: null, error: { message: 'db error' } } },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await clockOut('entry-1')

    expect(result).toEqual({ success: false, error: 'db error' })
  })
})

// ── adminCreateTimeEntry ──────────────────────────────────────────────────────

describe('adminCreateTimeEntry', () => {
  it('returns error when not authenticated', async () => {
    const mock = makeMockSupabase({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminCreateTimeEntry({
      employeeId: 'emp-1',
      clockIn: '2025-06-17T16:00:00Z',
      clockOut: '2025-06-17T22:00:00Z',
    })

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('inserts entry and returns success', async () => {
    const mock = makeMockSupabase({
      tables: { time_entries: { insert: { error: null } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminCreateTimeEntry({
      employeeId: 'emp-1',
      clockIn: '2025-06-17T16:00:00Z',
      clockOut: '2025-06-17T22:00:00Z',
    })

    expect(result).toEqual({ success: true })
  })

  it('accepts null clockOut for open entry', async () => {
    const mock = makeMockSupabase({
      tables: { time_entries: { insert: { error: null } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminCreateTimeEntry({
      employeeId: 'emp-1',
      clockIn: '2025-06-17T16:00:00Z',
      clockOut: null,
    })

    expect(result).toEqual({ success: true })
  })
})

// ── adminUpdateTimeEntry ──────────────────────────────────────────────────────

describe('adminUpdateTimeEntry', () => {
  it('returns error when not authenticated', async () => {
    const mock = makeMockSupabase({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminUpdateTimeEntry({
      id: 'entry-1',
      clockIn: '2025-06-17T16:00:00Z',
      clockOut: null,
    })

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns success on update', async () => {
    const mock = makeMockSupabase()
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminUpdateTimeEntry({
      id: 'entry-1',
      clockIn: '2025-06-17T16:00:00Z',
      clockOut: '2025-06-17T22:00:00Z',
    })

    expect(result).toEqual({ success: true })
  })
})

// ── adminClockIn ──────────────────────────────────────────────────────────────

describe('adminClockIn', () => {
  it('returns error when not authenticated', async () => {
    const mock = makeMockSupabase({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminClockIn('emp-1')

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('returns error when employee is already clocked in', async () => {
    const mock = makeMockSupabase({
      tables: {
        time_entries: { select: { data: { id: 'open-entry' }, error: null } },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminClockIn('emp-1')

    expect(result).toEqual({ success: false, error: 'Already clocked in.' })
  })

  it('inserts entry and returns success', async () => {
    const mock = makeMockSupabase({
      tables: {
        time_entries: {
          select: { data: null, error: null },
          insert: { error: null },
        },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminClockIn('emp-1')

    expect(result).toEqual({ success: true })
  })
})

// ── adminDeleteTimeEntry ──────────────────────────────────────────────────────

describe('adminDeleteTimeEntry', () => {
  it('returns error when not authenticated', async () => {
    const mock = makeMockSupabase({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminDeleteTimeEntry('entry-1')

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('deletes and returns success', async () => {
    const mock = makeMockSupabase({
      tables: { time_entries: { delete: { error: null } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminDeleteTimeEntry('entry-1')

    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/', 'layout')
  })

  it('returns error on DB failure', async () => {
    const mock = makeMockSupabase({
      tables: { time_entries: { delete: { error: { message: 'cannot delete' } } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await adminDeleteTimeEntry('entry-1')

    expect(result).toEqual({ success: false, error: 'cannot delete' })
  })
})
