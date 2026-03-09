CREATE TABLE public.workout_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  workout_plan_id uuid REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  day_index integer NOT NULL,
  day_name text NOT NULL,
  muscle_group text NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  exercises_completed integer NOT NULL DEFAULT 0,
  exercises_total integer NOT NULL DEFAULT 0
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);