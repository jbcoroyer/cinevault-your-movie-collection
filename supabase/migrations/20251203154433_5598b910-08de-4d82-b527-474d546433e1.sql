-- Drop the existing check constraint
ALTER TABLE public.user_movies DROP CONSTRAINT IF EXISTS user_movies_status_check;

-- Add a new check constraint that allows 'none', 'watchlist', and 'watched'
ALTER TABLE public.user_movies ADD CONSTRAINT user_movies_status_check CHECK (status IN ('none', 'watchlist', 'watched'));