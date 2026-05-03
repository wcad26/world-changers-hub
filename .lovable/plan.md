I found a new concrete symptom: the regional dashboard is rendering, but the regional session context is logging `ready. user = none`. That means the dashboard is no longer blocked by roles, but the app still fails to see the logged-in Supabase user after navigation. Because `userRegion` stays null, every region-scoped query is disabled, so the dashboard shows no data. The blank page later is likely a downstream crash/reload from this unstable post-login session state, not from the dashboard cards themselves.

Plan to resolve it completely:

1. Replace the regional session provider with a login-owned boot process
   - Stop relying on repeated `supabase.auth.getSession()` polling after navigation as the primary source of truth.
   - On successful regional login, persist a small non-sensitive bootstrap record in session storage containing only `userId`, `email`, and `regionId` resolved from the database.
   - The regional portal will read this bootstrap immediately on page load so it can set `user` and `region` before any dashboard query runs.
   - Supabase session remains the real auth mechanism for RLS; the bootstrap only prevents the UI from losing the user/region during client-side navigation races.

2. Resolve region at login using database-backed membership, not role management
   - In `RegionalAuth.tsx`, after `signInWithPassword`, fetch the user’s profile and/or member record to resolve `region_id`.
   - No role checks, no permission checks, no `user_roles` or `regional_user_roles` reads.
   - If profile region is missing, fall back to the members table.
   - Navigate only after this regional bootstrap state is ready.

3. Make the regional session provider tolerant and non-destructive
   - Rework `RegionalSessionContext.tsx` so it initializes from the regional bootstrap record first, then hydrates from Supabase auth in the background.
   - Remove the remaining `onAuthStateChange` dependency from the critical boot path, or make it purely additive and deferred.
   - Never clear the regional UI state because of a transient null session unless the user explicitly clicks Logout.
   - Keep `retry()` but make it retry region/profile resolution from both Supabase session and bootstrap.

4. Fix the dashboard hooks that still depend on delayed context
   - Ensure the dashboard’s data hooks receive the resolved `regionId` directly from the rebuilt regional context.
   - Keep role management removed.
   - Add safe error handling so a failed query does not blank the page.
   - When a region is resolved, the existing database data for WCA DOUALA should load: there are 382 members, 51 events, 27 financial transactions, 3 discipleship relationships, and attendance records in the database.

5. Add a regional-only diagnostic fallback instead of a blank page
   - If the region still cannot be resolved, show a clear panel with:
     - current auth status
     - detected email/user id when available
     - whether bootstrap exists
     - a Retry button
     - a Logout button
   - This prevents the blank screen while giving us useful evidence if anything else remains.

6. Remove or bypass remaining regional access-management code paths from the startup path
   - Confirm the regional dashboard, layout, and shared hooks used by it no longer query `user_roles`, `regional_user_roles`, or permission hooks during initial render.
   - Leave old Access Management files unused unless deleting them is safe, but ensure no regional route imports or executes them.

7. Database/RLS follow-up if needed
   - If dashboard queries still return empty after region is resolved, add a migration to loosen regional RLS from `has_role(auth.uid(), 'regional_admin')` to region membership checks such as `user_belongs_to_region(auth.uid(), region_id)` for regional portal tables.
   - This keeps access restricted to the user’s own region while removing role-management as a blocker.

Expected result:
- After login, the sidebar should show `WCA DOUALA` instead of `PORTAL`.
- The dashboard should immediately know the region and enable all region-scoped data queries.
- Regional dashboard cards should display the existing member/event/finance data instead of empty placeholders.
- A transient missing Supabase session after navigation should no longer blank the page or force logout.