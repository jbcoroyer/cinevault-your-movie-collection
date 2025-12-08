-- Update the handle_new_user function to not expose emails as usernames
-- Generate a friendly username like 'User_abc123' instead of using email
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