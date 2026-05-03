I found an important clue: the current screen is not a true empty white crash. The regional shell is rendering, but the dashboard is stuck at `Loading your region… / Your session is still loading`. That means the login succeeded, then the post-login regional context did not supply `user` + `region` to the dashboard. The remaining blockers are not the password login itself; they are the regional startup/context flow and role-management dependencies that still exist around the regional portal.

Plan to rebuild this aggressively:

1. Replace the regional post-login bootstrap
- Stop relying on `get_my_regional_context()` as the only source of `profile` and `region`.
- Rebuild `RegionalSessionContext` into a simpler regional-only startup:
  - read the Supabase session once;
  - if a session user exists, set `user` immediately so the dashboard no longer says “session is still loading”;
  - load profile/region with a fallback chain:
    1. profile.region_id if available;
    2. the user’s `members.region_id` as the regional membership source;
    3. role tables only as a last resort, or remove this fallback entirely if possible.
- Never call automatic `signOut()` during regional startup.
- Never redirect to `/auth/regional` from the regional portal startup.
- Add debug logging for session/profile/member/region resolution so we can see exactly which step succeeds or fails.

2. Simplify regional login page
- Keep only email/password sign-in and navigation to `/admin/regional/dashboard`.
- Remove the post-login `get_my_regional_context()` pre-warm call because it is another post-login function that can fail or race.
- Do not check roles, regional permissions, or call any sign-out after successful login.

3. Remove regional role management from the regional portal UI
- Remove the Access Management page from regional routes and sidebar.
- Remove the `UserRoles` route/page from the regional portal.
- Stop importing/using `REGIONAL_PAGES` from the permission catalog to build the regional sidebar; replace it with a plain static menu that has no permission keys.
- Leave Super Admin role-management code alone unless it directly affects regional login.

4. Remove role/permission hooks from regional startup paths
- Change `useUserPermissions` regional permission checks to no-op read-only helpers, or remove any remaining regional portal usage.
- Change `useMembers` so it no longer batch-fetches `user_roles`; this is a remaining role-table query that runs on core regional pages like Dashboard and Members.
- Remove unused `RoleBadge` import from the regional Members page.
- Keep member type/status display, because those are membership data, not portal access roles.

5. Remove regional-role writes from regional DCG dialogs
- In `AddDcgDialog` and `EditDcgDialog`, remove writes to `user_roles` for `dcg_admin` when assigning/changing leaders.
- Keep `dcg_user_sessions` updates because that is DCG session data, not regional portal access gating.

6. Remove backend regional permission function from the login path
- Add a migration to neutralize `has_regional_permission()` so it always returns true and no longer reads `regional_user_roles` / `regional_roles`.
- Keep the tables for now to avoid breaking Super Admin pages immediately, but ensure regional portal access does not depend on them.
- Optionally drop the `get_my_regional_context()` frontend dependency rather than deleting the function, because deleting it may break old deployed clients during transition.

7. Make dashboard resilient even if region takes time
- If `user` is present but `region` is not yet resolved, show a recovery panel that says the account could not resolve a region and includes Retry.
- Do not let this state cause a logout or a blank page.
- Ensure every regional page that currently blocks on `!userRegion` either shows a bounded recovery message or can render an empty state, rather than an infinite skeleton.

8. Validate after implementation
- Search again for regional references to `regional_user_roles`, `regional_roles`, `has_regional_permission`, `PermissionGate`, `useHasPermission`, and `/auth/regional` redirects.
- Confirm the regional route no longer contains role/access-management gates.
- Check console/network for the next remaining blocker after login.

Expected result:
- Any authenticated account that has a regional membership/profile region can enter the regional portal.
- No regional role-management table or permission function blocks page rendering.
- No automatic post-login sign-out happens from the regional portal.
- If region resolution fails, the UI shows a clear recovery state instead of a blank screen/logout loop.