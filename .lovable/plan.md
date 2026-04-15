

## Full Plan: Children Criteria, Attendance Graph, Gender Distribution, Registration Relationships, Children Filter, and Menu Cleanup

### 1. Age Threshold: 18 → 16

**Files**: `useAttendance.ts` (line 147), `MembersTab.tsx` (line 57, line 284)

- Change `< 18` to `< 16` in all `isChild` / age checks
- Update label "Under 18 years" to "Under 16 years"

---

### 2. Fix Attendance Trend Graph

**File**: `TrendChart.tsx` (line 27)
- Remove `(event as any)` cast -- the hook already returns `children_present` as a typed field

**File**: `useAttendance.ts`
- Replace manual year math in `isChild` (lines 141-148) with `differenceInYears` from date-fns for consistency, using `< 16`
- Ensure `children_present` correctly separates children regardless of `member_type`

---

### 3. Gender Distribution: 5 Categories

**File**: `MembersTab.tsx` (lines 108-117)

- Replace simple gender grouping with age+relationship-aware categorization
- Fetch `member_relationships` for all members in the region
- A person is "Young" if age < 16 AND has at least one relationship in `member_relationships`
- Categories: **Adult Male**, **Adult Female**, **Young Male**, **Young Female**, **Unknown** (only shown if records with no gender exist)
- Anyone not meeting "Young" criteria is "Adult"

---

### 4. Add Relationship Field to Registration Forms

**Files**: `memberRegistrationSchema.ts`, `visitorRegistrationSchema.ts`
- Add optional `relationship_member_id` (string) and `relationship_type` (string)

**File**: `RegisterMemberForm.tsx`
- Add collapsible "Family Relationship" section with:
  - Relationship type dropdown (Spouse, Parent, Child, Sibling, Guardian, Other -- matching existing types)
  - Searchable member selector
- After member creation, if relationship fields filled, call `useCreateMemberRelationship`

---

### 5. Children Filter on Member Lists and Attendance Dialogs

**New file**: `src/utils/childUtils.ts`
- `isChildMember(dob, memberId, relationships)`: true if age < 16 AND has at least one relationship entry

**Files with children filter added**:
- `src/pages/admin/regional/Members.tsx` -- add "children" to member type filter dropdown
- `src/pages/admin/super/Members.tsx` -- same children filter
- `src/components/admin/regional/events/AttendanceManagementDialog.tsx` -- "Show Children Only" toggle
- `src/components/admin/dcg/EventAttendanceDialog.tsx` -- same toggle

All require fetching `member_relationships` to determine child status.

---

### 6. Remove Reports from Regional Sidebar

- `RegionalAdminLayout.tsx` line 34: remove Reports menu item
- `EnhancedRegionalAdminLayout.tsx` lines 77-82: remove Reports entry

---

### 7. Keep Existing Relationship Types (No Changes)

Current types (`spouse | parent | child | sibling | guardian | other`) remain unchanged. No database migration needed.

---

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useAttendance.ts` | Age 18→16, fix isChild logic |
| `src/components/admin/regional/dashboard/tabs/MembersTab.tsx` | Age 18→16, 5-category gender chart, label update |
| `src/components/admin/regional/dashboard/TrendChart.tsx` | Remove `as any` cast |
| `src/utils/childUtils.ts` | **New** -- shared child detection utility |
| `src/schemas/memberRegistrationSchema.ts` | Add optional relationship fields |
| `src/schemas/visitorRegistrationSchema.ts` | Add optional relationship fields |
| `src/components/admin/regional/RegisterMemberForm.tsx` | Add relationship section + post-creation insert |
| `src/pages/admin/regional/Members.tsx` | Add "children" filter option |
| `src/pages/admin/super/Members.tsx` | Add "children" filter option |
| `src/components/admin/regional/events/AttendanceManagementDialog.tsx` | Add children filter toggle |
| `src/components/admin/dcg/EventAttendanceDialog.tsx` | Add children filter toggle |
| `src/components/admin/RegionalAdminLayout.tsx` | Remove Reports menu item |
| `src/components/admin/EnhancedRegionalAdminLayout.tsx` | Remove Reports menu item |

### No Database Changes Required

All logic uses existing `profiles.date_of_birth` and `member_relationships` table.

