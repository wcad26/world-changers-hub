I found this is not the login page itself. The regional portal is becoming unstable after navigation/refetch, then Lovable’s blank-page detector reloads the preview. That matches the console message `RESET_BLANK_CHECK` and the behavior you described: click inside regional portal -> blank -> reloads back to dashboard.

Likely causes in the current code:
- Some regional pages still use stale region lookup logic based on `user.user_metadata.region_id`, but the new regional session only provides `{ id, email }`. This affects pages like Settings and the Regional Website Information form.
- The regional session provider does not subscribe to auth/session changes, so after token refresh or delayed session restoration, pages can run authenticated queries at the wrong time.
- The regional dashboard runs many heavy queries and chart computations without a route-level error boundary. Any runtime/render/query edge case can blank the whole portal, causing the preview to auto-reload.
- React Query is using default global behavior, so stale queries can refetch on focus/reconnect after minutes and destabilize the page.

Plan to fix it:

1. Stabilize regional auth readiness
   - Update `RegionalSessionContext` to expose explicit status: `checking`, `authorized`, `unauthorized`, `error`.
   - Listen to Supabase auth changes safely, including token refresh and sign-out, but do not perform heavy database fetches directly inside the auth callback.
   - Keep regional users authorized as long as session + `profile.region_id` are valid.
   - Do not redirect on temporary region/profile fetch errors; show a recoverable error state instead.

2. Fix stale regional page dependencies
   - Replace all regional portal usage of `user.user_metadata.region_id` with the canonical regional session/profile region id.
   - Specifically fix:
     - `src/pages/admin/regional/Settings.tsx`
     - `src/components/admin/regional/RegionalBranchForm.tsx`
   - Ensure Settings and Branch/Website Information pages use `useAuth().userRegion` or `useRegionalSession().region`, not metadata.

3. Add a regional portal error boundary
   - Wrap the regional layout/dashboard routes in a dedicated error boundary.
   - If a page crashes, show a clear “Regional page failed to load” panel with Retry and Go to Dashboard buttons instead of a blank screen.
   - This prevents the entire app from going blank and stops the automatic reload loop.

4. Reduce dashboard refetch/reload pressure
   - Add safe React Query defaults in `App.tsx`:
     - disable refetch-on-window-focus for portal data
     - set a reasonable `staleTime`
     - reduce automatic retries for protected queries
   - Add explicit `enabled` gates to regional dashboard direct queries so they only run after regional auth is fully authorized and `region.id` exists.
   - Make dashboard query keys stable and avoid mutating arrays inside query keys.

5. Harden regional dashboard rendering
   - Add error handling for the dashboard’s direct Supabase queries.
   - Disable Recharts initial animations on the dashboard charts to reduce render spikes.
   - If a dashboard dataset fails, show an inline error/loading state instead of allowing a render crash.

6. Audit and remove remaining passive logout/reload paths
   - Search all regional portal paths for `signOut`, `window.location`, `location.reload`, and redirect logic.
   - Keep logout only on explicit user-clicked Logout.
   - Remove or isolate stale `RegionalPermissionRoute.tsx` if it is no longer used.

Expected result:
- A regional user can navigate between Dashboard, Members, Events, DCG, Finances, Reports, Settings, and Website Information without the page blanking.
- Token refresh or delayed Supabase session restoration will not force a dashboard reload.
- If a page has a real rendering/data error, the portal shows a controlled error panel instead of going blank.
- The regional login remains a single shared login page for all regions.

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>