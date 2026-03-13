
-- Comments table for the social feed
CREATE TABLE public.feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT 'Usuário',
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view comments"
  ON public.feed_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON public.feed_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.feed_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for feed comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comments;
