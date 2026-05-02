# Strict child rule — completed rollout

## Done
- `buildChildrenSet` helper in `src/utils/childUtils.ts` (age<16 AND adult relationship).
- Reports: `useReports`, `useSuperAdminReports`, `useEventReport`, `useRegionalDcgReports` (regional + global) all exclude children from member/visitor counts and expose `totalChildren` / `childrenCount`.
- DCG layer: `useRegionalData::useRegionalDCGs` member_count now excludes children. `pages/dcg/Dashboard.tsx` shows a "Children" KPI card and excludes them from active members.
- Relationship UI present on regional, super, and DCG (read-only) MemberProfile screens.
- Super Admin Dashboard exposes a "Children" KPI tile; Regional Reports dashboard shows a Children card.

## Out of scope
- Backfilling historical relationships.
- Per-referral-member relationship type on `VisitorRegister`.
