
-- Add output_type to certificate_templates (certificate | badge)
ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS output_type text NOT NULL DEFAULT 'certificate';

ALTER TABLE public.certificate_templates
  DROP CONSTRAINT IF EXISTS certificate_templates_output_type_check;
ALTER TABLE public.certificate_templates
  ADD CONSTRAINT certificate_templates_output_type_check
  CHECK (output_type IN ('certificate','badge'));

-- Add output_type + pre_registration link on certificates and allow member-less badges
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS output_type text NOT NULL DEFAULT 'certificate',
  ADD COLUMN IF NOT EXISTS pre_registration_id uuid;

ALTER TABLE public.certificates
  DROP CONSTRAINT IF EXISTS certificates_output_type_check;
ALTER TABLE public.certificates
  ADD CONSTRAINT certificates_output_type_check
  CHECK (output_type IN ('certificate','badge'));

-- FK for pre_registration_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'certificates_pre_registration_id_fkey'
  ) THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_pre_registration_id_fkey
      FOREIGN KEY (pre_registration_id)
      REFERENCES public.event_pre_registrations(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Allow badges for non-members
ALTER TABLE public.certificates ALTER COLUMN member_id DROP NOT NULL;

-- Prevent duplicate output per pre-registrant per event/output type
CREATE UNIQUE INDEX IF NOT EXISTS certificates_pre_reg_output_unique
  ON public.certificates (pre_registration_id, output_type)
  WHERE pre_registration_id IS NOT NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS certificates_output_type_idx
  ON public.certificates (output_type);
CREATE INDEX IF NOT EXISTS certificate_templates_output_type_idx
  ON public.certificate_templates (output_type);
