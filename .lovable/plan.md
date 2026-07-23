# Extend Certificate System for Badges & Pre-Registrant Recipients

Today the Generate flow only picks from `members`/event `attendance` records and requires each recipient to have a `member_id`. Badges for people who only pre-registered (including non-members) can't be produced. This plan adds a "Badge" output alongside certificates and a new recipient source: **event pre-registrations**.

## What changes for the user

**Global Certificates page** (`/admin/super/certificates`) and **Regional Certificates page** get:

1. A new **Output Type** toggle at the top of the Generate tab: `Certificate` | `Badge`.
   - Badge uses the same template/positioning pipeline (image + name + QR) — templates are just tagged as badges.
2. A new **Recipient Source** picker: `Members` | `Event attendees` | `Event pre-registrations` (new).
3. When source = pre-registrations:
   - Event selector is required (already exists).
   - Extra filters: primary-only vs. include family group, needs-lodging, attendee type (adult/youth/child derived from DOB), region (super admin only), search by name/email/phone.
   - Recipient list shows pre-registrants with name, email/phone, region, family-group indicator, and a "already has badge for this event" pill (so re-runs skip).
4. Template Type dropdown gains a `Badge` option; Templates tab shows a Badge vs Certificate filter.
5. Issued/Sent tabs get an "Output type" column and filter (Certificate/Badge).

## What changes under the hood

- **DB**: add `output_type text` (`'certificate' | 'badge'`, default `'certificate'`) to both `certificate_templates` and `certificates`. Backfill existing rows to `'certificate'`. Add `pre_registration_id uuid` (nullable, FK to `event_pre_registrations`) and make `member_id` nullable on `certificates` so non-member badges can be issued. Add unique partial index `(pre_registration_id, output_type)` where not null to prevent duplicates per event/badge.
- **Recipient resolver**: new hook `useEventPreRegistrants(eventId, filters)` that joins `event_pre_registrations` with `profiles`/`members` for name/email and derives display name using the "Last Name First Name" rule.
- **Generation flow**: in `Certificates.tsx` (both super + regional), branch on recipient source. For pre-registrants, use the pre-registrant's `name`/`email` (falling back to profile if linked), set `member_id` when available else null, and set `pre_registration_id`. `region_id` comes from the event or the pre-registrant's linked member.
- **Certificate number prefix**: use `BADGE-…` when output_type is badge, `CERT-…` otherwise (small change in `certificateUtils.generateCertificateNumber`).
- **Emails**: reuse existing `send-certificate-emails` edge function — subject/body switch on `output_type` (Badge vs Certificate wording). Skip recipients with no email.
- **Verification page** (`/verify/:code`) copy adjusts to say "Badge" or "Certificate" based on the stored `output_type`.

## Out of scope

- No changes to badge visual layout beyond what templates + name/QR positioning already provide (organizers upload their own badge artwork).
- No printing/PDF sheet layout (Avery-style multi-up) — v1 exports single PNGs per badge, same as certificates. Can be a follow-up if wanted.
- No standalone badges for people with neither a member nor a pre-registration record.

## Files to touch

- `supabase/migrations/*` — new migration for the two columns + backfill + index.
- `src/hooks/useCertificates.ts` — thread `output_type` through mutations/queries; add filter.
- `src/hooks/useEventPreRegistrants.ts` — **new** hook.
- `src/utils/certificateUtils.ts` — badge number prefix; type option additions.
- `src/pages/admin/super/Certificates.tsx` and `src/pages/admin/regional/Certificates.tsx` — Generate tab: output type toggle, recipient source picker, pre-registrant list, generation branch; Templates/Issued/Sent: output-type column + filter.
- `src/components/admin/regional/EditCertificateTemplateDialog.tsx` — add output_type field.
- `supabase/functions/generate-certificates/index.ts` and `send-certificate-emails/index.ts` — accept `output_type` and `pre_registration_id`, adjust wording.
- `src/pages/CertificateVerify.tsx` — dynamic label.

## Open question

Ask before implementation: should badges be **generated per pre-registrant even if they have no email** (name-only, download-only), or **skip email-less pre-registrants** entirely? Default in the plan: generate for all, skip email step for those without an address.
