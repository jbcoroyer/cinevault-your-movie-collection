-- Update the handle_new_user function to generate anonymous usernames instead of using email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  generated_username text;
BEGIN
  -- Use the name from metadata if provided by OAuth, otherwise generate a random username
  -- Never use email as it would expose PII
  generated_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    'User_' || substr(md5(random()::text), 1, 8)
  );
  
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    generated_username,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$;

-- Anonymize existing profiles that have email-like usernames
UPDATE public.profiles
SET username = 'User_' || substr(md5(id::text || random()::text), 1, 8)
WHERE username LIKE '%@%';