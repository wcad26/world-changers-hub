

## Plan: Modernize Visitor Registration Form

This plan mirrors the member registration form changes onto the visitor form: glassmorphism UI, occupation dropdown, emergency contact removal, and replacing the "invited by" free-text field with a member search/select system.

### Schema Changes

1. **Update `visitorRegistrationSchema.ts`**
   - Remove `emergency_contact_name` and `emergency_contact_phone` fields
   - Change `occupation` from free-text with min/max to a simple optional string (dropdown selection)
   - Replace `referral_person_name` (free text) with `referral_member_ids` (array of UUIDs) for the "invited by" case — this enables selecting existing members instead of typing a name
   - Keep `referral_person_name` as optional fallback for the free text (in case user types a name not in system — actually, remove it and use only member selection)
   - Update the refinement: if `referral_source === 'invited_by'`, require `referral_member_ids` to have at least one entry

### Edge Function Update

2. **Update `create-visitor/index.ts`**
   - Remove `emergency_contact_name` and `emergency_contact_phone` from destructuring and profile insert
   - Accept `referral_member_ids` (array of UUIDs) instead of `referral_person_name`
   - After creating the visitor, if `referral_member_ids` is provided, create `member_relationships` records linking the new visitor to each referral member with relationship type "referred_by" or store the referral member IDs in the `referral_person_name` field as a comma-separated list (simpler, no schema change needed)
   - Actually, keep it simple: store the first referral member name in `referral_person_name` column for backward compatibility, and create relationship records

### UI Rebuild — `VisitorRegister.tsx`

3. **Apply glassmorphism aesthetic** matching MemberRegister.tsx:
   - Gradient background (`from-primary/5 via-background to-accent/5`)
   - Reuse the `GlassSection` component pattern with icons
   - Glass hero header with region name
   - Rounded-xl inputs with `bg-background/60`
   - Gradient submit button with hover lift

4. **Remove emergency contact section entirely**

5. **Replace occupation free-text Input with Select dropdown** fetching from `occupations` table via `useOccupations` hook

6. **Restructure referral section — "How did you hear about us?"**
   - Reorder options: "Invited by someone" first, then Social Media, Website, Other
   - When "Invited by someone" is selected, show a member search/select UI identical to the family relationships section in MemberRegister:
     - Multi-select popover with Command search across all regions using `search_all_members` RPC
     - Selected members shown as badges with remove buttons
     - This replaces the free-text "Who invited you?" field

7. **Organize form into GlassSection groups:**
   - Personal Information (name, email, phone, address, DOB, gender, occupation)
   - Event & Referral (event selection, satisfaction rating, how did you hear about us, invited-by member select)
   - Interest (join interest radio)

### Hook Update

8. **Update `useVisitorRegistration.ts`** to pass the new `referral_member_ids` field

### Edge Function — Relationship Creation

9. **Update `create-visitor/index.ts`** to create `member_relationships` records when `referral_member_ids` are provided, linking the new visitor to the referral members

### Files Modified
- `src/schemas/visitorRegistrationSchema.ts`
- `src/pages/VisitorRegister.tsx` — Full UI rebuild
- `src/hooks/useVisitorRegistration.ts`
- `supabase/functions/create-visitor/index.ts`

