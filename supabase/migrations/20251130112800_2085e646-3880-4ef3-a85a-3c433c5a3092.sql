-- Add is_special column to mark extraordinary events excluded from standard reports
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT false;

-- Add attendance_target column for event attendance targets
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendance_target INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN events.is_special IS 'Mark extraordinary events that should be excluded from standard regional event reports';
COMMENT ON COLUMN events.attendance_target IS 'Target attendance number for the event. Used for performance calculations in regional reports.';