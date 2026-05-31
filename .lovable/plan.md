I found two likely crisis sources:

1. The last certificate migration re-created public read storage policies but did not drop/recreate all certificate storage write policies in one final consolidated migration, leaving room for duplicate/stale policy behavior.
2. The regional portal still depends on session/bootstrap hydration for `userRegion`; when that fails or lags, dashboard/certificate queries can start with missing context and render a blank/error state even though route guards are pass-through.

Plan:

1. Consolidate certificate access rules
   - Add one final migration that drops every certificate-related table and storage policy by name.
   - Recreate certificate table policies so any signed-in user has full control over `certificates` and `certificate_templates`.
   - Recreate storage policies so any signed-in user can upload, replace, and delete files in both `certificates` and `certificate-templates`; public can read both buckets.
   - Keep the needed Data API grants for `authenticated`, `anon` reads, and `service_role`.

2. Make regional session fully non-blocking
   - Update the regional session provider so it never returns `checking` after mount and never clears portal state unless the user explicitly clicks logout.
   - If no region is available yet, keep rendering the portal shell instead of depending on a region bootstrap.
   - Preserve the existing pass-through route guards.

3. Prevent certificate/dashboard query failures from blanking the portal
   - Harden certificate hooks so RLS or missing-region errors return safe empty arrays with console warnings instead of throwing into React Query/error boundaries.
   - For regional certificate pages, allow queries to render even while region context is still hydrating.

4. Validate
   - Re-check active policies for certificate tables and storage after migration.
   - Check console/network/dev-server logs for blank-screen or auth errors after the changes.