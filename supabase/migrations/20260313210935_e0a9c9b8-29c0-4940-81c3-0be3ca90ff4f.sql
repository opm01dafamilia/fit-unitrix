
-- Seasons table
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons" ON public.seasons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert seasons" ON public.seasons
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update seasons" ON public.seasons
  FOR UPDATE TO authenticated USING (true);

-- User season progress table
CREATE TABLE public.user_season_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  season_xp integer NOT NULL DEFAULT 0,
  season_level integer NOT NULL DEFAULT 1,
  final_position integer DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, season_id)
);

ALTER TABLE public.user_season_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all season progress" ON public.user_season_progress
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own season progress" ON public.user_season_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own season progress" ON public.user_season_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
