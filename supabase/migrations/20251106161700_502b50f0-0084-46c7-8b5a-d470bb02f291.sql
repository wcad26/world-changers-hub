-- Add French translation fields to events table
ALTER TABLE public.events
ADD COLUMN name_fr text,
ADD COLUMN description_fr text,
ADD COLUMN location_name_fr text,
ADD COLUMN address_fr text,
ADD COLUMN requirements_fr text;

-- Add French translation fields to event_speakers table
ALTER TABLE public.event_speakers
ADD COLUMN name_fr text,
ADD COLUMN title_fr text,
ADD COLUMN bio_fr text;

-- Add French translation fields to event_testimonials table
ALTER TABLE public.event_testimonials
ADD COLUMN name_fr text,
ADD COLUMN role_fr text,
ADD COLUMN content_fr text;

-- Add French translation fields to event_faqs table
ALTER TABLE public.event_faqs
ADD COLUMN question_fr text,
ADD COLUMN answer_fr text;