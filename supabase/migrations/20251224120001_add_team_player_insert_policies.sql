-- Add insert policies for nfl_team and player tables to allow roster scraping

-- Allow inserts into nfl_team table (for service role and authenticated users)
CREATE POLICY "Enable insert for nfl_team" ON public.nfl_team FOR INSERT WITH CHECK (true);

-- Allow inserts into player table (for service role and authenticated users)
CREATE POLICY "Enable insert for player" ON public.player FOR INSERT WITH CHECK (true);

-- Allow updates to player table
CREATE POLICY "Enable update for player" ON public.player FOR UPDATE USING (true) WITH CHECK (true);
