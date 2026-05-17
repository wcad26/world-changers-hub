I found the current portal guards still redirect to login when `getSession()` returns no session. Since this happens only in the Lovable development preview and production is fine, the fix should avoid treating preview-session restore failures as a reason to log users out.

Plan:

1. Replace portal route guards with pass-through loading/error boundaries
   - Make `DcgSessionRoute`, `SuperAdminSessionRoute`, and `MemberProtectedRoute` stop navigating to login automatically.
   - They will render the portal immediately under the existing layout and rely on page/query loading states and Supabase RLS for real access control.
   - Keep `RegionalSessionRoute` as pass-through.

2. Make `AuthProvider` preview-resilient
   - Stop clearing the current user on transient `SIGNED_OUT` / null-session events unless the user clicked an explicit logout button.
   - Keep `loading/authReady/initialized` stable so dashboards show loaders instead of blanking.
   - Continue loading profile, region, member, and DCG context in the background as best-effort data, not as a gate for entering the portal.

3. Add lightweight login bootstrap for all portals
   - After successful sign-in, write a small session bootstrap to `sessionStorage` for DCG, Member, Super Admin, and Regional portals.
   - Use it to keep the UI authenticated in the development preview if Supabase session restore is delayed or blocked.
   - Clear it only when the user explicitly logs out.

4. Preserve loading states instead of redirecting
   - Update shared auth fallback values so portal pages understand “still loading” rather than “not authenticated”.
   - Avoid blank screens by showing existing loading UI while protected data queries are pending.

5. Validate the dev environment path
   - Check Vite/dev logs after changes.
   - Confirm no portal guard contains automatic `<Navigate>` back to login.
   - Confirm the only remaining sign-out flows are explicit logout buttons.