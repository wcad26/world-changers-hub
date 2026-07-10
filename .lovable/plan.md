## Goal

Public "Update My Profile" page where any existing member finds their record by email or phone, then edits and saves their profile using the same rich form used at `/member/register/:regionCode`.

## Route

`/profile/update` — public (no auth), linked from Navbar/footer as needed.

## Flow

1. **Lookup step** — glass card with two tabs (Email / Phone). User submits one value. A new edge function `profile-update-lookup` finds the profile + member record and returns:
   - profile fields (first/last name, email, phone, address, dob, gender, occupation, region_id)
   - member fields (dcg_id, ministry_interests, foundation school + baptism status/dates, member_type)
   - existing `member_relationships` (as `{type, memberIds[]}` entries)
   - the region slug (for DCG list scoping)
   - a short-lived signed `update_token` (HMAC of profile_id + expiry, 20 min) so the client can submit updates without auth
   - If not found → friendly "no profile found" state with links to `/member/register/:regionCode`.
   - If multiple matches (shouldn't happen after normalization) → return the first and log.

2. **Edit step** — reuse the exact layout of `MemberRegister.tsx` (Personal Info, Church Life, Family Relationships, DCG selection, Ministry interests). Extract the shared form body into `MemberProfileForm` so both `MemberRegister` and the new page use it. The DCG dropdown is populated from the found profile's region.
   - Pre-populate every field from lookup response.
   - Email field is read-only (identifier); phone stays editable. Region is read-only display.
   - Success screen: "Profile updated" + link back to homepage / member portal login.

3. **Submit step** — POSTs to new edge function `profile-update-submit` with `update_token` + form payload. The function:
   - Verifies the HMAC token and expiry.
   - Uses `SUPABASE_SERVICE_ROLE_KEY` to update `profiles` (name, phone, address, dob, gender, occupation) and `members` (dcg_id, ministry_interests, foundation school + baptism fields, member_type recomputed from foundation school completion per the existing rule).
   - Replaces `member_relationships` rows for this member with the submitted set (same validation as registration: minors must be linked to at least one adult).
   - Also updates `auth.users` email is NOT changed (email stays the identifier).
   - Returns `{ success, member_id }`.

## Files

**New**
- `src/pages/UpdateProfile.tsx` — lookup + form host, success/error states, Navbar shell mirroring `MemberRegister`.
- `src/components/profile/ProfileLookupCard.tsx` — Email/Phone tabbed lookup form.
- `src/components/profile/MemberProfileForm.tsx` — shared form extracted from `MemberRegister.tsx` (props: `mode: 'register' | 'update'`, `initialValues`, `region`, `onSubmit`, `isSubmitting`). Keeps all existing sections and validation intact.
- `supabase/functions/profile-update-lookup/index.ts`
- `supabase/functions/profile-update-submit/index.ts`
- `supabase/functions/_shared/updateToken.ts` — HMAC sign/verify helper (uses `SUPABASE_JWT_SECRET` or a new `PROFILE_UPDATE_SECRET`).

**Edited**
- `src/App.tsx` — add `<Route path="/profile/update" element={<UpdateProfile />} />`.
- `src/pages/MemberRegister.tsx` — swap inline form body for `<MemberProfileForm mode="register" ... />` (no behavior change).
- `src/components/layout/Navbar.tsx` — add a small "Update profile" link (or a link on `MemberAuth` page) so members can find it.
- `src/utils/languageUtils.ts` — add EN/FR strings for the new lookup + update UI.

## Technical Notes

- Lookup normalization: email `lower(trim)`, phone stripped to digits, compared against digit-normalized `profiles.phone`. Since phone isn't guaranteed unique, if >1 profile matches by phone, return the list with masked names and let user pick before proceeding.
- Token: `base64url(payload).base64url(hmacSHA256(payload, secret))` where payload = `{pid, exp}`. Expiry 20 minutes; regenerated on each successful lookup.
- No RLS bypass on the client: all writes go through the edge function with service role. Frontend never receives `service_role_key`.
- Age/relationship validation reused from `MemberRegister` (minors need adult link).
- The `member_type` recompute uses the existing rule in `mem://features/member-registration-foundation-school-logic`.
- Do not alter auth: profile update page is fully public.

## Out of Scope

- Password changes / auth-linked email changes.
- Bulk admin update flows.
- Uploading member photos (kept identical to current member registration behaviour — not part of that form either).
