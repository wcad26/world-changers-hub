# Visitor Registration: Parity Fixes with Member Form

## Findings

Search across the codebase confirms:
- `src/pages/VisitorRegister.tsx` — no emergency contact fields
- `src/schemas/visitorRegistrationSchema.ts` — no emergency contact fields
- `supabase/functions/create-visitor/index.ts` — no emergency contact fields
- DB column already dropped from `profiles`

So no "emergency_contact" data path exists for visitors. But the visitor form still has the **same crash/silent-failure risks** that broke member registration:

1. Uses Radix `Select` components (Gender, Occupation, Event, Referral Source, Relationship). These can throw `NotFoundError: removeChild` when browser translation extensions (Google Translate, etc.) mutate Radix's hidden bubble-select DOM — same root cause as the member form failure.
2. No safety net to clear stale `root` errors from prior failed submissions.
3. Two stale translation entries still reference emergency contact in `src/utils/languageUtils.ts` (`emergencyContact`, `emergencyContactName`, `emergencyContactPhone`).

## Changes

### 1. `src/pages/VisitorRegister.tsx`
Replace Radix `Select` components with native `<select>` elements (matching the pattern used in `MemberRegister.tsx`) for:
- Gender
- Occupation
- Event attended (`rated_event_id`)
- Referral source
- Relationship type

Keep the rest of the form (Calendar, Popover member-search Combobox) unchanged — those weren't implicated.

Add an effect to clear any stale `root` errors on mount, mirroring the member form's safety net.

### 2. `src/utils/languageUtils.ts`
Remove the three orphaned French translation keys:
- `emergencyContact`
- `emergencyContactName`
- `emergencyContactPhone`

### 3. `src/pages/MemberRegister.tsx`
Remove the now-unnecessary `emergency_contact` substring check in the stale-error effect (no field by that name exists anywhere anymore — the guard is dead code).

### 4. `src/pages/admin/regional/MemberProfile.tsx`
Remove the leftover `{/* (Emergency contact removed) */}` placeholder comment.

## Out of scope

- No DB migration needed (columns already dropped).
- No edge function changes needed (`create-visitor` is already clean).
- No schema changes to `visitorRegistrationSchema.ts`.

## Technical notes

Native select pattern (already used in `MemberRegister.tsx`):
```tsx
<select
  className="w-full h-10 rounded-xl bg-background/60 border border-input px-3 text-sm"
  value={field.value || ''}
  onChange={(e) => field.onChange(e.target.value)}
>
  <option value="" disabled>{t('selectGender')}</option>
  <option value="Male">{t('male')}</option>
  <option value="Female">{t('female')}</option>
</select>
```
