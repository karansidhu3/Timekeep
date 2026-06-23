-- VIDEO PREP — run in Supabase SQL Editor right before recording
-- https://supabase.com/dashboard/project/zacwmkjldmnxwjsrdttl/editor
--
-- Run this every time you start a new recording session.
-- Safe to run multiple times.

-- 1. Set Jake's clock-in to 47 minutes ago so the elapsed timer looks live
UPDATE public.time_entries
SET clock_in = NOW() - INTERVAL '47 minutes'
WHERE employee_id = 'cb964d9c-1c24-42c2-a2a5-568bb14749c9'
  AND clock_out IS NULL;

-- 2. Wipe Todd's today entries so he can clock in cleanly during the demo
DELETE FROM public.time_entries
WHERE employee_id = 'a5f239a5-eb12-4c17-a909-48d043b786ea'
  AND clock_in >= CURRENT_DATE AT TIME ZONE 'America/Los_Angeles';
