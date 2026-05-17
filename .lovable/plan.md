# Super Admin Dashboard — Full Rebuild (Global Glass Edition)

Replace `src/pages/admin/super/Dashboard.tsx` entirely. Old KPI strip, all four existing tabs (Regional Member Overview, Regional DCG Overview, Global Finances, Regional Events Overview) and their tables/exports are **removed**. The new page mirrors `src/pages/admin/regional/Dashboard.tsx` 1:1 in look, feel, layout, and computation pipeline — but every dataset is global across all regions, with an additional **Region** filter to optionally scope to one region.

## 1. Layout (identical to regional)

```text
┌─ Sticky glass filter bar (shrink-0, blurred, border-b) ───────────────┐
│ [1M 3M 6M 1Y Custom]  [Region ▾]  [Event Type ▾]  [🔎 search events] │
├─ Scrollable content (flex-1 overflow-y-auto, space-y-6) ──────────────┤
│  KPI grid — 5 GlassKPICard (Regional or DCG variant)                  │
│  Attendance Trend (AreaChart, per-event or weekly buckets, target line)│
│  Gender & Age Distribution (BarChart 2/3) │ 4-quadrant card (1/3):    │
│                                           │   Tithers · Givers ·      │
│                                           │   Income Growth · Fundr.  │
└────────────────────────────────────────────────────────────────────────┘
```

All styling tokens (`bg-card/60 backdrop-blur-sm`, `rounded-2xl`, `border-border/40`, `GlassKPICard`, gradient `<defs>` for Areas, `hsl(var(--chart-*))`) come straight from the regional file — no new design tokens.

## 2. Filter state

- `quickPeriod`: `1-month | 3-months | 6-months | 1-year | custom` (default `1-month`).
- `customRange`: `{ from?, to? }` via shadcn Popover + Calendar (range mode).
- `regionId`: `"all"` (default) or a UUID — populated by `useAllRegions({ includeInactive: false })`.
- `eventType`: `regional | dcg` (default `regional`).
- `searchQuery`: free text matched against event name.

`dateRange` / `dateFilters` / `prevDateFilters` memos are copied verbatim from the regional dashboard.

## 3. Data layer — global with optional region scoping

Every hook takes an optional `regionId?: string`. When `regionId` is undefined (i.e. `"all"`) it queries across all regions; otherwise it filters to that region. Super Admin already has global SELECT under existing RLS, so no new policies are needed.

New hooks (parallel to the regional ones, but global):

- `useGlobalMembersScoped(regionId?)` — `members` joined with `profiles`; optional `.eq('region_id', regionId)`. Returns the same `MemberWithProfile` shape as `useMembers` so the categorization logic is reusable.
- `useGlobalEventsScoped(regionId?)` — `events` (region-filtered or not).
- `useGlobalAttendanceHistoryWithMemberTypes(regionId?)` — same shape as `useAttendanceHistoryWithMemberTypes`; when global, runs across all regions and merges.
- `useGlobalFinancialSummaryScoped(dateFilters, regionId?)` and `useGlobalFinancialTransactionsScoped(dateFilters, regionId?)`.
- `useGlobalDiscipleshipRelationshipsScoped(regionId?)`.
- `useGlobalFundraisingCampaignsScoped(regionId?)`.
- `useGlobalActivePlanTargetsScoped(regionId?)` — when `"all"`, fetch active plans for **every** region and SUM each target key (`total_event_attendees`, `avg_event_attendance`, `avg_dcg_attendance`, etc.). When scoped, delegate to existing `useActivePlanTargets(regionId)`.
- `useGlobalDcgMembershipScoped(regionId?)` — global rollup of `totalDcgMembers / totalDcgAdults / totalDcgChildren`, optionally filtered by region.
- Special-event-ids query inline (same pattern as regional) — drop `.eq('region_id', …)` when global.

Member-relationships fetch stays on `fetchMemberRelationshipsForMembers(memberIds)` — chunked `.in()` on both sides as mandated by `mem://core` rules. This must run against the **global** member id list when `regionId === "all"` so children/adult classification is correct across regions.

## 4. Member-type & child rules (must mirror regional EXACTLY)

The regional KPI computation in `src/pages/admin/regional/Dashboard.tsx` (`kpis` memo, lines 146–359) is the source of truth. Replicate it 1:1, only swapping the input arrays for the global versions. Specifically:

1. **Children** — use `isChildMember(dob, id, relationships, adultDobLookup)` from `src/utils/childUtils.ts`:
   - age < 16 (`CHILD_AGE_THRESHOLD`), AND
   - at least one row in `member_relationships` (either direction, any type) linking to a member whose DOB is ≥16 or unknown.
   - `adultDobLookup` is built from the **global** member set so cross-region family links still resolve correctly.
2. **Special-event visitors** — `member_type === 'visitor' && rated_event_id && specialEventIds.has(rated_event_id)`. Excluded from every dashboard metric (consistent with the regional rule). Special-event-ids query is global (no region filter) when `regionId === "all"`.
3. **Adults bucket** — everything that is not a child and not a special-event visitor. Split into:
   - `memberCount` = adults with `member_type === 'member'`
   - `visitorCount` = adults with `member_type === 'visitor'` (regular visitors)
4. **30-day growth %** — `newAdults30` vs `newAdultsPrev` (days 30–60); same formula for children. Computed across the chosen scope (all regions or one).
5. **DCG membership** — `useGlobalDcgMembershipScoped` returns `{ totalDcgMembers, totalDcgAdults, totalDcgChildren }` already applying the same strict child rule inside the DCG subset.
6. **Discipleship success rate** — count distinct `relationship_id`s in `discipleship_progress` with `milestone === 'became_member'`, divide by total relationships in scope.
7. **Attendance classification** — copy `isRegionalSource` / `isDcgSource` helpers; classify by `source_event_id` first, then by `dcg_id` legacy fallback. DCG-recorded regional attendance is still counted as regional.
8. **Tithers / Givers** — unique `recorded_by` in `Tithes` category / income-type categories within `dateFilters`, across the scope.
9. **Income growth %** — `(current - previous) / previous * 100` on `financial_summary.total_income` for `dateFilters` vs `prevDateFilters`.
10. **Fundraising %** — `Σraised / Σgoal * 100` over campaigns in scope.
11. **Attendance target %** — drive from active plan targets (`total_event_attendees` preferred, else `avg_event_attendance`; `avg_dcg_attendance` for DCG mode). When `regionId === "all"`, targets are summed across regions.

This guarantees a Super Admin viewing `Region = X` sees the **same numbers** they would see on that region's Regional Dashboard, and `Region = All` is the legitimate sum/global aggregate.

## 5. Charts (verbatim from regional, global inputs)

- **Attendance Trend** — `AreaChart` with `Members / Regular Visitors / Children` series and gradient defs; per-event points in `regional` mode, 7-day buckets in `dcg` mode; dashed `ReferenceLine` at `kpis.targetMembers` when a member target exists for the scope. For `"all"` scope, plan target = SUM of all active regional plan targets.
- **Gender & Age Distribution** — `BarChart` with `Adult/Young Females`, `Adult/Young Males`, plus `Unknown` when present. Children determined by the strict rule; gender from `profiles.gender`.
- **4-quadrant card** — Tithers / Givers / Income Growth / Fundraising (identical markup).

## 6. KPI cards

Regional mode (5 cards):
1. **Members** — `kpis.totalAdults`; subtitle `${memberCount} members · ${visitorCount} visitors`.
2. **Children** — `kpis.totalChildren`; subtitle `±X% (30d)`.
3. **Regional Events** — `regionalEventsCount`; subtitle `Avg: N attendees`.
4. **Attendance Target** — `${regionalAttendanceTargetPct}%` or `—` if missing.
5. **Discipleship Success** — `${successRate}%`.

DCG mode (5 cards):
1. **Members** — `dcgTotalMembers`; subtitle `${dcgAdults} adults · ${dcgChildren} children`.
2. **Children** — `dcgChildren`; subtitle "In DCGs".
3. **DCG Events** — `dcgEventsCount`; subtitle `Avg: N attendees`.
4. **Attendance Target** — `${dcgAttendanceTargetPct}%` or `—`.
5. **Discipleship Success** — `${successRate}%`.

## 7. Loading / error states

- Top-level skeleton: same pattern as regional (`Skeleton` blocks for filter bar, KPI grid, trend chart) while members + events + attendance + financial summary are loading.
- Inline error banner using the regional pattern: only show when an error AND the corresponding dataset is still missing (transient failures recover silently). Retry button calls the failed `refetch()`s.
- **No "region missing" notice** — Super Admin has no single region; replaced by the Region filter bar.

## 8. Files

Created
- `src/hooks/useGlobalMembersScoped.ts`
- `src/hooks/useGlobalEventsScoped.ts`
- `src/hooks/useGlobalAttendanceScoped.ts`
- `src/hooks/useGlobalFinancialsScoped.ts`
- `src/hooks/useGlobalDiscipleshipScoped.ts`
- `src/hooks/useGlobalFundraisingCampaignsScoped.ts`
- `src/hooks/useGlobalPlanTargetsScoped.ts`
- `src/hooks/useGlobalDcgMembershipScoped.ts`

Rewritten
- `src/pages/admin/super/Dashboard.tsx` — full replacement, no tabs, no tables, no CSV exports.

Reused unchanged
- `src/components/ui/GlassSection.tsx` (`GlassKPICard`)
- `src/utils/childUtils.ts` (`isChildMember`, `buildChildrenSet`, `CHILD_AGE_THRESHOLD`)
- `src/utils/fetchMemberRelationships.ts`
- `src/hooks/useAllRegions.tsx` (for the Region select options)
- Recharts, date-fns, shadcn primitives, all existing semantic tokens.

Deleted/orphaned (left in place; not referenced by the new page)
- `useSuperAdminReports`, `useGlobalDcgReports` — keep the files; they may still be used by `pages/admin/super/Reports.tsx`. New dashboard does not import them.

## 9. Validation

1. With `Region = All`, confirm KPI totals equal the sum of the same KPIs computed per-region on the Regional Dashboard. Spot-check Members, Children, Discipleship Success.
2. With `Region = <one region>`, confirm every KPI, the trend chart, the gender chart, and the 4-quadrant numbers **exactly match** that region's Regional Dashboard for the same period and event type.
3. Toggle Event Type Regional ↔ DCG; confirm KPI labels swap and trend re-buckets weekly for DCG.
4. Confirm child counts are nonzero where families span regions (global member-relationships fetch coverage).
5. Confirm special-event visitors are excluded from every metric in both `All` and single-region scopes.
6. Confirm period switching (1M/3M/6M/1Y/Custom) drives every metric, including income growth % vs previous equal-length window.

## 10. Notes

- No DB migrations. No new RLS. Super Admin already has global SELECT on every table consumed here.
- No `presentation-artifact`. Pure UI rebuild.
- Memory entry `mem://features/super-admin-kpi-cards` should be refreshed after build to point at the new layout — done in build phase.