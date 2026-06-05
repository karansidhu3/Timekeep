-- Weekly schedule templates: defines a repeating shift for an employee on a given day of the week.
-- day_of_week uses ISO 8601 (1=Monday … 7=Sunday).

create table schedule_templates (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  start_time  time not null,
  end_time    time not null,
  notes       text,
  created_at  timestamptz not null default now(),
  constraint schedule_templates_employee_day unique (employee_id, day_of_week)
);

create index on schedule_templates (employee_id);

alter table schedule_templates enable row level security;

-- Employees can read their own templates (to show on schedule page)
create policy "employees_read_own_templates"
  on schedule_templates for select
  using (employee_id = auth.uid());

-- Admins manage everything
create policy "admins_manage_templates"
  on schedule_templates for all
  using (is_admin())
  with check (is_admin());
