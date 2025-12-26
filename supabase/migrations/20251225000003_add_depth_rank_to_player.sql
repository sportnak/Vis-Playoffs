-- Add depth_rank column to player table
-- Represents where the player is on the depth chart (1 = starter, 2 = second string, etc.)
ALTER TABLE player
ADD COLUMN depth_rank INTEGER;

-- Add comment explaining the column
COMMENT ON COLUMN player.depth_rank IS 'Position on team depth chart: 1 = starter, 2 = second string, 3 = third string, etc. NULL if not on depth chart.';
