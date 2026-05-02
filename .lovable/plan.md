## Goal

1. Make sure relationships can be **established / edited** everywhere a person is created or managed (public registration, regional/DCG admin registration, profiles in every portal).
2. Make sure **every report and KPI** — not just the regional dashboard — applies the strict child rule and **excludes children from member and visitor counts**.

## Current state (verified)

Relationship capture already exists in:
- `MemberRegister.tsx` (public member sign-up) → persisted by `create-member-registration` edge fn.
- `VisitorRegister.tsx` (public visitor sign-up, single referral relationship) → persisted by `create-visitor` edge fn.
- `RegisterMemberForm.tsx` (regional admin "Register Member") → also reused by DCG `RegisterNewMemberDialog`.
- `FamilyRelationshipsSection` → embedded in **regional** `MemberProfile` only.

Strict child rule (`isChildMember`: age < 16 AND has an adult relationship) is applied in:
- `Dashboard.tsx`, `MemberKPICards.tsx`, `MembersTab.tsx`, `Members.tsx` (regional + super), attendance trend.

It is **NOT** applied in these reporting surfaces, so children are still counted as members/visitors there:
- `useReports.ts` (regional Reports page) — uses `count(*)` from `members`.
- `useSuperAdminReports.ts` (super admin Dashboard + Reports) — `.eq('member_type','member')` etc., no child exclusion.
- `useEventReport.ts` (per-event report) — counts attendees by `member_type` only.
- `useRegionalDcgReports.ts`, `useRegionalData.ts`, `DcgReportsTab`, `DcgOverviewTab`, `DCGTab`, `pages/dcg/Dashboard.tsx` — all DCG member counts include children.
- `useRegionStats.tsx` — distinct member count includes children.

Gaps in relationship management UI:
- Super-admin `MemberProfile.tsx` has no `FamilyRelationshipsSection`.
- DCG portal member detail / profile views are read-only and have no relationship section.
- Visitor profile (regional) has no way to add additional family relationships after the initial referral.
- DCG `RegisterNewMemberDialog` already inherits the regional form so it gets the relationship UI for free — verify it's visible inside the dialog scroll area.

## Plan

### 1. Surface relationship UI everywhere a profile is viewed

- Add `<FamilyRelationshipsSection memberId={member.id} />` to:
  - `src/pages/admin/super/MemberProfile.tsx` (full edit access).
  - DCG portal member detail screens (`src/pages/dcg/...` member view) in **read-only** mode (`readOnly` prop already supported).
- Confirm the section also renders for visitor records (the underlying table is `members` with `member_type='visitor'`, so the same component works) — explicitly include it on the visitor profile view in regional + super portals.
- Verify it is visible (not clipped) inside `RegisterNewMemberDialog` (the DCG registration dialog) — the dialog already has `overflow-y-auto`, no change expected, just QA.

### 2. Allow visitor self-registration to capture richer relationships (optional polish)

`VisitorRegister.tsx` currently captures one `referral_relationship_type` shared by all referral members. Keep this as-is (it already writes to `member_relationships`) but document the limitation. No code change unless you want per-member relationship types — can be added later.

### 3. Centralise the child-exclusion helper

Add a small helper alongside `childUtils.ts`:

```ts
// returns Set<memberId> of children given a list of members + relationships
export const buildChildrenSet = (
  members: { id: string; profiles?: { date_of_birth?: string | null } | null }[],
  relationships: { member_id: string; related_member_id: string }[]
): Set<string>
```

This avoids the same boilerplate (build `adultDobLookup`, loop) in every report.

### 4. Apply strict child exclusion to every remaining KPI / report

For each surface listed below: fetch `member_relationships` for the relevant scope, build the children set, then **subtract children from member and visitor counts** and add a separate "Children" figure where appropriate.

| File | Change |
|---|---|
| `src/hooks/useReports.ts` | Fetch members (id, member_type, dob) + relationships for region. Compute `totalMembers`, `totalVisitors`, `totalChildren` excluding children from the first two. |
| `src/hooks/useSuperAdminReports.ts` | Same approach but globally and per-region (loop builds region-scoped children sets). Update `totalMembers`, `previousMemberCount`, `activePercentage`, region rows. |
| `src/hooks/useEventReport.ts` | Fetch `member_relationships` for the attendees, exclude children from `membersCount` / `visitorsCount`, expose `childrenCount`. |
| `src/hooks/useRegionalDcgReports.ts`, `useRegionalData.ts` (DCG `member_count`), `useDcgMembers.ts` aggregations | Subtract children from per-DCG member counts; expose `childrenCount` separately. |
| `src/hooks/useRegionStats.tsx` | Exclude children from the distinct-member tally. |
| `src/pages/dcg/Dashboard.tsx` | Recompute `totalMembers` (DCG members) excluding children; show children separately. |
| `DcgOverviewTab.tsx`, `DcgReportsTab.tsx`, `DCGTab.tsx`, `super/Dashboard.tsx`, `super/Reports.tsx`, `regional/Reports.tsx` | Consume the corrected counts; add a "Children" column / KPI tile where useful. |

### 5. Memory + docs

Update `mem://logic/child-member-categorization` to reaffirm the rule applies to **all** KPIs (regional, super, DCG, event-level, regional reports).

## Out of scope

- Backfilling historical relationships — only newly-registered children with a recorded adult relationship will appear in the Children KPI. Existing under-16 members without relationships will continue to be excluded from Members / Visitors **and** from Children until an admin records the relationship in their profile.
- Per-referral-member relationship type on `VisitorRegister` (current single-type capture is preserved).

## Files expected to change

Hooks: `useReports.ts`, `useSuperAdminReports.ts`, `useEventReport.ts`, `useRegionalDcgReports.ts`, `useRegionalData.ts`, `useDcgMembers.ts`, `useRegionStats.tsx`.
Pages/Components: `super/MemberProfile.tsx`, regional + super visitor profiles, DCG portal member detail, `pages/dcg/Dashboard.tsx`, `DcgOverviewTab.tsx`, `DcgReportsTab.tsx`, `DCGTab.tsx`, `super/Dashboard.tsx`, `super/Reports.tsx`, `regional/Reports.tsx`.
Utils: `src/utils/childUtils.ts` (add `buildChildrenSet` helper).
Memory: `mem://logic/child-member-categorization`, `mem://index.md`.
