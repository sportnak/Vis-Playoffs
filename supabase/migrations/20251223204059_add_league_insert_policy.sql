-- Add RLS policy to allow authenticated users to create leagues
CREATE POLICY "Enable insert for authenticated users only"
ON public.league
FOR INSERT
TO authenticated
WITH CHECK (admin_id = auth.uid());
