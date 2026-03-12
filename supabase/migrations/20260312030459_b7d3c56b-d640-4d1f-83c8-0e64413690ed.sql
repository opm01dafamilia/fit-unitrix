
-- Table to track daily diet completion for streaks and achievements
CREATE TABLE public.diet_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meals_total INTEGER NOT NULL DEFAULT 0,
  meals_done INTEGER NOT NULL DEFAULT 0,
  meals_failed INTEGER NOT NULL DEFAULT 0,
  all_completed BOOLEAN NOT NULL DEFAULT false,
  adherence_pct NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tracked_date)
);

-- Enable RLS
ALTER TABLE public.diet_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own diet tracking" ON public.diet_tracking
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diet tracking" ON public.diet_tracking
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diet tracking" ON public.diet_tracking
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diet tracking" ON public.diet_tracking
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
