-- Create email delivery status enum
CREATE TYPE email_delivery_status AS ENUM (
  'pending',
  'sent', 
  'delivered',
  'bounced',
  'failed',
  'complained'
);

-- Add email tracking columns to certificates table
ALTER TABLE public.certificates
ADD COLUMN resend_email_id text,
ADD COLUMN email_status email_delivery_status DEFAULT 'pending',
ADD COLUMN email_delivery_details jsonb,
ADD COLUMN email_last_status_update timestamp with time zone;

-- Create indexes for efficient filtering
CREATE INDEX idx_certificates_email_status ON public.certificates(email_status);
CREATE INDEX idx_certificates_resend_email_id ON public.certificates(resend_email_id);

-- Add comment for documentation
COMMENT ON COLUMN public.certificates.email_status IS 'Tracks email delivery status from Resend webhooks';
COMMENT ON COLUMN public.certificates.resend_email_id IS 'Resend email ID for tracking delivery status';
COMMENT ON COLUMN public.certificates.email_delivery_details IS 'Additional details like bounce reason, timestamps, etc.';