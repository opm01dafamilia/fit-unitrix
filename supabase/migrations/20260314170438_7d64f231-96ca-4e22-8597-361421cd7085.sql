
CREATE TABLE public.fitness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'baixa',
  city text,
  experience_level text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fitness_scores ENABLE ROW LEVEL SECURITY;

-- Everyone can read scores (for community comparison)
CREATE POLICY "Authenticated users can view all scores"
  ON public.fitness_scores FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert own score
CREATE POLICY "Users can insert own score"
  ON public.fitness_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own score
CREATE POLICY "Users can update own score"
  ON public.fitness_scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Unique constraint per user
CREATE UNIQUE INDEX fitness_scores_user_id_idx ON public.fitness_scores (user_id);
