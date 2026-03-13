
-- Friendships table
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can see friendships they're part of
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can insert own friendships"
  ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update friendships they received (accept/reject)
CREATE POLICY "Users can update received friendships"
  ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = friend_id);

-- Users can delete their own friendships
CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Add friend_code to profiles for adding friends by code
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS friend_code text UNIQUE;

-- Allow authenticated users to read other profiles' friend_code and basic info for friend search
CREATE POLICY "Authenticated users can view public profile info"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
