-- Add whatsapp_contact column to events table
ALTER TABLE public.events
ADD COLUMN whatsapp_contact text;