-- Migration: Cleanup old position boolean columns
-- Run this AFTER verifying the position enum migration is successful

-- IMPORTANT: Only run this migration after:
-- 1. Verifying all players have a position value set
-- 2. Updating all application code to use the new position column
-- 3. Testing thoroughly in development/staging environment

-- Make position column NOT NULL
ALTER TABLE public.player ALTER COLUMN position SET NOT NULL;

-- Drop the old boolean columns
ALTER TABLE public.player DROP COLUMN IF EXISTS is_qb;
ALTER TABLE public.player DROP COLUMN IF EXISTS is_rb;
ALTER TABLE public.player DROP COLUMN IF EXISTS is_wr;
ALTER TABLE public.player DROP COLUMN IF EXISTS is_te;

-- Rollback instructions:
-- To rollback, you'll need to recreate the boolean columns and repopulate them:
/*
ALTER TABLE public.player ADD COLUMN is_qb boolean;
ALTER TABLE public.player ADD COLUMN is_rb boolean;
ALTER TABLE public.player ADD COLUMN is_wr boolean;
ALTER TABLE public.player ADD COLUMN is_te boolean;

UPDATE public.player SET is_qb = (position = 'QB');
UPDATE public.player SET is_rb = (position = 'RB');
UPDATE public.player SET is_wr = (position = 'WR');
UPDATE public.player SET is_te = (position = 'TE');
*/
