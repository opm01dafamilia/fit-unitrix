
-- Create user_invites table for referral tracking
CREATE TABLE public.user_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  invited_email TEXT,
  invited_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  workouts_completed INTEGER NOT NULL DEFAULT 0,
  has_subscription BOOLEAN NOT NULL DEFAULT false,
  validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- Inviter can see their own invites
CREATE POLICY "Users can view own invites" ON public.user_invites
  FOR SELECT TO authenticated
  USING (auth.uid() = inviter_id);

-- Users can insert invites they send
CREATE POLICY "Users can insert own invites" ON public.user_invites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = inviter_id);

-- Users can update own invites (for tracking)
CREATE POLICY "Users can update own invites" ON public.user_invites
  FOR UPDATE TO authenticated
  USING (auth.uid() = inviter_id);

-- Also allow the invited user to update their invite record (to mark workouts etc)
CREATE POLICY "Invited users can update their invite" ON public.user_invites
  FOR UPDATE TO authenticated
  USING (auth.uid() = invited_user_id);

-- Allow reading invite by code (for signup flow - public)
CREATE POLICY "Anyone can read invite by code" ON public.user_invites
  FOR SELECT TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_user_invites_updated_at
  BEFORE UPDATE ON public.user_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
