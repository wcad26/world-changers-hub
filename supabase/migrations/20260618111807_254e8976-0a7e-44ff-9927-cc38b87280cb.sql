CREATE UNIQUE INDEX IF NOT EXISTS fundraising_pledges_campaign_member_active_uidx
  ON public.fundraising_pledges (campaign_id, member_id)
  WHERE member_id IS NOT NULL AND status = 'active';