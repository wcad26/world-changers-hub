-- Add column for other referral source details
ALTER TABLE members
ADD COLUMN referral_other_details text;

COMMENT ON COLUMN members.referral_other_details IS 'Details when referral source is "other"';