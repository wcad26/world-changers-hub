-- Add slug column to events table for SEO-friendly URLs
ALTER TABLE events ADD COLUMN slug text;

-- Create unique index on slug (only for non-null values)
CREATE UNIQUE INDEX events_slug_unique ON events(slug) WHERE slug IS NOT NULL;

-- Create index for performance on slug lookups
CREATE INDEX events_slug_idx ON events(slug);