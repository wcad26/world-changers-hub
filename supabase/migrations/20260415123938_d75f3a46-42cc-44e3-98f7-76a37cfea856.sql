
-- Create occupations table
CREATE TABLE public.occupations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  name_fr text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.occupations ENABLE ROW LEVEL SECURITY;

-- Public can view active occupations
CREATE POLICY "Public can view active occupations"
ON public.occupations
FOR SELECT
USING (is_active = true);

-- Super admins can manage all occupations
CREATE POLICY "Super admins can manage all occupations"
ON public.occupations
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed data
INSERT INTO public.occupations (name, name_fr, display_order) VALUES
  ('Student', 'Étudiant(e)', 1),
  ('Teacher', 'Enseignant(e)', 2),
  ('Engineer', 'Ingénieur(e)', 3),
  ('Doctor', 'Médecin', 4),
  ('Nurse', 'Infirmier/Infirmière', 5),
  ('Accountant', 'Comptable', 6),
  ('Business Owner', 'Chef d''entreprise', 7),
  ('Pastor/Minister', 'Pasteur/Ministre', 8),
  ('Lawyer', 'Avocat(e)', 9),
  ('Civil Servant', 'Fonctionnaire', 10),
  ('Trader/Merchant', 'Commerçant(e)', 11),
  ('Driver', 'Chauffeur', 12),
  ('IT Professional', 'Professionnel(le) IT', 13),
  ('Farmer', 'Agriculteur/Agricultrice', 14),
  ('Artisan/Craftsman', 'Artisan(e)', 15),
  ('Journalist', 'Journaliste', 16),
  ('Pharmacist', 'Pharmacien(ne)', 17),
  ('Architect', 'Architecte', 18),
  ('Military/Police', 'Militaire/Police', 19),
  ('Homemaker', 'Homme/Femme au foyer', 20),
  ('Retired', 'Retraité(e)', 21),
  ('Unemployed', 'Sans emploi', 22),
  ('Other', 'Autre', 99);
