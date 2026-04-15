

## Plan: Rebuild Record Attendance Dialog

### Changes to `src/components/admin/regional/events/AttendanceManagementDialog.tsx`

**1. Glassmorphism styling** — Match regional admin pages: `bg-card/60 backdrop-blur-sm` on dialog content, subtle borders, rounded corners.

**2. Table columns** — Replace current 4 columns (Present, Name, Member ID, Email) with:
- **Present** — checkbox (narrow)
- **Name** — `Last Name First Name` format
- **DCG** — fetch from `dcg_members` joined with `dcgs` table to get DCG name per member; show "—" if not in any DCG
- **Member Type** — derive from: `member_type === 'member'` → "Member", `member_type === 'visitor'` + check if special event visitor vs regular → "Regular Visitor" / "Special Event Visitor", child check via `isChildMember()` → "Child"

**3. Filter row** — Replace the current search + Children Only toggle + Select All with:
- Search input (left)
- Single dropdown filter: All, Members, Regular Visitors, Special Event Visitors, Children (replaces the old Children Only toggle)
- Select All button stays

**4. Remove Cancel button** — Only keep the "Record Attendance" / "Update Attendance" button in footer.

**5. Mobile/tablet optimization** — Responsive dialog sizing using `w-full max-w-4xl` with `max-h-[85vh]`. On mobile: stack search and filter vertically, make table horizontally scrollable, compact padding. Use `pb-24` for bottom nav clearance.

**6. DCG data fetching** — Add a query inside the component to fetch `dcg_members` with `dcgs.name` for all members in the region:
```tsx
const { data: dcgMemberships } = useQuery({
  queryKey: ['attendance-dcg-memberships', regionId],
  queryFn: async () => {
    const { data } = await supabase
      .from('dcg_members')
      .select('member_id, dcgs!inner(name)')
      .eq('is_active', true);
    return data;
  },
});
// Build a Map<memberId, dcgName> for O(1) lookup
```

**7. Member type derivation logic:**
- If `isChildMember(dob, id, relationships)` → "Child"
- If `member_type === 'visitor'` and member has `source_event_id` or is linked to a special event → "Special Event Visitor" (check via `join_interest` or source event linkage)
- If `member_type === 'visitor'` → "Regular Visitor"
- If `member_type === 'member'` → "Member"

### Files Modified
- `src/components/admin/regional/events/AttendanceManagementDialog.tsx` — Full rebuild of UI, filter logic, table columns, DCG fetch, remove Cancel button

