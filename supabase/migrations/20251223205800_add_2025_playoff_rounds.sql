-- Create 2025 playoff rounds (Wildcard, Divisional, Conference)
-- Only insert if rounds don't already exist (idempotent)

-- Insert the 2025 playoff rounds
INSERT INTO public.nfl_rounds (round, year, status)
SELECT 2, 2025, 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.nfl_rounds WHERE round = 2 AND year = 2025
)
UNION ALL
SELECT 3, 2025, 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.nfl_rounds WHERE round = 3 AND year = 2025
)
UNION ALL
SELECT 4, 2025, 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.nfl_rounds WHERE round = 4 AND year = 2025
);
