-- Add new columns to watch_logs for social posting features
ALTER TABLE public.watch_logs 
ADD COLUMN caption TEXT,
ADD COLUMN emoji TEXT,
ADD COLUMN image_url TEXT,
ADD COLUMN is_post BOOLEAN DEFAULT false;

-- Update the table to set existing entries as simple logs (not posts)
UPDATE public.watch_logs SET is_post = false WHERE is_post IS NULL;