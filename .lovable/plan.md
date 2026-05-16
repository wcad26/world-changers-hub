# Rebuild DCG Dashboard

Replace the current `src/pages/dcg/Dashboard.tsx` with a layout that mirrors the regional admin dashboard (DCG-filter view from the reference screenshot), scoped to the logged-in DCG only.

## Layout

```
┌──────────────────────────────────────────────────┐
│ Fixed top bar: [1M 3M 6M 1Y Custom]  [Search]    │
├──────────────────────────────────────────────────┤
│ Scrollable area:                                 │
│   ┌──── 4 Glass KPI Cards ────┐                  │
│   │ Members │ Children │ Net Balance │ Discp. % ││
│   └──────────────────────────────────────────────┘│
│   ┌──── Attendance Trend (AreaChart) ───────────┐│
│   │  Members · Regular Visitors · Children       ││
│   └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

Same visual language as Regional: `bg-card/60 backdrop-blur-sm`, rounded-2xl borders, `GlassKPICard`, gradient area chart with the existing chart-1/2/4 tokens, fixed filter bar with scrollable body.

## KPI cards (scoped to current DCG)

1. **Members** — adult active members count, subtitle `X adults · Y children`. Uses existing `dcgMembers` + strict child rule already in the file.
2. **Children** — strict-child count (age <16 AND adult relationship), subtitle "In DCG".
3. **Net Balance** — `total_income - total_expenses` for the selected period, formatted with region currency, subtitle `Income / Expenses`. Color follows sign (green/red).
4. **Discipleship Success** — % of disciples mentored by this DCG's members that reached the `became_member` milestone. Compute via `discipleship_relationships` filtered to mentor_id in DCG member ids, joined with `discipleship_progress`.

## Attendance Trend chart

- Reuse the regional `AreaChart` block (3 series: Members, Regular Visitors, Children, gradients + custom tooltip).
- Data from `useDcgAttendanceHistory(userDcg.id)` — one point per DCG attendance event in the selected period, sorted by date. Use `members_present`, `visitors_present`, `children_present` fields if available; if the hook only returns `total_present`, plot a single "Attendance" series instead (decide at implementation by inspecting the hook).
- Empty state matches regional (centered placeholder inside the glass panel).

## Period filter

- Reuse the regional pattern: `1M / 3M / 6M / 1Y / Custom` button group + date-range popover.
- Single piece of state `quickPeriod` + `customRange` → derived `dateRange` (memoized) drives:
  - `useFinancialTransactions({ from, to })` (replaces current month-only fetch)
  - Filtering of `attendanceHistory` for the trend + averages
- Search input filters trend events by name (parity with regional).

## Removed from current dashboard

- 5-card stat strip, Recent Activities card, Members & Finances summary cards, quick actions — all replaced by the new layout above (user already deleted Quick Actions).

## Technical notes

- File: rewrite `src/pages/dcg/Dashboard.tsx`. Keep wrapping in `DcgAdminLayout`.
- Components reused: `GlassKPICard` from `@/components/ui/GlassSection`, `Calendar`, `Popover`, `Input`, `Button`, recharts `AreaChart`.
- Hooks reused: `useDcgMembers`, `useDcgAttendanceHistory`, `useFinancialTransactions` (filtered by `dcg_id === userDcg.id`), `useRegionCurrency`, `useAuth`.
- New query for Discipleship Success: fetch `discipleship_relationships` where `mentor_id IN (dcg member ids)`, then `discipleship_progress` for those relationship ids; compute `% with became_member milestone`.
- Keep the existing strict-child `useEffect` that builds `childrenSet`.
- No backend/schema changes.
