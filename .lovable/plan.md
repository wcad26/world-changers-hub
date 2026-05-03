No — the regional context should not be null inside the regional portal.

A React context can have a default value of `null`, but once a page is inside `<RegionalSessionProvider>`, every regional component should receive a real context value. In this project, `RegionalSessionContext` currently starts as `null` and the hook returns a “safe stub” if the provider is missing. That makes the app avoid crashing, but it also hides the real problem: some regional consumers can briefly run without a real provider/session value during development remounts, HMR, or route boot.

## What is happening

The current provider exists around `/admin/regional/*`, but the live logs showed this sequence:

```text
[RegionalSession] boot start
[RegionalSession] boot start
[RegionalSession] boot: no session
```

This confirms two things:

1. React development mode is mounting the regional session logic twice.
2. One boot pass sees `getSession()` as `null`, then the route treats that as unauthorized and sends you back to `/auth/regional`.

So the issue is not only “context null.” It is a combination of:

- context defaulting to `null`,
- regional hooks returning empty fallback values when no provider/session is ready,
- immediate redirect when session is temporarily unavailable,
- development double-mount/HMR making that race happen repeatedly.

## Triggers to eliminate

1. `RegionalSessionContext` default value is `null`.
   - This allows consumers to receive no real regional value when provider timing is off.

2. `useRegionalSession()` currently returns a silent safe stub when context is missing.
   - This hides provider errors and makes regional pages behave as if the user/region does not exist.

3. `useAuth()` also falls back to an empty value if the regional context is missing.
   - Regional pages that still use `useAuth()` can receive `userRegion: null`, even inside the regional portal.

4. `RegionalSessionProvider` still treats one immediate `getSession()` null result as `unauthorized`.
   - This is the direct cause of the login bounce.

5. `RegionalSessionRoute` still redirects automatically on `status === 'unauthorized'`.
   - This is the final trigger that sends you to `/auth/regional`.

6. React `StrictMode` in `main.tsx` doubles auth boot effects in development.
   - This makes the race easier to reproduce.

7. `RegionalAuth.tsx` navigates after sign-in before the regional provider has independently confirmed the session is restored.
   - `await supabase.auth.getSession()` once is not strong enough in this app’s development environment.

## Updated implementation plan

### 1. Make regional context non-null by design

Replace the context’s default `null` with a stable default object:

```text
status: 'checking'
ready: false
authorized: false
user: null
profile: null
region: null
retry: no-op
signOut: no-op
```

This means regional consumers always receive a valid object shape. They may receive “checking,” but never a missing context value.

### 2. Make missing provider obvious during development

Keep the default object safe, but add a development-only console warning if `useRegionalSession()` is used outside the provider.

Do not return a fake “authorized” state. The default stays `checking`, so pages do not accidentally run protected queries without a real session.

### 3. Add an explicit `RegionalAuthReadyGate`

Wrap the whole `/admin/regional/*` subtree like this:

```text
/admin/regional
  RegionalSessionProvider
    RegionalSessionRoute
      EnhancedRegionalAdminLayout
        regional pages
```

Then make `RegionalSessionRoute` the only place that decides whether regional pages render.

Until context says `ready && authorized`, regional pages should not mount. This prevents hooks in dashboard/members/events from running before the regional session has a user and region.

### 4. Replace one-shot `getSession()` with a tolerant regional boot

In `RegionalSessionProvider`:

- first wait for Supabase auth restoration,
- retry `getSession()` for a short window,
- only load profile/region after a real `session.user` exists,
- never mark unauthorized from the first null result.

Use a small helper like:

```text
waitForSession(maxAttempts: 8, delay: 150ms)
```

This directly removes the current “successful login → blank spinner → no session → login page” chain.

### 5. Use a scoped auth listener safely

Add a regional-only `onAuthStateChange` listener, but keep it non-destructive:

- `INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED`: update regional user/session.
- `SIGNED_OUT`: only mark unauthorized if the user clicked regional logout.
- Do not run profile queries inside the callback directly; schedule the load outside the callback.

This follows Supabase’s recommended auth readiness pattern while avoiding the previous cross-portal logout problem.

### 6. Remove automatic redirect from regional unauthorized state

Change `RegionalSessionRoute` so `unauthorized` shows a stable panel:

- “We could not find an active regional session.”
- “Try again” button.
- “Go to login” button.

Do not automatically navigate to `/auth/regional`. This eliminates the final forced logout/login-page bounce.

### 7. Strengthen `RegionalAuth.tsx` after sign-in

After `signInWithPassword`:

- wait until `getSession()` returns the same signed-in user,
- then navigate to `/admin/regional/dashboard`,
- keep region/profile checks non-destructive.

This ensures the provider does not mount before the session has been persisted.

### 8. Update `useAuth()` regional fallback

When there is no global `AuthProvider` but regional context exists:

- return `loading: !regional.ready || regional.status === 'checking'`,
- return `initialized: regional.ready`,
- return `userRegion: regional.region`,
- return `hasRegionalPortalAccess: regional.authorized`,
- never return a completed empty auth value while the regional provider is still checking.

This prevents legacy regional hooks from thinking auth is finished with no region.

### 9. Disable React `StrictMode` for the development preview

Remove `<StrictMode>` from `main.tsx` for now. This stops development-only double auth boots while we stabilize the portal.

### 10. Keep diagnostic logs until confirmed stable

Keep clear logs:

```text
[RegionalSession] provider mounted
[RegionalSession] waiting for session
[RegionalSession] session restored
[RegionalSession] profile loaded
[RegionalSession] region loaded
[RegionalSession] authorized
[RegionalSession] no session after retry window
```

## Expected result

After this update:

- regional context will always have a valid value shape,
- regional pages will not mount before the regional session is ready,
- one temporary `null` session will not redirect you to login,
- blank page reloads should stop,
- the only normal way back to login will be an intentional logout or a confirmed missing/expired session after retries.