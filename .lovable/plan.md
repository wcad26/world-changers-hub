I found the remaining reload behavior is very likely caused by the regional session provider being mounted inside the `/admin/regional` route element. When moving between regional pages, the route tree can remount the regional guard/provider, temporarily re-check auth/profile/region. If that check races or a page renders blank/crashes during navigation, Lovable’s blank-page detector reloads the preview, which sends the app back to the dashboard. There are also still hard navigation paths (`window.location.assign/replace`) that can cause full page reloads instead of SPA navigation.

Plan to eliminate the reloads:

1. Keep the regional session mounted globally
   - Move `RegionalSessionProvider` out of `RegionalSessionRoute` and wrap the whole regional route group once in `App.tsx`.
   - This makes the regional session stable while moving between Dashboard, Certificates, Members, Events, DCG, Settings, etc.
   - Regional page navigation will no longer recreate the session provider or briefly drop auth/region state.

2. Replace hard reload/navigation with SPA navigation
   - Remove `window.location.replace('/auth/regional')` from the regional sign-out flow and use React Router navigation instead.
   - Replace `window.location.assign('/admin/regional/dashboard')` in the regional error boundary with SPA navigation or a safe link/button.
   - Keep sign-out only for explicit logout clicks.

3. Make the regional guard non-destructive
   - Update the guard to redirect to `/auth/regional` only when status is explicitly `unauthorized`.
   - If status is `error`, show a recoverable “session could not be checked” panel with Retry and Login buttons instead of blanking or redirecting.
   - Keep authorized users inside the portal even if a non-critical region read fails.

4. Add page-level crash isolation for regional pages
   - Key the error boundary by pathname so if one page fails, only that page shows an error panel.
   - Navigation to another regional page should reset the boundary automatically.
   - This prevents one bad page (for example Certificates) from blanking the whole portal and triggering Lovable’s preview reload.

5. Harden regional data hooks against page-transition races
   - Ensure regional hooks used by all pages only run after `regionId` exists.
   - Add safe defaults/empty arrays and inline error states for certificates, members, events, attendance, reports, finances, communications, and DCG pages.
   - Avoid throwing render-breaking query errors where the page can display an error message instead.

6. Remove remaining dashboard/login redirect sources from regional navigation
   - Remove or stop using legacy `RegionalPermissionRoute.tsx`, since it can still redirect to login/dashboard based on the global auth context.
   - Keep `/admin/regional` redirecting to dashboard only when the user intentionally opens the base regional URL, not when navigating between child pages.

Expected result:
- Moving between any regional portal page will be normal client-side navigation, not a reload.
- The regional session will not be re-created on every page change.
- A page-specific error will show an error panel instead of a blank screen.
- The portal will not redirect to dashboard/login unless the user explicitly logs out or truly has no session.