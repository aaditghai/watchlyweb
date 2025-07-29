-- Add profile fields for stats and preferences
ALTER TABLE public.profiles 
ADD COLUMN avatar_url TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN favorite_genres TEXT[],
ADD COLUMN total_movies_logged INTEGER DEFAULT 0,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create storage bucket for profile avatars and movie photos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('movie-photos', 'movie-photos', true);

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for movie photos
CREATE POLICY "Movie photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'movie-photos');

CREATE POLICY "Users can upload their own movie photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'movie-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own movie photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'movie-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own movie photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'movie-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update profile stats
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stats when movies are logged
CREATE TRIGGER update_profile_stats_trigger
  AFTER INSERT OR DELETE ON public.watch_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_stats();

-- Update existing profiles with current stats
UPDATE public.profiles 
SET total_movies_logged = (
  SELECT COUNT(*) 
  FROM public.watch_logs 
  WHERE watch_logs.user_id = profiles.user_id
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();