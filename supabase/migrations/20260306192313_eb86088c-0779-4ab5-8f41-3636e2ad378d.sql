
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER,
  gender TEXT,
  height NUMERIC,
  weight NUMERIC,
  objective TEXT,
  activity_level TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Workout plans table
CREATE TABLE public.workout_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  days_per_week INTEGER NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workout plans" ON public.workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout plans" ON public.workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout plans" ON public.workout_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout plans" ON public.workout_plans FOR DELETE USING (auth.uid() = user_id);

-- Diet plans table
CREATE TABLE public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  activity_level TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own diet plans" ON public.diet_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diet plans" ON public.diet_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diet plans" ON public.diet_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diet plans" ON public.diet_plans FOR DELETE USING (auth.uid() = user_id);

-- Body tracking table
CREATE TABLE public.body_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  body_fat NUMERIC,
  chest NUMERIC,
  waist NUMERIC,
  hip NUMERIC,
  arm NUMERIC,
  leg NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.body_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own body tracking" ON public.body_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body tracking" ON public.body_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own body tracking" ON public.body_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own body tracking" ON public.body_tracking FOR DELETE USING (auth.uid() = user_id);

-- Fitness goals table
CREATE TABLE public.fitness_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  goal_type TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fitness_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own fitness goals" ON public.fitness_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fitness goals" ON public.fitness_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fitness goals" ON public.fitness_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fitness goals" ON public.fitness_goals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_fitness_goals_updated_at BEFORE UPDATE ON public.fitness_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
