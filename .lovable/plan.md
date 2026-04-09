

## Redesign Members Tab KPI Cards and Remove Old MemberCards

### What Changes

1. **Redesign MembersTab KPI cards** to match the GlassCard style from MemberCards (title top-left, icon top-right, value below, detail bottom-left, trend bottom-right)
2. **Keep only these KPI cards**: Total Members, Total Visitors, New This Month, Member Target, Children
3. **Remove**: Avg Attendance, Attendance Rate, Member:Visitor cards
4. **Add Children KPI card** -- counts members whose `date_of_birth` makes them under 18 years old
5. **Add Member Target KPI card** -- same design as the old MemberCards version with target progress and days remaining
6. **Delete the old MemberCards component** and its usage from Dashboard.tsx
7. **Make period filter functional** -- filter "New This Month", monthly growth chart, and recent joiners by the selected date range

### Technical Details

#### `src/components/admin/regional/dashboard/tabs/MembersTab.tsx`
- Replace the 6-card grid with 5 GlassCard-style KPI cards in a `grid-cols-2 md:grid-cols-3 lg:grid-cols-5` layout
- Each card: title (top-left, small text), icon (top-right, rounded bg), value (large bold), description + trend (bottom row)
- **Total Members**: value = count of `member_type === 'member'`, bottom-left = "X active", bottom-right = growth trend
- **Total Visitors**: value = count of `member_type === 'visitor'`, bottom-left = "Registered visitors", bottom-right = visitor growth trend
- **New This Month**: value = count joined within period, bottom-left = period label
- **Member Target**: value = target progress % or "No Target", bottom-left = "X of Y" or "Set a target", bottom-right = days remaining badge
- **Children**: value = count of members with `date_of_birth` indicating age < 18, bottom-left = "Under 18 years"
- Import and use `useCurrentMemberTarget` from `useMemberTargets`
- Filter `newThisMonth` and `monthlyGrowth` based on `filters.dateRange` instead of hardcoded current month
- Growth trends use attendance data already available

#### `src/pages/admin/regional/Dashboard.tsx`
- Remove the `MemberCards` import and its conditional render block (lines 130-135)
- Remove `MemberCards` from imports

#### `src/components/admin/regional/dashboard/MemberCards.tsx`
- Delete this file (no longer needed)

### Files Changed

| File | Change |
|------|--------|
| `src/components/admin/regional/dashboard/tabs/MembersTab.tsx` | Redesign KPI cards, add Children + Target, remove 3 cards, wire period filter |
| `src/pages/admin/regional/Dashboard.tsx` | Remove MemberCards usage |
| `src/components/admin/regional/dashboard/MemberCards.tsx` | Delete |

### No Database Changes Required

Children count derived from existing `profiles.date_of_birth` column.

