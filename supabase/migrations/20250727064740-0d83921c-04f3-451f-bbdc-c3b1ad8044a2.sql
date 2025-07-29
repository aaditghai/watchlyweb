-- Create storage bucket for movie photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('movie-photos', 'movie-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for movie photos
CREATE POLICY "Anyone can view movie photos" 
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