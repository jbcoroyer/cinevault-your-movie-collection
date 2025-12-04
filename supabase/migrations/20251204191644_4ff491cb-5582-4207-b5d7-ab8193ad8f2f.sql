-- Convert existing ratings from 0-10 scale to 0-5 scale
-- Divide by 2 and round up to nearest 0.5
UPDATE public.user_movies 
SET rating = CEIL(rating / 2 * 2) / 2
WHERE rating IS NOT NULL;