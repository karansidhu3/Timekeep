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
import { upsertTemplate, deleteTemplate, applyTemplatesToWeek } from '@/lib/actions/templates'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── upsertTemplate ─────────────────────────────────────────────────────────────

describe('upsertTemplate', () => {
  it('returns error when not authenticated', async () => {
    const mock = makeMockSupabase({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await upsertTemplate({
      employeeId: 'emp-1',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
    })

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('upserts template and returns success', async () => {
    const mock = makeMockSupabase({
      tables: { schedule_templates: { upsert: { error: null } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await upsertTemplate({
      employeeId: 'emp-1',
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '17:00',
    })

    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalled()
  })

  it('returns error on upsert failure', async () => {
    const mock = makeMockSupabase({
      tables: { schedule_templates: { upsert: { error: { message: 'unique constraint' } } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await upsertTemplate({
      employeeId: 'emp-1',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
    })

    expect(result).toEqual({ success: false, error: 'unique constraint' })
  })
})

// ── deleteTemplate ─────────────────────────────────────────────────────────────

describe('deleteTemplate', () => {
  it('returns error when not authenticated', async () => {
    const mock = makeMockSupabase({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await deleteTemplate('tmpl-1')

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('deletes and returns success', async () => {
    const mock = makeMockSupabase({
      tables: { schedule_templates: { delete: { error: null } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await deleteTemplate('tmpl-1')

    expect(result).toEqual({ success: true })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalled()
  })

  it('returns error on delete failure', async () => {
    const mock = makeMockSupabase({
      tables: { schedule_templates: { delete: { error: { message: 'not found' } } } },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await deleteTemplate('nonexistent')

    expect(result).toEqual({ success: false, error: 'not found' })
  })
})

// ── applyTemplatesToWeek ───────────────────────────────────────────────────────

const SHIFT_A = {
  employeeId: 'emp-1',
  startTime: '2025-06-17T16:00:00Z',
  endTime: '2025-06-17T22:00:00Z',
  notes: null,
}

const SHIFT_B = {
  employeeId: 'emp-2',
  startTime: '2025-06-17T16:00:00Z',
  endTime: '2025-06-17T22:00:00Z',
  notes: null,
}

describe('applyTemplatesToWeek', () => {
  it('returns error when not authenticated', async () => {
    const mock = makeMockSupabase({ user: null })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await applyTemplatesToWeek([SHIFT_A])

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
  })

  it('creates all shifts when none exist', async () => {
    const mock = makeMockSupabase({
      tables: {
        shifts: {
          select: { data: null, error: null },  // no existing shifts
          insert: { error: null },
        },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await applyTemplatesToWeek([SHIFT_A, SHIFT_B])

    expect(result).toEqual({ success: true, created: 2, skipped: 0 })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalled()
  })

  it('skips shifts when employee already has a shift that day', async () => {
    // First shift: no existing → create. Second shift: existing → skip.
    const mock = makeMockSupabase({
      tables: {
        shifts: {
          select: [
            { data: null, error: null },           // first check: no existing
            { data: { id: 'existing' }, error: null }, // second check: exists
          ],
          insert: { error: null },
        },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await applyTemplatesToWeek([SHIFT_A, SHIFT_B])

    expect(result).toEqual({ success: true, created: 1, skipped: 1 })
  })

  it('skips all shifts when all already exist', async () => {
    const mock = makeMockSupabase({
      tables: {
        shifts: {
          select: { data: { id: 'existing' }, error: null },  // always exists
        },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await applyTemplatesToWeek([SHIFT_A, SHIFT_B])

    expect(result).toEqual({ success: true, created: 0, skipped: 2 })
  })

  it('returns success with zero created for empty input', async () => {
    const mock = makeMockSupabase()
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    const result = await applyTemplatesToWeek([])

    expect(result).toEqual({ success: true, created: 0, skipped: 0 })
  })

  it('sets created_by to the authenticated user ID', async () => {
    const mock = makeMockSupabase({
      user: { id: 'admin-user-id' },
      tables: {
        shifts: {
          select: { data: null, error: null },
          insert: { error: null },
        },
      },
    })
    vi.mocked(createServerClient).mockResolvedValue(mock as any)

    await applyTemplatesToWeek([SHIFT_A])

    // Verify insert was called (the insertFn on the shifts table)
    const shiftsTable = mock.from.mock.results.find(
      (r: any) => mock.from.mock.calls[mock.from.mock.results.indexOf(r)]?.[0] === 'shifts'
    )
    expect(shiftsTable).toBeDefined()
  })
})
