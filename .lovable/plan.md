

## Plan: Modernize Regional Admin Pages with Glassmorphism UI + Fix Loading States

This is a large-scale UI modernization of 6 regional admin pages, applying the same glassmorphism design language used in the member/visitor registration forms. Additionally, fixing the DCG and Events pages to show proper loading skeletons instead of premature "No data found" messages.

### Design Pattern

Reuse the existing `GlassSection` pattern from MemberRegister.tsx:
- `rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm` for section wrappers
- Icon + title headers with `bg-primary/10` icon badges
- `bg-background/60` inputs
- Skeleton loading states that match the glass aesthetic
- Gradient accent elements using brand primary/secondary

### Changes by Page

**1. DCG Management (`DcgOverviewTab.tsx`, `DCG.tsx`)**
- Replace plain `Card` wrappers with glass panels
- Fix loading: Show skeleton table rows while `isLoading` is true; only show "No DCGs found" after loading completes with empty data
- Add glass-styled KPI summary cards (Total DCGs, Total Members, Active Groups)
- Glass-styled search bar and action button

**2. Event Management (`Events.tsx`)**
- Apply glass panels to the event listing cards and tabs
- Fix loading: Same pattern — skeleton rows during load, "No events found" only after data resolves empty
- Glass-styled analytics summary cards
- Glass-styled filter/search bar area

**3. Members Management (`Members.tsx`)**
- Wrap member list table in glass panel
- Glass-styled filter row (search, status, type dropdowns)
- Glass KPI cards for member counts
- Proper loading skeletons matching glass aesthetic

**4. Certificates Management (`Certificates.tsx`)**
- Glass panels for template management and issued certificates sections
- Glass-styled tab navigation
- Loading skeletons for certificate tables

**5. Settings (`Settings.tsx`)**
- Glass section wrappers for each settings group (Currency, Notifications, etc.)
- Icon-headed sections matching the registration form pattern

**6. User Roles (`UserRoles.tsx`)**
- Glass KPI cards replacing plain cards
- Glass panel wrapper for tab content
- Consistent icon styling

### Loading State Fix Pattern

For DCG and Events pages, the fix is:
```tsx
// Before (broken):
{filteredDcgs.length > 0 ? (...) : null}
{!isLoading && filteredDcgs.length === 0 && <"No DCGs found">}

// After (correct):
{isLoading ? (
  <SkeletonRows count={3} />
) : filteredDcgs.length > 0 ? (
  filteredDcgs.map(...)
) : (
  <"No DCGs found">
)}
```

The `DcgOverviewTab.tsx` already has skeleton loading but the conditional logic allows "No DCGs found" to flash before data arrives because `isLoading` may briefly be false before the query is enabled (when `regionId` is still undefined). Fix: Also check `!userRegion` in the loading condition.

### Shared GlassSection Component

Extract the `GlassSection` component from `MemberRegister.tsx` into a shared location (`src/components/ui/GlassSection.tsx`) so all 6 pages can import it consistently.

### Files Modified
- `src/components/ui/GlassSection.tsx` — New shared component
- `src/components/admin/regional/dcg/DcgOverviewTab.tsx` — Glass UI + loading fix
- `src/pages/admin/regional/DCG.tsx` — Glass wrapper
- `src/pages/admin/regional/Events.tsx` — Glass UI + loading fix
- `src/pages/admin/regional/Members.tsx` — Glass UI + loading states
- `src/pages/admin/regional/Certificates.tsx` — Glass UI
- `src/pages/admin/regional/Settings.tsx` — Glass sections
- `src/pages/admin/regional/UserRoles.tsx` — Glass KPI cards + panels

### Technical Notes
- No database changes required
- No new dependencies
- All changes are purely presentational + loading state logic fixes
- The glass styling classes (`border-border/40 bg-card/60 backdrop-blur-sm rounded-2xl`) are already defined in the project's CSS

