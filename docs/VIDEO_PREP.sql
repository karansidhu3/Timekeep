-- =============================================================================
-- VIDEO PREP — run before every recording session
-- Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zacwmkjldmnxwjsrdttl/editor
--
-- Safe to run multiple times. Works any day of the week.
-- Wipes all shifts and time_entries and rebuilds them relative to today.
-- =============================================================================

DO $$
DECLARE
  jake  UUID := 'cb964d9c-1c24-42c2-a2a5-568bb14749c9';
  sara  UUID := '261170ec-2857-47b5-bf83-a56a8cc25d9e';
  todd  UUID := 'a5f239a5-eb12-4c17-a909-48d043b786ea';
  admin UUID := '6ccf9241-a453-4198-8ac7-662a27be7806';

  today DATE;
  sun   DATE;  -- Sunday of current PST week
  dow   INT;   -- day of week: 0=Sun, 1=Mon … 6=Sat
BEGIN
  today := (NOW() AT TIME ZONE 'America/Los_Angeles')::DATE;
  dow   := EXTRACT(DOW FROM today::TIMESTAMP)::INT;
  sun   := today - dow;

  -- ── Wipe everything ────────────────────────────────────────────────────────
  DELETE FROM public.time_entries;
  DELETE FROM public.shifts;

  -- ── THIS WEEK — shifts ────────────────────────────────────────────────────

  -- Jake: Mon–Fri 9am–5pm
  INSERT INTO public.shifts (employee_id, start_time, end_time, created_by)
  SELECT jake,
    ((sun + gs)::TIMESTAMP + INTERVAL '9 hours')  AT TIME ZONE 'America/Los_Angeles',
    ((sun + gs)::TIMESTAMP + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles',
    admin
  FROM generate_series(1, 5) AS gs;

  -- Sara: Mon/Wed/Fri 10am–6pm
  INSERT INTO public.shifts (employee_id, start_time, end_time, created_by)
  SELECT sara,
    ((sun + gs)::TIMESTAMP + INTERVAL '10 hours') AT TIME ZONE 'America/Los_Angeles',
    ((sun + gs)::TIMESTAMP + INTERVAL '18 hours') AT TIME ZONE 'America/Los_Angeles',
    admin
  FROM (VALUES (1), (3), (5)) AS t(gs);

  -- Sara: Sat 10am–3pm
  INSERT INTO public.shifts (employee_id, start_time, end_time, created_by)
  VALUES (
    sara,
    ((sun + 6)::TIMESTAMP + INTERVAL '10 hours') AT TIME ZONE 'America/Los_Angeles',
    ((sun + 6)::TIMESTAMP + INTERVAL '15 hours') AT TIME ZONE 'America/Los_Angeles',
    admin
  );

  -- Todd: Tue–Sat 9am–9pm (wide window so "Your shift started" is always visible)
  INSERT INTO public.shifts (employee_id, start_time, end_time, created_by)
  SELECT todd,
    ((sun + gs)::TIMESTAMP + INTERVAL '9 hours')  AT TIME ZONE 'America/Los_Angeles',
    ((sun + gs)::TIMESTAMP + INTERVAL '21 hours') AT TIME ZONE 'America/Los_Angeles',
    admin
  FROM generate_series(2, 6) AS gs;

  -- ── LAST WEEK — time entries (gives the time entries page rich history) ───

  -- Jake: last Mon–Fri all completed
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT jake,
    ((sun - 7 + gs)::TIMESTAMP + INTERVAL '9 hours 1 minute')  AT TIME ZONE 'America/Los_Angeles',
    ((sun - 7 + gs)::TIMESTAMP + INTERVAL '17 hours 4 minutes') AT TIME ZONE 'America/Los_Angeles'
  FROM generate_series(1, 5) AS gs;

  -- Sara: last Mon/Wed/Fri completed
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT sara,
    ((sun - 7 + gs)::TIMESTAMP + INTERVAL '10 hours 6 minutes') AT TIME ZONE 'America/Los_Angeles',
    ((sun - 7 + gs)::TIMESTAMP + INTERVAL '18 hours 2 minutes') AT TIME ZONE 'America/Los_Angeles'
  FROM (VALUES (1), (3), (5)) AS t(gs);

  -- Todd: last Tue/Wed/Thu completed
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT todd,
    ((sun - 7 + gs)::TIMESTAMP + INTERVAL '9 hours 3 minutes')  AT TIME ZONE 'America/Los_Angeles',
    ((sun - 7 + gs)::TIMESTAMP + INTERVAL '20 hours 57 minutes') AT TIME ZONE 'America/Los_Angeles'
  FROM (VALUES (2), (3), (4)) AS t(gs);

  -- ── THIS WEEK — completed entries for days already past ──────────────────

  -- Jake: Mon → yesterday
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT jake,
    ((sun + gs)::TIMESTAMP + INTERVAL '9 hours 3 minutes')  AT TIME ZONE 'America/Los_Angeles',
    ((sun + gs)::TIMESTAMP + INTERVAL '17 hours 5 minutes') AT TIME ZONE 'America/Los_Angeles'
  FROM generate_series(1, GREATEST(LEAST(dow - 1, 5), 0)) AS gs
  WHERE gs >= 1;

  -- Sara: Mon/Wed if already past
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT sara,
    ((sun + gs)::TIMESTAMP + INTERVAL '10 hours 7 minutes') AT TIME ZONE 'America/Los_Angeles',
    ((sun + gs)::TIMESTAMP + INTERVAL '18 hours 3 minutes') AT TIME ZONE 'America/Los_Angeles'
  FROM (VALUES (1), (3)) AS t(gs)
  WHERE gs < dow;

  -- Todd: Tue/Wed if already past
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT todd,
    ((sun + gs)::TIMESTAMP + INTERVAL '9 hours 2 minutes')  AT TIME ZONE 'America/Los_Angeles',
    ((sun + gs)::TIMESTAMP + INTERVAL '20 hours 58 minutes') AT TIME ZONE 'America/Los_Angeles'
  FROM (VALUES (2), (3)) AS t(gs)
  WHERE gs < dow;

  -- ── Jake: open entry for today ────────────────────────────────────────────
  -- clock_in = 47 minutes ago → live elapsed timer reads ~0:47 on camera
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  VALUES (jake, NOW() - INTERVAL '47 minutes', NULL);

END $$;
