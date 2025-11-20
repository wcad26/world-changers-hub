-- Create password_reset_otps table for forgot password functionality
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_password_reset_otps_email ON public.password_reset_otps(email);
CREATE INDEX idx_password_reset_otps_expires_at ON public.password_reset_otps(expires_at);
CREATE INDEX idx_password_reset_otps_user_id ON public.password_reset_otps(user_id);

-- Enable RLS
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only allow service role to manage OTPs (through edge functions)
-- No user-level access since this is handled by edge functions with service role
CREATE POLICY "Service role can manage OTPs"
ON public.password_reset_otps
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.password_reset_otps IS 'Stores one-time passwords for password reset functionality. Managed by edge functions.';