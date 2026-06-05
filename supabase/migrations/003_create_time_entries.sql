create table time_entries (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  clock_in    timestamptz not null,
  clock_out   timestamptz,
  notes       text,
  created_at  timestamptz not null default now()
);

create index on time_entries (employee_id);
create index on time_entries (clock_in);

alter table time_entries enable row level security;

create policy "employees_read_own_time_entries"
  on time_entries for select
  using (employee_id = auth.uid());

create policy "employees_insert_own_time_entries"
  on time_entries for insert
  with check (employee_id = auth.uid());

create policy "employees_update_own_time_entries"
  on time_entries for update
  using (employee_id = auth.uid() and clock_out is null);

create policy "admins_manage_time_entries"
  on time_entries for all
  using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
  );
