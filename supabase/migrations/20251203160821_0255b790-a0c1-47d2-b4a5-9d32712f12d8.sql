-- Change rating column from integer to numeric to support 0.5 increments
ALTER TABLE public.user_movies ALTER COLUMN rating TYPE numeric(3,1) USING rating::numeric(3,1);