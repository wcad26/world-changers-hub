
CREATE OR REPLACE FUNCTION public.update_campaign_raised_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cid uuid := COALESCE(NEW.campaign_id, OLD.campaign_id);
BEGIN
  UPDATE public.fundraising_campaigns
     SET raised = COALESCE((
       SELECT SUM(amount) FROM public.fundraising_donations
        WHERE campaign_id = _cid
          AND COALESCE(status, 'completed') = 'completed'
     ), 0)
   WHERE id = _cid;
  RETURN NULL;
END $$;

-- Ensure trigger fires on UPDATE too (status transitions)
DROP TRIGGER IF EXISTS update_campaign_raised_amount_trigger ON public.fundraising_donations;
DROP TRIGGER IF EXISTS trg_update_campaign_raised ON public.fundraising_donations;
CREATE TRIGGER trg_update_campaign_raised
  AFTER INSERT OR UPDATE OR DELETE ON public.fundraising_donations
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_raised_amount();
