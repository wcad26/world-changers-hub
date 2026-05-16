ALTER TABLE public.fundraising_campaigns
  ALTER COLUMN goal TYPE bigint,
  ALTER COLUMN raised TYPE bigint;

ALTER TABLE public.fundraising_donations
  ALTER COLUMN amount TYPE bigint;