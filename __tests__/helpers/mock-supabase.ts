import { vi } from 'vitest'

export type MockResult<T = any> = { data: T; error: null } | { data: null; error: { message: string } }

export interface TableConfig {
  select?: MockResult | MockResult[]
  insert?: { error: { message: string } | null }
  update?: { data?: any[] | null; error: { message: string } | null }
  upsert?: { error: { message: string } | null }
  delete?: { error: { message: string } | null }
}

export interface MockConfig {
  user?: { id: string; email?: string } | null
  signInError?: string | null
  tables?: Record<string, TableConfig>
  adminAuth?: {
    createUser?: MockResult
    updateUserById?: MockResult
    deleteUser?: MockResult
  }
}

function makeSeqMock(config: MockResult | MockResult[] | undefined) {
  const fn = vi.fn()
  if (!config) {
    fn.mockResolvedValue({ data: null, error: null })
  } else if (Array.isArray(config)) {
    for (const r of config) fn.mockResolvedValueOnce(r)
    fn.mockResolvedValue({ data: null, error: null })
  } else {
    fn.mockResolvedValue(config)
  }
  return fn
}

export function makeMockSupabase(config: MockConfig = {}) {
  // Per-table mock fns are created once and shared across from() calls so
  // sequential mockResolvedValueOnce queues drain correctly in loops.
  const tableCache = new Map<string, ReturnType<typeof buildTableEntry>>()

  function buildTableEntry(table: string) {
    const tc = config.tables?.[table] ?? {}
    const updateResult = tc.update !== undefined
      ? tc.update
      : { data: [{ id: 'mock-id' }], error: null }
    const deleteResult = tc.delete !== undefined
      ? tc.delete
      : { error: null }
    const readTerminal = makeSeqMock(tc.select)
    return {
      readTerminal,
      insertFn: vi.fn().mockResolvedValue(tc.insert !== undefined ? tc.insert : { error: null }),
      upsertFn: vi.fn().mockResolvedValue(tc.upsert !== undefined ? tc.upsert : { error: null }),
      updateResult,
      deleteResult,
    }
  }

  function getTable(table: string) {
    if (!tableCache.has(table)) tableCache.set(table, buildTableEntry(table))
    return tableCache.get(table)!
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: config.user !== undefined ? config.user : { id: 'test-user-id' } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        error: config.signInError ? { message: config.signInError } : null,
        data: { user: null },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      admin: {
        createUser: vi.fn().mockResolvedValue(
          config.adminAuth?.createUser ?? { data: { user: { id: 'new-user-id' } }, error: null }
        ),
        updateUserById: vi.fn().mockResolvedValue(
          config.adminAuth?.updateUserById ?? { data: null, error: null }
        ),
        deleteUser: vi.fn().mockResolvedValue(
          config.adminAuth?.deleteUser ?? { data: null, error: null }
        ),
      },
    },

    from: vi.fn().mockImplementation((table: string) => {
      const t = getTable(table)

      // Read chain — shared terminal fn so sequential values drain across calls
      const readChain: Record<string, unknown> = {}
      for (const m of ['eq', 'neq', 'is', 'not', 'gte', 'lte', 'order', 'limit', 'in', 'contains']) {
        readChain[m] = vi.fn().mockReturnValue(readChain)
      }
      readChain.select = vi.fn().mockReturnValue(readChain)
      readChain.single = t.readTerminal
      readChain.maybeSingle = t.readTerminal
      // templates.ts uses .maybySingle() (note the 'y') — support both spellings
      readChain.maybySingle = t.readTerminal

      // update().eq() → thenable (supports both await .eq() and await .eq().select())
      const updateResult = t.updateResult
      const eqResult: Record<string, unknown> = {
        then: (res: (v: unknown) => void, rej: (e: unknown) => void) =>
          Promise.resolve(updateResult).then(res, rej),
        catch: (rej: (e: unknown) => void) => Promise.resolve(updateResult).catch(rej),
        select: vi.fn().mockResolvedValue(updateResult),
      }
      const updateProxy = { eq: vi.fn().mockReturnValue(eqResult) }

      // delete().eq() → Promise
      const deleteProxy = { eq: vi.fn().mockResolvedValue(t.deleteResult) }

      return {
        select: vi.fn().mockReturnValue(readChain),
        insert: t.insertFn,
        update: vi.fn().mockReturnValue(updateProxy),
        delete: vi.fn().mockReturnValue(deleteProxy),
        upsert: t.upsertFn,
      }
    }),
  }
}
