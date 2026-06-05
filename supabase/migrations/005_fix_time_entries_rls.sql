-- Fix: update policy's implicit WITH CHECK re-evaluated clock_out IS NULL on the *new* row,
-- blocking the clock-out update. Add explicit WITH CHECK that only verifies ownership.
drop policy if exists "employees_update_own_time_entries" on time_entries;
create policy "employees_update_own_time_entries"
  on time_entries for update
  using (employee_id = auth.uid() and clock_out is null)
  with check (employee_id = auth.uid());

-- Fix: admins policy used raw employees query, risking recursion. Switch to is_admin().
drop policy if exists "admins_manage_time_entries" on time_entries;
create policy "admins_manage_time_entries"
  on time_entries for all
  using (is_admin())
  with check (is_admin());
