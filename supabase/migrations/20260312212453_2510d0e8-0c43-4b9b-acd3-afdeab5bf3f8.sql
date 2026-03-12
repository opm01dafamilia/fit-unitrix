ALTER TABLE public.user_ranking_stats 
ADD COLUMN IF NOT EXISTS total_xp integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_xp integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank_tier text NOT NULL DEFAULT 'bronze';