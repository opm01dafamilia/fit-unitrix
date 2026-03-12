
-- Add privacy_level to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_level text NOT NULL DEFAULT 'public';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Weekly challenges table
CREATE TABLE public.weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL,
  target_value integer NOT NULL DEFAULT 1,
  icon text NOT NULL DEFAULT '🎯',
  week_start date NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges" ON public.weekly_challenges
  FOR SELECT TO authenticated USING (true);

-- User challenge progress
CREATE TABLE public.user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_value integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenge progress" ON public.user_challenge_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenge progress" ON public.user_challenge_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenge progress" ON public.user_challenge_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Activity feed
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view feed" ON public.activity_feed
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own activities" ON public.activity_feed
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.activity_feed
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Activity reactions
CREATE TABLE public.activity_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL DEFAULT '💪',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reactions" ON public.activity_reactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own reactions" ON public.activity_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.activity_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Ranking view table (materialized stats per user)
CREATE TABLE public.user_ranking_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT 'Usuário',
  total_workouts integer NOT NULL DEFAULT 0,
  total_series integer NOT NULL DEFAULT 0,
  diet_streak integer NOT NULL DEFAULT 0,
  workout_streak integer NOT NULL DEFAULT 0,
  achievements_count integer NOT NULL DEFAULT 0,
  ranking_score integer NOT NULL DEFAULT 0,
  week_start date NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.user_ranking_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rankings" ON public.user_ranking_stats
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own ranking stats" ON public.user_ranking_stats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ranking stats" ON public.user_ranking_stats
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_reactions;

-- Seed initial weekly challenges
INSERT INTO public.weekly_challenges (title, description, challenge_type, target_value, icon) VALUES
  ('Guerreiro da Semana', 'Complete 5 treinos esta semana', 'workouts', 5, '⚔️'),
  ('Dieta Impecável', 'Mantenha 90% de aderência na dieta', 'diet_adherence', 90, '🥗'),
  ('Leg Day', 'Treine pernas pelo menos 2x', 'leg_workouts', 2, '🦵'),
  ('Consistência Total', 'Treine todos os grupos musculares', 'all_muscle_groups', 5, '💪'),
  ('Streak de Fogo', 'Mantenha um streak de 7 dias de dieta', 'diet_streak', 7, '🔥');
