-- Run in Supabase SQL Editor

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS round_count integer NOT NULL DEFAULT 10;

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS voting_duration integer NOT NULL DEFAULT 30;

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS results_duration integer NOT NULL DEFAULT 5;

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS placement_duration integer NOT NULL DEFAULT 5;

ALTER TABLE public.games
  DROP CONSTRAINT IF EXISTS games_round_count_check;

ALTER TABLE public.games
  ADD CONSTRAINT games_round_count_check
  CHECK (round_count >= 2 AND round_count <= 10);

ALTER TABLE public.games
  DROP CONSTRAINT IF EXISTS voting_duration_check;

ALTER TABLE public.games
  ADD CONSTRAINT voting_duration_check
  CHECK (voting_duration BETWEEN 5 AND 120);

ALTER TABLE public.games
  DROP CONSTRAINT IF EXISTS results_duration_check;

ALTER TABLE public.games
  ADD CONSTRAINT results_duration_check
  CHECK (results_duration BETWEEN 3 AND 60);

ALTER TABLE public.games
  DROP CONSTRAINT IF EXISTS placement_duration_check;

ALTER TABLE public.games
  ADD CONSTRAINT placement_duration_check
  CHECK (placement_duration BETWEEN 3 AND 60);

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS settings_locked boolean NOT NULL DEFAULT false;
