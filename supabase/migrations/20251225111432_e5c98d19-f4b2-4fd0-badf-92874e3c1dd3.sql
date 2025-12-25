-- Backfill onboarding_complete for existing users who already have a username
UPDATE public.profiles
SET onboarding_complete = true
WHERE (onboarding_complete IS DISTINCT FROM true)
  AND username IS NOT NULL
  AND btrim(username) <> '';