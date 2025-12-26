-- Migration: Convert player position booleans to enum
-- This migration adds a position enum column and migrates data from is_qb, is_rb, is_wr, is_te

-- Step 1: Create the position enum type
CREATE TYPE player_position AS ENUM ('QB', 'RB', 'WR', 'TE');

-- Step 2: Add the new position column (nullable for now)
ALTER TABLE public.player ADD COLUMN position player_position;

-- Step 3: Migrate existing data
-- Priority: QB > RB > WR > TE (in case a player has multiple positions set)
UPDATE public.player
SET position = CASE
    WHEN is_qb = true THEN 'QB'::player_position
    WHEN is_rb = true THEN 'RB'::player_position
    WHEN is_wr = true THEN 'WR'::player_position
    WHEN is_te = true THEN 'TE'::player_position
    ELSE NULL
END;

-- Step 4: Make position column NOT NULL (after data migration)
-- Note: Only do this if all players have a position set
-- ALTER TABLE public.player ALTER COLUMN position SET NOT NULL;

-- Step 5: Drop the old boolean columns
-- Uncomment these lines after verifying the migration is successful
-- ALTER TABLE public.player DROP COLUMN is_qb;
-- ALTER TABLE public.player DROP COLUMN is_rb;
-- ALTER TABLE public.player DROP COLUMN is_wr;
-- ALTER TABLE public.player DROP COLUMN is_te;

-- Step 6: Add index on position for better query performance
CREATE INDEX idx_player_position ON public.player(position);

-- Rollback instructions:
-- To rollback this migration, run:
-- DROP INDEX IF EXISTS idx_player_position;
-- ALTER TABLE public.player DROP COLUMN position;
-- DROP TYPE IF EXISTS player_position;
