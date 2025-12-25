-- Add unique constraints to support UPSERT operations for roster scraping

-- Ensure team abbreviation uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS nfl_team_abbr_idx ON nfl_team(abbr);

-- Ensure player uniqueness per team (composite key on name + team)
CREATE UNIQUE INDEX IF NOT EXISTS player_name_team_idx ON player(name, nfl_team_id);
