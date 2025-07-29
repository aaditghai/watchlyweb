-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update total movies logged count
  UPDATE public.profiles 
  SET total_movies_logged = (
    SELECT COUNT(*) 
    FROM public.watch_logs 
    WHERE user_id = NEW.user_id
  )
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;