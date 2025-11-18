-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT UNIQUE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  region_id UUID REFERENCES public.regions(id) NOT NULL,
  certificate_type TEXT NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_name TEXT,
  event_date DATE,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  certificate_url TEXT NOT NULL,
  verification_code TEXT UNIQUE NOT NULL,
  qr_code_data TEXT,
  issued_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_certificates_member ON public.certificates(member_id);
CREATE INDEX idx_certificates_verification ON public.certificates(verification_code);
CREATE INDEX idx_certificates_region ON public.certificates(region_id);

-- Create certificate templates table
CREATE TABLE public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES public.regions(id),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  template_url TEXT NOT NULL,
  name_position JSONB DEFAULT '{"x": 400, "y": 300, "fontSize": 48, "fontFamily": "Arial", "color": "#000000"}'::jsonb,
  qr_position JSONB DEFAULT '{"x": 50, "y": 550, "size": 150}'::jsonb,
  additional_fields JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Certificates RLS policies
CREATE POLICY "Public can view active certificates"
  ON public.certificates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Regional admins manage certificates in region"
  ON public.certificates FOR ALL
  USING (
    has_role(auth.uid(), 'regional_admin'::app_role) AND 
    region_id = get_user_region(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'regional_admin'::app_role) AND 
    region_id = get_user_region(auth.uid())
  );

CREATE POLICY "Super admins manage all certificates"
  ON public.certificates FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Members view own certificates"
  ON public.certificates FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE profile_id = auth.uid()
    )
  );

-- Certificate templates RLS policies
CREATE POLICY "Public can view active templates"
  ON public.certificate_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Regional admins manage templates in region"
  ON public.certificate_templates FOR ALL
  USING (
    has_role(auth.uid(), 'regional_admin'::app_role) AND 
    (region_id = get_user_region(auth.uid()) OR region_id IS NULL)
  )
  WITH CHECK (
    has_role(auth.uid(), 'regional_admin'::app_role) AND 
    (region_id = get_user_region(auth.uid()) OR region_id IS NULL)
  );

CREATE POLICY "Super admins manage all templates"
  ON public.certificate_templates FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificate-templates', 'certificate-templates', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for certificate-templates bucket
CREATE POLICY "Admins can upload certificate templates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificate-templates' AND
    (has_role(auth.uid(), 'regional_admin'::app_role) OR 
     has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Admins can view certificate templates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificate-templates' AND
    (has_role(auth.uid(), 'regional_admin'::app_role) OR 
     has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Admins can update certificate templates"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'certificate-templates' AND
    (has_role(auth.uid(), 'regional_admin'::app_role) OR 
     has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Admins can delete certificate templates"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certificate-templates' AND
    (has_role(auth.uid(), 'regional_admin'::app_role) OR 
     has_role(auth.uid(), 'super_admin'::app_role))
  );

-- Storage RLS policies for certificates bucket
CREATE POLICY "Public can view certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

CREATE POLICY "Admins can upload certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates' AND
    (has_role(auth.uid(), 'regional_admin'::app_role) OR 
     has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Admins can delete certificates"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certificates' AND
    (has_role(auth.uid(), 'regional_admin'::app_role) OR 
     has_role(auth.uid(), 'super_admin'::app_role))
  );

-- Create trigger for updated_at
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();