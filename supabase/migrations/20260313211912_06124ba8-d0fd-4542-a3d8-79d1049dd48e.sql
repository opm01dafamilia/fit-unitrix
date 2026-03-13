
-- Table for league assignments per user per season
CREATE TABLE public.user_leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  league text NOT NULL DEFAULT 'bronze',
  group_number integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, season_id)
);

ALTER TABLE public.user_leagues ENABLE ROW LEVEL SECURITY;

-- Everyone can view league data (for group rankings)
CREATE POLICY "Anyone can view leagues" ON public.user_leagues
  FOR SELECT TO authenticated USING (true);

-- Users can insert their own league entry
CREATE POLICY "Users can insert own league" ON public.user_leagues
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update own league entry
CREATE POLICY "Users can update own league" ON public.user_leagues
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
