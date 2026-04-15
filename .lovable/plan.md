
## Plan: Modern Glassy Registration Form + Occupation Dropdown + Required DCG

### Database Changes

1. **Create `occupations` table** — stores a list of selectable occupations
   - Columns: `id` (uuid), `name` (text, unique), `name_fr` (text, nullable for French), `display_order` (int), `is_active` (boolean, default true), `created_at` (timestamptz)
   - RLS: Public SELECT on active occupations; Super Admin ALL
   - Seed with common occupations: Student, Teacher, Engineer, Doctor, Nurse, Accountant, Business Owner, Pastor/Minister, Lawyer, Civil Servant, Trader/Merchant, Driver, IT Professional, Farmer, Artisan/Craftsman, Journalist, Pharmacist, Architect, Military/Police, Homemaker, Retired, Unemployed, Other

### Schema Changes

2. **Update `memberRegistrationSchema.ts`**
   - Change `occupation` from free string with min/max to a simple optional string (selected from dropdown)
   - Make `dcg_id` required (remove `.optional()`, add `.uuid("Please select a DCG")`)

### UI Rebuild — Modern Glassy Form (`MemberRegister.tsx`)

3. **Background & Container**: Replace plain `bg-background` with a gradient background using brand colors (purple-to-teal soft gradient). The form card becomes a glassmorphism panel with `backdrop-blur`, soft borders, and subtle shadow — using existing CSS classes like `glass-panel-soft` and `card-soft`.

4. **Header**: Branded hero-style header at the top with gradient background (wca-purple to wca-violet), region name prominently displayed, and a welcoming subtitle with softer typography.

5. **Form Sections**: Each section (Personal Info, Spiritual Info, Ministry, Family Relationships, DCG) gets:
   - A subtle glass card container with rounded corners and soft border
   - Section icon alongside the heading
   - Smooth spacing and padding

6. **Inputs**: Styled with rounded-xl borders, soft focus rings in brand accent color, slight background tint for contrast.

7. **Occupation Field**: Replace free-text `Input` with a `Select` dropdown that fetches from the new `occupations` table. Include an "Other" option.

8. **DCG Selection**: Remove the `{dcgs.length > 0 &&}` conditional — always show DCG section. Mark as required (no "optional" label). Update validation.

9. **Submit Button**: Full-width gradient button (purple-to-teal) with hover lift effect, matching brand aesthetic.

10. **Success/Error States**: Apply same glassmorphism treatment to success card and duplicate detection card.

### Admin Form Update

11. **Update `RegisterMemberForm.tsx`** — Change occupation from Input to Select dropdown using the same occupations table, for consistency.

### Files Modified
- `supabase/migrations/` — New migration for `occupations` table with seed data
- `src/integrations/supabase/types.ts` — Auto-updated
- `src/schemas/memberRegistrationSchema.ts` — Occupation + DCG validation
- `src/pages/MemberRegister.tsx` — Full UI rebuild with glassmorphism + occupation dropdown + required DCG
- `src/components/admin/regional/RegisterMemberForm.tsx` — Occupation dropdown
