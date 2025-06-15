
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'regional_admin', 'member');

-- Create enum for member status
CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'new', 'transferred');

-- Create regions table
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  regional_pastor TEXT,
  established_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  occupation TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  region_id UUID REFERENCES public.regions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  region_id UUID REFERENCES public.regions(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE (user_id, role, region_id)
);

-- Create members table (comprehensive member management)
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id TEXT UNIQUE NOT NULL, -- Human readable member ID
  region_id UUID REFERENCES public.regions(id) NOT NULL,
  status member_status DEFAULT 'new',
  join_date DATE DEFAULT CURRENT_DATE,
  baptism_date DATE,
  membership_class_completed BOOLEAN DEFAULT false,
  is_volunteer BOOLEAN DEFAULT false,
  skills_talents TEXT[],
  preferred_service_areas TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- Create function to get user's region
CREATE OR REPLACE FUNCTION public.get_user_region(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT region_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Create function to check if user belongs to specific region
CREATE OR REPLACE FUNCTION public.user_belongs_to_region(_user_id UUID, _region_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND region_id = _region_id
  )
$$;

-- RLS Policies for regions
CREATE POLICY "Public can view active regions" 
ON public.regions FOR SELECT 
USING (is_active = true);

CREATE POLICY "Super admins can manage all regions" 
ON public.regions FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Regional admins can view their region" 
ON public.regions FOR SELECT 
USING (
  public.has_role(auth.uid(), 'regional_admin') 
  AND id = public.get_user_region(auth.uid())
);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Regional admins can view profiles in their region" 
ON public.profiles FOR SELECT 
USING (
  public.has_role(auth.uid(), 'regional_admin') 
  AND region_id = public.get_user_region(auth.uid())
);

-- RLS Policies for user_roles
CREATE POLICY "Super admins can manage all roles" 
ON public.user_roles FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Regional admins can view roles in their region" 
ON public.user_roles FOR SELECT 
USING (
  public.has_role(auth.uid(), 'regional_admin') 
  AND region_id = public.get_user_region(auth.uid())
);

CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for members
CREATE POLICY "Super admins can manage all members" 
ON public.members FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Regional admins can manage members in their region" 
ON public.members FOR ALL 
USING (
  public.has_role(auth.uid(), 'regional_admin') 
  AND region_id = public.get_user_region(auth.uid())
);

CREATE POLICY "Members can view other members in their region" 
ON public.members FOR SELECT 
USING (
  region_id = public.get_user_region(auth.uid())
);

-- Create trigger function to auto-create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'first_name', 
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

-- Create trigger to auto-create profiles on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert sample regions
INSERT INTO public.regions (name, code, description, address, contact_email, regional_pastor, is_active) VALUES
('Lagos Region', 'LG', 'Lagos Metropolitan Region covering Lagos State', 'Victoria Island, Lagos, Nigeria', 'lagos@wca.org', 'Pastor John Adebayo', true),
('Abuja Region', 'AB', 'Federal Capital Territory Region', 'Central Business District, Abuja, Nigeria', 'abuja@wca.org', 'Pastor Mary Okafor', true),
('Port Harcourt Region', 'PH', 'Rivers State Region covering South-South', 'GRA Phase 2, Port Harcourt, Nigeria', 'portharcourt@wca.org', 'Pastor David Okoro', true),
('Ibadan Region', 'IB', 'Oyo State Region covering South-West', 'Bodija, Ibadan, Nigeria', 'ibadan@wca.org', 'Pastor Grace Adeleke', true),
('Kano Region', 'KN', 'Kano State Region covering Northern Nigeria', 'Sabon Gari, Kano, Nigeria', 'kano@wca.org', 'Pastor Samuel Musa', true);

-- Create function to generate member ID
CREATE OR REPLACE FUNCTION public.generate_member_id(_region_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  region_code TEXT;
  next_number INTEGER;
  member_id TEXT;
BEGIN
  -- Get region code
  SELECT code INTO region_code FROM public.regions WHERE id = _region_id;
  
  -- Get next number for this region
  SELECT COALESCE(MAX(CAST(SUBSTRING(member_id FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.members
  WHERE region_id = _region_id;
  
  -- Format: REGIONCODE-YYYY-NNNN
  member_id := region_code || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN member_id;
END;
$$;
