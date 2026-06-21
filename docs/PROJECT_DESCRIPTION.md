# TimeKeep — Master Project Description

**For use with Career OS and resume generation tools.**

---

## Project Summary

Designed, engineered, and shipped TimeKeep — a full-stack workforce management application built for small businesses operating real shift-based teams. The product targets the specific operational gap between enterprise scheduling software (too complex) and paper schedules or group chats (too fragile). Built entirely solo from product concept through deployment, with zero third-party component libraries, a custom design system, and a proprietary authentication model.

---

## Scale and Scope

- **61 source files** across app, components, and library layers
- **21 page-level components** (Next.js App Router)
- **30 reusable UI components** built from scratch with no component library dependencies
- **5 server action modules** handling auth, time entries, shifts, templates, and employee management
- **8 lib utilities** for timezone-safe date math, formatting, and duration calculation
- **2 fully distinct user contexts** — employee and admin — with separate authentication paths, data access scopes, navigation systems, and interaction models
- **8 total routes**: 3 employee-facing, 5 admin-facing
- **4 core database tables**: employees, shifts, time_entries, templates
- **5 shift states** classified and rendered in real time: upcoming, on-shift, late, done, missed
- Deployed to **Vercel** with Supabase cloud backend (PostgreSQL + Auth + Row Level Security)

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components, streaming SSR) |
| UI | React 19, TypeScript 6, Tailwind CSS 4 |
| Backend / DB | Supabase (PostgreSQL, Row Level Security, SSR Auth) |
| Auth | Custom 4-digit PIN system with bcryptjs hashing |
| Date handling | date-fns 4 (timezone-safe, DST-aware) |
| Deployment | Vercel (serverless, edge-compatible) |

---

## System Architecture

### Data Model

- Designed a **4-table relational schema** with explicit separation of scheduled work (shifts) and actual work (time_entries) — keeping them as distinct records means mismatches (late arrivals, overtime, absences) emerge naturally from query logic rather than requiring flags or status columns
- **Shifts table**: `employee_id` (FK), `start_time`, `end_time`, `notes` — represents what was planned
- **Time entries table**: `employee_id` (FK), `clock_in`, `clock_out`, `notes` — represents what actually happened; `clock_out` nullable by design to represent an open/active session
- **Templates table**: `employee_id` (FK), `day_of_week` (1–7 integer), `start_time`, `end_time`, `notes` — stores recurring schedule patterns separate from the shifts they generate; avoids the cascading-edit problem of recurring shift records
- **Employees table**: `id`, `name`, `role`, `pin_hash`, `active` — `active` boolean enables soft-delete (deactivate without destroying history)

### Server / Client Boundary

- All **page-level data fetching runs in Server Components** — schedule data, time entries, and employee records arrive fully rendered with zero client-side loading states; employees land on their dashboard without a skeleton or spinner
- All **mutations run via Next.js Server Actions** — no API routes, no REST layer, no client-side token handling; mutations execute in the Node.js server context with full database access and return typed success/error results directly to the calling component
- **Client Components are scoped to 3 concerns only**: interactive real-time elements (ClockInterface elapsed timer, countdown), form components with local state (modals, PIN entry), and navigation components — everything else is a Server Component
- This boundary eliminates an entire class of race conditions where optimistic UI updates can diverge from server state

### Authentication Architecture

- Implemented **2 completely separate authentication paths** on a single Supabase project: a shared-device employee path and a persistent admin path
- **Employee path**: name selection (public query, no auth) → 4-digit PIN entry → Server Action retrieves stored bcrypt hash for that employee → `bcrypt.compare()` runs server-side → on match, creates a Supabase session using a derived email (`{employeeId}@timekeep.internal`) and the PIN + `::tk` suffix as the password to satisfy Supabase's 6-character minimum without exposing that constraint in the UX → session cookie set via `@supabase/ssr`
- **Admin path**: standard Supabase email/password sign-in with a persistent session cookie; all admin routes guard with `supabase.auth.getUser()` and redirect to `/login` on failure
- Both paths use `@supabase/ssr` for cookie-based session management — required for SSR compatibility since Supabase's default client uses `localStorage`, which is unavailable in Server Components

### Multi-Tenancy and Data Isolation

- Applied **Row Level Security (RLS) policies** in Supabase to enforce data isolation at the database layer — employees can only read and write their own `time_entries` rows; shifts are readable but not writable by employee sessions; all table mutations from employees are blocked except clock-in/clock-out via Server Actions running under a service role client
- **Admin operations** use a Supabase client initialized with the service role key (server-side only) to bypass RLS where elevated access is required — creating shifts, editing time entries, managing employees
- This approach eliminates the alternative of application-level row filtering, which is vulnerable to implementation errors on every new query

### Query Architecture

- **Admin dashboard**: executes 3 parallel queries via `Promise.all` — shifts in a ±14-hour window centered on now (captures yesterday's late shifts and today's upcoming shifts in a single pass), all open time entries (no `clock_out`), and completed entries in the last 24 hours — then classifies results client-side in a single O(n) pass into 4 arrays (clockedIn, upcoming, late, done) with no additional round trips
- **Employee detail page**: executes 4 parallel queries — employee record, full time entry history, current week's shifts, and the open entry if any — all resolved simultaneously before render
- **Schedule pages**: query shifts within the week range using `gte`/`lte` on `start_time`, then group by day index using a PST-aware weekday function — a single query produces the full week grid with no per-day fetches

### Clock Interface State Machine

- Designed the ClockInterface as a **formal 3-branch state machine** resolved at render time from 2 inputs: `openEntry` (nullable) and `todayShift` (nullable)
- **Branch 1 — Missed**: `openEntry` exists AND the entry's `clock_in` date in PST does not match today's date in PST → recovery flow; employee must specify their leave time before any other action is available
- **Branch 2 — On shift**: `openEntry` exists AND entry date matches today → dark hero state with sub-states: `isOvertime` (elapsed > scheduled), `minsLeft` (countdown to shift end), progress bar tracking worked vs. scheduled minutes
- **Branch 3 — Not clocked in**: no `openEntry` → 4 sub-states driven by `todayShift`: off (no shift), upcoming (shift start in the future, live countdown), ready (shift has started, not yet clocked in), over (shift end has passed)
- State transitions are driven entirely by server data — the client holds no mutable shift state; each clock-in or clock-out triggers a Server Action that re-fetches and re-renders the page

---

## Engineering — Authentication

- Designed and implemented a **custom 4-digit PIN authentication system** on top of Supabase Auth, encoding employee identity into a derived email address and padding the PIN with a `::tk` suffix to meet the 6-character minimum — keeping the UX model simple (4 digits, no username) while satisfying the constraint invisibly
- Hashed all PINs using **bcrypt** before storage; PIN verification runs exclusively server-side inside a Next.js Server Action, never sending the hash to the client and never exposing the comparison result until a valid session is established
- Implemented **server-side redirect guards** on all admin routes using `supabase.auth.getUser()` in the page Server Component — unauthenticated requests never reach the data-fetching layer
- Applied **Row Level Security (RLS)** as the last line of defense — even if an application-level guard were bypassed, employees cannot read or modify another employee's records at the database level

---

## Engineering — Clock System

- Built a **real-time clock-in/clock-out state machine** resolving employee state from server data on every render, with no client-held mutable state that can diverge from the database
- Implemented a **1-second precision live elapsed timer** using `setInterval` at 1000ms intervals anchored to the server-provided `clock_in` timestamp — prevents client-side time manipulation since the reference point is authoritative server data, not a client-set start time
- Engineered a **hold-to-confirm clock-out interaction** at 16ms tick intervals (60fps), filling a progress bar over 700ms before executing the clock-out Server Action — applied exclusively to this action because it is irreversible; cancels with a 200ms ease-out retreat on pointer release
- Built a **missed clock-out detection system** that compares clock-in date vs. current date in PST using `toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })` — when they diverge, the employee is gated into a recovery flow requiring a manual leave-time selection before the normal interface becomes available
- Implemented a **live shift countdown** with second-level precision below 60 seconds, using `Math.ceil` on the millisecond delta rather than decrementing a counter — avoids `setInterval` drift accumulating over long sessions

---

## Engineering — Scheduling System

- Built a **DST-aware week range calculator** that returns ISO-compliant Sunday–Saturday boundaries in PST/PDT by probing both UTC-7 and UTC-8 offsets to find the exact midnight boundary for the local date — correctly handles the twice-yearly DST transition that would otherwise shift a naively calculated midnight by one hour
- Designed a **week offset parameter** (`weekOffset: number`) on the range calculator allowing any week in history or the future to be queried by integer offset from the current week — powers week navigation without storing a selected date in state
- Implemented a **template application system** that batch-creates shifts from per-employee, per-day-of-week patterns: maps each template record to a concrete date using `addDays(weekStart, dayOfWeek % 7)`, skips days with existing shifts, and upserts the remainder in a single database operation
- Chose **templates as a separate table from shifts** specifically to avoid the cascading-edit problem: a recurring shift record requires retroactive updates when exceptions occur; a template that generates shifts on demand lets any week deviate without modifying past or future weeks

---

## Engineering — Admin Dashboard

- Built a **real-time shift classification engine** that resolves the full employee workforce status from 3 parallel database queries and a single O(n) classification pass — no per-employee queries, no N+1 pattern
- Implemented a **±14-hour query window** centered on the current time rather than a calendar day boundary — ensures shifts that started yesterday and are still running appear in the active list, and shifts starting in the next 14 hours appear as upcoming
- Built **15-minute late threshold detection**: an employee whose shift start has passed by more than 15 minutes without a clock-in is promoted from upcoming to late and surfaced as a structural visual interruption (not a card)
- Implemented **unscheduled clock-in detection** by cross-referencing open time entries against employees with shifts — any open entry without a matching shift surfaces as active labor regardless of schedule state, preventing managers from missing unplanned clock-ins

---

## Engineering — Mobile and Viewport

- Replaced `min-h-screen` (`100vh`) with `100dvh` (dynamic viewport height) across all full-screen surfaces, resolving a mobile Safari bug where `100vh` includes the collapsible browser chrome and pushes bottom-aligned content below the visible fold
- Applied `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` with `max()` fallbacks across all edge-to-edge surfaces — handles iPhone notch, Dynamic Island, and home indicator clearance without JavaScript resize listeners
- Built a **dual navigation system**: a fixed sidebar on desktop (`md:` breakpoint and above) and a bottom tab bar on mobile, both driven from a single layout component with conditional rendering — no separate mobile/desktop route trees
- Enforced **44px minimum touch targets** on all interactive elements using `min-h-[44px]`, with primary action buttons at `h-14` (56px)

---

## Design and Interaction

- Enforced a **2-typeface semantic rule**: Inter for all prose, labels, and action text; JetBrains Mono for all time values, durations, countdowns, and numeric metrics — making the distinction between authored content and measured data visually unambiguous
- Built **4 animation primitives** as custom CSS keyframes covering the full interaction surface: page arrival, modal ascent (mobile bottom sheet and desktop float), and the clock-in state transition — the only animation in the product with a duration above 400ms
- Implemented **adaptive modal rendering**: the same shift creation and template editing components render as bottom sheets on mobile (rising from the bottom edge) and floating dialogs on desktop — a single component tree, 2 animation paths, viewport-driven by a CSS breakpoint
- Applied deliberate friction to exactly 1 action: the hold-to-confirm clock-out mechanic. All other interactions in the product are instantaneous — this restraint makes the friction meaningful rather than routine

---

## Product Decisions

- **PIN auth over magic link or password**: shift workers clock in from a shared device. Magic links require personal phone access; passwords create manager support burden when forgotten. A 4-digit PIN is the minimum viable credential for shared-device, high-turnover authentication.
- **RLS at the database layer, not the application layer**: enforcing row access in application code requires getting it right on every query. RLS enforces it once, at the data source, regardless of how many queries or routes are added later.
- **Server Components for all data fetching**: eliminates the loading state problem entirely for first-paint. Employees land on their dashboard with data; admins see the schedule without a spinner. The tradeoff is that every data mutation requires a page refresh or Server Action — acceptable for this use case.
- **Templates generate shifts on demand, not in advance**: auto-generating future shifts from a recurring record creates scheduling debt. If the recurring pattern changes, past and future records need retroactive correction. Generating only when the manager applies the template keeps each week independent.
- **Separate shifts and time_entries tables**: a single table with a "scheduled" flag would conflate what was planned with what happened. Keeping them separate means late arrivals, overtime, and absences are natural query results rather than computed fields.
- **`100dvh` over `min-h-screen`**: `100vh` on iOS Safari is fixed to the screen height including hidden browser chrome. `100dvh` updates dynamically as the chrome shows or hides. For a full-screen clock interface, the difference is content falling below the visible fold vs. staying in frame.

---

## Key Metrics

| Metric | Value |
|---|---|
| Total source files | 61 |
| Pages (routes) | 8 |
| Components built from scratch | 30 |
| Server action modules | 5 |
| Database tables | 4 |
| User authentication paths | 2 (employee PIN, admin email/password) |
| User contexts | 2 (employee, admin) |
| Clock interface states | 3 (off-shift, on-shift, missed) |
| Clock sub-states | 7 (off, upcoming, ready, on-shift, overtime, over, missed) |
| Shift classification buckets | 4 (clocked-in, upcoming, late, done) |
| Dashboard query strategy | 3 parallel queries + O(n) client-side classification |
| Late threshold | 15 minutes past shift start |
| Hold-to-confirm duration | 700ms at 60fps (16ms tick) |
| Calendar system | Sunday–Saturday, PST/PDT timezone-safe, DST-aware |
| Auth method | Custom 4-digit PIN, bcrypt-hashed, server-side verification |
| Target viewport | 375px mobile-first, responsive to desktop |

---

## What This Project Demonstrates

- **System design judgment**: data model separates scheduled work from actual work, enabling natural detection of mismatches (late, overtime, absent) without status flags or computed fields; RLS enforces multi-tenancy at the database layer rather than the application layer
- **Full-stack ownership**: authentication, data modeling, server-side rendering, real-time UI, mobile viewport handling, deployment — no handoffs, no team, no scaffolding beyond framework and database
- **Constraint-driven engineering**: every architectural decision traces to a real operational constraint — shared-device auth, irreversible clock-out, DST-sensitive time math, mobile Safari viewport behavior — rather than to pattern preference
- **Boundary discipline**: explicit separation of server and client responsibilities; Server Components for data, Server Actions for mutations, Client Components only where interactivity is genuinely required
- **Product judgment**: the minimum feature set that solves the actual problem; deliberately excluded recurring shifts, notifications, payroll integration, and reporting — each would add complexity without solving the core workflow more effectively
