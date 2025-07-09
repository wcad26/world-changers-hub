
-- Create fundraising campaigns table
CREATE TABLE public.fundraising_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal INTEGER NOT NULL, -- Amount in cents
  raised INTEGER NOT NULL DEFAULT 0, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;

-- Policy for regional admins to manage campaigns in their region
CREATE POLICY "Regional admins can manage campaigns in their region"
  ON public.fundraising_campaigns
  FOR ALL
  USING (
    has_role(auth.uid(), 'regional_admin'::app_role) 
    AND region_id = get_user_region(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'regional_admin'::app_role) 
    AND region_id = get_user_region(auth.uid())
  );

-- Policy for super admins to manage all campaigns
CREATE POLICY "Super admins can manage all campaigns"
  ON public.fundraising_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Policy for public to view public campaigns
CREATE POLICY "Public can view public campaigns"
  ON public.fundraising_campaigns
  FOR SELECT
  USING (is_public = true);

-- Create donations table to track individual donations
CREATE TABLE public.fundraising_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE,
  donor_name TEXT,
  donor_email TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  anonymous BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  donation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for donations
ALTER TABLE public.fundraising_donations ENABLE ROW LEVEL SECURITY;

-- Policy for regional admins to view donations for campaigns in their region
CREATE POLICY "Regional admins can view donations in their region"
  ON public.fundraising_donations
  FOR SELECT
  USING (
    has_role(auth.uid(), 'regional_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.fundraising_campaigns 
      WHERE id = campaign_id 
      AND region_id = get_user_region(auth.uid())
    )
  );

-- Policy for super admins to view all donations
CREATE POLICY "Super admins can view all donations"
  ON public.fundraising_donations
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Function to update campaign raised amount
CREATE OR REPLACE FUNCTION update_campaign_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.fundraising_campaigns 
    SET raised = raised + NEW.amount
    WHERE id = NEW.campaign_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.fundraising_campaigns 
    SET raised = raised - OLD.amount
    WHERE id = OLD.campaign_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update raised amount when donations are added/removed
CREATE TRIGGER update_campaign_raised_trigger
  AFTER INSERT OR DELETE ON public.fundraising_donations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_raised_amount();

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_fundraising_campaigns_updated_at
  BEFORE UPDATE ON public.fundraising_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();
