

## Plan: Strict Permission Enforcement + Remove Locations & Fundraising Pages

### Part A — Fix permission bypass (sidebar + routes)

**Root cause:** The base `regional_admin` role is being treated as a full-access bypass in 3 places, so any user holding it (used as a login token) sees every menu item and can reach every URL — regardless of their granular role.

**Rule going forward:** `regional_admin` is only a login token. Only `super_admin` keeps the unconditional bypass. Granular `regional_user_roles` permissions decide what's visible/reachable. True region owners already have the auto-created `Regional Admin` granular role with every permission, so they keep full access through the normal path.

**Files to modify:**
- `src/components/admin/EnhancedRegionalAdminLayout.tsx` — `isPrivileged` becomes `hasRole('super_admin')` only.
- `src/components/auth/RegionalPermissionRoute.tsx` — remove the `regional_admin` bypass; only super admins skip.
- `src/hooks/useAuth.tsx` — `hasRegionalPermission` drops the `regional_admin` shortcut, keeps the `super_admin` one.

### Part B — Permanently remove Locations and Fundraising

Fundraising is now handled inside the Finance page, and locations are handled in the DCG portal. Both standalone regional pages are removed completely.

**Sidebar config — `src/config/regionalPermissions.ts`:**
- Remove `locations_view` and `fundraising_view` from `REGIONAL_PAGES`.
- Remove `locations_*` and `fundraising_*` keys from `PERMISSION_CATALOG` so they never appear in Create/Edit Role dialogs again.

**Routes — `src/App.tsx`:**
- Delete the `/admin/regional/locations` route and its `RegionalPermissionRoute` wrapper.
- Delete the `/admin/regional/fundraising` route and its wrapper.
- Remove the imports for `RegionalLocations` and `RegionalFundraising`.

**Pages deleted:**
- `src/pages/admin/regional/Locations.tsx`
- `src/pages/admin/regional/Fundraising.tsx`

**Supporting components — only delete the ones used exclusively by these pages.** I'll grep each file before deleting to be safe. Components I'll check (and delete if no other consumer):
- `src/components/admin/regional/CreateFundraisingCampaignDialog.tsx`
- `src/components/admin/regional/CampaignDetailsDialog.tsx`
- `src/components/admin/regional/FundraisingAnalyticsChart.tsx`
- `src/hooks/useFundraisingCampaigns.ts`
- `src/hooks/useLocations.ts` (only delete if not used by DCG portal or public site — `usePublicLocations.ts` stays)

**Database cleanup migration:**
- Strip `locations_*` and `fundraising_*` keys from every row in `regional_roles.permissions` so old role definitions don't carry dead keys.

### Expected outcome

- Sidebar for `shiynsayenyuy@gmail.com` (Children Ministry): exactly 4 items — Dashboard, Member Management, Event Management, DCG Management.
- Sidebar for region owners: every remaining item, no Locations, no Fundraising.
- Typing `/admin/regional/locations` or `/admin/regional/fundraising` → 404 (NotFound).
- Create/Edit Role dialogs no longer list Locations or Fundraising permissions.
- Super admins still see everything that exists.

### QA checklist
1. Log in as Children Ministry user → 4 sidebar items, all other URLs redirect away.
2. Log in as a region owner → full sidebar minus Locations/Fundraising; no broken links.
3. Open Create Role dialog → Locations and Fundraising rows are gone.
4. Hit `/admin/regional/locations` and `/admin/regional/fundraising` directly → NotFound.
5. Confirm the Finance page still works and the DCG portal's location features still work.

