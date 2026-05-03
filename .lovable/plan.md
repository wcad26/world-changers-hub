# Remove Emergency Contact Fields System-Wide

The registration is failing because hidden form defaults (`emergency_contact_phone: ''`) still trigger the Zod `min(6)` validation in `memberRegistrationSchema`. We'll fully purge the field everywhere.

## 1. Schemas (drop fields entirely)
- `src/schemas/memberRegistrationSchema.ts` — remove `emergency_contact_name` and `emergency_contact_phone`.
- `src/hooks/useMembers.ts` — remove from member schema.
- `src/components/admin/regional/EditMemberForm.tsx` — remove from local zod schema, defaults, submit payload, and the two `FormField` blocks (lines ~508–520).
- `src/components/admin/regional/RegisterMemberForm.tsx` — same removals (schema, defaults, submit payload, FormFields ~437–450).

## 2. Public + member UI
- `src/pages/MemberRegister.tsx` — remove the two default values (lines 121–122).
- `src/pages/member/Profile.tsx` — remove the entire "Emergency Contact" card/section (state, reset, render, save payload).

## 3. Admin views
- `src/pages/admin/regional/MemberProfile.tsx` and `src/pages/admin/super/MemberProfile.tsx` — remove the Emergency Contact display rows.
- `src/pages/admin/regional/Members.tsx` — drop "Emergency Contact" / "Emergency Phone" columns from CSV export.

## 4. Edge functions
- `supabase/functions/create-member/index.ts` — stop destructuring and inserting these fields.
- `supabase/functions/create-member-registration/index.ts` — same.

## 5. Database migration
Drop the columns from `profiles`:
```sql
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS emergency_contact_name,
  DROP COLUMN IF EXISTS emergency_contact_phone;
```
This will regenerate `src/integrations/supabase/types.ts` automatically.

## Outcome
- Member registration submits successfully (no hidden phone validation).
- No UI surfaces, exports, or DB columns reference emergency contact anymore.
- Existing data in those columns is permanently dropped (acceptable per "no longer use it").

## Memory update
Add a constraint memory: "Emergency contact fields fully removed — never re-add to forms, schemas, edge functions, or DB."
