-- Create Week 17 and Week 18 rounds for 2025 season
-- Only insert if rounds don't already exist (idempotent)

-- Insert Week 17 and Week 18 rounds
INSERT INTO public.nfl_rounds (round, year, status)
SELECT -2, 2025, 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.nfl_rounds WHERE round = -2 AND year = 2025
)
UNION ALL
SELECT -1, 2025, 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.nfl_rounds WHERE round = -1 AND year = 2025
);
