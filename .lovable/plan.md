Eliminate the remaining preview-only failed reload session by removing the last auth initialization race and the remaining Fast Refresh invalidation point in the auth layer.

### What is still causing the failed reloads

1. `src/contexts/AuthContext.tsx` is still mounting repeatedly in preview
   - The console snapshot shows repeated `Auth: provider mounted — installing single auth listener` entries.
   - That means the provider is still being torn down and recreated in the preview iframe.

2. `src/contexts/AuthContext.tsx` still exports both the provider and the hook
   - `src/App.tsx` imports `AuthProvider` from `@/contexts/AuthContext`.
   - `src/hooks/useAuth.tsx` re-exports `useAuth` from `@/contexts/AuthContext`.
   - This mixed module pattern is a known Fast Refresh invalidation trigger in Vite/React preview mode, which can force remounts and session re-probing.

3. Auth initialization still treats every auth event with a session as a fresh data-fetch trigger
   - In `AuthContext.tsx`, `onAuthStateChange` schedules `fetchUserData` for any event with `session?.user`, including token refresh and initial restore.
   - During preview remounts or token churn, that keeps re-running protected queries during hydration.

4. Route guards are waiting on `loading/initialized`, but query hooks outside auth readiness can still start too early after a failed hot reload
   - The current app relies on `loading` and `initialized`, but there is no dedicated auth-readiness contract exposed for components/guards.
   - This is exactly the class of failure that produces preview-only “failed reload session” behavior.

### Implementation plan

1. Split the auth module so the context file is Fast Refresh-safe
   - Keep `AuthProvider` and `AuthContext` in `src/contexts/AuthContext.tsx`.
   - Move the `useAuth` hook implementation into `src/hooks/useAuth.tsx`.
   - This removes the mixed provider+hook export pattern that is still destabilizing preview remount behavior.

2. Introduce an explicit auth-ready state in the provider
   - Add a dedicated readiness flag that only becomes true after the initial `getSession()` restore path finishes.
   - Keep auth listener side effects non-blocking.
   - Distinguish initial restore from later auth events so the provider does not behave like every refresh is a fresh login.

3. Tighten auth event handling to avoid redundant re-fetch churn
   - Only trigger the full `fetchUserData` pipeline when it is truly needed:
     - initial authenticated restore
     - actual user change
     - explicit sign-in
     - explicit user update
   - Avoid refetching everything on routine token refresh unless the identity changed or required data is missing.

4. Expose auth readiness through the shared hook and align guards to it
   - Update `ProtectedRoute`, `MultiRoleProtectedRoute`, `MemberProtectedRoute`, `DcgProtectedRoute`, and `RegionalPermissionRoute` to depend on the explicit auth-ready contract instead of only inferred loading state.
   - Prevent guards from participating in transient redirect/reload races during preview hydration.

5. Keep portal login pages isolated but stop accidental post-login race windows
   - Preserve the current isolated login-page design.
   - Ensure their success flows rely on the stabilized provider/guard readiness instead of winning a race against preview reload timing.

### Files to update

- `src/contexts/AuthContext.tsx`
- `src/hooks/useAuth.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/auth/MultiRoleProtectedRoute.tsx`
- `src/components/auth/MemberProtectedRoute.tsx`
- `src/components/auth/DcgProtectedRoute.tsx`
- `src/components/auth/RegionalPermissionRoute.tsx`

### Technical details

- Keep `onAuthStateChange` callback non-awaited.
- Use the provider as the single source of truth for:
  - session restore
  - auth readiness
  - user-data hydration
- Prevent Fast Refresh from remounting the auth root by separating component exports from hook exports.
- Preserve current portal isolation; do not re-link portal login pages.

### Expected result

- Preview no longer enters failed reload session state after auth changes.
- The auth provider stops remounting on every preview refresh cycle.
- Login pages remain separated by portal.
- Guards wait for a real auth-ready state before redirecting or querying protected data.