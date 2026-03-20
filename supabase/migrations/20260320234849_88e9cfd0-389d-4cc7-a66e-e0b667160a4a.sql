
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'personal', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Trainer-student relationship table
CREATE TABLE public.trainer_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  student_user_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trainer_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view own students"
  ON public.trainer_students FOR SELECT
  TO authenticated
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert own students"
  ON public.trainer_students FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update own students"
  ON public.trainer_students FOR UPDATE
  TO authenticated
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete own students"
  ON public.trainer_students FOR DELETE
  TO authenticated
  USING (auth.uid() = trainer_id);

-- 6. Trainer workout plans table (100% manual, no AI)
CREATE TABLE public.trainer_workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL,
  student_id UUID REFERENCES public.trainer_students(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Treino',
  plan_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trainer_workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view own workout plans"
  ON public.trainer_workout_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert own workout plans"
  ON public.trainer_workout_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update own workout plans"
  ON public.trainer_workout_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete own workout plans"
  ON public.trainer_workout_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = trainer_id);
