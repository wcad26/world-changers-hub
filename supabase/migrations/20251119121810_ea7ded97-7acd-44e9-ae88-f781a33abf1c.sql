-- Add email_sent_at column to track when certificate emails were sent
ALTER TABLE certificates 
ADD COLUMN email_sent_at timestamp with time zone;

-- Add index for better query performance
CREATE INDEX idx_certificates_email_sent_at ON certificates(email_sent_at);

-- Add comment
COMMENT ON COLUMN certificates.email_sent_at IS 'Timestamp when the certificate was successfully sent via email. NULL means not sent yet.';