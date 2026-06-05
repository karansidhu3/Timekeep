# Technical Reference

> Implementation details for the workforce scheduling and time tracking system.
> Read CLAUDE_DOCTRINE.md first. This document covers the *how*.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js App Router + TypeScript + Tailwind CSS |
| Backend | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel |

---

## Repository Structure

```
/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # PIN login page
│   ├── (employee)/
│   │   ├── layout.tsx                # Mobile nav shell
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Today's shift + clock in/out
│   │   └── schedule/
│   │       └── page.tsx              # Weekly schedule view
│   ├── (admin)/
│   │   ├── layout.tsx                # Sidebar shell
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Admin overview
│   │   ├── schedule/
│   │   │   ├── page.tsx              # Schedule management
│   │   │   └── [shiftId]/
│   │   │       └── page.tsx          # Edit/delete shift
│   │   ├── employees/
│   │   │   ├── page.tsx              # Employee list
│   │   │   └── [employeeId]/
│   │   │       └── page.tsx          # Edit employee
│   │   └── time-entries/
│   │       └── page.tsx              # Clock-in/out records
│   ├── layout.tsx                    # Root HTML shell
│   ├── page.tsx                      # Redirects to /dashboard or /login
│   └── globals.css
├── components/
│   ├── ui/                           # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── EmptyState.tsx
│   ├── employee/
│   │   ├── ShiftCard.tsx
│   │   ├── ClockInButton.tsx
│   │   ├── WeeklySchedule.tsx
│   │   └── BottomNav.tsx
│   └── admin/
│       ├── Sidebar.tsx
│       ├── ShiftForm.tsx
│       ├── EmployeeForm.tsx
│       ├── TimeEntriesTable.tsx
│       └── AdminWeeklyView.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # createBrowserClient
│   │   └── server.ts                 # createServerClient (cookies)
│   ├── actions/
│   │   ├── auth.ts                   # signIn, signOut
│   │   ├── shifts.ts                 # createShift, updateShift, deleteShift
│   │   ├── time-entries.ts           # clockIn, clockOut
│   │   └── employees.ts              # createEmployee, updateEmployee, deactivateEmployee
│   └── utils.ts                      # formatDuration, formatShiftTime, getWeekRange
├── middleware.ts                     # Route protection
├── supabase/
│   └── migrations/
│       ├── 001_create_employees.sql
│       ├── 002_create_shifts.sql
│       ├── 003_create_time_entries.sql
│       └── 004_seed_dev_data.sql
├── docs/
│   ├── CLAUDE_DOCTRINE.md
│   └── CLAUDE_TECHNICAL.md
├── .env.local                        # Never commit
├── .env.example
└── CLAUDE.md
```

---

## Database Schema

### `employees`

```sql
create table employees (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null check (role in ('employee', 'admin')),
  pin        text not null,          -- bcrypt hash
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
```

### `shifts`

```sql
create table shifts (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  notes       text,
  created_by  uuid not null references employees(id),
  created_at  timestamptz not null default now(),

  constraint shifts_end_after_start check (end_time > start_time)
);
```

### `time_entries`

```sql
create table time_entries (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  clock_in    timestamptz not null,
  clock_out   timestamptz,           -- null = currently clocked in
  notes       text,
  created_at  timestamptz not null default now()
);
```

### Indexes

```sql
create index on shifts (employee_id);
create index on shifts (start_time);
create index on time_entries (employee_id);
create index on time_entries (clock_in);
```

### Row Level Security

```sql
alter table employees   enable row level security;
alter table shifts      enable row level security;
alter table time_entries enable row level security;

-- employees: read own row
create policy "employees_read_own"
  on employees for select
  using (id = auth.uid());

-- admins: full access to employees
create policy "admins_manage_employees"
  on employees for all
  using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
  );

-- employees: read own shifts
create policy "employees_read_own_shifts"
  on shifts for select
  using (employee_id = auth.uid());

-- admins: full access to shifts
create policy "admins_manage_shifts"
  on shifts for all
  using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
  );

-- employees: read own time entries
create policy "employees_read_own_time_entries"
  on time_entries for select
  using (employee_id = auth.uid());

-- employees: clock in (insert own)
create policy "employees_insert_own_time_entries"
  on time_entries for insert
  with check (employee_id = auth.uid());

-- employees: clock out (update own open entry)
create policy "employees_update_own_time_entries"
  on time_entries for update
  using (employee_id = auth.uid() and clock_out is null);

-- admins: full access to time entries
create policy "admins_manage_time_entries"
  on time_entries for all
  using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
  );
```

---

## Authentication Strategy

**Mechanism:** Supabase Auth + PIN-based login

**Why PIN:**
- Employees don't have work email addresses
- 4-digit PIN is low-friction on mobile
- Eliminates password reset flows entirely
- Business is trust-based; threat model is low

**Login flow:**
1. Employee selects their name from a list
2. Enters 4-digit PIN
3. Server Action calls `supabase.auth.signInWithPassword` using:
   - email: `{employee_id}@internal.local`
   - password: their PIN
4. On success: session cookie set, redirect based on `role`

**Employee creation (admin):**
- Insert row into `employees` table
- Call `supabase.auth.admin.createUser` with derived email + PIN as password
- Requires `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to client)

**PIN reset (admin):**
- Update `employees.pin` hash
- Call `supabase.auth.admin.updateUserById` with new password

**Route protection (`middleware.ts`):**

```
/login          → public
/dashboard/*    → requires session
/schedule/*     → requires session
/admin/*        → requires session + role === 'admin'
```

---

## Server Actions Pattern

All mutations live in `lib/actions/`. Standard shape:

```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createShift(data: CreateShiftInput) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('shifts')
    .insert({
      employee_id: data.employeeId,
      start_time:  data.startTime,
      end_time:    data.endTime,
      notes:       data.notes ?? null,
      created_by:  data.createdBy,
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/schedule')
  return { success: true }
}
```

**Rules:**
- Always return `{ success: boolean, error?: string }`
- Always call `revalidatePath` after mutations
- Never return raw Supabase error objects to the client
- Keep actions thin — no business logic beyond validation + DB call

---

## Data Fetching Pattern

Fetch in Server Components, pass as props to Client Components:

```typescript
// app/(employee)/dashboard/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const { data: shift } = await supabase
    .from('shifts')
    .select('*')
    .gte('start_time', startOfToday)
    .lte('start_time', endOfToday)
    .single()

  const { data: openEntry } = await supabase
    .from('time_entries')
    .select('*')
    .is('clock_out', null)
    .single()

  return <Dashboard shift={shift} openEntry={openEntry} />
}
```

**Rules:**
- Fetch data in page/layout Server Components
- Use `revalidatePath` for cache invalidation — no SWR or React Query in MVP
- `'use client'` only when interactivity is required (forms, buttons)

---

## Server Actions Reference

### `lib/actions/auth.ts`
| Action | Effect |
|--------|--------|
| `signIn(employeeId, pin)` | `supabase.auth.signInWithPassword` → redirect |
| `signOut()` | `supabase.auth.signOut` → redirect to `/login` |

### `lib/actions/shifts.ts`
| Action | Effect |
|--------|--------|
| `createShift(data)` | INSERT into shifts; revalidate schedule |
| `updateShift(shiftId, data)` | UPDATE shifts; revalidate schedule |
| `deleteShift(shiftId)` | DELETE from shifts; revalidate schedule |

### `lib/actions/time-entries.ts`
| Action | Effect |
|--------|--------|
| `clockIn()` | INSERT time_entry (clock_in = now()); revalidate dashboard |
| `clockOut(entryId)` | UPDATE time_entry (clock_out = now()); revalidate dashboard |

### `lib/actions/employees.ts`
| Action | Effect |
|--------|--------|
| `createEmployee(data)` | INSERT employee + create Supabase Auth user |
| `updateEmployee(id, data)` | UPDATE employees; optionally reset Auth password |
| `deactivateEmployee(id)` | UPDATE employees SET active = false |

---

## Environment Variables

```bash
# .env.local — never commit this file

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never expose to browser
```

---

## Date & Time Rules

- All timestamps stored as `timestamptz` in UTC
- Display in browser's local timezone via `Intl` API
- Use `date-fns` for date math (`npm install date-fns`)
- Never use `moment.js`
- Format: `Mon Jun 9 · 9:00 AM – 5:00 PM`
- Duration format: `8h 0m`

---

## Error Handling

- Server Actions return `{ success: false, error: string }` on failure
- Show inline error messages — no custom error boundaries in MVP
- Never swallow errors silently

---

## MVP Scope

### In Scope ✅

**Employee**
- [ ] PIN login (select name + enter PIN)
- [ ] View today's shift
- [ ] Clock in / clock out
- [ ] Elapsed time display when clocked in
- [ ] Weekly schedule view + week navigation

**Admin**
- [ ] All employee features
- [ ] Weekly schedule view (all employees)
- [ ] Create / edit / delete shifts
- [ ] Time entries table with duration calculation
- [ ] Employee list
- [ ] Create / edit employee + PIN reset
- [ ] Deactivate employee

**Infrastructure**
- [ ] Supabase schema + RLS deployed
- [ ] Vercel deployment live
- [ ] Tested on real mobile devices

### Out of Scope ❌

- Shift templates / recurring shifts
- Email / SMS notifications
- Shift swap requests
- Overtime alerts
- CSV export
- Payroll integration
- Break tracking
- Multiple locations

---

## Development Sequence

Build in this exact order. Do not skip ahead.

### Phase 1 — Foundation
1. Initialize Next.js (TypeScript + Tailwind + App Router)
2. Configure Supabase client (browser + server)
3. Run database migrations
4. Set up `middleware.ts` for route protection

### Phase 2 — Auth
5. Build `/login` page (employee selector + PIN input)
6. Implement `signIn` + `signOut` Server Actions
7. Verify role-based redirect works

### Phase 3 — Employee MVP
8. Dashboard: today's shift display
9. Dashboard: clock in / clock out + status timer
10. Schedule: weekly view + week navigation

### Phase 4 — Admin MVP
11. Admin schedule: weekly view (all employees)
12. Create / edit / delete shift forms + Server Actions
13. Time entries table
14. Employee list + create / edit / deactivate forms

### Phase 5 — Polish & Deploy
15. Mobile responsiveness audit
16. Error and empty states
17. Deploy to Vercel + set env vars
18. Smoke test on real device

---

## Known Intentional Limitations

These are deliberate decisions, not bugs:

- **No audit log** — who changed what is not tracked in MVP
- **No clock-in validation** — overlapping entries are possible; admin corrects manually
- **No shift conflict detection** — admin is trusted to schedule reasonably
- **No timezone config** — app uses browser timezone; fine for single-location business
- **No pagination** — 5–6 employees, trivial data volume
- **No real-time updates** — refresh the page to see changes

---

## Common Commands

```bash
npm run dev          # start dev server
npx tsc --noEmit     # type check
git push origin main # triggers Vercel auto-deploy
```
