-- Update rating constraint to 1-5 scale
ALTER TABLE members 
DROP CONSTRAINT IF EXISTS members_event_satisfaction_rating_check;

ALTER TABLE members
ADD CONSTRAINT members_event_satisfaction_rating_check 
CHECK (event_satisfaction_rating >= 1 AND event_satisfaction_rating <= 5);

COMMENT ON COLUMN members.event_satisfaction_rating IS 'Satisfaction rating 1-5 for the rated event';