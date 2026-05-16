## 1. Sidebar label cleanup + new Planning entry

Edit `src/components/admin/EnhancedRegionalAdminLayout.tsx` so the menu reads (in this order):

1. Dashboard
2. Members
3. Discipleship
4. Events
5. DCG
6. Certificate
7. Finance
8. Communication
9. **Planning** → `/admin/regional/planning` (icon: `Target`)
10. Website
11. Settings

Also update `ROUTE_TITLE_MAP` in `src/components/admin/RegionalAdminShell.tsx` so the header titles match the new short names (the existing map drives the page header), and add `'/admin/regional/planning': 'Plan Management'`. The mobile bottom-nav already strips "Management"/"Mgmt" so it will pick up the new labels automatically.

## 2. New page: Plan Management (`/admin/regional/planning`)

A single page where a region can set, track and review the targets it wants to hit over a period (quarter / year / custom range). Built as one cohesive page with tabs, not multiple routes.

### Proposed features (based on what the region already tracks)

**A. Strategic Goals (header)**
- Region's mission statement for the period (free text).
- Period selector: Quarter / Year / Custom range. All KPIs and targets below scope to it.

**B. Growth Targets**
- Target totals for: New Members, New Visitors, Visitor → Member conversions, Children registered.
- Automatic actuals pulled from `members` / visitors data for the selected period, with progress bar + % to goal + on-track/at-risk badge.

**C. Discipleship Targets**
- Targets for: Foundation School completions, Baptisms, Active mentor pairs, Disciples graduated.
- Actuals from existing discipleship tables.

**D. Event & Attendance Targets**
- Targets for: # of regional events, average attendance per event, total unique attendees, special events count.
- Actuals from `event_attendance` summaries.

**E. DCG Expansion Targets**
- Targets for: # of new DCGs launched, # of active DCGs, total DCG membership, average DCG attendance.
- Actuals from `dcgs` / `dcg_members` / DCG attendance.

**F. Financial Targets**
- Targets for: Total income, total expenses, net balance, fundraising campaigns raised.
- Actuals from `financial_transactions` and fundraising data, formatted in the regional currency.

**G. Initiatives & Action Items**
- Free-form list of named initiatives ("Open new DCG in PK21", "Run discipleship retreat") with: title, description, owner (regional user), due date, status (Not started / In progress / Done / Blocked), priority.
- Filterable list + kanban-style status grouping.

**H. Quarterly Review Notes**
- Per-period text field for wins, blockers, lessons learned. Visible to whoever opens the page.

**I. Snapshot KPI strip at top of page**
- Overall plan progress %, # targets on track, # at risk, # initiatives open — so leadership sees status in one glance.

## 3. Data model (new tables)

Two small tables, both scoped by `region_id` and protected by RLS so only users belonging to that region (or Super Admin) can read/write.

- **regional_plans** — one row per plan period for a region.
  - region_id, title, period_type (quarter/year/custom), start_date, end_date, mission_statement, review_notes, status (draft/active/closed), created_by.
- **regional_plan_targets** — many rows per plan; one row per measurable target.
  - plan_id, category (growth / discipleship / events / dcg / finance), metric_key (e.g. `new_members`, `total_income`), target_value (numeric), unit (count / currency / percent), notes.
  - Actual values are not stored — they are computed live from existing tables.
- **regional_plan_initiatives** — many rows per plan; the action items in section G.
  - plan_id, title, description, owner_user_id (nullable), due_date, status, priority.

RLS: regional admins/leaders of `region_id` can CRUD; Super Admins can CRUD across all regions; everyone else denied.

## 4. Wiring

- Add route in `src/App.tsx` under the regional `EnhancedRegionalAdminLayout` block: `<Route path="planning" element={<RegionalPlanning />} />`.
- Add page file `src/pages/admin/regional/Planning.tsx` implementing the tabs above.
- Add hooks `src/hooks/useRegionalPlans.ts` (plans + targets + initiatives CRUD) and `src/hooks/useRegionalPlanActuals.ts` (computes live actuals per metric from existing tables for the selected period).
- Reuse `GlassSection` / `GlassKPICard` / glass dialog standard for consistency with the rest of the regional portal.

## 5. Build order

1. Migration: create the three tables + RLS.
2. Update sidebar labels + add Planning entry + route + header title.
3. Build hooks for plans, targets, initiatives, and live actuals.
4. Build the Plan Management page (period selector, KPI strip, the six target sections, initiatives kanban, review notes).
5. Add empty-state ("Create your first plan") with a glass dialog to spin up a new plan period.

After approval, step 1 (migration) will be run first and confirmed before any code is written, so the generated Supabase types are available.
