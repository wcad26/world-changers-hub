I found the likely cause: relationship changes made in the member edit dialog invalidate only the per-member relationship query, but the regional dashboard and member-management KPI use separate cached relationship queries. Because those queries are not invalidated/refetched, the child can be correctly saved in `member_relationships` but still not appear in the Children KPI until the cache refreshes. I also confirmed in the database that WCA DOUALA currently has 1 strict child candidate (age under 16 with adult relationship), while the UI screenshot shows 0.

Plan to fix this fully:

1. Centralize strict child detection and relationship fetching
   - Add a reusable regional relationship hook/helper that fetches all relationship rows touching members in a region.
   - Use `buildChildrenSet` everywhere instead of manually calling `isChildMember` in each page.
   - Avoid mutating `memberIds` with `.sort()` inside query keys, since that can cause unstable memo/cache behavior.

2. Fix query invalidation after relationship/profile updates
   - Update `useCreateMemberRelationship` and `useDeleteMemberRelationship` to invalidate all relationship-dependent queries, including:
     - Regional member-management relationship query
     - Regional dashboard relationship query
     - Attendance history with member types
     - Regional reports
     - Super admin reports
     - DCG reports/data queries
   - Update `EditMemberForm` success handling so after profile DOB/member updates it invalidates dashboard/report queries as well as member queries.
   - This ensures editing a child DOB and then adding a parent relationship immediately recalculates all KPIs/reports.

3. Fix regional member-management KPI/filter counts
   - Replace the local manual child calculation in `src/pages/admin/regional/Members.tsx` and `MemberKPICards.tsx` with `buildChildrenSet`.
   - Ensure Children are excluded from Members, Regular Visitors, and Special Event Visitors, and counted only in Children.
   - Ensure the Children filter uses the same computed child set as the KPI cards.

4. Fix regional dashboard charts/reports accuracy
   - Update `src/pages/admin/regional/Dashboard.tsx` to consume the same strict children set.
   - Fix the attendance trend source (`useAttendanceHistoryWithMemberTypes`) so it builds the adult DOB lookup from all attendance members, not just the child record, before classifying attendance as Members / Regular Visitors / Children.
   - This will correct dashboard attendance trends and average attendee calculations where children were previously mixed into member/visitor attendance.

5. Sweep remaining report/count surfaces
   - Review and patch remaining hooks that still count raw member rows without children exclusion, especially:
     - `useAllMembers.ts` / `useGlobalMemberStats`
     - `useRegionStats.tsx` if region member-count meaning requires adult-only counting
     - DCG member lists/dashboard/reporting hooks where child exclusion is still partial
   - Ensure children are not included in any adult member/visitor KPI, and are exposed as children where relevant.

6. Verification
   - Use the live database child candidate in WCA DOUALA as a validation case: regional Members page Children KPI should show 1, not 0.
   - Verify dashboard Members total subtracts that child from adult member/visitor counts.
   - Verify attendance/member/visitor charts use Children separately when that child has attendance records.

No new database table is needed for this fix; the relationship rows already exist. The work is in cache invalidation and making all reporting surfaces use the same strict child classification.