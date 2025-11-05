-- Create event_speakers table
CREATE TABLE IF NOT EXISTS event_speakers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;

-- Public can view speakers for public events
CREATE POLICY "Public can view speakers for public events"
    ON event_speakers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_speakers.event_id
            AND e.is_public = true
        )
    );

-- Regional admins can manage speakers in their region
CREATE POLICY "Regional admins can manage speakers in their region"
    ON event_speakers FOR ALL
    USING (
        has_role(auth.uid(), 'regional_admin'::app_role) AND
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_speakers.event_id
            AND e.region_id = get_user_region(auth.uid())
        )
    )
    WITH CHECK (
        has_role(auth.uid(), 'regional_admin'::app_role) AND
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_speakers.event_id
            AND e.region_id = get_user_region(auth.uid())
        )
    );

-- DCG admins can manage speakers for their DCG events
CREATE POLICY "DCG admins can manage speakers for their DCG events"
    ON event_speakers FOR ALL
    USING (
        has_role(auth.uid(), 'dcg_admin'::app_role) AND
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_speakers.event_id
            AND e.dcg_id = get_user_dcg(auth.uid())
        )
    )
    WITH CHECK (
        has_role(auth.uid(), 'dcg_admin'::app_role) AND
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_speakers.event_id
            AND e.dcg_id = get_user_dcg(auth.uid())
        )
    );

-- Super admins can manage all speakers
CREATE POLICY "Super admins can manage all event speakers"
    ON event_speakers FOR ALL
    USING (has_role(auth.uid(), 'super_admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create indexes for faster queries
CREATE INDEX idx_event_speakers_event_id ON event_speakers(event_id);
CREATE INDEX idx_event_speakers_display_order ON event_speakers(display_order);