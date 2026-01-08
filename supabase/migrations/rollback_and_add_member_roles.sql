-- First, drop the function we just created
DROP FUNCTION IF EXISTS update_league_admin(UUID, UUID, UUID);

-- Add a role column to league_members table
ALTER TABLE league_members
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member'));

-- Set the league creator (based on league.admin_id) as admin in league_members
-- This ensures you get your admin access back
UPDATE league_members lm
SET role = 'admin'
FROM league l
WHERE lm.league_id = l.id
AND lm.user_id = l.admin_id;

-- Create an index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_league_members_role ON league_members(league_id, role);
