-- Create badge_showcase table for storing user's featured badges
CREATE TABLE public.badge_showcase (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  slot INTEGER NOT NULL CHECK (slot >= 0 AND slot <= 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, slot),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badge_showcase ENABLE ROW LEVEL SECURITY;

-- Users can view anyone's badge showcase
CREATE POLICY "Badge showcases are viewable by everyone"
ON public.badge_showcase
FOR SELECT
USING (true);

-- Users can manage their own badge showcase
CREATE POLICY "Users can insert their own badge showcase"
ON public.badge_showcase
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badge showcase"
ON public.badge_showcase
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badge showcase"
ON public.badge_showcase
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_badge_showcase_user_id ON public.badge_showcase(user_id);