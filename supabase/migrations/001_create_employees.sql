create table employees (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null check (role in ('employee', 'admin')),
  pin        text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table employees enable row level security;

create policy "employees_read_own"
  on employees for select
  using (id = auth.uid());

create policy "admins_manage_employees"
  on employees for all
  using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
  );
