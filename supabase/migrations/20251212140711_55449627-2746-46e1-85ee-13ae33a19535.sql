-- Fix search_path for existing functions
ALTER FUNCTION public.check_badges_on_update() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;