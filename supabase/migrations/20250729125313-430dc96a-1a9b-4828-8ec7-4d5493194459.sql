-- Update all existing events to be featured events
UPDATE events SET is_featured = true WHERE is_featured = false;