-- Create table for user's top 5 movies
CREATE TABLE public.user_top_movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 5),
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, slot)
);

-- Enable RLS
ALTER TABLE public.user_top_movies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all top movies"
ON public.user_top_movies
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own top movies"
ON public.user_top_movies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own top movies"
ON public.user_top_movies
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own top movies"
ON public.user_top_movies
FOR DELETE
USING (auth.uid() = user_id);