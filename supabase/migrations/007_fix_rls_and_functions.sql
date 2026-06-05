-- Fixes applied live to Supabase but never saved as migration files.
-- All operations are idempotent — safe to re-run.
--
-- Problem: the original admins_manage_employees policy queried the employees
-- table from within an employees RLS policy, causing infinite recursion (42P17).
-- Fix: a SECURITY DEFINER function with row_security=off reads employees without
-- triggering RLS, breaking the recursion.

-- ── is_admin() function ──────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.employees
    where id = auth.uid()
      and role = 'admin'
      and active = true
  )
$$;

-- ── employees RLS ────────────────────────────────────────────────────────────

-- Allow unauthenticated/anonymous reads of active employee names (needed for
-- the login page's name selector).
drop policy if exists "public_read_employees" on employees;
create policy "public_read_employees"
  on employees for select
  using (active = true);

-- Replace the recursive admin policy with the is_admin() function.
drop policy if exists "admins_manage_employees" on employees;
create policy "admins_manage_employees"
  on employees for all
  using (is_admin())
  with check (is_admin());

-- ── shifts RLS ───────────────────────────────────────────────────────────────

-- Consistent: use is_admin() instead of inline subquery.
drop policy if exists "admins_manage_shifts" on shifts;
create policy "admins_manage_shifts"
  on shifts for all
  using (is_admin())
  with check (is_admin());
