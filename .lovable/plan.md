## Root cause

The runtime error from the console is unambiguous:

```
Error: useRegionalSession must be used within a <RegionalSessionProvider>
  at ShellInner (RegionalAdminShell.tsx:50)
  at RegionalErrorBoundary
  at RegionalSessionRoute
  at RenderedRoute
  at Routes               ← inner <Routes>
  at RegionalSessionProvider
  at RenderedRoute
  at Routes               ← outer <Routes>
```

In `src/App.tsx` the regional portal is wired like this:

```tsx
<Route
  path="/admin/regional/*"
  element={
    <RegionalSessionProvider>
      <Routes>                                 {/* nested Routes inside element */}
        <Route element={<RegionalSessionRoute><EnhancedRegionalAdminLayout /></RegionalSessionRoute>}>
          <Route path="dashboard" element={<RegionalDashboard />} />
          ...
        </Route>
      </Routes>
    </RegionalSessionProvider>
  }
/>
```

Two real problems come out of this shape:

1. **Nested `<Routes>` inside a route `element` makes the provider unstable.** Every time the URL changes inside `/admin/regional/*`, React Router treats the outer `element` as the same node *but* the inner `<Routes>` re-evaluates its match. During HMR (which is what was active when the user logged in — note the `?t=1777129521806` HMR query string in the stack trace), Vite swaps the `RegionalSessionContext.tsx` module, and because the provider lives inside the `element` (not as a layout route), the provider can briefly remount with a fresh context identity while `RegionalAdminShell` (already mounted under the previous identity) tries to read it. `useContext` then returns `null` and the hook throws.

2. **`RegionalErrorBoundary` catches the throw, but it sits *inside* `RegionalSessionRoute` which is *inside* the provider.** When the throw happens during the provider's first render after login, the boundary renders its fallback inside the broken subtree, which is what the user perceives as "an error message then the page went blank and logged me out". The user is not actually logged out — the session in Supabase is fine (auth logs show a clean login), but the UI has crashed into the boundary fallback and the next interaction navigates away.

The earlier fix that moved `RegionalSessionProvider` to wrap the regional branch was correct in spirit, but wrapping it via a nested `<Routes>` inside `element` reintroduced the instability we were trying to avoid, and HMR after a fresh login is the trigger that exposes it.

## Plan

### 1. Replace nested `<Routes>` with proper React Router layout routes

In `src/App.tsx`, restructure `/admin/regional/*` so the provider is a real **layout route**, not a wrapper inside an `element`:

```tsx
<Route
  path="/admin/regional"
  element={
    <RegionalSessionProvider>
      <Outlet />
    </RegionalSessionProvider>
  }
>
  <Route index element={<Navigate to="/admin/regional/dashboard" replace />} />
  <Route
    element={
      <RegionalSessionRoute>
        <EnhancedRegionalAdminLayout />
      </RegionalSessionRoute>
    }
  >
    <Route path="dashboard" element={<RegionalDashboard />} />
    <Route path="members" element={<RegionalMembers />} />
    <Route path="members/:memberId" element={<RegionalMemberProfile />} />
    <Route path="events" element={<RegionalEvents />} />
    <Route path="events/:eventId/report" element={<RegionalEventReport />} />
    <Route path="finances" element={<RegionalFinances />} />
    <Route path="dcg" element={<RegionalDCG />} />
    <Route path="dcg/:dcgId" element={<DcgProfile />} />
    <Route path="certificates" element={<RegionalCertificates />} />
    <Route path="reports" element={<RegionalReports />} />
    <Route path="communication" element={<RegionalCommunication />} />
    <Route path="branch-settings" element={<RegionalBranchSettings />} />
    <Route path="discipleship" element={<RegionalDiscipleship />} />
    <Route path="user-roles" element={<UserRoles />} />
    <Route path="settings" element={<RegionalSettings />} />
  </Route>
</Route>
```

This removes the inner `<Routes>` entirely, so the provider is mounted exactly once for the whole regional branch and stays stable across navigation and HMR. The catch-all in the second top-level route (`path="/*"`) keeps everything else under `AuthProvider` exactly as today.

Add the `Outlet` import to `App.tsx`.

### 2. Make `useRegionalSession` resilient instead of crash-on-null

Even with the routing fix, a single missing-provider read should never blank the portal. In `src/contexts/RegionalSessionContext.tsx`:

- Change the hook to log a warning and return a safe `checking`/unauthorized stub instead of `throw`ing. Concretely:

  ```ts
  export const useRegionalSession = (): RegionalSessionValue => {
    const ctx = useContext(RegionalSessionContext);
    if (!ctx) {
      // Defensive: should never happen now that the provider is a layout
      // route, but a transient null during HMR must not blank the portal.
      console.warn('[RegionalSession] consumed outside provider — returning stub');
      return {
        user: null,
        profile: null,
        region: null,
        status: 'checking',
        ready: false,
        authorized: false,
        retry: () => {},
        signOut: async () => {},
      };
    }
    return ctx;
  };
  ```

This turns the "page went blank" symptom into, at worst, a one-frame loading spinner, even if some future regression reintroduces the ordering problem.

### 3. Make the error boundary recoverable on transient context errors

In `src/components/auth/RegionalErrorBoundary.tsx`, when the caught error message matches `useRegionalSession must be used`, automatically clear the error on the next tick (single retry) instead of staying in the fallback UI. This guarantees that even if the throw slips through once during HMR, the next render — which now has the provider — paints normally instead of stranding the user on the error screen.

### 4. Verify the login → dashboard transition

After applying 1–3, verify:

- Logging in at `/auth/regional` navigates to `/admin/regional/dashboard` and the shell renders without the "must be used within a `<RegionalSessionProvider>`" error.
- Navigating between regional pages (Dashboard → Certificates → Members → Dashboard) does not blank the screen.
- Logout still lands on `/auth/regional` cleanly.
- The HMR scenario (saving a regional file while logged in) no longer produces the crash.

## Files touched

- `src/App.tsx` — convert the regional branch to a proper layout-route structure with `Outlet`, remove the nested `<Routes>`.
- `src/contexts/RegionalSessionContext.tsx` — `useRegionalSession` returns a safe stub + warning instead of throwing.
- `src/components/auth/RegionalErrorBoundary.tsx` — auto-recover from the specific "must be used within provider" error on next tick.

No database, RLS, edge function, or auth-config changes are needed. The Supabase auth logs show login is succeeding cleanly — this is purely a client-side routing/provider lifecycle bug.