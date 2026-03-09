
-- Table to store per-exercise set history for progression tracking
CREATE TABLE public.exercise_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  set_number INTEGER NOT NULL DEFAULT 1,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.exercise_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercise history"
  ON public.exercise_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise history"
  ON public.exercise_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise history"
  ON public.exercise_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise history"
  ON public.exercise_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_exercise_history_user_exercise ON public.exercise_history(user_id, exercise_name);
CREATE INDEX idx_exercise_history_created ON public.exercise_history(user_id, created_at DESC);
