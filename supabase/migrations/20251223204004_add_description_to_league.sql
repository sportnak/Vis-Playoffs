-- Add description column to league table
ALTER TABLE public.league ADD COLUMN IF NOT EXISTS description text;
