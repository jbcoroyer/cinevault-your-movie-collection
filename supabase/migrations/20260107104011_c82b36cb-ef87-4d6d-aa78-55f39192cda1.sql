-- Create collection_goals table for user goals
CREATE TABLE public.collection_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL, -- 'genre', 'director', 'studio', 'decade', 'format', 'count', 'custom'
  target_config JSONB NOT NULL DEFAULT '{}', -- { genre: 'Horror', target_count: 10 } or { director_id: 123, target_count: 5 }
  target_count INTEGER NOT NULL DEFAULT 1,
  current_count INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_ai_suggested BOOLEAN NOT NULL DEFAULT false,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  deadline DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collection_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goals"
ON public.collection_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
ON public.collection_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
ON public.collection_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
ON public.collection_goals FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_collection_goals_user_id ON public.collection_goals(user_id);
CREATE INDEX idx_collection_goals_completed ON public.collection_goals(user_id, is_completed);

-- Trigger for updated_at
CREATE TRIGGER update_collection_goals_updated_at
BEFORE UPDATE ON public.collection_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();