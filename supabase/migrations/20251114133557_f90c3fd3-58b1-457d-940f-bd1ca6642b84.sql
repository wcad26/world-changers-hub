-- Add columns to members table for event rating and referral tracking
ALTER TABLE members
ADD COLUMN rated_event_id uuid REFERENCES events(id),
ADD COLUMN event_satisfaction_rating integer CHECK (event_satisfaction_rating >= 0 AND event_satisfaction_rating <= 10),
ADD COLUMN referral_source text,
ADD COLUMN referral_person_name text;

COMMENT ON COLUMN members.rated_event_id IS 'The event being rated by the visitor';
COMMENT ON COLUMN members.event_satisfaction_rating IS 'Satisfaction rating 0-10 for the rated event';
COMMENT ON COLUMN members.referral_source IS 'How the visitor heard about WCA';
COMMENT ON COLUMN members.referral_person_name IS 'Name of person who invited the visitor if applicable';