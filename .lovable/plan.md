I found two important things:

1. The recent login itself is succeeding in Supabase.
2. The user reaches the regional dashboard and dashboard data starts loading, then the app navigates back to `/auth/regional`. That means the failure is after login, inside the portal/session/dashboard path.

Plan to stabilize it:

1. Remove all portal switchers from portal layouts
   - Remove `PortalSwitcher` imports/usages from:
     - `src/components/admin/AdminLayout.tsx` (Super Admin layout)
     - `src/components/admin/DcgAdminLayout.tsx` (DCG layout)
     - `src/components/layout/MemberLayout.tsx` (Member layout)
   - Regional layout currently does not render a portal switcher, so it will remain clean.
   - Keep the standalone `/portal-selector` page for now unless you want it removed later; the immediate request is to eliminate switchers inside the portals.

2. Fix the regional dashboard redirect problem at the guard level
   - Remove the 7-second timeout redirect in `src/components/auth/RegionalSessionRoute.tsx`.
   - That timeout can send a valid user back to `/auth/regional` if dashboard queries or session hydration are slow, making it look like a logout.
   - Replace it with a stable loading state and only redirect when the regional session check has completed and there is truly no authorized regional profile.

3. Make the regional session provider more reliable
   - Update `src/contexts/RegionalSessionContext.tsx` to track explicit states: checking, authorized, unauthorized, and error.
   - Do not swallow profile/region fetch errors silently.
   - Do not sign the user out automatically from the regional session guard; simply redirect only if there is no session or no `profile.region_id`.
   - Add temporary console diagnostics around session/profile/region resolution so we can see if a future redirect is caused by missing session, missing profile, missing region, or a query error.

4. Stop dashboard queries from running before regional auth is ready
   - In `src/pages/admin/regional/Dashboard.tsx`, derive a single `regionalReady = ready && !!userRegion?.id`.
   - Only enable direct dashboard queries (`member_relationships`, special events, discipleship progress) after `regionalReady` and their dependencies are present.
   - The existing hooks already mostly use `enabled: !!regionId`, but the dashboard has direct Supabase queries too; those should be gated consistently.

5. Remove or neutralize stale regional auth/permission paths that can interfere
   - Remove unused imports from `src/App.tsx`: `ProtectedRoute` and `MultiRoleProtectedRoute` are no longer used there.
   - Delete or at least detach stale `src/components/auth/RegionalPermissionRoute.tsx` if it is unused, because it still redirects to `/auth/regional` based on the old global `AuthProvider` permission model.
   - Keep `/admin/regional/*` and `/auth/regional` intact, because the regional portal still needs them.

6. Audit remaining forced logout paths
   - Keep explicit sign-out only on user-clicked logout buttons and real access-denied login checks.
   - Do not call `supabase.auth.signOut()` from passive guards or dashboard/data-loading paths.
   - Leave DCG/Super/Member login access-denied sign-outs unchanged for now unless we see the same issue there, but remove their portal switchers as requested.

Expected result:
- A regional user logs in at `/auth/regional`.
- The app navigates to `/admin/regional/dashboard`.
- The dashboard stays visible while data loads.
- Slow or failing dashboard data does not log the user out or send them back to login.
- The portal switcher is gone from Regional/DCG/Member/Super Admin portal layouts, so cross-portal state cannot interfere while we evaluate the session behavior.