-- Add headshot_url column to player table
ALTER TABLE player
ADD COLUMN headshot_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN player.headshot_url IS 'URL to player headshot image from ESPN';
