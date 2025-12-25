-- Enable league admins to update their own leagues
CREATE POLICY "Enable update for league admins"
ON public.league
FOR UPDATE
TO authenticated
USING (admin_id = auth.uid())
WITH CHECK (admin_id = auth.uid());
