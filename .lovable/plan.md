## 1. French copy fixes
In `src/utils/languageUtils.ts`:
- `sr_who_register_subtitle` FR → `"Saisissez l'e-mail ou le numéro de téléphone utilisé lors de votre inscription à WCA. Si vous êtes nouveau, nous vous inscrirons ici-même."`
- `sr_pledge_subtitle` FR → `"Prenez un engagement financier pour soutenir l'organisation de l'événement. Nous reviendrons vers vous pour le suivi."`

## 2. Public `/fundraising` page — wire to real data
Rewrite `src/pages/Fundraising.tsx` to drop the hard‑coded sample campaigns and pull from the DB.

- New hook `usePublicFundraisingCampaigns()` in `src/hooks/useFundraisingCampaigns.ts`: selects from `fundraising_campaigns` where `is_public = true`, ordered by `status` (active first) then `created_at desc`. Joins region name; works without auth (RLS already allows public read for `is_public`).
- Card layout matches the current visual (status badge, image, category/region chip, title, description, progress, raised/goal, date, supporter count) but:
  - **Buttons reorder**: `Details` first (primary, filled) → links to `/fundraising/:id`. `Donate` second (secondary variant) → links to `/fundraising/:id/donate`.
  - Both are `<Link>` navigations — no dialogs.
- Remove the existing `CampaignDetailsDialog`-style inline modal usage from this public page.

## 3. Campaign image upload — admin parity
- `src/components/admin/super/finances/CreateGlobalCampaignDialog.tsx`: add the same image‑upload block already present in `CreateFundraisingCampaignDialog.tsx` (file input + preview + upload to `campaign-images` bucket, then `image_url` saved on the campaign). Storage path prefix `global/<uuid>.<ext>`.
- `src/components/admin/regional/EditFundraisingCampaignDialog.tsx` + matching super edit dialog (if present, otherwise add): support replacing/clearing `image_url` with the same uploader.
- Bucket `campaign-images` already used by regional create; ensure it exists and is public via migration (idempotent `insert ... on conflict do nothing` into `storage.buckets`, plus public read policy).

## 4. New page: `/fundraising/:id` (Details)
File `src/pages/FundraisingDetails.tsx`, route added in `src/App.tsx`.

Sections:
- Hero with cover image, status badge, title, region chip, dates, supporters, currency-aware raised/goal + progress.
- "About this project" (campaign description).
- "Gallery" (for now just the cover image; structured so we can add more images later — no DB change required now).
- Sticky CTA panel on desktop, stacked on mobile, with two buttons:
  - **Pledge** (primary) → `/fundraising/:id/pledge`
  - **Donate** (secondary) → `/fundraising/:id/donate`
- Recent supporters list (anonymous-aware) pulled from `fundraising_donations`.

## 5. New page: `/fundraising/:id/pledge`
File `src/pages/FundraisingPledge.tsx`.

Flow:
1. Step 1 — phone number input + **Proceed**. Calls a new lookup edge function `fundraising-lookup` (or reuses `event-pre-register-lookup`'s phone branch) that searches `members` and a generalized "registered visitor" view by phone.
2. Step 2 — form
   - If matched: greeting `Hello {first_name}, input your pledge amount below and confirm to send in your pledge.` Only fields shown: pledge amount + currency (defaults to campaign currency) + optional note.
   - If not matched: message `Fill the form below and confirm to send in your pledge.` Fields: Family Name, Other Names, Telephone Number (prefilled), Email, Pledge Amount.
3. **Confirm** submits to a new edge function `fundraising-public-pledge` that:
   - Resolves or creates the donor in `public.donors` (region inferred from campaign).
   - Inserts a row in a **new `fundraising_pledges` table** (see Section 7).
   - Updates an aggregate `pledged_total` on `fundraising_campaigns` (added in same migration) so the public page can show pledged-vs-goal later.
4. Success screen with shareable summary.

French translations added for all strings in `languageUtils.ts` (prefix `fp_`).

## 6. New page: `/fundraising/:id/donate`
File `src/pages/FundraisingDonate.tsx`.

Flow:
1. Phone number input + **Proceed** (same lookup as pledge).
2. Branches:
   - **Match + has open pledge on this campaign** → show pledge card (amount, currency, progress bar of redeemed vs pledged via existing donations sum). Below: amount input + **Pay Now** (stub button — payment integration deferred).
   - **Match, no pledge** → show donor info pre-filled; amount input + **Pay Now**.
   - **No match** → form with Family Name, Other Names, Phone, Amount + **Pay Now**.
   - Toggle **Donate anonymously** at top: collapses to just amount + **Pay Now**.
3. Pay Now currently records intent only (no real charge yet). It calls `fundraising-public-donate` edge function that:
   - Resolves/creates donor (unless anonymous).
   - Inserts into `fundraising_donations` with `status = 'pending'` (new column added in Section 7).
   - Returns the donation id for the future payment step.

French translations added.

## 7. Database migration
Single migration file:

```sql
-- 7.1 Image column already exists; add pledge aggregate
ALTER TABLE public.fundraising_campaigns
  ADD COLUMN IF NOT EXISTS pledged_total bigint NOT NULL DEFAULT 0;

-- 7.2 Donation status (for pending payments)
ALTER TABLE public.fundraising_donations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending','completed','failed','refunded'));

-- 7.3 Public pledges
CREATE TABLE public.fundraising_pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES public.donors(id) ON DELETE SET NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  pledger_name text NOT NULL,
  pledger_phone text NOT NULL,
  pledger_email text,
  amount bigint NOT NULL CHECK (amount > 0),
  currency_code text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','fulfilled','cancelled')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fundraising_pledges TO authenticated;
GRANT SELECT, INSERT ON public.fundraising_pledges TO anon;
GRANT ALL ON public.fundraising_pledges TO service_role;
ALTER TABLE public.fundraising_pledges ENABLE ROW LEVEL SECURITY;

-- Anyone may create a pledge for a public campaign
CREATE POLICY "Public can insert pledges for public campaigns"
  ON public.fundraising_pledges FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.fundraising_campaigns c
    WHERE c.id = campaign_id AND c.is_public = true));
-- Regional/super admins manage pledges for their campaigns (mirrors existing donation policies)
-- (full policy block in migration body)

-- 7.4 Trigger to keep pledged_total in sync
CREATE OR REPLACE FUNCTION public.fr_sync_pledged_total() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.fundraising_campaigns SET pledged_total = COALESCE((
    SELECT SUM(amount) FROM public.fundraising_pledges
     WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
       AND status = 'active'
  ),0) WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  RETURN NULL;
END $$;
CREATE TRIGGER trg_fr_sync_pledged AFTER INSERT OR UPDATE OR DELETE
  ON public.fundraising_pledges FOR EACH ROW EXECUTE FUNCTION public.fr_sync_pledged_total();

-- 7.5 Storage bucket idempotent ensure (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-images','campaign-images',true)
  ON CONFLICT (id) DO NOTHING;
-- Read/write storage policies for authenticated; public read.
```

## 8. Edge functions (no auth required, use service role)
- `supabase/functions/fundraising-lookup/index.ts` — POST `{ phone }` → `{ found, first_name?, last_name?, type: 'member'|'visitor'|'donor', id?, has_pledge?, pledge? }` for a given `campaign_id`.
- `supabase/functions/fundraising-public-pledge/index.ts` — POST `{ campaign_id, phone, family_name?, other_names?, email?, amount, currency_code, note? }`.
- `supabase/functions/fundraising-public-donate/index.ts` — POST `{ campaign_id, phone?, family_name?, other_names?, anonymous, amount, currency_code }` → inserts pending donation, returns id.

All three registered in `supabase/config.toml` with `verify_jwt = false`.

## 9. Routing & navigation
`src/App.tsx`:
- `/fundraising/:id` → `FundraisingDetails`
- `/fundraising/:id/pledge` → `FundraisingPledge`
- `/fundraising/:id/donate` → `FundraisingDonate`

## 10. i18n
Add ~25 EN/FR keys in `languageUtils.ts` covering details page sections, pledge & donate flow labels, buttons, success/error toasts.

## Out of scope (deferred)
- Actual payment processing on "Pay Now" — wired as TODO; will be tackled in the follow-up prompt as you noted.
- Multi-image gallery upload for campaigns (current scope: single cover image).
