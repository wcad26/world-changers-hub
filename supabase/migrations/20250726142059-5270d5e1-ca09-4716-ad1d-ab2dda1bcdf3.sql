-- Enable real-time updates for regions table
ALTER TABLE public.regions REPLICA IDENTITY FULL;

-- Add regions table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.regions;