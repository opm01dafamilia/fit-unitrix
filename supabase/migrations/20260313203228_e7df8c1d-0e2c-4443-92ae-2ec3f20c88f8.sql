
-- Allow authenticated users to insert weekly challenges (for auto-generation)
CREATE POLICY "Authenticated users can insert challenges"
ON public.weekly_challenges
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update challenges
CREATE POLICY "Authenticated users can update challenges"
ON public.weekly_challenges
FOR UPDATE
TO authenticated
USING (true);

-- Add unique constraint for challenge deduplication per week
ALTER TABLE public.weekly_challenges ADD CONSTRAINT unique_challenge_per_week UNIQUE (challenge_type, week_start);

-- Add xp_reward column to weekly_challenges
ALTER TABLE public.weekly_challenges ADD COLUMN IF NOT EXISTS xp_reward integer NOT NULL DEFAULT 20;

-- Add difficulty column to weekly_challenges
ALTER TABLE public.weekly_challenges ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'intermediario';
