-- Create global_content table for managing website content
CREATE TABLE public.global_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.global_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view global content" 
  ON public.global_content 
  FOR SELECT 
  USING (true);

CREATE POLICY "Super admins can manage all global content" 
  ON public.global_content 
  FOR ALL 
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_global_content_updated_at
  BEFORE UPDATE ON public.global_content
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

-- Insert default about_us content structure
INSERT INTO public.global_content (page_type, content) VALUES (
  'about_us',
  '{
    "hero": {
      "title": "About World Changers Association",
      "description": "We are a global community of believers dedicated to transforming lives and communities through faith, service, and discipleship.",
      "mission_points": [
        "Spreading the Gospel to all nations",
        "Building strong Christian communities",
        "Empowering believers through discipleship",
        "Serving those in need with love and compassion"
      ]
    },
    "values": [
      {
        "icon": "Heart",
        "title": "Love",
        "description": "We believe love is the foundation of all we do, demonstrating Christ''s love through our actions and relationships."
      },
      {
        "icon": "Users",
        "title": "Community",
        "description": "We foster authentic relationships and support one another in our spiritual journey and daily lives."
      },
      {
        "icon": "BookOpen",
        "title": "Truth",
        "description": "We are committed to the truth of God''s Word as our guide for life, ministry, and decision-making."
      },
      {
        "icon": "Hands",
        "title": "Service",
        "description": "We actively serve others, following Christ''s example of selfless love and compassionate action."
      }
    ],
    "milestones": [
      {
        "year": "1995",
        "title": "Foundation",
        "description": "WCA was founded with a vision to reach the unreached and build strong Christian communities worldwide."
      },
      {
        "year": "2005",
        "title": "Global Expansion", 
        "description": "Expanded operations to multiple countries, establishing regional centers and local chapters."
      },
      {
        "year": "2015",
        "title": "Digital Ministry",
        "description": "Launched comprehensive digital platforms to reach and serve believers in the digital age."
      },
      {
        "year": "2024",
        "title": "New Horizons",
        "description": "Continuing to grow and adapt, embracing new technologies and methods to fulfill our mission."
      }
    ],
    "team": [
      {
        "name": "Dr. Michael Thompson",
        "role": "Global President",
        "image": "/lovable-uploads/366be6c2-b04b-4b05-a73a-cff2d9452c69.png",
        "bio": "With over 25 years of ministry experience, Dr. Thompson leads WCA with passion and dedication to global evangelism."
      },
      {
        "name": "Rev. Sarah Johnson", 
        "role": "Director of Operations",
        "image": "/lovable-uploads/49a70c29-0080-4568-ad27-30a1d70295e5.png",
        "bio": "Rev. Johnson oversees daily operations and ensures our mission is carried out effectively across all regions."
      },
      {
        "name": "Pastor David Chen",
        "role": "Director of Discipleship",
        "image": "/lovable-uploads/5ade5f06-a3a8-4a1e-abfb-038125a75293.png", 
        "bio": "Pastor Chen develops and implements discipleship programs that strengthen believers worldwide."
      }
    ],
    "cta": {
      "title": "Join Our Mission",
      "description": "Be part of something greater. Join us in changing lives and transforming communities around the world."
    }
  }'
);