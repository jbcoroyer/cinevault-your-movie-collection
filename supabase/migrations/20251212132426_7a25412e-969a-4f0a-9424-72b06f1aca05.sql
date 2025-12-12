-- Fix search_path security warnings for new functions

ALTER FUNCTION public.get_xp_for_format(text) SET search_path = public;
ALTER FUNCTION public.add_xp_on_physical_movie() SET search_path = public;
ALTER FUNCTION public.add_xp_on_review() SET search_path = public;
ALTER FUNCTION public.update_user_title() SET search_path = public;