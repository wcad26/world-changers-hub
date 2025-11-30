-- Add CASCADE delete constraints for all event-related tables

-- event_faqs
ALTER TABLE public.event_faqs
DROP CONSTRAINT IF EXISTS event_faqs_event_id_fkey;

ALTER TABLE public.event_faqs
ADD CONSTRAINT event_faqs_event_id_fkey
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- event_images
ALTER TABLE public.event_images
DROP CONSTRAINT IF EXISTS event_images_event_id_fkey;

ALTER TABLE public.event_images
ADD CONSTRAINT event_images_event_id_fkey
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- event_slug_history
ALTER TABLE public.event_slug_history
DROP CONSTRAINT IF EXISTS event_slug_history_event_id_fkey;

ALTER TABLE public.event_slug_history
ADD CONSTRAINT event_slug_history_event_id_fkey
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- event_speakers
ALTER TABLE public.event_speakers
DROP CONSTRAINT IF EXISTS event_speakers_event_id_fkey;

ALTER TABLE public.event_speakers
ADD CONSTRAINT event_speakers_event_id_fkey
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- event_testimonials
ALTER TABLE public.event_testimonials
DROP CONSTRAINT IF EXISTS event_testimonials_event_id_fkey;

ALTER TABLE public.event_testimonials
ADD CONSTRAINT event_testimonials_event_id_fkey
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- members.rated_event_id should be set to NULL when event is deleted
ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_rated_event_id_fkey;

ALTER TABLE public.members
ADD CONSTRAINT members_rated_event_id_fkey
FOREIGN KEY (rated_event_id) REFERENCES public.events(id) ON DELETE SET NULL;