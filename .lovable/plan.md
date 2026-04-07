## Fix DCG Portal: Layout, Members, Events, Finances

### Issues Identified

1. **Desktop sidebar scrolls with content** -- needs `fixed` or `sticky` positioning with `h-screen overflow-y-auto`
2. **Portal Switcher and Sign Out in sidebar footer** -- move to the left menu panel just after the reports button. this should as well update for the tablet and mobile views.
3. **Members table has Actions column** -- remove it, make rows clickable to member profile
4. **Members need RLS access** -- DCG admins need to read member profile pages (route uses `RegionalAdminLayout`, need a DCG-compatible member profile page or route)
5. **Mobile member card**: type badge on wrong position -- move to top-right (same row as name), remove delete button
6. **Members page buttons hidden under header** on mobile/tablet
7. **Events page shows "DCG information not found"** -- `userDcg` is null during initial auth loading; needs loading state instead of error
8. **Events tablet view not optimized** -- tables overflow on tablet
9. **Regional events should NOT have actions column** -- DCG leaders cannot edit regional events
10. **Attendance dialog overflows mobile** -- needs max-height, ScrollArea, remove Member ID column
11. **Finances page shows "DCG information not found"** same loading race condition
12. **Finance page buttons hidden on tablet**
13. **Attendance dialog name order** -- currently first-last, should be last-first

### Plan

#### 1. `DcgAdminLayout.tsx` -- Fix desktop sidebar + move Portal Switcher/Sign Out

- Add `fixed top-0 left-0 h-screen overflow-y-auto` to the sidebar so it stays fixed while content scrolls
- Add `ml-64` (or `ml-16` when collapsed) to the main content div
- Remove PortalSwitcher and Sign Out from sidebar footer
- Add them to the left menu panel under the reports button and update the table and mobile veiws to no more have the footer section again.

#### 2. `Members.tsx` -- Remove Actions, make clickable, fix mobile card, fix header overlap

- Remove the Actions column and `<Trash2>` button from desktop table
- Make each `<TableRow>` clickable with `onClick={() => navigate(\`/dcg/member/{dcgMember.member_id})}`and`cursor-pointer`
- Mobile card: move `<Badge>` to the right side of the name row, remove the delete button
- Make mobile cards clickable too
- Fix header section: the buttons are `hidden lg:block` for the title but buttons always show -- ensure buttons are visible and not overlapped by the fixed header

#### 3. DCG Member Profile Route

- Create a simple route `/dcg/member/:memberId` that renders a read-only member profile page within `DcgAdminLayout`
- Reuse data from `useMembers` or create a lightweight member view
- No RLS changes needed if DCG admins already have SELECT on `members` and `profiles` in their region (they do per existing policies)

#### 4. `Events.tsx` -- Fix loading state, tablet optimization, regional events no actions

- Replace the `if (!userDcg)` early return with a loading spinner when `loading` is true from `useAuth`
- Only show error if auth is done AND `userDcg` is null
- For regional events table: create a separate `renderRegionalEventsTable` that has no Actions column (no delete, no dropdown menu)
- Regional event cards on mobile: only show "Record Attendance" button, no delete
- Add `useIsTablet` and use card view for both mobile AND tablet

#### 5. `EventAttendanceDialog.tsx` -- Fix mobile overflow, remove Member ID

- Add `max-h-[85vh]` to DialogContent
- Wrap the content in ScrollArea
- Remove the "Member ID" column from the table
- Fix name order: `${last_name} ${first_name}`
- On mobile, use a simpler card-based list instead of table

#### 6. `Finances.tsx` -- Fix loading state, fix button visibility on tablet

- Same loading state fix as Events: show spinner during auth loading
- Ensure Record Income/Record Expense buttons are visible on tablet (not hidden under header)

### Files Changed


| File                                                 | Change                                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/components/admin/DcgAdminLayout.tsx`            | Fix sidebar to fixed position, move Portal Switcher + Sign Out to header                  |
| `src/pages/dcg/Members.tsx`                          | Remove Actions column, make rows clickable, fix mobile card layout, fix button visibility |
| `src/pages/dcg/Events.tsx`                           | Fix loading state, separate regional events renderer (no actions), tablet card view       |
| `src/components/admin/dcg/EventAttendanceDialog.tsx` | Constrain to viewport, remove Member ID, fix name order, mobile layout                    |
| `src/pages/dcg/Finances.tsx`                         | Fix loading state, fix button visibility                                                  |
| `src/App.tsx`                                        | Add `/dcg/member/:memberId` route                                                         |
| `src/pages/dcg/MemberProfile.tsx`                    | New -- read-only member profile page for DCG portal                                       |


### No Database Changes Required

DCG admins already have SELECT policies on `members` and `profiles` for their region.