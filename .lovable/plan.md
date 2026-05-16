## Rebuild DCG Members Page

Rewrite `src/pages/dcg/Members.tsx` to mirror the Regional Members page (`src/pages/admin/regional/Members.tsx`) but scoped to the current DCG. Keep the "Add Existing" + "Register New" buttons unique to DCG.

### Layout

1. **4 Glass KPI cards** (replaces the regional 5-card strip) — `grid gap-4 md:grid-cols-4`, same glass styling as `MemberKPICards.tsx`:
   - **Total** — sum of members + children + regular visitors in the DCG
   - **Members** — adult, non-visitor members
   - **Children** — strict child rule (`buildChildrenSet`: age <16 AND linked to ≥1 adult via relationships)
   - **Regular Visitors** — `member_type === 'visitor'` AND NOT linked to a special event
   
   Each card shows: count, `Active: X%` subtitle, and growth `+X% last 30 days` from `join_date`. Active % uses last 5 DCG attendance events (mirrors regional logic but reads `attendance_events` where `dcg_id = userDcg.id`).

2. **Member Directory panel** — identical glass card to regional:
   - Header: icon + "Member Directory" / "A list of all members in this DCG"
   - Right side: `Add Existing` (outline) + `Register New` (primary) buttons that open existing `AddExistingMemberDialog` / `RegisterNewMemberDialog`
   - Filter row: search input + Status select + Type select (All / Member / Regular Visitors / Children) + Export CSV button
   - Table columns: Name, Address (md+), Phone (sm+), Role (Member/Visitor badge), Status, Join Date (lg+), Actions (View / Remove from DCG dropdown)
   - Row click → `/dcg/member/{memberId}` (existing route)

### Data flow

- Source: existing `useDcgMembers(userDcg.id)` → returns `dcg_members` joined with `members` + `profiles`. Map to a flat `MemberWithProfile[]`-shaped array (extract `dcgMember.members`) so the regional-style filters/table work unchanged.
- Relationships: call `fetchMemberRelationshipsForMembers` on the flattened member ids for `buildChildrenSet`.
- Special-event visitor exclusion: fetch `events.is_special` for the visitor `rated_event_id`s (same pattern as regional). Special-event visitors are excluded from the Regular Visitors count and from the Total (per the user's requested KPI scope).
- DCG attendance events for Active %: `attendance_events` where `dcg_id = userDcg.id`, last 5 by date.
- Remove action: reuse `useRemoveMemberFromDcg`.

### Removed from current page

- The simple search-only card layout.
- Inline role-change select on each row (move to a future edit dialog if needed; keep out of this rewrite to match regional table layout).
- Mobile-only card list (regional uses responsive table with hidden columns at breakpoints — same here).

### Files

- **Rewrite**: `src/pages/dcg/Members.tsx`
- **New** (optional helper): `src/components/admin/dcg/DcgMemberKPICards.tsx` — slimmed copy of `MemberKPICards.tsx` with 4 cards and DCG-scoped attendance query. Keeps the existing regional component untouched.
- No backend / schema changes.

### Notes

- Reuse existing dialogs: `AddExistingMemberDialog`, `RegisterNewMemberDialog`.
- Keep the `px-[10px]` wrapper class the user previously added.
- Follow the "Last Name First Name" display convention (already in current file).
