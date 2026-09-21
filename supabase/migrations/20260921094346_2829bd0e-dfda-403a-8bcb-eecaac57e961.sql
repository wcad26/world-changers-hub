ALTER TABLE public.event_registration_fees DROP CONSTRAINT IF EXISTS event_registration_fees_category_check;
ALTER TABLE public.event_registration_fees ADD CONSTRAINT event_registration_fees_category_check CHECK (category IN ('leader','member','child','family'));
ALTER TABLE public.event_pre_registrations ADD COLUMN IF NOT EXISTS fee_is_group boolean NOT NULL DEFAULT false;