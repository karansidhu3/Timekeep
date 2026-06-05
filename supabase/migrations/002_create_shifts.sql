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

create index on shifts (employee_id);
create index on shifts (start_time);

alter table shifts enable row level security;

create policy "employees_read_own_shifts"
  on shifts for select
  using (employee_id = auth.uid());

create policy "admins_manage_shifts"
  on shifts for all
  using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
  );
