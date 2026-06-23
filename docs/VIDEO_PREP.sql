-- =============================================================================
-- VIDEO PREP — run before every recording session
-- Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zacwmkjldmnxwjsrdttl/editor
--
-- Safe to run multiple times. Works any weekday.
-- Rebuilds all shifts and time entries relative to today in PDT.
-- =============================================================================

-- Uses a CTE to compute this week's Sunday and today's DOW once,
-- then pure SQL date arithmetic (avoids PL/pgSQL variable issues).

WITH
  cal AS (
    SELECT
      -- Today's date in PDT
      (NOW() AT TIME ZONE 'America/Los_Angeles')::DATE AS today,
      -- Day of week: 0=Sun 1=Mon … 6=Sat
      EXTRACT(DOW FROM NOW() AT TIME ZONE 'America/Los_Angeles')::INT AS dow
  ),
  week AS (
    SELECT
      today,
      dow,
      -- Sunday of the current PDT week
      today - dow AS sun
    FROM cal
  )

-- We can't run multiple DML from one CTE, so we do it in a DO block
-- that references the same pure-SQL computation.
SELECT 1; -- CTE above is just for reference; real logic is in the DO block below.

DO $$
DECLARE
  jake  UUID := 'cb964d9c-1c24-42c2-a2a5-568bb14749c9';
  sara  UUID := '261170ec-2857-47b5-bf83-a56a8cc25d9e';
  todd  UUID := 'a5f239a5-eb12-4c17-a909-48d043b786ea';
  admin UUID := '6ccf9241-a453-4198-8ac7-662a27be7806';

  -- Compute this week's Sunday as a timestamptz at midnight PDT
  -- Using a function avoids the DATE+INT casting bug in PL/pgSQL
  sun_ts  TIMESTAMPTZ;
  today   DATE;
  dow     INT;
BEGIN
  today  := (NOW() AT TIME ZONE 'America/Los_Angeles')::DATE;
  dow    := EXTRACT(DOW FROM NOW() AT TIME ZONE 'America/Los_Angeles')::INT;

  -- Sunday midnight PDT → UTC
  sun_ts := (DATE_TRUNC('day',
               (today - dow)::TIMESTAMP
             ) + INTERVAL '0') AT TIME ZONE 'America/Los_Angeles';

  -- ── Wipe ──────────────────────────────────────────────────────────────────
  DELETE FROM public.time_entries;
  DELETE FROM public.shifts;

  -- ── THIS WEEK — shifts ────────────────────────────────────────────────────

  -- Jake: Mon–Fri 9am–5pm
  INSERT INTO public.shifts (employee_id, start_time, end_time, created_by)
  SELECT jake,
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '9 hours',
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '17 hours',
    admin
  FROM generate_series(1, 5) AS gs;

  -- Sara: Mon/Wed/Fri 10am–6pm
  INSERT INTO public.shifts (employee_id, start_time, end_time, created_by)
  SELECT sara,
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '10 hours',
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '18 hours',
    admin
  FROM (VALUES (1), (3), (5)) AS t(gs);

  -- Sara: Sat 10am–3pm
  INSERT INTO public.shifts (employee_id, start_time, end_time, created_by) VALUES (
    sara,
    sun_ts + INTERVAL '6 days' + INTERVAL '10 hours',
    sun_ts + INTERVAL '6 days' + INTERVAL '15 hours',
    admin
  );

  -- Todd: Mon–Sat 9am–9pm
  INSERT INTO public.shifts (employee_id, start_time, end_time, created_by)
  SELECT todd,
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '9 hours',
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '21 hours',
    admin
  FROM generate_series(1, 6) AS gs;

  -- ── LAST WEEK — time entries (history for time entries page) ──────────────

  -- Jake: last Mon–Fri
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT jake,
    sun_ts - INTERVAL '7 days' + (gs || ' days')::INTERVAL + INTERVAL '9 hours 1 minute',
    sun_ts - INTERVAL '7 days' + (gs || ' days')::INTERVAL + INTERVAL '17 hours 4 minutes'
  FROM generate_series(1, 5) AS gs;

  -- Sara: last Mon/Wed/Fri
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT sara,
    sun_ts - INTERVAL '7 days' + (gs || ' days')::INTERVAL + INTERVAL '10 hours 6 minutes',
    sun_ts - INTERVAL '7 days' + (gs || ' days')::INTERVAL + INTERVAL '18 hours 2 minutes'
  FROM (VALUES (1), (3), (5)) AS t(gs);

  -- Todd: last Tue/Wed/Thu
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT todd,
    sun_ts - INTERVAL '7 days' + (gs || ' days')::INTERVAL + INTERVAL '9 hours 3 minutes',
    sun_ts - INTERVAL '7 days' + (gs || ' days')::INTERVAL + INTERVAL '20 hours 57 minutes'
  FROM (VALUES (2), (3), (4)) AS t(gs);

  -- ── THIS WEEK — completed entries for weekdays already past ───────────────

  -- Jake: Mon → yesterday (dow - 1 past weekdays)
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT jake,
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '9 hours 3 minutes',
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '17 hours 5 minutes'
  FROM generate_series(1, GREATEST(LEAST(dow - 1, 5), 0)) AS gs
  WHERE gs >= 1;

  -- Sara: Mon/Wed if already past
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT sara,
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '10 hours 7 minutes',
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '18 hours 3 minutes'
  FROM (VALUES (1), (3)) AS t(gs)
  WHERE gs < dow;

  -- Todd: Mon/Tue/Wed if already past
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  SELECT todd,
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '9 hours 2 minutes',
    sun_ts + (gs || ' days')::INTERVAL + INTERVAL '20 hours 58 minutes'
  FROM (VALUES (1), (2), (3)) AS t(gs)
  WHERE gs < dow;

  -- ── Jake: open entry for today (47 min ago → live elapsed ~0:47) ──────────
  INSERT INTO public.time_entries (employee_id, clock_in, clock_out)
  VALUES (jake, NOW() - INTERVAL '47 minutes', NULL);

END $$;
