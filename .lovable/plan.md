Root cause: the Children KPI shows 0 even when valid child relationships exist because:

1. The current relationship-loading paths fetch only `member_id` and `related_member_id` and ignore `relationship_type`. Combined with how the data is read in different places, the strict child detection sometimes treats a relationship as missing.
2. Detection logic does not normalize across all relationship types in both directions. Any relationship type (spouse, parent, child, sibling, guardian, other) recorded from either side must be treated equivalently when verifying a child has at least one adult tie.
3. Several reporting hooks duplicate this logic with subtle differences, so a fix in one place doesn't propagate.

Plan:

1. Make child detection relationship-type agnostic and bi-directional (single source of truth)
   - In `src/utils/childUtils.ts`, keep the rule simple and explicit:
     - A member is a child when age < 16 AND at least one row in `member_relationships` ties them to ANY other member who is an adult (age >= 16 or DOB unknown).
     - All six relationship types (spouse, parent, child, sibling, guardian, other) count equally.
     - Direction does not matter: a row where the candidate appears as either `member_id` or `related_member_id` is considered a tie.
   - Strengthen `buildChildrenSet(...)` so it always builds a complete `adultDobLookup` from the member list and applies the rule uniformly.
   - Remove every site-specific reimplementation of the rule and route them through `buildChildrenSet`.

2. Use `buildChildrenSet` everywhere KPIs/charts/reports are computed
   - Regional Dashboard (`src/pages/admin/regional/Dashboard.tsx`): replace inline `isChildMember` loop with `buildChildrenSet`.
   - Members management (`Members.tsx`, `MemberKPICards.tsx`): keep `buildChildrenSet`; ensure both consume the same `memberRelationships` query.
   - Reporting hooks: `useReports.ts`, `useSuperAdminReports.ts`, `useRegionalDcgReports.ts`, `useEventReport.ts`, `useRegionalData.ts`, `useAttendance.ts`, `src/pages/dcg/Dashboard.tsx`, `src/pages/admin/super/Dashboard.tsx`, `src/pages/admin/regional/Reports.tsx`. All share the same helper.

3. Ensure relationship rows are actually fetched for every member visible on the page
   - Some current `.or(member_id.in.(...),related_member_id.in.(...))` calls can hit URL length / parser limits when the member list is large, silently returning a partial set. Switch to two separate `.in(...)` queries per side and merge in JS to guarantee complete coverage.
   - This fix applies to: regional `Dashboard.tsx`, `Members.tsx`, `useAttendance.ts`, `useReports.ts`, `useSuperAdminReports.ts`, `useRegionalDcgReports.ts`, `useEventReport.ts`, `useRegionalData.ts`, `dcg/Dashboard.tsx`.

4. Cache invalidation safety net
   - Verify `invalidateRelationshipDependentQueries` covers every query key prefix used by the hooks above; add any missing ones.
   - Make sure both `useCreateMemberRelationship` and `useDeleteMemberRelationship` (and `EditMemberForm`'s onSuccess after DOB edits) call it. Already in place — confirm prefixes match the actual keys after refactor.

5. Update the Core memory rule
   - Replace "at least one member_relationships row with an adult" wording so it's explicit that ALL relationship types and BOTH directions count, while still requiring the related party to be an adult (or have unknown DOB).

6. Verify
   - Re-query Postgres after deploy to count strict children per region (already shows WCA DOUALA = 1).
   - Confirm dashboard Children KPI matches that count and that Members/Visitors KPI excludes the same record.
   - Spot check Reports, Attendance Trend chart, and DCG dashboards for the same number.