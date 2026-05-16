## Rebuild Create Fundraising Campaign Dialog

Completely rewrite `CreateFundraisingCampaignDialog.tsx` using the project's modern glass dialog standard (matching `RecordDonationDialog`, `RegisterDonorDialog`) with full image upload support and richer campaign fields.

### Visual design (glass dialog standard)

- DialogContent: `sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl`
- Gradient header band with blurred orb decorations, gradient icon square (PiggyBank), title + description
- Body grouped into glass panels (`rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4`):
  1. Campaign Image (drag/drop + preview card)
  2. Campaign Details (Name, Description)
  3. Goal & Timeline (Goal with currency suffix, Start Date, End Date — shadcn DatePicker popovers)
  4. Visibility (Public toggle using Switch, not raw checkbox)
- Sticky footer: Cancel (outline) + gradient primary CTA "Create Campaign"
- Uppercase tracked labels, `bg-background/60 border-border/50` inputs

### New / fixed functionality

- Working image upload (currently the file input is unwired). Flow:
  - Local preview on selection (validate type = image/*, size ≤ 5MB)
  - On submit: upload file to `campaign-images` storage bucket at path `{region_id}/{uuid}.{ext}`, get public URL, write to `fundraising_campaigns.image_url`
- Replace native date inputs with shadcn Calendar/Popover DatePickers, with end-date ≥ start-date validation
- Goal input keeps thousands formatting; show region currency symbol inline
- Switch component for `isPublic` (with helper text)
- Loading state on submit button (spinner + disabled), proper toast on success/error
- Reset form + clear preview on close/success
- Keep current `useCreateFundraisingCampaign` hook contract; extend it to accept `imageUrl` and write `image_url` in the insert

### Files to change

- `src/components/admin/regional/CreateFundraisingCampaignDialog.tsx` — full rewrite
- `src/hooks/useFundraisingCampaigns.ts` — add `image?: string` (public URL) to schema/insert mapping for `image_url`

### Database / storage

Create a public `campaign-images` storage bucket with RLS so authenticated regional admins can upload/update/delete within their `{region_id}/...` folder and anyone can read (campaigns are publicly displayed). Done via a Supabase migration before code changes.

### Out of scope

- Editing existing campaigns (separate dialog already exists/can be added later)
- Multi-image gallery, rich text description, campaign categories