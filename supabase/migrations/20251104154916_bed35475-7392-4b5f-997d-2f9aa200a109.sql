-- Create event_testimonials table
CREATE TABLE IF NOT EXISTS event_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create event_faqs table
CREATE TABLE IF NOT EXISTS event_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_testimonials_event_id ON event_testimonials(event_id);
CREATE INDEX IF NOT EXISTS idx_event_faqs_event_id ON event_faqs(event_id);

-- Extend events table with new columns
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS registration_url TEXT,
  ADD COLUMN IF NOT EXISTS organizer_name TEXT,
  ADD COLUMN IF NOT EXISTS organizer_email TEXT,
  ADD COLUMN IF NOT EXISTS organizer_phone TEXT,
  ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Enable RLS on new tables
ALTER TABLE event_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_testimonials
CREATE POLICY "Public can view testimonials for public events"
ON event_testimonials
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_testimonials.event_id 
    AND e.is_public = true
  )
);

CREATE POLICY "Authenticated users can manage testimonials"
ON event_testimonials
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for event_faqs
CREATE POLICY "Public can view FAQs for public events"
ON event_faqs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_faqs.event_id 
    AND e.is_public = true
  )
);

CREATE POLICY "Authenticated users can manage FAQs"
ON event_faqs
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);